const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// Known external API domains to detect
const KNOWN_APIS = [
  "api.openai.com",
  "maps.googleapis.com",
  "api.razorpay.com",
  "api.twilio.com",
  "api.stripe.com",
  "api.sendgrid.com",
];

// Extracts a URL string from a StringLiteral or TemplateLiteral node
function extractUrl(node) {
  if (node.type === "StringLiteral") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q) => q.value.raw).join("");
  }
  return null;
}

// Checks which known domain (if any) appears in the URL
function matchKnownApi(url) {
  return KNOWN_APIS.find((domain) => url.includes(domain)) || null;
}

function scanExternalApis(projectDir) {
  const files = fg.sync("**/*.{js,jsx}", {
    cwd: projectDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const findings = [];

  for (const filePath of files) {
    const code = fs.readFileSync(filePath, "utf-8");

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx"],
      });
    } catch (err) {
      console.warn(`Skipping ${filePath} — failed to parse: ${err.message}`);
      continue;
    }

    traverse(ast, {
      CallExpression(callPath) {
        const callee = callPath.node.callee;
        let firstArg = null;

        // Case 1: axios.get/post/etc(...)
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "axios"
        ) {
          firstArg = callPath.node.arguments[0];
        }

        // Case 2: fetch(...)
        if (callee.type === "Identifier" && callee.name === "fetch") {
          firstArg = callPath.node.arguments[0];
        }

        if (!firstArg) return;

        const url = extractUrl(firstArg);
        if (!url) return;

        const matchedDomain = matchKnownApi(url);
        if (!matchedDomain) return; // not a known external API, ignore

        // Now check: is there a process.env usage "nearby"?
        // "Nearby" = anywhere inside the same enclosing function
        const enclosingFunction = callPath.getFunctionParent();
        let hasEnvVarNearby = false;

        if (enclosingFunction) {
          enclosingFunction.traverse({
            MemberExpression(innerPath) {
              const inner = innerPath.node.object;
              if (
                inner.type === "MemberExpression" &&
                inner.object.type === "Identifier" &&
                inner.object.name === "process" &&
                inner.property.type === "Identifier" &&
                inner.property.name === "env"
              ) {
                hasEnvVarNearby = true;
              }
            },
          });
        }

        findings.push({
          domain: matchedDomain,
          file: path.basename(filePath),
          line: callPath.node.loc.start.line,
          hardcoded: true,
          hasEnvVarNearby,
        });
      },
    });
  }

  return findings;
}

module.exports = scanExternalApis;

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function extractPath(node) {
  if (node.type === "StringLiteral") {
    return node.value;
  }

  if (node.type === "TemplateLiteral") {
    let result = "";
    node.quasis.forEach((quasi, i) => {
      result += quasi.value.raw;
      if (i < node.expressions.length) {
        result += ":param";
      }
    });
    return result;
  }

  return null;
}

function scanFrontend(frontendDir) {
  // Match both .js and .jsx files
  const files = fg.sync("**/*.{js,jsx}", { cwd: frontendDir, absolute: true });

  const calls = [];

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

        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "axios" &&
          ["get", "post", "put", "delete", "patch"].includes(
            callee.property.name,
          )
        ) {
          const method = callee.property.name;
          const firstArg = callPath.node.arguments[0];
          const extractedPath = firstArg ? extractPath(firstArg) : null;

          if (extractedPath) {
            calls.push({
              method: method.toUpperCase(),
              path: extractedPath,
              file: path.basename(filePath),
              line: callPath.node.loc.start.line,
            });
          }
        }

        if (callee.type === "Identifier" && callee.name === "fetch") {
          const firstArg = callPath.node.arguments[0];
          const extractedPath = firstArg ? extractPath(firstArg) : null;

          if (extractedPath) {
            calls.push({
              method: "GET",
              path: extractedPath,
              file: path.basename(filePath),
              line: callPath.node.loc.start.line,
            });
          }
        }
      },
    });
  }

  return calls;
}

module.exports = scanFrontend;

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function scanBackend(backendDir) {
  // Find all .js files inside the backend folder
  const files = fg.sync("**/*.js", { cwd: backendDir, absolute: true });

  const routes = [];

  for (const filePath of files) {
    const code = fs.readFileSync(filePath, "utf-8");

    let ast;
    try {
      ast = parser.parse(code, { sourceType: "module" });
    } catch (err) {
      console.warn(`Skipping ${filePath} — failed to parse: ${err.message}`);
      continue;
    }

    traverse(ast, {
      CallExpression(callPath) {
        const callee = callPath.node.callee;

        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "router" &&
          ["get", "post", "put", "delete", "patch"].includes(
            callee.property.name,
          )
        ) {
          const method = callee.property.name;
          const firstArg = callPath.node.arguments[0];

          if (firstArg && firstArg.type === "StringLiteral") {
            routes.push({
              method: method.toUpperCase(),
              path: firstArg.value,
              file: path.basename(filePath),
              line: callPath.node.loc.start.line,
            });
          }
        }
      },
    });
  }

  return routes;
}

// Quick manual test — scan the test-fixtures folder
const result = scanBackend("./test-fixtures");
console.log(result);

module.exports = scanBackend;

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function scanEnvUsage(projectDir) {
  const files = fg.sync("**/*.{js,jsx}", {
    cwd: projectDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const usedVars = new Set();

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
      MemberExpression(callPath) {
        const node = callPath.node;

        // Outer node's property must be a plain identifier, e.g. DATABASE_URL
        if (node.property.type !== "Identifier") return;

        const inner = node.object;

        // Inner node must be: process.env
        if (
          inner.type === "MemberExpression" &&
          inner.object.type === "Identifier" &&
          inner.object.name === "process" &&
          inner.property.type === "Identifier" &&
          inner.property.name === "env"
        ) {
          usedVars.add(node.property.name);
        }
      },
    });
  }

  // Find a .env or .env.example file
  const envFilePath = [".env", ".env.example"]
    .map((name) => path.join(projectDir, name))
    .find((p) => fs.existsSync(p));

  let declaredVars = [];

  if (envFilePath) {
    const envContent = fs.readFileSync(envFilePath, "utf-8");
    declaredVars = envContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.split("=")[0].trim());
  }

  const missing = [...usedVars].filter((v) => !declaredVars.includes(v));

  return { used: [...usedVars], missing, envFileFound: !!envFilePath };
}

module.exports = scanEnvUsage;

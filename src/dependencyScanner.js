const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// A small hardcoded list of Node.js built-in modules to exclude
const NODE_BUILTINS = [
  "fs",
  "path",
  "http",
  "https",
  "os",
  "crypto",
  "util",
  "events",
  "stream",
  "url",
  "querystring",
  "child_process",
  "net",
  "dns",
  "buffer",
  "process",
  "assert",
  "zlib",
  "readline",
  "cluster",
];

// Extracts the "package name" from an import path
// e.g. 'lodash/get' -> 'lodash', '@babel/parser' -> '@babel/parser', './foo' -> null
function extractPackageName(importPath) {
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    return null; // local file import, not a package
  }

  if (importPath.startsWith("@")) {
    // scoped package, e.g. @babel/parser -> keep first two segments
    const parts = importPath.split("/");
    return parts.slice(0, 2).join("/");
  }

  // regular package, e.g. lodash/get -> lodash
  return importPath.split("/")[0];
}

function scanDependencies(projectDir) {
  const files = fg.sync("**/*.{js,jsx}", {
    cwd: projectDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const usedPackages = new Set();

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
      // Catches: import x from 'package'
      ImportDeclaration(callPath) {
        const pkg = extractPackageName(callPath.node.source.value);
        if (pkg && !NODE_BUILTINS.includes(pkg)) {
          usedPackages.add(pkg);
        }
      },
      // Catches: require('package')
      CallExpression(callPath) {
        const callee = callPath.node.callee;
        if (callee.type === "Identifier" && callee.name === "require") {
          const firstArg = callPath.node.arguments[0];
          if (firstArg && firstArg.type === "StringLiteral") {
            const pkg = extractPackageName(firstArg.value);
            if (pkg && !NODE_BUILTINS.includes(pkg)) {
              usedPackages.add(pkg);
            }
          }
        }
      },
    });
  }

  // Read package.json
  const pkgJsonPath = path.join(projectDir, "package.json");
  let declaredDeps = [];

  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    declaredDeps = [
      ...Object.keys(pkgJson.dependencies || {}),
      ...Object.keys(pkgJson.devDependencies || {}),
    ];
  }

  const missing = [...usedPackages].filter(
    (pkg) => !declaredDeps.includes(pkg),
  );
  const unused = declaredDeps.filter((pkg) => !usedPackages.has(pkg));

  return { missing, unused };
}

module.exports = scanDependencies;

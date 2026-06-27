const fs = require("fs");
const scanDependencies = require("./src/dependencyScanner");

// Temporarily copy samplePackage.json -> package.json inside test-fixtures
fs.copyFileSync(
  "./test-fixtures/samplePackage.json",
  "./test-fixtures/package.json",
);

const result = scanDependencies("./test-fixtures");
console.log(result);

// Clean up the temporary package.json
fs.unlinkSync("./test-fixtures/package.json");

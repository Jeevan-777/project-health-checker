const fs = require("fs");
const scanEnvUsage = require("./src/envScanner");

fs.copyFileSync("./test-fixtures/sample.env", "./test-fixtures/.env");

const result = scanEnvUsage("./test-fixtures");
console.log(result);

fs.unlinkSync("./test-fixtures/.env");

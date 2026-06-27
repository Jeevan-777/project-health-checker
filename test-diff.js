const scanBackend = require("./src/backendScanner");
const scanFrontend = require("./src/frontendScanner");
const diffRoutes = require("./src/diff");

const backendRoutes = scanBackend("./test-fixtures");
const frontendCalls = scanFrontend("./test-fixtures");

const issues = diffRoutes(backendRoutes, frontendCalls);

console.log(issues);

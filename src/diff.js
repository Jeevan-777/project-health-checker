const normalizePath = require("./normalize");

function diffRoutes(backendRoutes, frontendCalls) {
  const issues = [];

  // Normalize both sides first
  const normalizedBackend = backendRoutes.map((r) => ({
    ...r,
    normalizedPath: normalizePath(r.path),
  }));

  const normalizedFrontend = frontendCalls.map((c) => ({
    ...c,
    normalizedPath: normalizePath(c.path),
  }));

  // Check 1: frontend calls with no matching backend route at all
  for (const call of normalizedFrontend) {
    const matchExists = normalizedBackend.some(
      (route) => route.normalizedPath === call.normalizedPath,
    );

    if (!matchExists) {
      issues.push({
        type: "MISSING_BACKEND_ROUTE",
        message: `Frontend calls ${call.method} ${call.path} (in ${call.file}:${call.line}) but no matching backend route exists`,
      });
      continue; // no point checking method mismatch if there's no match at all
    }

    // Check 2: same path exists, but no matching HTTP method
    const methodMatch = normalizedBackend.some(
      (route) =>
        route.normalizedPath === call.normalizedPath &&
        route.method === call.method,
    );

    if (!methodMatch) {
      const actualMethods = normalizedBackend
        .filter((route) => route.normalizedPath === call.normalizedPath)
        .map((route) => route.method)
        .join(", ");

      issues.push({
        type: "METHOD_MISMATCH",
        message: `Frontend calls ${call.method} ${call.path} (in ${call.file}:${call.line}) but backend only defines [${actualMethods}] for this path`,
      });
    }
  }

  // Check 3: backend routes never called by frontend (dead routes)
  for (const route of normalizedBackend) {
    const isUsed = normalizedFrontend.some(
      (call) =>
        call.normalizedPath === route.normalizedPath &&
        call.method === route.method,
    );

    if (!isUsed) {
      issues.push({
        type: "DEAD_ROUTE",
        message: `Backend route ${route.method} ${route.path} (in ${route.file}:${route.line}) is never called from the frontend`,
      });
    }
  }

  return issues;
}

module.exports = diffRoutes;

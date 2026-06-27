function normalizePath(routePath) {
  return routePath
    .split("/")
    .map((segment) => {
      // Express-style param: :id, :userId, etc.
      if (segment.startsWith(":")) {
        return ":param";
      }
      // Already converted by frontendScanner: :param
      if (segment === ":param") {
        return ":param";
      }
      // Pure numeric segment, e.g. 123
      if (/^\d+$/.test(segment)) {
        return ":param";
      }
      return segment;
    })
    .join("/");
}

module.exports = normalizePath;

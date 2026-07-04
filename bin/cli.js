#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");
const fs = require("fs");

const scanBackend = require("../src/backendScanner");
const scanFrontend = require("../src/frontendScanner");
const diffRoutes = require("../src/diff");
const scanDependencies = require("../src/dependencyScanner");
const scanEnvUsage = require("../src/envScanner");
const scanExternalApis = require("../src/externalApiScanner");
const printReport = require("../src/reporter");

const program = new Command();

program
  .name("project-health-check")
  .description(
    "Statically analyzes a full-stack JS project for route drift, dependency drift, env var drift, and hardcoded secrets",
  )
  .option(
    "-b, --backend <path>",
    "path to backend folder (auto-detected if not set)",
  )
  .option(
    "-f, --frontend <path>",
    "path to frontend folder (auto-detected if not set)",
  )
  .option("-p, --project <path>", "root path of the project", ".")
  .parse(process.argv);

const options = program.opts();
const projectDir = path.resolve(options.project);

// Auto-detect folder if flag not provided
function detectDir(provided, candidates) {
  if (provided) return path.resolve(provided);
  for (const candidate of candidates) {
    const full = path.join(projectDir, candidate);
    if (fs.existsSync(full)) return full;
  }
  return projectDir; // fallback to root
}

const backendDir = detectDir(options.backend, [
  "routes",
  "api",
  "server",
  "backend",
]);
const frontendDir = detectDir(options.frontend, [
  "src",
  "client",
  "frontend",
  "app",
]);

// Run all scanners
const backendRoutes = scanBackend(backendDir);
const frontendCalls = scanFrontend(frontendDir);
const routeIssues = diffRoutes(backendRoutes, frontendCalls);

const depIssues = scanDependencies(projectDir);
const envIssues = scanEnvUsage(projectDir);

const apiFindingsBackend = scanExternalApis(backendDir);
const apiFindingsFrontend = scanExternalApis(frontendDir);
const apiFindings = [...apiFindingsBackend, ...apiFindingsFrontend];

printReport({ routeIssues, depIssues, envIssues, apiFindings });

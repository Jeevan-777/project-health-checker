#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");

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
  .option("-b, --backend <path>", "path to backend folder", "./routes")
  .option("-f, --frontend <path>", "path to frontend folder", "./src")
  .option(
    "-p, --project <path>",
    "root path of the project (used for package.json and .env)",
    ".",
  )
  .parse(process.argv);

const options = program.opts();

const backendDir = path.resolve(options.project, options.backend);
const frontendDir = path.resolve(options.project, options.frontend);
const projectDir = path.resolve(options.project);

// Run all scanners
const backendRoutes = scanBackend(backendDir);
const frontendCalls = scanFrontend(frontendDir);
const routeIssues = diffRoutes(backendRoutes, frontendCalls);

const depIssues = scanDependencies(projectDir);
const envIssues = scanEnvUsage(projectDir);

// External API scanner should check both backend and frontend folders
const apiFindingsBackend = scanExternalApis(backendDir);
const apiFindingsFrontend = scanExternalApis(frontendDir);
const apiFindings = [...apiFindingsBackend, ...apiFindingsFrontend];

// Print the unified report
printReport({ routeIssues, depIssues, envIssues, apiFindings });

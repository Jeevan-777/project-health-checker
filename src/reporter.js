const chalk = require("chalk");

function printReport({ routeIssues, depIssues, envIssues, apiFindings }) {
  let issueCount = 0;

  console.log(chalk.bold.underline("\n🔍 Project Health Check Report\n"));

  // --- Routes section ---
  console.log(chalk.bold("Routes:"));
  if (routeIssues.length === 0) {
    console.log(chalk.green("  ✔ No route mismatches found"));
  } else {
    routeIssues.forEach((issue) => {
      issueCount++;
      const color = issue.type === "DEAD_ROUTE" ? chalk.yellow : chalk.red;
      console.log(color(`  ✖ [${issue.type}] ${issue.message}`));
    });
  }

  // --- Dependencies section ---
  console.log(chalk.bold("\nDependencies:"));
  if (depIssues.missing.length === 0 && depIssues.unused.length === 0) {
    console.log(chalk.green("  ✔ No dependency issues found"));
  } else {
    depIssues.missing.forEach((pkg) => {
      issueCount++;
      console.log(chalk.red(`  ✖ Missing from package.json: ${pkg}`));
    });
    depIssues.unused.forEach((pkg) => {
      issueCount++;
      console.log(chalk.yellow(`  ⚠ Installed but unused: ${pkg}`));
    });
  }

  // --- Env vars section ---
  console.log(chalk.bold("\nEnvironment Variables:"));
  if (!envIssues.envFileFound) {
    console.log(chalk.yellow("  ⚠ No .env or .env.example file found"));
  } else if (envIssues.missing.length === 0) {
    console.log(chalk.green("  ✔ No missing environment variables"));
  } else {
    envIssues.missing.forEach((v) => {
      issueCount++;
      console.log(chalk.red(`  ✖ Used in code but not declared: ${v}`));
    });
  }

  // --- External APIs section ---
  console.log(chalk.bold("\nExternal APIs:"));
  if (apiFindings.length === 0) {
    console.log(chalk.green("  ✔ No external API calls detected"));
  } else {
    apiFindings.forEach((finding) => {
      issueCount++;
      const risk = finding.hasEnvVarNearby
        ? chalk.yellow(`⚠ Hardcoded URL to ${finding.domain}`)
        : chalk.red(
            `✖ Hardcoded URL to ${finding.domain} — no API key env var found nearby`,
          );
      console.log(`  ${risk} (${finding.file}:${finding.line})`);
    });
  }

  // --- Summary ---
  console.log(chalk.bold(`\n${issueCount} issue(s) found.\n`));
}

module.exports = printReport;

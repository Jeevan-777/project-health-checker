# 🔍 Project Health Checker

A CLI tool that statically analyzes full-stack JavaScript projects (Node.js/Express + React/plain JS frontend) and detects common real-world bugs **before they cause runtime errors** — using AST (Abstract Syntax Tree) parsing via Babel.

No runtime required. No dependencies installed. Just point it at your project and get a report.

---

## What It Checks

### 1. API Route Drift

Compares Express backend routes against frontend API calls (`axios`/`fetch`) and flags:

- Frontend calls an endpoint that doesn't exist on the backend
- Backend route is never called from the frontend (dead route)
- Same path but different HTTP method

### 2. Dependency Check

Compares packages actually imported/required in code against `package.json` and flags:

- Packages used in code but missing from `package.json`
- Packages installed but never imported anywhere (unused bloat)

### 3. Environment Variable Check

Finds all `process.env.X` usage across the codebase and flags:

- Any variable used in code but not declared in `.env` or `.env.example`

### 4. External API Usage Detector

Detects calls to known third-party APIs (OpenAI, Google Maps, Twilio, Stripe, etc.) and flags:

- Hardcoded base URLs in code
- External API calls with no nearby API key env var (possible hardcoded secret risk)

---

## Installation

```bash
npm install -g project-health-checker
```

Or run without installing:

```bash
npx project-health-checker
```

---

## Usage

Run from the root of your project:

```bash
project-health-check
```

The tool auto-detects common folder names (`routes/`, `src/`, `client/`, `api/`).

### Custom paths

```bash
project-health-check --backend ./api/routes --frontend ./client/src
```

### All flags

| Flag         | Shorthand | Description                              | Default       |
| ------------ | --------- | ---------------------------------------- | ------------- |
| `--backend`  | `-b`      | Path to backend routes folder            | Auto-detected |
| `--frontend` | `-f`      | Path to frontend folder                  | Auto-detected |
| `--project`  | `-p`      | Project root (for package.json and .env) | `.`           |

---

## Sample Output

🔍 Project Health Check Report
Routes:
✖ [MISSING_BACKEND_ROUTE] Frontend calls GET /profiles/:param (in api.js:17) but no matching backend route exists
✖ [DEAD_ROUTE] Backend route PUT /users/:id (in users.js:17) is never called from the frontend

Dependencies:
✖ Missing from package.json: lodash
⚠ Installed but unused: mongoose

Environment Variables:
✖ Used in code but not declared: SECRET_KEY

External APIs:
✖ Hardcoded URL to api.openai.com — no API key env var found nearby (api.js:23)
⚠ Hardcoded URL to maps.googleapis.com (api.js:13)
6 issue(s) found.

---

## Tech Stack

- **[@babel/parser](https://babeljs.io/docs/babel-parser)** — AST parsing
- **[@babel/traverse](https://babeljs.io/docs/babel-traverse)** — AST traversal
- **[fast-glob](https://github.com/mrmlnc/fast-glob)** — file scanning
- **[chalk](https://github.com/chalk/chalk)** — colored terminal output
- **[commander](https://github.com/tj/commander.js)** — CLI interface

---

## Limitations

- Detects `axios` and `fetch` calls only (not custom HTTP wrappers)
- Route matching uses normalized wildcard comparison — dynamic routes constructed programmatically may not be detected
- External API detection covers a fixed list of known domains (OpenAI, Google Maps, Razorpay, Twilio, Stripe, SendGrid)

---

## Roadmap

- [ ] Missing `await` on async DB calls (Mongoose)
- [ ] `--html` flag for visual HTML report
- [ ] Git pre-commit hook integration
- [ ] Support for custom HTTP client wrappers

---

## Author

**Jeevan B M**  
[GitHub](https://github.com/Jeevan-777) · [npm](https://www.npmjs.com/package/project-health-checker)

---

## License

MIT

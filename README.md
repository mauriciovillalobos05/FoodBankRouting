## Branch naming convention

Use these prefixes:

- `feature/<short-kebab-summary>`
- `fix/<short-kebab-summary>`
- `hotfix/<short-kebab-summary>`
- `release/<version-or-date>`

**Examples**
- `feature/add-qr-checkin`
- `fix/qr-scan-duplicates`
- `hotfix/pdf-null-pointer`
- `release/2025-10-22`

## Folder naming convention (repo layout)

The CI expects these folders at the repo root:

- `api/         # Backend (Python 3.11)`
- `web-pwa/     # PWA Voluntariado (Node 20)`
- `web-staff/   # Panel Staff (Node 20)`
- `.github/`
  workflows/
    ci.yml   # GitHub Actions workflow


If you rename folders or change runtimes, update the workflow env in .github/workflows/ci.yml:

env:
  - `PYTHON_VERSION: "3.11"`
  - `NODE_VERSION: "20"`
  - `BACKEND_DIR: api`
  - `PWA_DIR: web-pwa`
  - `STAFF_DIR: web-staff`

Continuous Integration (CI)

Where: .github/workflows/ci.yml

When:

On pull_request to main and develop

On push to main and develop

Concurrency: cancels older runs on the same ref (cancel-in-progress: true)

## CI jobs summary
Job	Directory	What it does
- `backend-ci	api/	Installs Python deps (3.11), optional lint (ruff/black), runs pytest if tests exist`
- `web-pwa-ci	web-pwa/	Installs Node deps (20), runs npm run lint/test/build if scripts exist`
- `web-staff-ci	web-staff/	Same as PWA: lint/test/build if scripts exist`

If a script or tests are missing, the job does not fail for that step; it warns so you can add them later.

What you need to pass CI
Backend (api/) — Job: backend-ci

Minimum required

requirements.txt present

Recommended

- `Tests in tests/ and/or pytest.ini`

- `Optional linters: ruff, black`

- `What the job runs`

- `pip install -r requirements.txt`

- `ruff . and black --check . if installed`

- `pytest -q if tests/ or pytest.ini exist`

Run locally

- `cd api`
- `python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate`
- `pip install -r requirements.txt`
- `pytest -q   # if you have tests`

## PWA Voluntariado (web-pwa/) — Job: web-pwa-ci

Minimum required

package.json present

Optional scripts

"lint", "test", "build"

What the job runs

npm ci

npm run lint (if exists)

npm test -- --ci --passWithNoTests (if exists)

npm run build (if exists)

Run locally

- `cd web-pwa`
- `npm ci`
- `npm run lint   # if exists`
- `npm test       # if exists`
- `npm run build  # if exists`

## Panel Staff (web-staff/) — Job: web-staff-ci

Minimum required

package.json present

Optional scripts

"lint", "test", "build"

What the job runs

npm ci

npm run lint (if exists)

npm test -- --ci --passWithNoTests (if exists)

npm run build (if exists)

Run locally

- `cd web-staff`
- `npm ci`
- `npm run lint   # if exists`
- `npm test       # if exists`
- `npm run build  # if exists`

## Pull Request workflow

Create your branch from develop using the naming convention above.

Commit small, descriptive changes.

Open a PR → develop. All 3 CI jobs must be green.

develop requires 1 review; later, merging develop → main requires 2 reviews.

Merge using Squash. The head branch is auto-deleted.

Hotfixes: branch from main as hotfix/*, open PR to main, and after merge back-merge main → develop.

Repo rules (summary)

Protected branches:

main: 2 approvals, conversations resolved, required checks green

develop: 1 approval, required checks green

Merge strategy: Squash only (linear history)

Required checks:

backend-ci

web-pwa-ci

web-staff-ci

Troubleshooting

“requirements.txt not found”
Ensure it exists under api/ or update BACKEND_DIR in the workflow.

“package.json not found”
Ensure it exists under web-pwa/ or web-staff/, or update PWA_DIR / STAFF_DIR.

Lint/Test didn’t run
Add the scripts to package.json (frontends) or a tests/ folder / pytest.ini (backend).

Version mismatch
CI uses Python 3.11 and Node 20. Align your local env when possible.

PR can’t be merged
Check all 3 CI checks are green and you have the required approvals.

Add a new app/module to CI

Create the folder (e.g., mobile/).

Copy an existing job in ci.yml, change its working-directory.

(Optional) Mark the new job as a required check in branch protection settings.

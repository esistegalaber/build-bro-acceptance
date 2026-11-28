# build-bro-acceptance

Acceptance tests for Build Bruh. [Playwright](https://playwright.dev) drives a real browser against a
live [build-bro-api](https://github.com/esistegalaber/build-bro-api) and
[build-bro-ui](https://github.com/esistegalaber/build-bro-ui), the way a user would.

## Running

Needs Node (`.nvmrc`) and Docker. No checkouts of the other projects, no JDK.

1. Install: `nvm use`, `npm ci`, then `npm run browsers:install` (once, downloads Chromium).
2. `npm test`

`npm test` starts the published images of the API and the UI (`main` by default) and a throwaway MariaDB with
[Testcontainers](https://node.testcontainers.org), on random ports, and runs the tests in Chromium. Before
**each** test it resets that database to this repo's `data/testdata.sql`. Afterwards the containers are
removed. Your local database and any dev servers you run are not touched. At the start it prints which images
it tests, with their digests; the API's and the UI's logs go to `container-logs/`.

The images are amd64 only. On Apple Silicon they run emulated: it works, the API just starts slower.

To test against the dev servers you already run (the UI's `npm start` on `:4200`, the API on `:8080`, e.g. via
the workspace `run-stack` skill), use `npm run test:dev`. That starts nothing.

> **`npm run test:dev` resets the database the dev API uses: by default the local `build_bruh`, all of whose
> data it deletes.**

| Script | What it does |
|---|---|
| `npm test` | Runs all tests headless, against the images |
| `npm run test:dev` | The same, against the dev servers already running on `:4200` and `:8080` |
| `npm run test:headed` | The same, with a visible browser |
| `npm run test:ui` | Playwright's UI mode: pick, watch and debug tests |
| `npm run report` | Opens the HTML report of the last run (with traces of failed tests) |
| `npm run typecheck` | `tsc` over config, setup and tests |
| `npm run lint` | ESLint with the Playwright rules |

## Configuration

`support/env.ts` reads these variables. The test data is always this repo's own `data/testdata.sql`.

| Variable | Default | Meaning |
|---|---|---|
| `API_IMAGE` | `ghcr.io/esistegalaber/build-bro-api:main` | The API image `npm test` runs |
| `UI_IMAGE` | `ghcr.io/esistegalaber/build-bro-ui:main` | The UI image `npm test` runs |
| `DB_HOST`, `DB_PORT` | `localhost`, `3306` | `test:dev` only: the dev API's database, for the reset |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `build_bruh` ×3 | The database credentials (also those of the throwaway database) |

Any image reference works: a release (`:1.2.0`), one commit of `main` (`:sha-abc1234`), a pull request
(`:pr-42`, while the PR is open) or an image you built yourself (`build-bro-ui:dev`). Registry references
(`ghcr.io/...`) are pulled on every run, because tags like `main` move; local ones are used as they are.

## Writing tests

- Specs go in `tests/<feature>/` as `*.spec.ts` (one folder per UI feature, `tests/journeys/` for flows
  across pages).
- Import `test` and `expect` from `support/fixtures.ts`, not from `@playwright/test`. It provides the
  page objects (`support/pages/`) and an `api` request context as fixtures.
- Page objects hold locators and actions, specs hold the assertions.
- Every test starts from `data/testdata.sql`: an automatic fixture resets the database before
  each test. Tests may create, change or delete any data, including baseline rows, and don't clean up
  afterwards. Fixed names are fine. Never assert on IDs the API generates.
- `data/testdata.sql` belongs to this repo. It was copied from build-bro-api's
  `src/test/resources/testdata.sql` (the header names the commit) and doesn't follow changes to that file.
  A table added in a build-bro-api migration must be added to its delete list (FK-safe order): until it
  is, the reset fails with `testdata.sql doesn't empty: <table>`.
- The tests run one at a time (`workers: 1`) until there is a database per worker.
- Find elements the way a user does: `getByRole`, `getByLabel`, `getByText`.

## CI

`.github/workflows/build.yml` checks out only this repo and runs `npm test` against the published images.
It runs on push, on pull requests, nightly, and by hand (`workflow_dispatch`, with an image tag for the API
and one for the UI, e.g. `pr-42`). The job summary names the images and their digests. The HTML report and
`container-logs/` are kept as the `playwright-report` artifact.

## Testing API and UI changes together

To check that changes in build-bro-api and build-bro-ui work together before they are merged, run the suite
against the images of their pull requests. Each open PR has an image tagged `pr-<N>`.

**In CI** (the run shows on the Actions tab, with the report as an artifact):

```bash
gh workflow run build.yml -R esistegalaber/build-bro-acceptance -f api_tag=pr-42 -f ui_tag=pr-17
```

Or on GitHub: Actions → "Acceptance tests" → Run workflow, and enter the two tags. Leave one at `main` to test a single
PR against the other project's `main`.

**Locally:**

```bash
API_IMAGE=ghcr.io/esistegalaber/build-bro-api:pr-42 UI_IMAGE=ghcr.io/esistegalaber/build-bro-ui:pr-17 npm test
```

Which states can be tested:

| Tag | Image of | Exists |
|---|---|---|
| `main` | the newest commit on `main` | always |
| `sha-<7>` | one commit of `main` | always |
| `pr-<N>` | the newest commit of PR `N` | while the PR is open; deleted when it closes |
| `X.Y.Z`, `X.Y`, `latest` | a release `vX.Y.Z` | always |

A branch without a PR has no image, so open a PR (a draft is enough) to test it. Locally you can also build an
image yourself and pass its name, e.g. `UI_IMAGE=build-bro-ui:dev npm test`.

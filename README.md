# build-bro-acceptance

Acceptance tests for Build Bruh. [Playwright](https://playwright.dev) drives a real browser against a
live [build-bro-api](https://github.com/esistegalaber/build-bro-api) and
[build-bro-ui](https://github.com/esistegalaber/build-bro-ui), the way a user would.

## Layout

The repo expects the other projects next to it (the Build Bruh workspace layout):

```
Work/
├── build-bro-api/
├── build-bro-ui/
└── build-bro-acceptance/   ← this repo
```

## Running

1. Install: `nvm use` (Node from `.nvmrc`), `sdk env` (the API's JDK from `.sdkmanrc`), `npm ci`, then `npm run browsers:install` (once, downloads Chromium).
2. Start MariaDB (see the workspace `CLAUDE.md` or the `run-stack` skill). Playwright doesn't start the
   database.
3. `npm test`

`npm test` starts the API (`./mvnw spring-boot:run`) and the UI (`npm start`), or reuses them when they
already run on `:8080` and `:4200`, and runs the tests in Chromium. Before **each** test it resets the
database to build-bro-api's `src/test/resources/testdata.sql`.

> **The reset deletes all data in the `build_bruh` database.** To keep it, point the tests and the API at
> a throwaway database: `DB_PORT` for the tests, `SPRING_DATASOURCE_URL` for the API (Playwright passes it
> on when it starts the API).

| Script | What it does |
|---|---|
| `npm test` | Runs all tests headless |
| `npm run test:headed` | The same, with a visible browser |
| `npm run test:ui` | Playwright's UI mode: pick, watch and debug tests |
| `npm run report` | Opens the HTML report of the last run (with traces of failed tests) |
| `npm run typecheck` | `tsc` over config, setup and tests |
| `npm run lint` | ESLint with the Playwright rules |

## Configuration

The suite always runs against the sibling checkouts: the UI on `http://localhost:4200`, the API on
`http://localhost:8080`, the data from `../build-bro-api/src/test/resources/testdata.sql`. Only the
database is configurable (`support/env.ts`):

| Variable | Default | Meaning |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `3306`, `build_bruh` ×3 | The API's database, for the reset |

The defaults are the local `build_bruh`, which a reused dev API reads too.

The API runs on the shell's `JAVA_HOME`. Locally, this repo's `.sdkmanrc` selects the JDK; it must match
build-bro-api's Java version. On CI, `setup-java` sets it.

## Writing tests

- Specs go in `tests/<feature>/` as `*.spec.ts` (one folder per UI feature, `tests/journeys/` for flows
  across pages).
- Import `test` and `expect` from `support/fixtures.ts`, not from `@playwright/test`. It provides the
  page objects (`support/pages/`) and an `api` request context as fixtures.
- Page objects hold locators and actions, specs hold the assertions.
- Every test starts from build-bro-api's `testdata.sql`: an automatic fixture resets the database before
  each test. Tests may create, change or delete any data, including baseline rows, and don't clean up
  afterwards. Fixed names are fine. Never assert on IDs the API generates.
- The tests run one at a time (`workers: 1`) until there is a database per worker.
- Find elements the way a user does: `getByRole`, `getByLabel`, `getByText`.

## CI

`.github/workflows/build.yml` checks out this repo, build-bro-api and build-bro-ui side by side and
starts MariaDB as a service. Playwright then boots the API and the UI and runs the tests. It runs on
push, on pull requests, nightly, and by hand (`workflow_dispatch`, which can run against other API or UI
branches). The HTML report is kept as the `playwright-report` artifact.

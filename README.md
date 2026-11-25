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

Other locations: set `API_DIR` and `UI_DIR`.

## Running

1. Install: `nvm use` (Node from `.nvmrc`), `npm ci`, then `npm run browsers:install` (once, downloads Chromium).
2. Start MariaDB (see the workspace `CLAUDE.md` or the `run-stack` skill). Playwright doesn't start the
   database.
3. `npm test`

`npm test` starts the API (`./mvnw spring-boot:run`) and the UI (`npm start`), or reuses them when they
already run on `:8080` and `:4200`. It then resets the database to build-bro-api's
`src/test/resources/testdata.sql` and runs the tests in Chromium.

> **The reset deletes all data in the `build_bruh` database.** Use `RESET_DB=false` to keep it, or point
> the tests at another database (`DB_PORT`, and the same database for the API via `SPRING_DATASOURCE_URL`).

| Script | What it does |
|---|---|
| `npm test` | Runs all tests headless |
| `npm run test:headed` | The same, with a visible browser |
| `npm run test:ui` | Playwright's UI mode: pick, watch and debug tests |
| `npm run report` | Opens the HTML report of the last run (with traces of failed tests) |
| `npm run typecheck` | `tsc` over config, setup and tests |
| `npm run lint` | ESLint with the Playwright rules |

## Configuration

All settings are environment variables (`support/env.ts`):

| Variable | Default | Meaning |
|---|---|---|
| `BASE_URL` | `http://localhost:4200` | Where the browser opens the app |
| `API_URL` | `http://localhost:8080` | The API, for direct calls from tests |
| `STACK` | `local` | `external`: don't start the API and UI, test what runs at `BASE_URL` / `API_URL` |
| `API_DIR`, `UI_DIR` | sibling folders | The checkouts Playwright starts |
| `API_JAVA_HOME` | the JDK in build-bro-api's `.sdkmanrc` if sdkman has it | JDK for the API |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `3306`, `build_bruh` ×3 | The API's database, for the reset |
| `RESET_DB` | `true` | `false` skips the reset |
| `TEST_DATA_SQL` | build-bro-api's `testdata.sql` | Data loaded by the reset |

## Writing tests

- Specs go in `tests/<feature>/` as `*.spec.ts` (one folder per UI feature, `tests/journeys/` for flows
  across pages).
- Import `test` and `expect` from `support/fixtures.ts`, not from `@playwright/test`. It provides the
  page objects (`support/pages/`) and an `api` request context as fixtures.
- Page objects hold locators and actions, specs hold the assertions.
- Tests that change data create their own (through the API, with unique names) instead of changing the
  `testdata.sql` baseline.
- Tests can rely on the data in `testdata.sql`. Until they create their own data, they run one at a time
  (`workers: 1`).
- Find elements the way a user does: `getByRole`, `getByLabel`, `getByText`.

## CI

`.github/workflows/build.yml` checks out this repo, build-bro-api and build-bro-ui side by side and
starts MariaDB as a service. Playwright then boots the API and the UI and runs the tests. It runs on
push, on pull requests, nightly, and by hand (`workflow_dispatch`, which can run against other API or UI
branches). The HTML report is kept as the `playwright-report` artifact.

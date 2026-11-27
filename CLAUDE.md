# CLAUDE.md: build-bro-acceptance

Acceptance tests for Build Bruh: Playwright (TypeScript) against a live build-bro-api and build-bro-ui.
It runs against the sibling folders `../build-bro-api` and `../build-bro-ui` only.
The README has the setup and the environment variables (only `DB_*`).

## Commands

- `nvm use` (Node from `.nvmrc`, also used by CI) and `sdk env` (JDK from `.sdkmanrc`, for the API), then
  `npm ci` and `npm run browsers:install` (once)
- `npm test`: boots the API and UI (or reuses running ones), runs the tests, each on a freshly reset DB
- `npm run typecheck` and `npm run lint`: run both after every change. Playwright itself doesn't type-check, and
  ESLint (`eslint.config.js`: type-checked typescript-eslint plus eslint-plugin-playwright) catches a missing
  `await`, `waitForTimeout` and focused or skipped tests. CI fails on lint warnings too.
- `npx playwright test tests/foo.spec.ts`, `--headed`, `--ui`, `--debug` for single tests and debugging

MariaDB must already run (the workspace `run-stack` skill). Playwright doesn't start it.

## How it works

- `playwright.config.ts`: `webServer` starts the API (`./mvnw spring-boot:run`, ready when it serves
  `/openapi/build-bro-api.yaml`, so Flyway has migrated) and the UI (`npm start`) from the sibling
  folders. Running instances are reused, except on CI. The API gets the shell's `JAVA_HOME`: locally
  from this repo's `.sdkmanrc`, on CI from `setup-java`. **`.sdkmanrc` must match build-bro-api's Java
  version.**
- `support/env.ts`: the fixed paths and URLs, and the database settings (`DB_*` variables).
- `support/database.ts`: `resetDatabase()` runs `data/testdata.sql` (deletes all rows, inserts the test
  data with fixed IDs) through the `mariadb` driver. Its first reset on a connection fails with
  `testdata.sql doesn't empty: <table>` when a table in the schema has no `delete from` in the file.
- `support/fixtures.ts`: specs import `test` / `expect` from here. Page objects and shared helpers are
  fixtures (`api`: a request context for the API; `homePage`, ...). A worker-scoped `database` fixture
  holds one connection; the automatic `resetDatabase` fixture resets the database before **every** test.
- `support/pages/`: one page object per UI page (`home.page.ts` → `HomePage`), shared parts (side nav,
  paginator, ...) in `pages/components/`.
- `tests/<feature>/`: specs, one folder per UI feature folder (`home`, `builds`, `build-sets`,
  `deployments`, `servers`, `labels`, `projects`); `tests/journeys/` for flows across several pages.

## Writing specs

- **One spec file per area of behaviour**, grouped with `test.describe`. Test titles say the outcome the
  user sees ("pinning a build keeps it in the set after reload").
- **Page objects hold locators and actions; specs hold the assertions.** A page object exposes `Locator`s
  and methods such as `open()` or `pin(project, buildNumber)` and never calls `expect`. Specs get them as
  fixtures (`async ({homePage}) => ...`), never with `new`. A new page object: a file in
  `support/pages/` and an entry in `support/fixtures.ts`.
- **Test data:** every test starts from `data/testdata.sql`: an automatic fixture resets the
  database before each test. Tests may create, change or delete any data, including baseline rows, and
  don't clean up afterwards. Fixed names are fine. Never assert on IDs the API generates (the reset
  leaves `AUTO_INCREMENT` counters as they are).

## Conventions

- **Running the tests wipes the local `build_bruh` database.** Before running them for the user, ask
  first, or point the tests and the API at a throwaway database: start MariaDB on another port and set
  `DB_PORT` and `SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:<port>/build_bruh` (with no API already
  running on `:8080`, which would be reused).
- Tests are user journeys through the UI. Locate elements by role, label or text, not CSS classes. Where
  that isn't enough, `getByTestId()` finds the UI's `data-testid` attributes (Playwright's default).
  When the UI lacks any handle, add one in build-bro-ui (separate PR); better a role or label than a test ID.
- Icons are ligature text (`material-icons`), so an element's text includes icon names
  (`inventory_290Builds`). Match exact child texts rather than `toContainText` on a whole card.
- **This repo owns `data/testdata.sql`** (#14). It was copied from build-bro-api's
  `src/test/resources/testdata.sql` (the header names the commit) and doesn't follow changes to that
  file; don't sync it. Change it when a build-bro-api migration breaks it or a story needs other data.
  A table added in build-bro-api must be added to its delete list in FK-safe order; the reset fails
  until it is. A test that needs other data can also create it through the `api` fixture or the UI.
- `workers: 1` and `fullyParallel: false` stay until there is a database per worker: a reset deletes
  every table, so a second worker would lose its data mid-test.
- Dependencies are pinned to exact versions. Upgrade `@playwright/test` and the browsers together
  (`npm run browsers:install`).
- CI: `.github/workflows/build.yml`, actions pinned to commit SHAs like the other repos.

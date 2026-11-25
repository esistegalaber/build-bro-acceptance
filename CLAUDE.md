# CLAUDE.md: build-bro-acceptance

Acceptance tests for Build Bruh: Playwright (TypeScript) against a live build-bro-api and build-bro-ui.
It expects both as sibling folders (`../build-bro-api`, `../build-bro-ui`), or at `API_DIR` / `UI_DIR`.
The README has the setup and every environment variable.

## Commands

- `npm ci` and `npm run browsers:install` (once)
- `npm test`: boots the API and UI (or reuses running ones), resets the DB, runs the tests
- `npm run typecheck`: run after every change. Playwright itself doesn't type-check.
- `npx playwright test tests/foo.spec.ts`, `--headed`, `--ui`, `--debug` for single tests and debugging

MariaDB must already run (the workspace `run-stack` skill). Playwright doesn't start it.

## How it works

- `playwright.config.ts`: `webServer` starts the API (`./mvnw spring-boot:run`, ready when it serves
  `/openapi/build-bro-api.yaml`) and the UI (`npm start`). Running instances are reused, except on CI.
  `STACK=external` starts nothing.
- `support/env.ts`: all settings, read from environment variables. The API's JDK comes from its
  `.sdkmanrc` through sdkman, because sdkman's auto-env doesn't apply to processes Playwright starts.
- `setup/database.setup.ts`: the `setup` project. It loads build-bro-api's
  `src/test/resources/testdata.sql` (deletes all rows, inserts the test data) through the `mariadb`
  driver. The browser projects depend on it, so it runs after the web servers are up and Flyway has
  created the schema.
- `support/fixtures.ts`: specs import `test` / `expect` from here. Shared fixtures go here (`api` is a
  request context for the API).

## Conventions

- **Running the tests wipes the local `build_bruh` database.** Before running them for the user, ask
  first or use `RESET_DB=false`. To test against a throwaway DB: start MariaDB on another port and set
  `DB_PORT` and `SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:<port>/build_bruh`.
- Tests are user journeys through the UI. Locate elements by role, label or text, not CSS classes. Where
  that isn't enough, `getByTestId()` finds the UI's `data-testid` attributes (Playwright's default).
  When the UI lacks any handle, add one in build-bro-ui (separate PR); better a role or label than a test ID.
- Icons are ligature text (`material-icons`), so an element's text includes icon names
  (`inventory_290Builds`). Match exact child texts rather than `toContainText` on a whole card.
- Test data comes from build-bro-api's `testdata.sql`. A test that needs other data creates it through
  the `api` fixture. A change to `testdata.sql` belongs in build-bro-api.
- `workers: 1` while tests share the database. Raise it only once tests own their data.
- Dependencies are pinned to exact versions. Upgrade `@playwright/test` and the browsers together
  (`npm run browsers:install`).
- CI: `.github/workflows/build.yml`, actions pinned to commit SHAs like the other repos.

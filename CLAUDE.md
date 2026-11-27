# CLAUDE.md: build-bro-acceptance

Acceptance tests for Build Bruh: Playwright (TypeScript) against a live build-bro-api and build-bro-ui.
`npm test` runs against their published Docker images (#16), `npm run test:dev` against dev servers that
already run. The README has the setup and the environment variables (`API_IMAGE`, `UI_IMAGE`, `DB_*`).

## Commands

- `nvm use` (Node from `.nvmrc`, also used by CI), then `npm ci` and `npm run browsers:install` (once).
  Docker must run; no JDK and no sibling checkouts are needed.
- `npm test`: starts the API and UI images and a throwaway MariaDB, runs the tests, each on a freshly reset
  DB, removes the containers. Safe to run any time: it never touches the local database.
- `npm run test:dev` (`STACK=dev`): the same against the dev servers on `:4200`/`:8080`; starts nothing
- `npm run typecheck` and `npm run lint`: run both after every change. Playwright itself doesn't type-check, and
  ESLint (`eslint.config.js`: type-checked typescript-eslint plus eslint-plugin-playwright) catches a missing
  `await`, `waitForTimeout` and focused or skipped tests. CI fails on lint warnings too.
- `npx playwright test tests/foo.spec.ts`, `--headed`, `--ui`, `--debug` for single tests and debugging

## How it works

- `support/stack.ts`: Playwright's `globalSetup` (its returned function is the teardown). With Testcontainers
  it starts `mariadb:10.10`, the API (`API_IMAGE`) and the UI (`UI_IMAGE`, `BUILDZ_API=api`) on their own
  Docker network, on random host ports. Ready means the API's `/actuator/health/readiness` and the UI's `/`
  answer 200. The images are amd64 only, requested as `linux/amd64` (emulated on Apple Silicon, so the
  startup timeout is generous). Registry references are always pulled (`main` moves), local ones never. It
  passes the URLs and the database port on in `BB_*` variables (`stackEnv`); the workers inherit them.
  It prints the images with their digests (also into `container-logs/images.md`, which CI puts into the job
  summary) and streams the API's and UI's logs into `container-logs/` (not `test-results/`, which Playwright
  empties). With `STACK=dev` it does nothing. Testcontainers' Ryuk container removes everything even when a
  run crashes.
- `support/env.ts`: the image references, the URLs and the database settings. Getters, read on every access,
  because `globalSetup` sets the `BB_*` variables after the module has loaded. Without them (`test:dev`) the
  local defaults apply. `baseURL` is a fixture override in `support/fixtures.ts`, since the config is read
  before `globalSetup` runs.
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

- **`npm test` uses its own throwaway database**, so it can run any time. **`npm run test:dev` wipes the
  database the dev API uses** (by default the local `build_bruh`): ask before running it for the user.
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
- CI: `.github/workflows/build.yml` checks out only this repo and runs `npm test` (`workflow_dispatch` takes
  `api_tag`/`ui_tag`); actions pinned to commit SHAs like the other repos.

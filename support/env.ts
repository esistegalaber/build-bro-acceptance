// Where the system under test lives. Every value can be overridden with an environment variable,
// so the same suite runs against the local workspace, CI and a deployed stack.
import {existsSync, readFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const here = import.meta.dirname

/** Root of the sibling project checkouts (the workspace folder). */
const workspace = path.resolve(here, '..', '..')
const apiDir = process.env.API_DIR ?? path.join(workspace, 'build-bro-api')

/**
 * The JDK the API needs. sdkman switches to the JDK in build-bro-api/.sdkmanrc only on an interactive
 * `cd`, not for a process Playwright starts, so look it up here. Undefined keeps the inherited JAVA_HOME
 * (CI sets it with setup-java).
 */
function apiJavaHome(): string | undefined {
  if (process.env.API_JAVA_HOME) return process.env.API_JAVA_HOME
  const sdkmanrc = path.join(apiDir, '.sdkmanrc')
  if (!existsSync(sdkmanrc)) return undefined
  const version = /^java=(\S+)/m.exec(readFileSync(sdkmanrc, 'utf8'))?.[1]
  const sdkmanDir = process.env.SDKMAN_DIR ?? path.join(os.homedir(), '.sdkman')
  const home = version && path.join(sdkmanDir, 'candidates', 'java', version)
  return home && existsSync(home) ? home : undefined
}

export const env = {
  /** Where the browser opens the app. */
  baseUrl: process.env.BASE_URL ?? 'http://localhost:4200',
  /** The API, for direct calls from tests (seeding, checks). */
  apiUrl: process.env.API_URL ?? 'http://localhost:8080',

  /**
   * `local` (default): Playwright starts the API and the UI from the sibling checkouts, or reuses
   * instances that already run (except on CI).
   * `external`: the stack is already running (Docker, a test server); Playwright starts nothing.
   */
  stack: (process.env.STACK ?? 'local') as 'local' | 'external',
  apiDir,
  apiJavaHome: apiJavaHome(),
  uiDir: process.env.UI_DIR ?? path.join(workspace, 'build-bro-ui'),

  /** The API's database. The setup project resets it to the API's testdata.sql before the tests. */
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'build_bruh',
    password: process.env.DB_PASSWORD ?? 'build_bruh',
    database: process.env.DB_NAME ?? 'build_bruh',
  },
  /** Set RESET_DB=false to keep the data in the database (the tests may then fail on unexpected data). */
  resetDb: process.env.RESET_DB !== 'false',
  testDataSql: process.env.TEST_DATA_SQL ?? path.join(apiDir, 'src/test/resources/testdata.sql'),
}

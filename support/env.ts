// Where the system under test lives (#16). `npm test`: Docker images that support/stack.ts starts on random
// ports; it passes their URLs and the database port on through the variables in `stackEnv`. `npm run
// test:dev` (STACK=dev): the dev servers that already run on localhost, and the local database (DB_*).
// The values are read on every access, because globalSetup sets them after this module has loaded.
import path from 'node:path'

/** The variables support/stack.ts sets for the tests (the workers inherit them). */
export const stackEnv = {
  baseUrl: 'BB_BASE_URL',
  apiUrl: 'BB_API_URL',
  dbHost: 'BB_DB_HOST',
  dbPort: 'BB_DB_PORT',
} as const

const variable = (name: string): string | undefined => process.env[name] || undefined

export const env = {
  /** The images `npm test` runs: any reference, a registry one (always pulled) or a local one. */
  get apiImage(): string {
    return variable('API_IMAGE') ?? 'ghcr.io/esistegalaber/build-bro-api:main'
  },
  get uiImage(): string {
    return variable('UI_IMAGE') ?? 'ghcr.io/esistegalaber/build-bro-ui:main'
  },

  /** Where the browser opens the app: the UI container, or the UI's `npm start` (which proxies `/api`). */
  get baseUrl(): string {
    return variable(stackEnv.baseUrl) ?? 'http://localhost:4200'
  },
  /** The API, for direct calls from tests. */
  get apiUrl(): string {
    return variable(stackEnv.apiUrl) ?? 'http://localhost:8080'
  },

  /**
   * The API's database, reset to `testDataSql` before every test: the throwaway MariaDB container, or with
   * `test:dev` the local `build_bruh` (DB_*), which the dev API reads too.
   */
  get db() {
    return {
      host: variable(stackEnv.dbHost) ?? variable('DB_HOST') ?? 'localhost',
      port: Number(variable(stackEnv.dbPort) ?? variable('DB_PORT') ?? 3306),
      user: variable('DB_USER') ?? 'build_bruh',
      password: variable('DB_PASSWORD') ?? 'build_bruh',
      database: variable('DB_NAME') ?? 'build_bruh',
    }
  },
  /** This repo's own test data (build-bro-acceptance#14), not build-bro-api's copy. */
  testDataSql: path.resolve(import.meta.dirname, '..', 'data', 'testdata.sql'),
}

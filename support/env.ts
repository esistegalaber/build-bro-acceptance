// Where the system under test lives. The suite runs against the sibling checkouts in the workspace
// (build-bro-api, build-bro-ui); only the database can be pointed elsewhere.
import path from 'node:path'

/** Root of the sibling project checkouts (the workspace folder). */
const workspace = path.resolve(import.meta.dirname, '..', '..')
const apiDir = path.join(workspace, 'build-bro-api')

export const env = {
  /** Where the browser opens the app: the UI's `npm start`, which proxies `/api` to the API. */
  baseUrl: 'http://localhost:4200',
  /** The API, for direct calls from tests. */
  apiUrl: 'http://localhost:8080',

  apiDir,
  uiDir: path.join(workspace, 'build-bro-ui'),

  /**
   * The API's database, reset to `testDataSql` before every test. The defaults are the local
   * `build_bruh`, which a reused dev API reads too. To keep local data, point the tests (`DB_PORT`, ...)
   * and the API (`SPRING_DATASOURCE_URL`) at a throwaway database.
   */
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'build_bruh',
    password: process.env.DB_PASSWORD ?? 'build_bruh',
    database: process.env.DB_NAME ?? 'build_bruh',
  },
  /** This repo's own test data (build-bro-acceptance#14), not build-bro-api's copy. */
  testDataSql: path.resolve(import.meta.dirname, '..', 'data', 'testdata.sql'),
}

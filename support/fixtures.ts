// Specs import `test` and `expect` from here, not from @playwright/test. Page objects and shared
// helpers are fixtures, so a spec asks for what it needs: `async ({homePage}) => ...`.
import {type APIRequestContext, test as base, expect} from '@playwright/test'
import type {Connection} from 'mariadb'
import {connectToDatabase, resetDatabase} from './database'
import {env} from './env'
import {HomePage} from './pages/home.page'
import {ProjectsPage} from './pages/projects.page'

type TestFixtures = {
  /** Automatic: every test starts from data/testdata.sql. */
  resetDatabase: void
  /** Calls the API directly, for example to create data a test needs or to check a result. */
  api: APIRequestContext
  homePage: HomePage
  projectsPage: ProjectsPage
}

type WorkerFixtures = {
  /** One connection to the API's database per worker, for the resets. */
  database: Connection
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // The UI's URL is only known after globalSetup has started it (support/stack.ts), so not in the config
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use) => {
    await use(env.baseUrl)
  },

  database: [
    // Playwright reads a fixture's dependencies from its first parameter, which must be destructured
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const connection = await connectToDatabase()
      await use(connection)
      await connection.end()
    },
    {scope: 'worker'},
  ],

  resetDatabase: [
    async ({database}, use) => {
      await resetDatabase(database)
      await use()
    },
    {auto: true},
  ],

  api: async ({playwright}, use) => {
    const api = await playwright.request.newContext({baseURL: env.apiUrl})
    await use(api)
    await api.dispose()
  },

  // Page objects, one per page (support/pages/)
  homePage: async ({page}, use) => {
    await use(new HomePage(page))
  },
  projectsPage: async ({page}, use) => {
    await use(new ProjectsPage(page))
  },
})

export {expect}

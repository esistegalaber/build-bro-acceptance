// Specs import `test` and `expect` from here, not from @playwright/test. Page objects and shared
// helpers are fixtures, so a spec asks for what it needs: `async ({homePage}) => ...`.
import {type APIRequestContext, test as base, expect} from '@playwright/test'
import {env} from './env'
import {HomePage} from './pages/home.page'

type Fixtures = {
  /** Calls the API directly, for example to create data a test needs or to check a result. */
  api: APIRequestContext
  homePage: HomePage
}

export const test = base.extend<Fixtures>({
  api: async ({playwright}, use) => {
    const api = await playwright.request.newContext({baseURL: env.apiUrl})
    await use(api)
    await api.dispose()
  },

  // Page objects, one per page (support/pages/)
  homePage: async ({page}, use) => {
    await use(new HomePage(page))
  },
})

export {expect}

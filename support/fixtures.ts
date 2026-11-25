// Specs import `test` and `expect` from here, not from @playwright/test, so shared fixtures
// (an API client, page objects, a logged-in user, ...) can be added in one place later.
import {test as base, expect} from '@playwright/test'
import {env} from './env'

export const test = base.extend<{api: import('@playwright/test').APIRequestContext}>({
  /** Calls the API directly, for example to create data a test needs or to check a result. */
  api: async ({playwright}, use) => {
    const api = await playwright.request.newContext({baseURL: env.apiUrl})
    await use(api)
    await api.dispose()
  },
})

export {expect}

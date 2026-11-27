import {defineConfig, devices} from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  // Every test resets the one shared database, so a second worker would have its data wiped mid-test.
  // Parallel runs need a database per worker.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', {open: 'never'}]] : [['list'], ['html', {open: 'never'}]],

  // Starts the API, the UI and a throwaway MariaDB from Docker images and stops them afterwards (its returned
  // function is the teardown); does nothing with STACK=dev (`npm run test:dev`). See support/stack.ts.
  globalSetup: './support/stack.ts',

  use: {
    // baseURL comes from support/fixtures.ts: the UI's port is only known after globalSetup
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Every test resets the database itself (the automatic `resetDatabase` fixture in support/fixtures.ts).
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
    // More browsers when needed:
    // {name: 'firefox', use: {...devices['Desktop Firefox']}},
    // {name: 'webkit', use: {...devices['Desktop Safari']}},
  ],
})

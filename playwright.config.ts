import {defineConfig, devices} from '@playwright/test'
import {env} from './support/env'

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

  use: {
    baseURL: env.baseUrl,
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

  // Boots the real stack from the sibling checkouts (the database must already run, see README).
  // Locally, instances that already listen on the ports are reused; on CI, Playwright always starts its
  // own. The API runs on the shell's JAVA_HOME: this repo's .sdkmanrc locally, setup-java on CI.
  webServer: [
    {
      name: 'API',
      command: './mvnw -B -q spring-boot:run',
      cwd: env.apiDir,
      url: `${env.apiUrl}/openapi/build-bro-api.yaml`,
      reuseExistingServer: !isCI,
      timeout: 240_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      name: 'UI',
      command: 'npm start',
      cwd: env.uiDir,
      url: env.baseUrl,
      reuseExistingServer: !isCI,
      timeout: 240_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})

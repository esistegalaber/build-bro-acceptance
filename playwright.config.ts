import {defineConfig, devices} from '@playwright/test'
import {env} from './support/env'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  // The tests share one database, so they run one at a time until they own their data.
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
    // Resets the database to the API's testdata.sql. Runs after the web servers are up, so Flyway
    // has already created the schema.
    {
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
      dependencies: ['setup'],
    },
    // More browsers when needed:
    // {name: 'firefox', use: {...devices['Desktop Firefox']}, dependencies: ['setup']},
    // {name: 'webkit', use: {...devices['Desktop Safari']}, dependencies: ['setup']},
  ],

  // Boots the real stack (the database must already run, see README). Locally, instances that
  // already listen on the ports are reused; on CI, Playwright always starts its own.
  webServer:
    env.stack === 'external'
      ? undefined
      : [
          {
            name: 'API',
            command: './mvnw -B -q spring-boot:run',
            cwd: env.apiDir,
            env: env.apiJavaHome ? {JAVA_HOME: env.apiJavaHome} : {},
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

// Playwright's globalSetup (#16): starts the system under test from Docker images before the tests and
// stops it afterwards (the returned function is Playwright's teardown). `STACK=dev` (`npm run test:dev`)
// skips all of this: the tests then use the dev servers that already run (support/env.ts).
//
// MariaDB, the API and the UI run on their own Docker network, mapped to random host ports, so a run never
// collides with a running dev stack or a second run. The URLs and the database port reach the tests through
// process.env: Playwright starts the workers after globalSetup, so they inherit them.
import {execFileSync} from 'node:child_process'
import {createWriteStream, mkdirSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {
  GenericContainer,
  Network,
  PullPolicy,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'
import {env, stackEnv} from './env'

const MARIADB_IMAGE = 'mariadb:10.10'
/** The images are amd64 only (build-bro-api#28, build-bro-ui#86); on Apple Silicon they run emulated. */
const PLATFORM = 'linux/amd64'
/** Pulling, plus the API's start (Flyway) under emulation on Apple Silicon. */
const STARTUP_TIMEOUT_MS = 240_000

const outDir = path.resolve(import.meta.dirname, '..', 'container-logs')

export default async function globalSetup(): Promise<(() => Promise<void>) | undefined> {
  if (process.env.STACK === 'dev') {
    console.log('STACK=dev: testing the dev servers on localhost:4200 and :8080 (their database gets reset)')
    return undefined
  }
  mkdirSync(outDir, {recursive: true})
  const started: (StartedTestContainer | StartedNetwork)[] = []
  try {
    const network = await new Network().start()
    started.push(network)

    const db = await new GenericContainer(MARIADB_IMAGE)
      .withNetwork(network)
      .withNetworkAliases('db')
      .withEnvironment({
        MARIADB_DATABASE: env.db.database,
        MARIADB_USER: env.db.user,
        MARIADB_PASSWORD: env.db.password,
        MARIADB_ROOT_PASSWORD: env.db.password,
      })
      .withExposedPorts(3306)
      .withHealthCheck({
        test: ['CMD', 'healthcheck.sh', '--connect', '--innodb_initialized'],
        interval: 1_000,
        retries: 60,
      })
      .withWaitStrategy(Wait.forHealthCheck())
      .start()
    started.push(db)

    const api = await fromImage(env.apiImage, 'api')
      .withNetwork(network)
      .withNetworkAliases('api')
      .withEnvironment({
        SPRING_DATASOURCE_URL: `jdbc:mariadb://db:3306/${env.db.database}`,
        SPRING_DATASOURCE_USERNAME: env.db.user,
        SPRING_DATASOURCE_PASSWORD: env.db.password,
      })
      .withExposedPorts(8080)
      // Ready once Flyway has migrated and the database answers (build-bro-api#24)
      .withWaitStrategy(Wait.forHttp('/actuator/health/readiness', 8080).forStatusCode(200))
      .start()
    started.push(api)

    const ui = await fromImage(env.uiImage, 'ui')
      .withNetwork(network)
      .withEnvironment({BUILDZ_API: 'api'})
      .withExposedPorts(8080)
      .withWaitStrategy(Wait.forHttp('/', 8080).forStatusCode(200))
      .start()
    started.push(ui)

    process.env[stackEnv.baseUrl] = `http://${ui.getHost()}:${ui.getMappedPort(8080)}`
    process.env[stackEnv.apiUrl] = `http://${api.getHost()}:${api.getMappedPort(8080)}`
    process.env[stackEnv.dbHost] = db.getHost()
    process.env[stackEnv.dbPort] = String(db.getMappedPort(3306))
    reportImages()
  } catch (error) {
    await stop(started)
    throw error
  }
  return () => stop(started)
}

/**
 * A container from the API's or the UI's image. Registry references (`ghcr.io/...`) are always pulled,
 * because tags like `main` move; local ones (`build-bro-ui:dev`) are used as they are. Its log goes to
 * container-logs/<name>.log, which also explains a container that never gets ready.
 */
function fromImage(image: string, name: string): GenericContainer {
  return new GenericContainer(image)
    .withPlatform(PLATFORM)
    .withPullPolicy(isRegistryReference(image) ? PullPolicy.alwaysPull() : PullPolicy.defaultPolicy())
    .withStartupTimeout(STARTUP_TIMEOUT_MS)
    .withLogConsumer(stream => stream.pipe(createWriteStream(path.join(outDir, `${name}.log`))))
}

/** A reference whose first part is a registry host (`ghcr.io/...`, `localhost:5000/...`). */
function isRegistryReference(image: string): boolean {
  const first = image.split('/')[0]
  return image.includes('/') && (first.includes('.') || first.includes(':') || first === 'localhost')
}

/** Prints which images were tested, with their digests, and writes the same to container-logs/images.md. */
function reportImages(): void {
  const lines = [env.apiImage, env.uiImage].map(image => `- \`${image}\`: \`${digestOf(image)}\``)
  const report = ['### Images under test', '', ...lines, ''].join('\n')
  console.log(report)
  writeFileSync(path.join(outDir, 'images.md'), report)
}

/** The registry digest of a pulled image, or the local image ID for an image that was never pushed. */
function digestOf(image: string): string {
  const inspect = (format: string) =>
    execFileSync('docker', ['image', 'inspect', '--format', format, image], {encoding: 'utf8'}).trim()
  const repoDigest = inspect('{{join .RepoDigests " "}}').split(' ')[0]
  return repoDigest ? repoDigest.slice(repoDigest.indexOf('@') + 1) : inspect('{{.Id}}')
}

async function stop(started: (StartedTestContainer | StartedNetwork)[]): Promise<void> {
  for (const resource of started.reverse()) {
    await resource.stop()
  }
}

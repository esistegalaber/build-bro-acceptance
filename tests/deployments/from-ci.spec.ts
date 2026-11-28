import {expect, test} from '../../support/fixtures'

// What CI does after a deployment: record it (POST /api/v1/deployments) and label its builds. Build IDs 20, 50
// and 80 are backend, frontend and backoffice next #10 in data/testdata.sql; deployment 1, the newest, holds
// the main #10 builds (IDs 10, 40, 70) and deployment 2 the main #9 ones.
test.describe('deployments made through the API', () => {
  test('a new deployment shows at the top with its builds', async ({api, deploymentsPage}) => {
    const response = await api.post('/api/v1/deployments', {
      data: {serverName: 'testserver', builds: [{id: 20}, {id: 50}, {id: 80}]},
    })
    expect(response.status()).toBe(200)

    await deploymentsPage.open()
    await expect(deploymentsPage.count).toHaveText('12 deployments')
    const newest = deploymentsPage.newest()
    await expect(newest).toContainText('testserver · Tester')
    await expect(deploymentsPage.buildCount(newest)).toHaveText('3 builds')
    // The deployment of the test data is still there, further down
    await expect(deploymentsPage.buildCount(deploymentsPage.deployment(1))).toHaveText('3 builds')

    await deploymentsPage.expand(newest)
    const builds = deploymentsPage.buildsOf(newest)
    await expect(builds.rows).toHaveCount(3)
    await expect(builds.row('backend', 'next', 10)).toBeVisible()
    await expect(builds.row('frontend', 'next', 10)).toBeVisible()
    await expect(builds.row('backoffice', 'next', 10)).toBeVisible()
  })

  test('labels added to a deployment’s builds show on each of them, and on no others', async ({api, deploymentsPage}) => {
    const response = await api.post('/api/v1/deployments/add-labels-to-builds/1', {
      data: [{key: 'qa', value: 'passed'}],
    })
    expect(response.status()).toBe(200)

    await deploymentsPage.open()
    await expect(deploymentsPage.count).toHaveText('11 deployments')

    const labelled = deploymentsPage.deployment(1)
    await deploymentsPage.expand(labelled)
    const labelledBuilds = deploymentsPage.buildsOf(labelled)
    for (const project of ['backend', 'frontend', 'backoffice']) {
      await labelledBuilds.expand(project, 'main', 10)
      await expect(labelledBuilds.label(project, 'main', 10, 'qa')).toHaveText('passed')
    }

    const other = deploymentsPage.deployment(2)
    await deploymentsPage.expand(other)
    const otherBuilds = deploymentsPage.buildsOf(other)
    for (const project of ['backend', 'frontend', 'backoffice']) {
      await otherBuilds.expand(project, 'main', 9)
      // The build's other labels show, so the row is open and the missing one isn't just not loaded yet
      await expect(otherBuilds.label(project, 'main', 9, 'Integration test')).toBeVisible()
      await expect(otherBuilds.label(project, 'main', 9, 'qa')).toHaveCount(0)
    }
  })
})

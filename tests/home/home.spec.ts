import {expect, test} from '../../support/fixtures'

// The expected values come from data/testdata.sql, which the database is reset to before each test.
test('the home page shows what Build Bruh knows from the test data', async ({homePage}) => {
  await homePage.open()

  await expect(homePage.heading).toBeVisible()

  // The stats
  for (const [key, label, value] of [
    ['projects', 'Projects', '4'],
    ['branches', 'Branches', '14'],
    ['builds', 'Builds', '90'],
    ['labels', 'Labels', '273'],
  ] as const) {
    await expect(homePage.statText(key, value)).toBeVisible()
    await expect(homePage.statText(key, label)).toBeVisible()
  }

  // The three newest deployments, newest first
  await expect(homePage.deploymentRows).toHaveCount(3)
  await expect(homePage.deploymentRows.first()).toContainText('testserver · Tester')
  await expect(homePage.deploymentRows.first()).toContainText('backend #10')

  // The build sets
  await expect(homePage.buildSet('main')).toContainText('2 projects · 1 pinned')
})

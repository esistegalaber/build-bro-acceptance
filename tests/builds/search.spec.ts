import {expect, test} from '../../support/fixtures'

// data/testdata.sql has 90 builds: #1 to #10 on each of main, next and feature-<project> of backend,
// frontend and backoffice. The page sorts them by build number, newest first, 10 per page.
const newestFirst = (from: number, to: number): string[] =>
  Array.from({length: to - from + 1}, (_, i) => `#${to - i}`)

test.describe('searching builds', () => {
  test.beforeEach(async ({buildsPage}) => {
    await buildsPage.open()
    await expect(buildsPage.count).toHaveText('90 builds')
  })

  test('a project and branch show only that branch’s builds, newest first', async ({buildsPage}) => {
    await buildsPage.search('backend', 'main')

    await expect(buildsPage.count).toHaveText('10 builds')
    await expect(buildsPage.builds.buildNumbers).toHaveText(newestFirst(1, 10))
    for (let buildNumber = 1; buildNumber <= 10; buildNumber++) {
      await expect(buildsPage.builds.row('backend', 'main', buildNumber)).toBeVisible()
    }
  })

  // Both ends are exclusive: the contract says so for `minBuildNumber`/`maxBuildNumber` (POST /api/v1/builds/search)
  test('a build number range shows only the builds between its ends', async ({buildsPage}) => {
    await buildsPage.search('backend', 'main')
    await buildsPage.buildNumbers(3, 7)

    await expect(buildsPage.count).toHaveText('3 builds')
    await expect(buildsPage.builds.buildNumbers).toHaveText(newestFirst(4, 6))
  })

  test('a search without matches shows the empty state, and resetting the filters brings all builds back', async ({
    buildsPage,
  }) => {
    await buildsPage.search('backend', 'main')
    await buildsPage.buildNumbers(11)

    await expect(buildsPage.count).toHaveText('0 builds')
    await expect(buildsPage.emptyState.getByText('No builds match these filters.')).toBeVisible()
    await expect(buildsPage.builds.rows).toHaveCount(0)

    await buildsPage.resetFilters()

    await expect(buildsPage.count).toHaveText('90 builds')
    await expect(buildsPage.emptyState).toBeHidden()
    await expect(buildsPage.builds.rows).toHaveCount(10)
  })
})

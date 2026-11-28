import {expect, test} from '../../support/fixtures'

// data/testdata.sql has 11 deployments of 3 builds each: 10 to testserver (1 to 11 days ago) and one to
// staging (5 days ago, ID 5); prod-1 has none. The page shows them newest first, 10 per page. Deployment 1,
// the newest, holds backend, frontend and backoffice main #10.
test.describe('searching deployments', () => {
  test.beforeEach(async ({deploymentsPage}) => {
    await deploymentsPage.open()
    await expect(deploymentsPage.count).toHaveText('11 deployments')
  })

  test('all deployments show newest first, ten to a page', async ({deploymentsPage}) => {
    const {rows, paginator} = deploymentsPage
    await expect(paginator.range).toHaveText('Showing 1–10 of 11')
    await expect(paginator.currentPage).toHaveText('1 / 2')
    // The staging deployment is the fifth newest
    await expect(rows).toContainText([
      ...Array<string>(4).fill('testserver · Tester'),
      'staging · Company Staging',
      ...Array<string>(5).fill('testserver · Tester'),
    ])
    await expect(deploymentsPage.newest()).toContainText('testserver · Tester')
    await expect(deploymentsPage.newest().and(deploymentsPage.deployment(1))).toBeVisible()
    await expect(deploymentsPage.buildCount(deploymentsPage.newest())).toHaveText('3 builds')

    await paginator.nextPage()
    await expect(paginator.range).toHaveText('Showing 11–11 of 11')
    await expect(paginator.currentPage).toHaveText('2 / 2')
    await expect(rows).toHaveCount(1)
    await expect(deploymentsPage.deployment(11)).toBeVisible()
  })

  test('a server shows only its deployments', async ({deploymentsPage}) => {
    await deploymentsPage.chooseServer('testserver')
    await expect(deploymentsPage.count).toHaveText('10 deployments')
    await expect(deploymentsPage.rows).toHaveCount(10)
    await expect(deploymentsPage.rows.filter({hasText: 'staging'})).toHaveCount(0)

    await deploymentsPage.chooseServer('staging')
    await expect(deploymentsPage.count).toHaveText('1 deployment')
    await expect(deploymentsPage.rows).toHaveCount(1)
    await expect(deploymentsPage.newest()).toContainText('staging · Company Staging')
    await expect(deploymentsPage.deployment(5)).toBeVisible()
  })

  test('a server without deployments shows the empty state, and resetting brings everything back', async ({deploymentsPage}) => {
    await deploymentsPage.chooseServer('prod-1')

    await expect(deploymentsPage.count).toHaveText('0 deployments')
    await expect(deploymentsPage.emptyState).toContainText('No deployments match these filters.')
    await expect(deploymentsPage.rows).toHaveCount(0)

    await deploymentsPage.resetFilters()
    await expect(deploymentsPage.count).toHaveText('11 deployments')
    await expect(deploymentsPage.emptyState).toBeHidden()
    await expect(deploymentsPage.rows).toHaveCount(10)
  })

  test('opening a deployment shows its builds', async ({deploymentsPage}) => {
    const newest = deploymentsPage.newest()
    await deploymentsPage.expand(newest)

    const builds = deploymentsPage.buildsOf(newest)
    await expect(builds.rows).toHaveCount(3)
    await expect(builds.row('backend', 'main', 10)).toBeVisible()
    await expect(builds.row('frontend', 'main', 10)).toBeVisible()
    await expect(builds.row('backoffice', 'main', 10)).toBeVisible()
  })
})

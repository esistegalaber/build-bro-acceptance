import {expect, test} from '../../support/fixtures'

// data/testdata.sql has 90 builds, nine of each build number from #1 to #10 (three projects, three branches
// each). Sorted newest first, a page's build numbers are known, though not the order of builds that share one.
const buildNumbers = (...counts: [number, number][]): string[] =>
  counts.flatMap(([buildNumber, count]) => Array<string>(count).fill(`#${buildNumber}`))

test.describe('paging through all builds', () => {
  test.beforeEach(async ({buildsPage}) => {
    await buildsPage.open()
    await expect(buildsPage.count).toHaveText('90 builds')
  })

  test('next and last page show the next and the last ten builds', async ({buildsPage}) => {
    const {builds, paginator} = buildsPage
    await expect(paginator.range).toHaveText('Showing 1–10 of 90')
    await expect(paginator.currentPage).toHaveText('1 / 9')
    await expect(builds.buildNumbers).toHaveText(buildNumbers([10, 9], [9, 1]))
    await expect(paginator.previousPageButton).toBeDisabled()

    await paginator.nextPage()
    await expect(paginator.range).toHaveText('Showing 11–20 of 90')
    await expect(paginator.currentPage).toHaveText('2 / 9')
    await expect(builds.buildNumbers).toHaveText(buildNumbers([9, 8], [8, 2]))

    await paginator.lastPage()
    await expect(paginator.range).toHaveText('Showing 81–90 of 90')
    await expect(paginator.currentPage).toHaveText('9 / 9')
    await expect(builds.buildNumbers).toHaveText(buildNumbers([2, 1], [1, 9]))
    await expect(paginator.nextPageButton).toBeDisabled()

    await paginator.firstPage()
    await expect(paginator.range).toHaveText('Showing 1–10 of 90')
  })

  test('a larger page size shows more builds per page', async ({buildsPage}) => {
    await buildsPage.perPage(25)

    await expect(buildsPage.paginator.range).toHaveText('Showing 1–25 of 90')
    await expect(buildsPage.paginator.currentPage).toHaveText('1 / 4')
    await expect(buildsPage.builds.rows).toHaveCount(25)
  })
})

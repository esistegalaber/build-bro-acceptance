import {expect, test} from '../../support/fixtures'

// data/testdata.sql has three build sets: `main` (backend `main` pinned to #9, frontend `main` at its latest, #10)
// and `feature-test-stage-1` and `Environment of StageServer` without projects.
test.describe('the build sets list', () => {
  test.beforeEach(async ({buildSetsPage}) => {
    await buildSetsPage.open()
  })

  test('the list shows every build set with a summary of its projects', async ({buildSetsPage}) => {
    await expect(buildSetsPage.entries).toHaveCount(3)
    await expect(buildSetsPage.summary('main')).toHaveText('2 projects · 1 pinned')
    await expect(buildSetsPage.summary('feature-test-stage-1')).toHaveText('No projects yet')
    await expect(buildSetsPage.summary('Environment of StageServer')).toHaveText('No projects yet')
  })

  test('selecting a build set shows the builds it resolves to', async ({buildSetsPage}) => {
    await buildSetsPage.select('main')

    await expect(buildSetsPage.cardHeading).toHaveText('Builds of main')
    await expect(buildSetsPage.builds.rows).toHaveCount(2)
    await expect(buildSetsPage.builds.row('backend', 'main', 9)).toBeVisible()
    await expect(buildSetsPage.builds.row('frontend', 'main', 10)).toBeVisible()
  })

  test('cancelling the confirmation keeps a build set, deleting removes it for good', async ({buildSetsPage}) => {
    await buildSetsPage.select('feature-test-stage-1')
    // The card shows before the set has loaded, with links to no set: wait for its name
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of feature-test-stage-1')
    await buildSetsPage.delete()
    await expect(buildSetsPage.deleteDialog('feature-test-stage-1')).toBeVisible()

    await buildSetsPage.cancelDelete()
    await expect(buildSetsPage.deleteDialog('feature-test-stage-1')).toBeHidden()
    await expect(buildSetsPage.entry('feature-test-stage-1')).toBeVisible()

    await buildSetsPage.delete()
    await buildSetsPage.confirmDelete()
    await expect(buildSetsPage.entry('feature-test-stage-1')).toBeHidden()
    await expect(buildSetsPage.entries).toHaveCount(2)

    await buildSetsPage.reload()
    await expect(buildSetsPage.entry('main')).toBeVisible()
    await expect(buildSetsPage.entry('feature-test-stage-1')).toBeHidden()
    await expect(buildSetsPage.entries).toHaveCount(2)
  })
})

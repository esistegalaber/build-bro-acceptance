import {expect, test} from '../../support/fixtures'

// data/testdata.sql: every project has the branches main, next and feature-<project>, each with builds #1 to #10.
// The build set `main` has backend `main` pinned to #9 and frontend `main` at its latest, #10.
test.describe('editing build sets', () => {
  test.beforeEach(async ({buildSetsPage}) => {
    await buildSetsPage.open()
    await expect(buildSetsPage.entries).toHaveCount(3)
  })

  test('a new build set is saved, listed and resolves to its builds', async ({alert, buildSetsPage, editBuildSetPage}) => {
    await buildSetsPage.newBuildSet()
    await editBuildSetPage.nameInput.fill('qa-stage')
    await editBuildSetPage.include('backend')
    await editBuildSetPage.chooseBranch('backend', 'main')
    await expect(editBuildSetPage.resolvedBuildNumber('backend')).toHaveText('#10')

    await editBuildSetPage.save()
    await expect(alert.heading).toHaveText('Saved')

    await editBuildSetPage.backToList()
    await expect(buildSetsPage.summary('qa-stage')).toHaveText('1 project')

    await buildSetsPage.reload()
    await expect(buildSetsPage.summary('qa-stage')).toHaveText('1 project')
    await buildSetsPage.select('qa-stage')
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of qa-stage')
    await expect(buildSetsPage.builds.rows).toHaveCount(1)
    await expect(buildSetsPage.builds.row('backend', 'main', 10)).toBeVisible()
  })

  test('pinning a build keeps it in the set after a reload, and unpinning brings back the latest', async ({
    alert,
    buildSetsPage,
    editBuildSetPage,
  }) => {
    await buildSetsPage.select('main')
    // The card shows before the set has loaded, with links to no set: wait for its name
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of main')
    await buildSetsPage.edit()
    await editBuildSetPage.pin('frontend', 5)
    await expect(editBuildSetPage.pinnedBadge('frontend')).toBeVisible()
    await expect(editBuildSetPage.resolvedBuildNumber('frontend')).toHaveText('#5')

    await editBuildSetPage.save()
    await expect(alert.heading).toHaveText('Saved')
    await alert.dismiss()
    await expect(alert.panel).toBeHidden()

    await editBuildSetPage.backToList()
    await buildSetsPage.reload()
    await expect(buildSetsPage.summary('main')).toHaveText('2 projects · 2 pinned')
    await buildSetsPage.select('main')
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of main')
    await expect(buildSetsPage.builds.row('frontend', 'main', 5)).toBeVisible()
    await expect(buildSetsPage.builds.row('backend', 'main', 9)).toBeVisible()

    await buildSetsPage.edit()
    await expect(editBuildSetPage.buildNumberInput('frontend')).toHaveValue('5')
    await editBuildSetPage.unpin('frontend')
    await expect(editBuildSetPage.pinnedBadge('frontend')).toBeHidden()
    await expect(editBuildSetPage.resolvedBuildNumber('frontend')).toHaveText('#10')

    await editBuildSetPage.save()
    await expect(alert.heading).toHaveText('Saved')

    await editBuildSetPage.backToList()
    await buildSetsPage.reload()
    await expect(buildSetsPage.summary('main')).toHaveText('2 projects · 1 pinned')
    await buildSetsPage.select('main')
    await expect(buildSetsPage.builds.row('frontend', 'main', 10)).toBeVisible()
    await expect(buildSetsPage.builds.row('backend', 'main', 9)).toBeVisible()
  })

  test('a clone saved under a new name has the same projects and pin, and the original stays', async ({
    alert,
    buildSetsPage,
    editBuildSetPage,
  }) => {
    await buildSetsPage.select('main')
    // The card shows before the set has loaded, with links to no set: wait for its name
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of main')
    await buildSetsPage.clone()
    // The copy has loaded once it shows its name and resolves; a name typed before would be replaced
    await expect(editBuildSetPage.nameInput).toHaveValue('CLONE-OF-main')
    await expect(editBuildSetPage.resolvedBuildNumber('backend')).toHaveText('#9')
    await expect(editBuildSetPage.resolvedBuildNumber('frontend')).toHaveText('#10')

    await editBuildSetPage.nameInput.fill('main-copy')
    await editBuildSetPage.save()
    await expect(alert.heading).toHaveText('Saved')

    await editBuildSetPage.backToList()
    await buildSetsPage.reload()
    await expect(buildSetsPage.entries).toHaveCount(4)
    await expect(buildSetsPage.summary('main-copy')).toHaveText('2 projects · 1 pinned')
    await expect(buildSetsPage.summary('main')).toHaveText('2 projects · 1 pinned')

    await buildSetsPage.select('main-copy')
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of main-copy')
    await expect(buildSetsPage.builds.rows).toHaveCount(2)
    await expect(buildSetsPage.builds.row('backend', 'main', 9)).toBeVisible()
    await expect(buildSetsPage.builds.row('frontend', 'main', 10)).toBeVisible()

    await buildSetsPage.select('main')
    await expect(buildSetsPage.cardHeading).toHaveText('Builds of main')
    await expect(buildSetsPage.builds.rows).toHaveCount(2)
    await expect(buildSetsPage.builds.row('backend', 'main', 9)).toBeVisible()
    await expect(buildSetsPage.builds.row('frontend', 'main', 10)).toBeVisible()
  })

  test('the resolved builds follow the project rows', async ({buildSetsPage, editBuildSetPage}) => {
    await buildSetsPage.newBuildSet()
    await expect(editBuildSetPage.resolved('backoffice')).toBeHidden()

    await editBuildSetPage.include('backoffice')
    await expect(editBuildSetPage.resolved('backoffice')).toBeVisible()
    await editBuildSetPage.chooseBranch('backoffice', 'next')
    await expect(editBuildSetPage.resolvedBuildNumber('backoffice')).toHaveText('#10')

    await editBuildSetPage.pin('backoffice', 3)
    await expect(editBuildSetPage.resolvedBuildNumber('backoffice')).toHaveText('#3')

    await editBuildSetPage.exclude('backoffice')
    await expect(editBuildSetPage.resolved('backoffice')).toBeHidden()
  })
})

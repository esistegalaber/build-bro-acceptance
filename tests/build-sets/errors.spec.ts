import {expect, test} from '../../support/fixtures'

test.describe('saving a build set that the UI or the API refuses', () => {
  test.beforeEach(async ({buildSetsPage}) => {
    await buildSetsPage.open()
    await buildSetsPage.newBuildSet()
  })

  test('a build set without a name can’t be saved', async ({editBuildSetPage}) => {
    await expect(editBuildSetPage.nameInput).toHaveValue('')
    await expect(editBuildSetPage.saveButton).toBeDisabled()

    await editBuildSetPage.nameInput.fill('qa-stage')
    await expect(editBuildSetPage.saveButton).toBeEnabled()

    await editBuildSetPage.nameInput.clear()
    await expect(editBuildSetPage.saveButton).toBeDisabled()
  })

  test('a new build set under an existing name shows the API’s error and creates nothing', async ({
    alert,
    buildSetsPage,
    editBuildSetPage,
  }) => {
    await editBuildSetPage.nameInput.fill('main')
    await editBuildSetPage.include('backend')
    await editBuildSetPage.chooseBranch('backend', 'next')
    await editBuildSetPage.save()

    await expect(alert.error).toBeVisible()
    await expect(alert.message).toHaveText("BuildSetTemplate with name='main' already exists")

    await editBuildSetPage.backToList()
    await expect(buildSetsPage.entries).toHaveCount(3)
    await expect(buildSetsPage.entry('main')).toHaveCount(1)
    await expect(buildSetsPage.summary('main')).toHaveText('2 projects · 1 pinned')
  })
})

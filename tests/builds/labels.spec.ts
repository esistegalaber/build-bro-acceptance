import {expect, test} from '../../support/fixtures'

// In data/testdata.sql every build has the labels integration-test (45 `ok`, 45 `broken`), jenkins-build
// and revision, each with a definition. integration-test's display name is "Integration test", revision
// must be a 64-character hex hash. Build ID 1 is backend / main #1.
test.describe('build labels', () => {
  test.beforeEach(async ({buildsPage}) => {
    await buildsPage.open()
    await expect(buildsPage.count).toHaveText('90 builds')
  })

  test('a label filter shows only the builds with that label', async ({buildsPage}) => {
    await buildsPage.chooseLabel('integration-test', 'broken')
    await buildsPage.addLabel()

    await expect(buildsPage.count).toHaveText('45 builds')
    await expect(buildsPage.labelFilter('integration-test')).toBeVisible()
    await expect(buildsPage.labelFilter('integration-test').getByText('broken', {exact: true})).toBeVisible()
  })

  test('an expanded build shows its labels under their display names', async ({buildsPage}) => {
    await buildsPage.search('backend', 'main')
    await buildsPage.builds.expand('backend', 'main', 1)

    await expect(buildsPage.builds.label('backend', 'main', 1, 'Integration test')).toHaveText('ok')
  })

  test('a label added through the API shows on the build and finds it', async ({api, buildsPage}) => {
    // As CI does: a key without a definition, accepted whatever the label validation setting
    const response = await api.post('/api/v1/builds/add-labels/1', {data: {qa: 'passed'}})
    expect(response.status()).toBe(200)

    await buildsPage.search('backend', 'main')
    await buildsPage.builds.expand('backend', 'main', 1)
    await expect(buildsPage.builds.label('backend', 'main', 1, 'qa')).toHaveText('passed')

    await buildsPage.reset()
    await expect(buildsPage.count).toHaveText('90 builds')
    await buildsPage.typeLabel('qa', 'passed')
    await buildsPage.addLabel()

    await expect(buildsPage.count).toHaveText('1 build')
    await expect(buildsPage.builds.rows).toHaveCount(1)
    await expect(buildsPage.builds.row('backend', 'main', 1)).toBeVisible()
  })

  test('a value that can’t match its label definition is flagged and can’t be added', async ({buildsPage}) => {
    await buildsPage.typeLabel('revision', 'not-a-hash')

    await expect(buildsPage.labelValueHint).toBeVisible()
    await expect(buildsPage.labelValueHint).toHaveClass(/\btext-error\b/)
    await expect(buildsPage.addLabelButton).toBeDisabled()

    // A real hash is fine
    await buildsPage.labelValueInput.fill('8760f3516abcfa33f62a7e2c26c077d87725b27e9958de75478fbfe8078d8a8e')
    await expect(buildsPage.labelValueHint).not.toHaveClass(/\btext-error\b/)
    await expect(buildsPage.addLabelButton).toBeEnabled()
  })
})

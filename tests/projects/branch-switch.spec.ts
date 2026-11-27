import {expect, test} from '../../support/fixtures'

// backend's `next` branch is active in data/testdata.sql. The page hides inactive branches until
// "Show inactive" is switched on, and forgets that switch on reload.
test.describe('turning a branch off and on', () => {
  test('its state survives a reload', async ({projectsPage}) => {
    await projectsPage.open()
    await expect(projectsPage.heading).toBeVisible()
    await projectsPage.showInactive()

    // Off
    await projectsPage.deactivateBranch('backend', 'next')
    await expect(projectsPage.branchInactive('backend', 'next')).toBeVisible()

    await projectsPage.reload()
    await expect(projectsPage.branch('backend', 'next')).toBeHidden()
    await projectsPage.showInactive()
    await expect(projectsPage.branchInactive('backend', 'next')).toBeVisible()
    await expect(projectsPage.branchSwitch('backend', 'next')).not.toBeChecked()

    // On
    await projectsPage.activateBranch('backend', 'next')
    await expect(projectsPage.branchInactive('backend', 'next')).toBeHidden()

    await projectsPage.reload()
    await expect(projectsPage.branch('backend', 'next')).toBeVisible()
    await expect(projectsPage.branchInactive('backend', 'next')).toBeHidden()
    await expect(projectsPage.branchSwitch('backend', 'next')).toBeChecked()
  })
})

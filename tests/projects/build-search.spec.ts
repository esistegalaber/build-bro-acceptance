import {expect, test} from '../../support/fixtures'

// The build search offers only active projects, and per project only its active branches. data/testdata.sql:
// backend (ID 1), backoffice and frontend are active, abandoned is not; backend's merged-feature-backend is an
// inactive branch. The projects load when the app starts, so a change made through the API shows after a reload.
const activeProjects = ['All projects', 'backend', 'backoffice', 'frontend']

test.describe('what the build search offers', () => {
  test('inactive projects and branches are left out', async ({buildsPage}) => {
    await buildsPage.open()

    await expect(buildsPage.projectOptions).toHaveText(activeProjects)

    await buildsPage.projectSelect.selectOption('backend')
    await expect(buildsPage.branchOptions).toHaveText(['All branches', 'main', 'next', 'feature-backend'])
  })

  test('a project switched off through the API is left out, and offered again once it is switched on', async ({
    api,
    projectsPage,
    buildsPage,
  }) => {
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')

    // Off
    const off = await api.post('/api/v1/projects/inactive/1')
    expect(off.status()).toBe(200)
    await projectsPage.reload()
    await expect(projectsPage.count).toHaveText('2 projects')
    await expect(projectsPage.project('backend')).toBeHidden()
    await projectsPage.showInactive()
    await expect(projectsPage.count).toHaveText('4 projects')
    await expect(projectsPage.projectInactive('backend')).toBeVisible()

    await buildsPage.open()
    await expect(buildsPage.projectOptions).toHaveText(['All projects', 'backoffice', 'frontend'])

    // On
    const on = await api.post('/api/v1/projects/active/1')
    expect(on.status()).toBe(200)
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')
    await expect(projectsPage.project('backend')).toBeVisible()
    await expect(projectsPage.projectInactive('backend')).toBeHidden()

    await buildsPage.open()
    await expect(buildsPage.projectOptions).toHaveText(activeProjects)
  })

  test('a branch switched off on the Projects page is left out without a reload', async ({
    projectsPage,
    sideNav,
    buildsPage,
  }) => {
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')
    await projectsPage.deactivateBranch('backend', 'next')
    await expect(projectsPage.branch('backend', 'next')).toBeHidden()

    // Through the side nav, so the app keeps its state: the page isn't loaded again
    await sideNav.open('Builds')

    await expect(buildsPage.heading).toBeVisible()
    await expect(buildsPage.projectOptions).toHaveText(activeProjects)
    await buildsPage.projectSelect.selectOption('backend')
    await expect(buildsPage.branchOptions).toHaveText(['All branches', 'main', 'feature-backend'])
  })
})

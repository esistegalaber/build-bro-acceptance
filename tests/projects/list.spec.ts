import {expect, test} from '../../support/fixtures'

// data/testdata.sql: backend (1), backoffice (2) and frontend (3) are active, each with the active branches
// main, next and feature-<project> and the inactive merged-feature-<project>. abandoned (4) is inactive, with
// main active and merged inactive. The page hides inactive projects and branches until "Show inactive" is
// switched on, and forgets that switch on reload.
test.describe('the project list', () => {
  test('shows the active projects with their active branches', async ({projectsPage}) => {
    await projectsPage.open()

    await expect(projectsPage.count).toHaveText('3 projects')
    await expect(projectsPage.project('backend')).toBeVisible()
    await expect(projectsPage.project('backoffice')).toBeVisible()
    await expect(projectsPage.project('frontend')).toBeVisible()
    await expect(projectsPage.project('abandoned')).toBeHidden()
    await expect(projectsPage.branchNames('backend')).toHaveText(['main', 'next', 'feature-backend'])
    await expect(projectsPage.summary('backend')).toHaveText('3 branches')
    await expect(projectsPage.projectInactive('backend')).toBeHidden()
  })

  test('also shows inactive projects and branches with "Show inactive"', async ({projectsPage}) => {
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')
    await projectsPage.showInactive()

    await expect(projectsPage.count).toHaveText('4 projects')
    await expect(projectsPage.project('abandoned')).toBeVisible()
    await expect(projectsPage.projectInactive('abandoned')).toBeVisible()
    await expect(projectsPage.summary('abandoned')).toHaveText('2 branches · 1 inactive')
    await expect(projectsPage.summary('backend')).toHaveText('4 branches · 1 inactive')
    await expect(projectsPage.branchNames('backend')).toHaveText(['main', 'next', 'feature-backend', 'merged-feature-backend'])
    await expect(projectsPage.projectInactive('backend')).toBeHidden()
  })
})

test.describe('searching projects and branches', () => {
  test('a project name finds the projects whose name contains it', async ({projectsPage}) => {
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')

    await projectsPage.search('back')

    await expect(projectsPage.count).toHaveText('2 projects')
    await expect(projectsPage.project('backend')).toBeVisible()
    await expect(projectsPage.project('backoffice')).toBeVisible()
    await expect(projectsPage.project('frontend')).toBeHidden()
  })

  test('a branch name narrows the card of its project to that branch', async ({projectsPage}) => {
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')

    await projectsPage.search('feature-frontend')

    await expect(projectsPage.count).toHaveText('1 project')
    await expect(projectsPage.project('frontend')).toBeVisible()
    await expect(projectsPage.branchNames('frontend')).toHaveText(['feature-frontend'])
    await expect(projectsPage.project('backend')).toBeHidden()
  })

  test('a search without a match shows an empty state, and clearing it brings every project back', async ({projectsPage}) => {
    await projectsPage.open()
    await expect(projectsPage.count).toHaveText('3 projects')

    await projectsPage.search('nothing like this')

    await expect(projectsPage.searchEmptyState).toContainText('No project or branch matches “nothing like this”.')
    await expect(projectsPage.count).toHaveText('0 projects')
    await expect(projectsPage.project('backend')).toBeHidden()

    await projectsPage.clearSearch()

    await expect(projectsPage.searchEmptyState).toBeHidden()
    await expect(projectsPage.count).toHaveText('3 projects')
    await expect(projectsPage.searchInput).toHaveValue('')
  })
})

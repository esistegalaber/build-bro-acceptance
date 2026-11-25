import {expect, test} from '../support/fixtures'

// The expected values come from build-bro-api's testdata.sql, which the setup project loads.
test('the home page shows what Build Bruh knows from the test data', async ({page}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible()

  // The stats. Exact texts, because a card's text also holds its icon's name ("inventory_2").
  const stats = [
    {key: 'projects', label: 'Projects', value: '4'},
    {key: 'branches', label: 'Branches', value: '14'},
    {key: 'builds', label: 'Builds', value: '90'},
    {key: 'labels', label: 'Labels', value: '273'},
  ]
  for (const {key, label, value} of stats) {
    const card = page.getByTestId(`stat-${key}`)
    await expect(card.getByText(value, {exact: true})).toBeVisible()
    await expect(card.getByText(label, {exact: true})).toBeVisible()
  }

  // The three newest deployments, newest first
  const deployments = page.getByRole('region', {name: 'Recent deployments'})
  const deploymentRows = deployments.getByTestId(/^home-deployment-\d+$/)
  await expect(deploymentRows).toHaveCount(3)
  await expect(deploymentRows.first()).toContainText('testserver · Tester')
  await expect(deploymentRows.first()).toContainText('backend #10')

  // The build sets
  const buildSets = page.getByRole('region', {name: 'Build sets'})
  await expect(buildSets.getByRole('link', {name: /^main\b/})).toContainText('2 projects · 1 pinned')
})

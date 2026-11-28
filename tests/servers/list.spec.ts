import {expect, test} from '../../support/fixtures'

// data/testdata.sql has three servers: testserver · Tester, staging · Company Staging and prod-1 · Prod.
test.describe('listing servers', () => {
  test('the page shows every server with its nickname and description', async ({serversPage}) => {
    await serversPage.open()

    await expect(serversPage.count).toHaveText('3 servers')
    // The entry's text is the icon, the name, "· nickname" and the description, with whitespace collapsed
    await expect(serversPage.entry('testserver')).toContainText('testserver · Tester Main Testing Server')
    await expect(serversPage.entry('staging')).toContainText('staging · Company Staging Main Staging Server')
    await expect(serversPage.entry('prod-1')).toContainText('prod-1 · Prod Prod-1')
  })

  test('a server a deployment created shows without a description once the page is opened again', async ({api, serversPage}) => {
    await serversPage.open()
    await expect(serversPage.count).toHaveText('3 servers')

    // A deployment to a server that isn't known yet creates it. Build 10 is backend main #10.
    const response = await api.post('/api/v1/deployments', {data: {serverName: 'qa-1', builds: [{id: 10}]}})
    expect(response.status()).toBe(200)

    // The servers load once when the app starts, so only a new page load shows qa-1
    await serversPage.open()
    await expect(serversPage.count).toHaveText('4 servers')
    await expect(serversPage.entry('qa-1')).toContainText('qa-1 No description')
    await expect(serversPage.entry('qa-1')).not.toContainText('·')
    await expect(serversPage.entry('testserver')).toContainText('testserver · Tester')
  })
})

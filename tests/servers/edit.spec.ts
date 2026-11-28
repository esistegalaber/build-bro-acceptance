import {expect, test} from '../../support/fixtures'

// Editing changes only the nickname and the description: a server's name can't be changed.
test.describe('editing a server', () => {
  test.beforeEach(async ({serversPage}) => {
    await serversPage.open()
    await expect(serversPage.count).toHaveText('3 servers')
  })

  test('a new nickname and description show in the list and are still there after a reload', async ({serversPage}) => {
    await serversPage.edit('staging')
    // The form starts with the server's values
    await expect(serversPage.nicknameField('staging')).toHaveValue('Company Staging')
    await expect(serversPage.descriptionField('staging')).toHaveValue('Main Staging Server')

    await serversPage.enterDetails('staging', 'Pre-Prod', 'Last stop before production')
    await serversPage.save('staging')

    await expect(serversPage.form('staging')).toBeHidden()
    const entry = serversPage.entry('staging')
    await expect(entry).toContainText('staging · Pre-Prod Last stop before production')
    await expect(entry).not.toContainText('Company Staging')
    await expect(entry).not.toContainText('Main Staging Server')
    await expect(serversPage.count).toHaveText('3 servers')

    // Stored, not just changed in the page
    await serversPage.reload()
    await expect(serversPage.count).toHaveText('3 servers')
    await expect(serversPage.entry('staging')).toContainText('staging · Pre-Prod Last stop before production')
    // The other servers are as they were
    await expect(serversPage.entry('testserver')).toContainText('testserver · Tester Main Testing Server')
  })

  test('the new nickname shows on the Deployments page', async ({serversPage, deploymentsPage}) => {
    await serversPage.edit('staging')
    await serversPage.enterDetails('staging', 'Pre-Prod', 'Last stop before production')
    await serversPage.save('staging')
    await expect(serversPage.entry('staging')).toContainText('· Pre-Prod')

    await deploymentsPage.open()
    await expect(deploymentsPage.count).toHaveText('11 deployments')
    // The server filter offers "staging · Pre-Prod", and no longer the old nickname
    await expect(deploymentsPage.serverSelect.getByRole('option', {name: 'staging · Pre-Prod'})).toHaveCount(1)
    await expect(deploymentsPage.serverSelect.getByRole('option', {name: /Company Staging/})).toHaveCount(0)
    // The only deployment to staging is deployment 5
    await expect(deploymentsPage.deployment(5)).toContainText('staging · Pre-Prod')
    await expect(deploymentsPage.deployment(5)).not.toContainText('Company Staging')
  })

  test('cancelling an edit leaves the nickname and description as they were', async ({serversPage}) => {
    await serversPage.edit('staging')
    await serversPage.enterDetails('staging', 'Pre-Prod', 'Last stop before production')
    await serversPage.cancel('staging')

    await expect(serversPage.form('staging')).toBeHidden()
    const entry = serversPage.entry('staging')
    await expect(entry).toContainText('staging · Company Staging Main Staging Server')
    await expect(entry).not.toContainText('Pre-Prod')

    // Opening the form again starts over with the stored values, not the abandoned ones
    await serversPage.edit('staging')
    await expect(serversPage.nicknameField('staging')).toHaveValue('Company Staging')
    await expect(serversPage.descriptionField('staging')).toHaveValue('Main Staging Server')

    await serversPage.reload()
    await expect(serversPage.entry('staging')).toContainText('staging · Company Staging Main Staging Server')
  })
})

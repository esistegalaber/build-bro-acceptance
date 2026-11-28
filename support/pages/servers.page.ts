import type {Locator, Page} from '@playwright/test'

/**
 * The Servers page (`/servers`): the list of servers and a form to edit one's nickname and description.
 * A server's name can't be changed, and new servers only come from a deployment. The servers load once when
 * the app starts, so a server that appeared since then shows after `reload()` or `open()`.
 */
export class ServersPage {
  readonly heading: Locator
  /** "3 servers" */
  readonly count: Locator

  private readonly list: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Servers', exact: true})
    this.list = page.getByRole('region', {name: 'Servers', exact: true})
    this.count = this.list.getByRole('heading', {name: /^\d+ servers?$/})
  }

  async open(): Promise<void> {
    await this.page.goto('/servers')
  }

  async reload(): Promise<void> {
    await this.page.reload()
  }

  /** A server's entry in the list: its name, "· nickname" and description. */
  entry(name: string): Locator {
    return this.list.getByRole('listitem').filter({has: this.editButton(name)})
  }

  private editButton(name: string): Locator {
    return this.page.getByRole('button', {name: `Edit ${name}`, exact: true})
  }

  /** The form that edits a server; it shows after `edit(name)`. */
  form(name: string): Locator {
    return this.page.getByRole('form', {name: `Edit ${name}`, exact: true})
  }

  nicknameField(name: string): Locator {
    return this.form(name).getByLabel('Nickname')
  }

  descriptionField(name: string): Locator {
    return this.form(name).getByLabel('Description')
  }

  /** Opens a server's form. */
  async edit(name: string): Promise<void> {
    await this.entry(name).getByRole('button', {name: `Edit ${name}`, exact: true}).click()
  }

  /** Replaces the form's nickname and description. */
  async enterDetails(name: string, nickname: string, description: string): Promise<void> {
    await this.nicknameField(name).fill(nickname)
    await this.descriptionField(name).fill(description)
  }

  /** Saves the form; it closes and the list shows the values the API answered with. */
  async save(name: string): Promise<void> {
    await this.form(name).getByRole('button', {name: 'Save', exact: true}).click()
  }

  async cancel(name: string): Promise<void> {
    await this.form(name).getByRole('button', {name: 'Cancel', exact: true}).click()
  }
}

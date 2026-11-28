import type {Locator, Page} from '@playwright/test'
import {BuildList} from './components/build-list'

/**
 * The build sets page (`/build-sets`): the list of build sets, the selected set's card with the builds it resolves
 * to, the delete confirmation and "New build set".
 */
export class BuildSetsPage {
  readonly heading: Locator
  readonly newBuildSetLink: Locator

  /** The list of build sets, one button each */
  readonly list: Locator
  readonly entries: Locator

  // The selected build set's card
  readonly card: Locator
  /** "Builds of main" */
  readonly cardHeading: Locator
  readonly editLink: Locator
  readonly cloneLink: Locator
  readonly deleteButton: Locator
  /** The builds the selected set resolves to */
  readonly builds: BuildList

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Build sets', exact: true})
    this.newBuildSetLink = page.getByRole('link', {name: 'New build set', exact: true})

    this.list = page.getByRole('navigation', {name: 'Build sets', exact: true})
    this.entries = this.list.getByRole('button')

    this.card = page.getByTestId('build-set-card')
    this.cardHeading = this.card.getByRole('heading', {level: 2})
    this.editLink = this.card.getByRole('link', {name: 'Edit', exact: true})
    this.cloneLink = this.card.getByRole('link', {name: 'Clone', exact: true})
    this.deleteButton = this.card.getByRole('button', {name: 'Delete', exact: true})
    this.builds = new BuildList(page, this.card)
  }

  async open(): Promise<void> {
    await this.page.goto('/build-sets')
  }

  async reload(): Promise<void> {
    await this.page.reload()
  }

  /**
   * A build set's entry in the list, by its name. The button's name also holds the summary ("main 2 projects ·
   * 1 pinned"), so the name must be followed by a space: `main` doesn't find `main-copy`.
   */
  entry(name: string): Locator {
    return this.list.getByRole('button', {name: new RegExp(`^${RegExp.escape(name)}\\s`)})
  }

  /** An entry's summary: "2 projects · 1 pinned", "1 project" or "No projects yet". */
  summary(name: string): Locator {
    return this.entry(name).getByText(/^\s*(No projects yet|\d+ projects?( · \d+ pinned)?)\s*$/)
  }

  /** Selects a build set, which shows its card. */
  async select(name: string): Promise<void> {
    await this.entry(name).click()
  }

  /** Opens the editor for a new build set. */
  async newBuildSet(): Promise<void> {
    await this.newBuildSetLink.click()
  }

  /** Opens the selected build set in the editor. */
  async edit(): Promise<void> {
    await this.editLink.click()
  }

  /** Opens a copy of the selected build set in the editor. */
  async clone(): Promise<void> {
    await this.cloneLink.click()
  }

  /** Asks to delete the selected build set; the confirmation dialog opens. */
  async delete(): Promise<void> {
    await this.deleteButton.click()
  }

  /** The confirmation dialog for deleting a build set, "Delete <name>?". */
  deleteDialog(name: string): Locator {
    return this.page.getByRole('dialog', {name: `Delete ${name}?`, exact: true})
  }

  /** Confirms the open delete dialog. */
  async confirmDelete(): Promise<void> {
    await this.openDialog().getByRole('button', {name: 'Delete', exact: true}).click()
  }

  /** Closes the open delete dialog without deleting. */
  async cancelDelete(): Promise<void> {
    await this.openDialog().getByRole('button', {name: 'Cancel', exact: true}).click()
  }

  /** The dialog element is always there; only while it is open does it have a heading and a name. */
  private openDialog(): Locator {
    return this.page.getByRole('dialog', {name: /^Delete .+\?$/})
  }
}

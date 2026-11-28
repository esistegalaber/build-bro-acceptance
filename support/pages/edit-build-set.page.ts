import type {Locator, Page} from '@playwright/test'

/**
 * The build set editor (`/edit-build-set/new`, `/edit-build-set/<name>`, `/edit-build-set/clone/<name>`): the
 * breadcrumb, the name, "Save build set", one row per project and the "Resolved builds" panel. After saving, the
 * editor stays open and the alert panel says "Saved".
 */
export class EditBuildSetPage {
  /** The breadcrumb's link back to the list */
  readonly buildSetsLink: Locator
  readonly nameInput: Locator
  /** Disabled while the name is empty */
  readonly saveButton: Locator
  /** The panel with the build each included project resolves to, updated as the rows change */
  readonly resolvedBuilds: Locator

  constructor(private readonly page: Page) {
    this.buildSetsLink = page.getByRole('navigation', {name: 'Breadcrumb'}).getByRole('link', {name: 'Build sets'})
    this.nameInput = page.getByRole('textbox', {name: 'Name', exact: true})
    this.saveButton = page.getByRole('button', {name: 'Save build set', exact: true})
    this.resolvedBuilds = page.getByRole('region', {name: 'Resolved builds', exact: true})
  }

  async save(): Promise<void> {
    await this.saveButton.click()
  }

  /** Back to the list through the breadcrumb. */
  async backToList(): Promise<void> {
    await this.buildSetsLink.click()
  }

  /** The switch that includes a project in the build set. */
  includeSwitch(project: string): Locator {
    return this.page.getByRole('checkbox', {name: `Include ${project}`, exact: true})
  }

  async include(project: string): Promise<void> {
    await this.includeSwitch(project).check()
  }

  async exclude(project: string): Promise<void> {
    await this.includeSwitch(project).uncheck()
  }

  /** The branch of an included project. */
  branchSelect(project: string): Locator {
    return this.page.getByRole('combobox', {name: `Branch of ${project}`, exact: true})
  }

  async chooseBranch(project: string, branch: string): Promise<void> {
    await this.branchSelect(project).selectOption(branch)
  }

  /** The build number of an included project; empty means its latest build. */
  buildNumberInput(project: string): Locator {
    return this.page.getByRole('spinbutton', {name: `Build number of ${project}, empty for the latest`, exact: true})
  }

  /** Pins an included project to a build number. */
  async pin(project: string, buildNumber: number): Promise<void> {
    await this.buildNumberInput(project).fill(String(buildNumber))
  }

  /** Clears an included project's build number, so it resolves to its latest build again. */
  async unpin(project: string): Promise<void> {
    await this.buildNumberInput(project).clear()
  }

  /** The "pinned" badge in a project's row, shown while it has a build number. */
  pinnedBadge(project: string): Locator {
    return this.page.getByTestId(`build-template-${project}`).getByText('pinned', {exact: true})
  }

  /** A project's row in the "Resolved builds" panel, there while the project is included. */
  resolved(project: string): Locator {
    return this.resolvedBuilds.getByTestId(`resolved-${project}`)
  }

  /** The build number a project resolves to ("#10"). */
  resolvedBuildNumber(project: string): Locator {
    return this.resolved(project).getByText(/^#\d+$/)
  }
}

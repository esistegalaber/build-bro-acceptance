import type {Locator, Page} from '@playwright/test'

/** The projects page (`/projects`): one card per project, with a switch per branch. */
export class ProjectsPage {
  readonly heading: Locator
  /** Also shows inactive projects and branches. Off after every page load. */
  readonly showInactiveSwitch: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Projects', exact: true})
    this.showInactiveSwitch = page.getByRole('checkbox', {name: 'Show inactive'})
  }

  async open(): Promise<void> {
    await this.page.goto('/projects')
  }

  async reload(): Promise<void> {
    await this.page.reload()
  }

  /**
   * Shows inactive projects and branches too. A click, not `check()`: the page keeps the switch as it
   * was until the store has changed.
   */
  async showInactive(): Promise<void> {
    await this.showInactiveSwitch.click()
  }

  /** A project's card, by its name. */
  project(name: string): Locator {
    return this.page.getByRole('region', {name, exact: true})
  }

  /** A branch's row in its project's card. */
  branch(project: string, branch: string): Locator {
    return this.project(project)
      .getByRole('listitem')
      .filter({has: this.page.getByTestId('branch-name').getByText(branch, {exact: true})})
  }

  /** The switch that turns a branch on or off; it is checked while the branch is active. */
  branchSwitch(project: string, branch: string): Locator {
    return this.branch(project, branch).getByRole('checkbox')
  }

  /** The "Inactive" marker of a branch. */
  branchInactive(project: string, branch: string): Locator {
    return this.branch(project, branch).getByTestId('branch-inactive')
  }

  /** Turns an active branch off (a click, see `showInactive()`). */
  async deactivateBranch(project: string, branch: string): Promise<void> {
    await this.branch(project, branch).getByTestId('branch-deactivate').click()
  }

  /** Turns an inactive branch on; it must be shown (`showInactive()`). */
  async activateBranch(project: string, branch: string): Promise<void> {
    await this.branch(project, branch).getByTestId('branch-activate').click()
  }
}

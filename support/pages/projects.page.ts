import type {Locator, Page} from '@playwright/test'

/** The projects page (`/projects`): one card per project, with a switch per branch. */
export class ProjectsPage {
  readonly heading: Locator
  /** Also shows inactive projects and branches. Off after every page load. */
  readonly showInactiveSwitch: Locator
  /** "3 projects": the number of projects shown, after the search */
  readonly count: Locator
  readonly searchInput: Locator
  /** The message of a search that matches nothing */
  readonly searchEmptyState: Locator
  readonly clearSearchButton: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Projects', exact: true})
    this.showInactiveSwitch = page.getByRole('checkbox', {name: 'Show inactive'})
    this.count = page.getByTestId('projects-count')
    this.searchInput = page.getByRole('searchbox', {name: 'Search projects and branches'})
    this.searchEmptyState = page.getByTestId('projects-empty')
    this.clearSearchButton = this.searchEmptyState.getByRole('button', {name: 'Clear search'})
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

  /** Searches project and branch names; the cards narrow to what matches. */
  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
  }

  /** "Clear search" in the empty state of a search without a match. */
  async clearSearch(): Promise<void> {
    await this.clearSearchButton.click()
  }

  /** A project's card, by its name. */
  project(name: string): Locator {
    return this.page.getByRole('region', {name, exact: true})
  }

  /** The names of the branches in a project's card, one element each. */
  branchNames(project: string): Locator {
    return this.project(project).getByTestId('branch-name')
  }

  /** A project's summary, such as "4 branches · 1 inactive". */
  summary(project: string): Locator {
    return this.project(project).getByTestId('project-summary')
  }

  /** The "Inactive" badge of a project. */
  projectInactive(project: string): Locator {
    return this.project(project).getByTestId('project-inactive')
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

import type {Locator, Page} from '@playwright/test'

/**
 * A list of builds, one row each (project, branch, build number), that expands to show the build's ID and
 * labels. The Builds page, build sets and deployments show the same rows.
 */
export class BuildList {
  /** Every row, in the order shown. */
  readonly rows: Locator
  /** The build numbers of the rows ("#10"), in the order shown. */
  readonly buildNumbers: Locator

  /** `scope`: the part of the page that holds the list, if it holds more than one. */
  constructor(
    private readonly page: Page,
    scope: Page | Locator = page,
  ) {
    this.rows = scope.getByTestId('build-row')
    this.buildNumbers = this.rows.getByText(/^#\d+$/)
  }

  /** The checkbox that expands a build's row. */
  private toggle(project: string, branch: string, buildNumber: number): Locator {
    return this.page.getByRole('checkbox', {
      name: `Show the labels of ${project} ${branch} #${buildNumber}`,
      exact: true,
    })
  }

  /** A build's row. */
  row(project: string, branch: string, buildNumber: number): Locator {
    return this.rows.filter({has: this.toggle(project, branch, buildNumber)})
  }

  /** Expands a build's row to show its ID and labels. */
  async expand(project: string, branch: string, buildNumber: number): Promise<void> {
    await this.toggle(project, branch, buildNumber).check()
  }

  /**
   * The value of a label in an expanded row, under the label definition's display name ("Integration test")
   * or, for a key without one, the key.
   */
  label(project: string, branch: string, buildNumber: number, name: string): Locator {
    return this.row(project, branch, buildNumber)
      .getByRole('term')
      .filter({hasText: new RegExp(`^${RegExp.escape(name)}$`)})
      .locator('xpath=following-sibling::dd[1]')
  }
}

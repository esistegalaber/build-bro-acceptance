import type {Locator, Page} from '@playwright/test'
import {BuildList} from './components/build-list'
import {Paginator} from './components/paginator'

/**
 * The Deployments page (`/deployments`): the filters, the number of matches and one row per deployment that
 * expands into its builds. The page only reads; deployments are created through the API.
 */
export class DeploymentsPage {
  readonly heading: Locator

  // The filters
  readonly serverSelect: Locator
  readonly pageSizeSelect: Locator
  readonly resetButton: Locator

  // The results
  /** "11 deployments" */
  readonly count: Locator
  readonly emptyState: Locator
  readonly resetFiltersButton: Locator
  /** One row per deployment, newest first */
  readonly rows: Locator
  readonly paginator: Paginator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Deployments', exact: true})

    const filters = page.getByRole('form', {name: 'Filters'})
    this.serverSelect = filters.getByTestId('server-select')
    this.pageSizeSelect = filters.getByTestId('page-size-select')
    this.resetButton = filters.getByRole('button', {name: 'Reset', exact: true})

    const results = page.getByRole('region', {name: 'Results'})
    this.count = results.getByTestId('deployments-count')
    this.emptyState = results.getByTestId('deployments-empty')
    this.resetFiltersButton = results.getByRole('button', {name: 'Reset the filters'})
    this.rows = results.getByTestId('row-of-deployment')
    this.paginator = new Paginator(results)
  }

  async open(): Promise<void> {
    await this.page.goto('/deployments')
  }

  /** Shows one server's deployments: its name, as in the option "testserver · Tester". */
  async chooseServer(name: string): Promise<void> {
    await this.serverSelect.selectOption({value: name})
  }

  async choosePageSize(size: 10 | 25 | 50): Promise<void> {
    await this.pageSizeSelect.selectOption(String(size))
  }

  /** The filters' "Reset" button. */
  async reset(): Promise<void> {
    await this.resetButton.click()
  }

  /** "Reset the filters" in the empty state. */
  async resetFilters(): Promise<void> {
    await this.resetFiltersButton.click()
  }

  /** The newest deployment on the page: the list is newest first. */
  newest(): Locator {
    return this.rows.first()
  }

  /**
   * A deployment of the test data by its ID (`data/testdata.sql`). Don't use it for deployments a test creates:
   * their IDs aren't known; they are the `newest()`.
   */
  deployment(id: number): Locator {
    return this.rows.filter({has: this.page.getByTestId(`deployment-${id}`)})
  }

  /** The checkbox that expands a deployment's row. Its name is the same for all deployments to one server. */
  private toggle(row: Locator): Locator {
    return row.getByRole('checkbox', {name: /^Show the builds of the deployment to /})
  }

  /** Expands a deployment's row to show its builds. */
  async expand(row: Locator): Promise<void> {
    await this.toggle(row).check()
  }

  /** The deployment's number of builds ("3 builds"). */
  buildCount(row: Locator): Locator {
    return row.getByTestId('builds-of-deployment')
  }

  /** The builds of a deployment, as in the Builds page. They show once the row is expanded. */
  buildsOf(row: Locator): BuildList {
    return new BuildList(this.page, row)
  }
}

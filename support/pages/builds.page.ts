import type {Locator, Page} from '@playwright/test'
import {BuildList} from './components/build-list'
import {Paginator} from './components/paginator'

/** The Builds page (`/builds`): the filters, the number of matches, the builds and the paginator. */
export class BuildsPage {
  readonly heading: Locator

  // The filters. The selects' and "to"'s labels aren't unique (a select's name includes its chosen option),
  // so those go by test ID.
  readonly projectSelect: Locator
  readonly branchSelect: Locator
  readonly minBuildNumberInput: Locator
  readonly maxBuildNumberInput: Locator
  readonly pageSizeSelect: Locator
  readonly labelKeyInput: Locator
  /** The value of a label filter, for a key without a definition or one typed as text */
  readonly labelValueInput: Locator
  /** The value of a label filter, for a key whose definition offers a list of values (ENUM, BOOLEAN) */
  readonly labelValueSelect: Locator
  /** What a defined key's value must look like, marked as an error when a typed value can't match */
  readonly labelValueHint: Locator
  readonly addLabelButton: Locator
  readonly resetButton: Locator
  /** The label filters in the search, one chip each */
  readonly labelFilters: Locator

  // The results
  /** "90 builds" */
  readonly count: Locator
  readonly emptyState: Locator
  readonly resetFiltersButton: Locator
  readonly builds: BuildList
  readonly paginator: Paginator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Builds', exact: true})

    const filters = page.getByRole('form', {name: 'Filters'})
    this.projectSelect = filters.getByTestId('project-select')
    this.branchSelect = filters.getByTestId('branch-select')
    this.minBuildNumberInput = filters.getByLabel('Build number from')
    this.maxBuildNumberInput = filters.getByTestId('max-build-number-input')
    this.pageSizeSelect = filters.getByTestId('page-size-select')
    this.labelKeyInput = filters.getByRole('combobox', {name: 'Label', exact: true})
    this.labelValueInput = filters.getByRole('textbox', {name: 'Value', exact: true})
    this.labelValueSelect = filters.getByTestId('label-value-input').and(filters.getByRole('combobox'))
    this.labelValueHint = filters.getByRole('status')
    this.addLabelButton = filters.getByRole('button', {name: 'Add label'})
    this.resetButton = filters.getByRole('button', {name: 'Reset', exact: true})
    this.labelFilters = filters.getByTestId('search-label')

    const results = page.getByRole('region', {name: 'Results'})
    this.count = results.getByRole('heading', {level: 2})
    this.emptyState = results.getByTestId('builds-empty')
    this.resetFiltersButton = results.getByRole('button', {name: 'Reset the filters'})
    this.builds = new BuildList(page, results)
    this.paginator = new Paginator(results)
  }

  async open(): Promise<void> {
    await this.page.goto('/builds')
  }

  /** Searches one project's builds, on one of its branches if given. */
  async search(project: string, branch?: string): Promise<void> {
    await this.projectSelect.selectOption(project)
    if (branch) await this.branchSelect.selectOption(branch)
  }

  /** Narrows the search to a build number range; either end may be left open. */
  async buildNumbers(from?: number, to?: number): Promise<void> {
    if (from !== undefined) await this.minBuildNumberInput.fill(String(from))
    if (to !== undefined) await this.maxBuildNumberInput.fill(String(to))
  }

  async perPage(size: 10 | 25 | 50): Promise<void> {
    await this.pageSizeSelect.selectOption(String(size))
  }

  /** Types a label filter's key and value, without adding it. For keys whose value is typed as text. */
  async typeLabel(key: string, value: string): Promise<void> {
    await this.labelKeyInput.fill(key)
    await this.labelValueInput.fill(value)
  }

  /** Types a label filter's key and chooses its value, without adding it. For keys with a list of values. */
  async chooseLabel(key: string, value: string): Promise<void> {
    await this.labelKeyInput.fill(key)
    await this.labelValueSelect.selectOption(value)
  }

  /** Adds the label filter typed or chosen ("Add label"). */
  async addLabel(): Promise<void> {
    await this.addLabelButton.click()
  }

  /** The chip of a label filter in the search, by its key. */
  labelFilter(key: string): Locator {
    return this.labelFilters.filter({
      has: this.page.getByRole('button', {name: `Remove the label filter ${key}`, exact: true}),
    })
  }

  /** The filters' "Reset" button. */
  async reset(): Promise<void> {
    await this.resetButton.click()
  }

  /** "Reset the filters" in the empty state. */
  async resetFilters(): Promise<void> {
    await this.resetFiltersButton.click()
  }
}

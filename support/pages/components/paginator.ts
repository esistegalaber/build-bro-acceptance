import type {Locator, Page} from '@playwright/test'

/**
 * The shared paginator under a result list: "Showing x–y of n" and first / previous / next / last page.
 * The actions are `firstPage()`, ..., not `first()`, ...: ESLint's playwright rules take those for `Locator`'s.
 */
export class Paginator {
  /** "Showing 1–10 of 90" */
  readonly range: Locator
  /** The current page and the number of pages, "1 / 9" */
  readonly currentPage: Locator
  readonly firstPageButton: Locator
  readonly previousPageButton: Locator
  readonly nextPageButton: Locator
  readonly lastPageButton: Locator

  /** `scope`: the part of the page that holds the paginator, if it holds more than one. */
  constructor(scope: Page | Locator) {
    this.range = scope.getByTestId('paginator-range')
    this.currentPage = scope.getByTestId('paginator-current')
    const pages = scope.getByRole('navigation', {name: 'Pages'})
    this.firstPageButton = pages.getByRole('button', {name: 'First page'})
    this.previousPageButton = pages.getByRole('button', {name: 'Previous page'})
    this.nextPageButton = pages.getByRole('button', {name: 'Next page'})
    this.lastPageButton = pages.getByRole('button', {name: 'Last page'})
  }

  async firstPage(): Promise<void> {
    await this.firstPageButton.click()
  }

  async previousPage(): Promise<void> {
    await this.previousPageButton.click()
  }

  async nextPage(): Promise<void> {
    await this.nextPageButton.click()
  }

  async lastPage(): Promise<void> {
    await this.lastPageButton.click()
  }
}

import type {Locator, Page} from '@playwright/test'

/** The side bar's navigation "Main": a link per page. It is on every page. */
export class SideNav {
  readonly nav: Locator

  constructor(page: Page) {
    this.nav = page.getByRole('navigation', {name: 'Main', exact: true})
  }

  /** A link of the navigation, by its label: "Home", "Build Sets", "Builds", "Deployments", "Servers", "Projects". */
  link(label: string): Locator {
    return this.nav.getByRole('link', {name: label, exact: true})
  }

  /** Goes to a page by clicking its link, without restarting the app. */
  async open(label: string): Promise<void> {
    await this.link(label).click()
  }
}

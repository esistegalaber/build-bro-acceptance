import type {Locator, Page} from '@playwright/test'

export type StatKey = 'projects' | 'branches' | 'builds' | 'labels'

/** The home page (`/`): stats, the newest deployments and the build sets. */
export class HomePage {
  readonly heading: Locator
  readonly recentDeployments: Locator
  readonly deploymentRows: Locator
  readonly buildSets: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Welcome back'})
    this.recentDeployments = page.getByRole('region', {name: 'Recent deployments'})
    this.deploymentRows = this.recentDeployments.getByTestId(/^home-deployment-\d+$/)
    this.buildSets = page.getByRole('region', {name: 'Build sets'})
  }

  async open(): Promise<void> {
    await this.page.goto('/')
  }

  /**
   * An exact text on a stat card: its number or its caption. A card's whole text also holds its icon's
   * name ("inventory_290Builds"), so match the parts, not the card.
   */
  statText(key: StatKey, text: string): Locator {
    return this.page.getByTestId(`stat-${key}`).getByText(text, {exact: true})
  }

  /** The link to a build set, by its name. */
  buildSet(name: string): Locator {
    return this.buildSets.getByRole('link', {name: new RegExp(`^${RegExp.escape(name)}\\b`)})
  }
}

import type {Locator, Page} from '@playwright/test'

/**
 * The alert panel above every page: the current message, an error (`role="alert"`) or an info such as "Saved"
 * (`role="status"`), until it is dismissed. It stays when the user navigates to another page.
 */
export class Alert {
  /** The panel, whatever the kind of message */
  readonly panel: Locator
  /** The panel while it shows an error */
  readonly error: Locator
  /** For an API error, the error's description */
  readonly heading: Locator
  /** For an API error, the error's message */
  readonly message: Locator
  readonly dismissButton: Locator

  constructor(page: Page) {
    this.panel = page.getByTestId('alert')
    this.error = page.getByRole('alert')
    this.heading = this.panel.getByTestId('alert-heading')
    this.message = this.panel.getByTestId('alert-message')
    this.dismissButton = this.panel.getByRole('button', {name: 'Dismiss'})
  }

  async dismiss(): Promise<void> {
    await this.dismissButton.click()
  }
}

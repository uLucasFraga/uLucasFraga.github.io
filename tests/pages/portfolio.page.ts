import { expect, type Locator, type Page } from '@playwright/test';

export type Language = 'en' | 'pt';

export class PortfolioPage {
  readonly page: Page;
  readonly locators: {
    heroTitle: Locator;
    terminal: Locator;
    terminalBody: Locator;
    rerunButton: Locator;
    navigation: Locator;
    impactItems: Locator;
    experienceItems: Locator;
    toolbox: Locator;
    repositoryLinks: Locator;
    postLinks: Locator;
    contactLinks: Locator;
    languageButton: (language: Language) => Locator;
  };

  constructor(page: Page) {
    this.page = page;
    this.locators = {
      heroTitle: page.getByTestId('hero-title'),
      terminal: page.getByTestId('hero-terminal'),
      terminalBody: page.locator('#term-body'),
      rerunButton: page.getByTestId('rerun-tests'),
      navigation: page.getByTestId('main-nav'),
      impactItems: page.getByTestId('impact-list').getByRole('listitem'),
      experienceItems: page.getByTestId('experience-list').locator(':scope > li'),
      toolbox: page.getByTestId('toolbox'),
      repositoryLinks: page.getByTestId('repo-list').getByRole('link'),
      postLinks: page.getByTestId('post-list').getByRole('link'),
      contactLinks: page.getByTestId('contact-links').getByRole('link'),
      languageButton: (language: Language) => page.getByTestId(`lang-${language}`),
    };
  }

  async navigate(query = '') {
    await this.page.goto(`/${query}`);
  }

  async switchLanguage(language: Language) {
    await this.locators.languageButton(language).click();
  }

  async rerunTests() {
    await this.locators.rerunButton.click();
  }

  async expectLanguage(language: Language) {
    await expect(this.page.locator('html')).toHaveAttribute('data-lang', language);
    await expect(this.locators.languageButton(language)).toHaveAttribute('aria-pressed', 'true');
  }

  async expectTerminalFinished() {
    await expect(this.locators.terminalBody).toHaveAttribute('data-state', 'done');
    await expect(this.locators.rerunButton).toBeEnabled();
  }
}

import { test, expect } from '@playwright/test';
import { PortfolioPage, type Language } from './pages/portfolio.page';

const heroTitleByLanguage: Record<Language, string> = {
  en: 'I turn complex releases into fun, reliable days.',
  pt: 'Eu transformo releases complexas em dias divertidos e confiáveis.',
};

const terminalSummaryByLanguage: Record<Language, string> = {
  en: '8 passed, 1 skipped',
  pt: '8 passaram, 1 ignorado',
};

const portraitAltByLanguage: Record<Language, string> = {
  en: 'Portrait of Lucas Fraga',
  pt: 'Foto de Lucas Fraga',
};

const sectionIds = ['impact', 'ai', 'experience', 'toolbox', 'open-source', 'writing', 'community', 'contact'] as const;

test.describe.parallel('[E2E - Portfolio] @regression', () => {
  let portfolio: PortfolioPage;

  test.beforeEach(async ({ page }) => {
    portfolio = new PortfolioPage(page);
  });

  test.describe('Success scenarios', () => {
    test('deve carregar o hero em inglês por padrão @smoke @success @positive', async ({ page }) => {
      await portfolio.navigate();

      await expect(page).toHaveTitle(/Lucas Fraga/);
      await portfolio.expectLanguage('en');
      await expect(portfolio.locators.heroTitle).toHaveText(heroTitleByLanguage.en);
    });

    test('deve concluir a execução do terminal com o resumo dos testes @smoke @success @positive', async () => {
      await portfolio.navigate();

      await portfolio.expectTerminalFinished();
      await expect(portfolio.locators.terminalBody).toContainText(terminalSummaryByLanguage.en);
      await expect(portfolio.locators.terminalBody).toContainText('npx playwright test ulucasfraga.spec.ts');
    });

    test('deve executar o terminal novamente ao clicar em "Run again" @success @positive', async () => {
      await portfolio.navigate();
      await portfolio.expectTerminalFinished();

      await portfolio.rerunTests();

      await portfolio.expectTerminalFinished();
      await expect(portfolio.locators.terminalBody).toContainText(terminalSummaryByLanguage.en);
    });

    for (const language of ['en', 'pt'] as const) {
      test(`deve exibir o conteúdo em ${language.toUpperCase()} ao trocar o idioma @success @positive`, async () => {
        await portfolio.navigate();
        await portfolio.switchLanguage(language === 'en' ? 'pt' : 'en');

        await portfolio.switchLanguage(language);

        await portfolio.expectLanguage(language);
        await expect(portfolio.locators.heroTitle).toHaveText(heroTitleByLanguage[language]);
        await portfolio.expectTerminalFinished();
        await expect(portfolio.locators.terminalBody).toContainText(terminalSummaryByLanguage[language]);
        await expect(portfolio.page.getByRole('img', { name: portraitAltByLanguage[language], exact: true })).toBeAttached();
      });
    }

    test('deve respeitar o idioma informado na URL @success @positive', async () => {
      await portfolio.navigate('?lang=pt');

      await portfolio.expectLanguage('pt');
      await expect(portfolio.locators.heroTitle).toHaveText(heroTitleByLanguage.pt);
    });

    test('deve manter o idioma escolhido após recarregar a página @success @positive', async ({ page }) => {
      await portfolio.navigate();
      await portfolio.switchLanguage('pt');

      await page.reload();

      await portfolio.expectLanguage('pt');
    });

    test('deve listar o conteúdo principal de cada seção @success @positive', async ({ page }) => {
      await portfolio.navigate();

      for (const sectionId of sectionIds) {
        await expect(page.locator(`section#${sectionId}`)).toBeVisible();
      }
      await expect(portfolio.locators.impactItems).toHaveCount(6);
      await expect(portfolio.locators.aiSteps).toHaveCount(6);
      await expect(portfolio.locators.experienceItems).toHaveCount(8);
      await expect(portfolio.locators.toolbox.getByText('Playwright', { exact: true })).toBeVisible();
      await expect(portfolio.locators.repositoryLinks).toHaveCount(7);
      await expect(portfolio.locators.postLinks).toHaveCount(4);
    });
  });

  test.describe('Negative / failure scenarios', () => {
    test('deve usar inglês quando o idioma da URL não é suportado @negative @error', async () => {
      await portfolio.navigate('?lang=xx');

      await portfolio.expectLanguage('en');
      await expect(portfolio.locators.heroTitle).toHaveText(heroTitleByLanguage.en);
    });

    test('não deve ter erros de JavaScript nem falhas em recursos do próprio site @negative @error', async ({ page, baseURL }) => {
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        // Network failures are reported by the requestfailed listener below, scoped to this site.
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
          problems.push(`console: ${message.text()}`);
        }
      });
      page.on('requestfailed', (request) => {
        if (baseURL && request.url().startsWith(baseURL)) {
          problems.push(`requestfailed: ${request.url()}`);
        }
      });

      await portfolio.navigate();
      await portfolio.expectTerminalFinished();
      await portfolio.switchLanguage('pt');
      await portfolio.expectTerminalFinished();

      expect(problems).toEqual([]);
    });

    test('não deve ter rolagem horizontal na página @negative @error', async ({ page }) => {
      await portfolio.navigate();

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
    });

    test('links externos devem abrir em nova aba com rel="noopener" @negative @error', async ({ page }) => {
      await portfolio.navigate();

      const externalLinks = page.locator('a[target="_blank"]');
      const total = await externalLinks.count();
      expect(total).toBeGreaterThan(0);

      for (let index = 0; index < total; index++) {
        await expect(externalLinks.nth(index)).toHaveAttribute('rel', /noopener/);
      }
    });

    test('não deve expor telefone ou endereço pessoal @negative @error', async ({ page }) => {
      await portfolio.navigate();

      const pageText = await page.locator('body').innerText();
      expect(pageText).not.toMatch(/\+351|\+55|\b9\d{2}\s?\d{3}\s?\d{3}\b/);
      expect(pageText).not.toMatch(/Rua |Almada|Caparica/i);
    });
  });
});

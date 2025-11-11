import { test, expect } from '@playwright/test';

const randomPhone = () => {
  const suffix = `${Date.now() % 1_000_0000}`.padStart(7, '0');
  return `+22177${suffix}`;
};

const randomEmail = () => `prestataire-${Date.now()}@example.com`;

test.describe('Onboarding prestataire', () => {
  test('un utilisateur peut créer un profil prestataire', async ({ page }) => {
    const phone = randomPhone();
    const email = randomEmail();

    await page.goto('/');
    await page.getByRole('button', { name: /Connexion ou inscription/i }).click();

    const identifierInput = page.getByLabel(/Email ou Téléphone/i);
    await expect(identifierInput).toBeVisible();
    await identifierInput.fill(phone);

    const [otpResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/auth/otp/request') && response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /Continuer/i }).click(),
    ]);

    const otpPayload = await otpResponse.json();
    const code = otpPayload?.code ?? '123456';

    const codeInput = page.getByLabel(/Code de vérification/i);
    await expect(codeInput).toBeVisible();
    await codeInput.fill(code);

    const [verifyResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/auth/otp/verify') && response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /Vérifier/i }).click(),
    ]);
    await expect(verifyResponse.ok()).toBeTruthy();

    await page.goto('/prestataire/create');
    await expect(page.getByRole('heading', { name: /Créer votre profil prestataire/i })).toBeVisible();

    await page.getByPlaceholder('Raison sociale *').fill('Coach IA Automatisé');
    await page.locator('textarea[placeholder="Description *"]').fill('Coaching informatique intensif.');
    await page.getByPlaceholder('Téléphone *').fill(phone);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Adresse').fill('Mbao, Dakar');

    await page.getByRole('button', { name: /Suivant/i }).click();

    await page.getByRole('button', { name: /^Suivant$/i }).click();

    await page.getByLabel(/Informatique/i).click();
    await page.getByPlaceholder('Nom du service').fill('Cours à domicile');
    await page.getByRole('button', { name: /^Ajouter$/i }).click();

    await Promise.all([
      page.waitForURL('**/prestataire*', { timeout: 60_000 }),
      page.getByRole('button', { name: /Créer le profil/i }).click(),
    ]);

    await expect(page.getByRole('heading', { name: /Tableau de bord Prestataire/i })).toBeVisible();
    await expect(page.getByText('Coach IA Automatisé')).toBeVisible();
  });
});


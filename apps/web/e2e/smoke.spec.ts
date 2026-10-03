import { expect, test } from '@playwright/test';

test('the login page is reachable', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Connexion à ImmoTrack' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
});

test('business pages require authentication', async ({ page }) => {
  for (const path of ['/', '/runs', '/properties', '/agent-ingest']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('the health endpoint responds', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('agent ingestion rejects unauthenticated calls without leaking details', async ({
  request,
}) => {
  const response = await request.post('/api/v1/agent-ingestion', { data: {} });
  expect(response.status()).toBe(401);
  const body = (await response.json()) as { error: { code: string; correlationId: string } };
  expect(body.error.code).toBe('UNAUTHORIZED');
  expect(response.headers()['x-correlation-id']).toBe(body.error.correlationId);
});

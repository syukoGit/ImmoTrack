import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Smoke tests sur le build de production. Supabase n'est pas contacté : sans cookie de session,
 * l'application redirige vers /login sans appel réseau. Aucune base de données n'est requise :
 * l'authentification agent est vérifiée avant tout accès à la base.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Permet d'utiliser un Chromium déjà installé (ex. image CI ou poste sans téléchargement).
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec next start --port ${PORT} --hostname 127.0.0.1`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      AUTH_MODE: 'supabase',
      SUPABASE_URL: process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
      SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? 'e2e-publishable-key',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'admin@example.com',
      // Base injoignable à dessein : les scénarios couverts doivent aboutir sans accès DB.
      DATABASE_URL: 'postgresql://e2e:e2e@127.0.0.1:9/e2e',
      LOG_LEVEL: 'warn',
    },
  },
});

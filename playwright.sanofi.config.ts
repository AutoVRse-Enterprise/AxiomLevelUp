import { defineConfig } from '@playwright/test'

const previewPort = 4182
const swiftShaderArgs = ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader']

export default defineConfig({
  testDir: './e2e/sanofi',
  outputDir: '.tmp/playwright-sanofi/results',
  fullyParallel: false,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '.tmp/playwright-sanofi/report', open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${previewPort}`,
    serviceWorkers: 'allow',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        launchOptions: { args: swiftShaderArgs },
      },
    },
    {
      name: 'touch-phone-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1,
        launchOptions: { args: swiftShaderArgs },
      },
    },
  ],
  webServer: {
    command: `npm run build:sanofi && npm run preview:sanofi -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    env: {
      VITE_E2E: 'true',
    },
    url: `http://127.0.0.1:${previewPort}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})

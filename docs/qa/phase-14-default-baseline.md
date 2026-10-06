# Phase 14 default-experience baseline

Captured before the multi-experience refactor on 2026-10-07.

## Automated baseline

- `npm run check`: passed in 88.257 seconds.
  - TypeScript and ESLint: passed.
  - Vitest: 73 files / 500 tests passed.
  - Content: 5 courses / 13 lessons / 4 cases / 1 anatomy map / 0 warnings.
  - Production build and every existing bundle budget: passed.
- Serial Playwright:
  `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`
  - 53 passed / 3 intentional project skips / 0 failed in 9.4 minutes.
  - All eight `e2e/phase-13-case-lab.spec.ts-snapshots` comparisons passed without updating.
- PWA injectManifest output: 171 precache entries (7087.65 KiB).

## Bundle budgets

| Role      | File                                     | Raw bytes | Gzip bytes | Limit raw / gzip |
| --------- | ---------------------------------------- | --------: | ---------: | ---------------- |
| Entry     | `AxiomLevelUp-CEkZKQrI.js`               |   411,869 |    128,715 | 770,000 / 230,000 |
| Imaging   | `createController-CXn45d44.js`           | 3,703,172 |  1,006,576 | 3,708,000 / 1,010,000 |
| Anatomy3D | `createAnatomyController-DngRQr-2.js`    |   689,298 |    175,616 | 850,000 / 220,000 |
| Confetti  | `confetti-OaOaAneI.js`                   |       791 |        505 | 14,000 / 8,000 |

## PWA manifest

```json
{
  "name": "Autovrse LevelUp",
  "short_name": "LevelUp",
  "description": "Interactive scientific and medical learning from Autovrse",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f7f9f8",
  "theme_color": "#5c4acf",
  "lang": "en",
  "scope": "/",
  "orientation": "any"
}
```

The four icon records are frozen in
`scripts/experiences/default-build-baseline.json`.

## HTML metadata

- `<html lang="en">`
- title: `Autovrse LevelUp`
- description: `Interactive scientific and medical learning from Autovrse.`
- theme colour: `#5c4acf`
- favicon: `/assets/icons/favicon.ico`
- SVG icon: `/brand/autovrse-logo.svg`
- Apple touch icon: `/assets/icons/apple-touch-icon-180x180.png`

`npm run verify:default-build` compares these normalized values and the complete PWA manifest with
the committed baseline. It also fails if the default service worker precaches `experiences/**`.

## Persisted-name contract

- IndexedDB value prefix: `axiom-runtime:`
- Persisted stores: `learner`, `activity-session`, `event-log`, `offline-library`
- localStorage: `axiom-runtime:preferences`, `axiom-runtime:simulated-offline`
- sessionStorage prefix: `axiom-runtime:pathway:`
- service-worker settings database: `axiom-runtime-service-worker`
- Cache Storage: `offline-courses-v1`, `dicom-studies-v1`, `versioned-case-models-v1`

## Route and shell contract

`src/app/router.characterization.test.tsx` freezes:

- the production and development route trees, titles, two layout groups and eager Home boundary;
- the exact default shell markup at `/`.

`src/state/persistence/storageKeys.characterization.test.ts` freezes the names above.

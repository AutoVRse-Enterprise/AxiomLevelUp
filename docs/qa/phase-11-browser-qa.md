# Phase 11 browser QA

## Result

**Pass — technical Chromium/emulation gate only.**

The complete production-preview suite passed on desktop and 375 px touch emulation. This evidence
does not approve the unreviewed clinical claims and does not satisfy physical Android or iOS
acceptance.

## Environment

- Date: 2026-10-03
- Host: Windows 10 build 19045 (`win32`)
- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Git branch/base commit: `master` at `d341dca`, with the uncommitted Phase 10/11 implementation
- Node: `v24.19.0`
- npm: `11.17.0`
- Playwright: `1.63.0`
- Browser: Playwright Chromium/headless-shell build 1243
- Targets:
  - desktop Chromium, 1440 × 900
  - touch-phone Chromium, 375 × 812, touch/mobile context, device scale factor 1
- Concurrency: two workers, pinned in `playwright.config.ts` after four-worker resource contention
  during P11-T12
- Preview: Vite production build on `http://127.0.0.1:4181`, strict port, `VITE_E2E=true`
- Service workers: blocked for golden-path tests; allowed only for the P11-T12 cache test
- WebGL on both targets:
  - API: WebGL 2
  - masked renderer/vendor: `WebKit WebGL` / `WebKit`
  - unmasked renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)
(0x0000C0DE)), SwiftShader driver)`
  - unmasked vendor: `Google Inc. (Google)`

## Commands and timings

- `npm run check:demo`
  - Expands to `npm run typecheck && npm run lint && npm run test:e2e`.
  - Initial attempt: failed after 25.706 seconds before browser launch because Chromium build 1243
    was absent from the sandbox-selected cache.
- `npx playwright install chromium`
  - Passed in 1.679 seconds and confirmed Chromium/headless-shell build 1243 in
    `C:\Users\c0n\AppData\Local\ms-playwright`.
- Second `npm run check:demo`
  - Failed after 25.737 seconds before browser launch because the sandbox still redirected
    Playwright to an empty temporary cache.
- `$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\Users\c0n\AppData\Local\ms-playwright'; npm run check:demo`
  - First successful complete run: **passed in 162.462 seconds**; 16/16 tests in 2.5 minutes.
  - Final rerun after renderer logging and documentation:
    **passed in 180.387 seconds**; 16/16 tests in 2.8 minutes.
  - Visual-acceptance rerun after removing the closed waypoint shell that obscured the airway:
    **passed in 93.259 seconds**; 16/16 tests in 1.3 minutes.
  - TypeScript: pass.
  - ESLint with zero warnings: pass.
  - Production build/preview: pass; Vite reported existing Cornerstone browser-externalization and
    chunk-size advisory warnings.
  - Playwright: zero retries and zero skips.
- Detailed renderer confirmation:
  `$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\Users\c0n\AppData\Local\ms-playwright'; npm run test:e2e -- --grep "opens the golden case"`
  - **2/2 passed in 30.4 seconds.**
- `npm run check`
  - **Passed in 41.589 seconds.**
  - TypeScript and ESLint: pass.
  - Vitest: 59 files / 400 tests passed in 17.81 seconds.
  - Content validation: 5 courses, 13 lessons, 4 cases, 1 anatomy map and zero warnings.
  - Production build and all entry, imaging, anatomy and confetti bundle budgets: pass.

## Golden-path timing and coverage

The automated interaction timing measures deterministic test execution, not a human presentation:

- Desktop automated path: 17.654 seconds inside the measured path; Playwright test 18.8 seconds.
- 375 px automated path: 17.043 seconds inside the measured path; Playwright test 18.3 seconds.
- Direct model-raycast localisation: 4.9 seconds desktop; 4.8 seconds at 375 px.
- Configured finding activation: about 1.3 minutes desktop; about 1.2 minutes at 375 px under the
  final run's concurrent software-renderer load.
- The presenter runbook remains paced at five minutes from briefing through comparison.

Both golden paths used the real branch controls and projected finding point on the real WebGL
canvas. They then completed overlay-free lobe/segment/structure localisation, severity selection,
CO₂ reasoning, diagnosis, urgent consequence, results and comparison. Separate real-canvas tests
covered most-specific lobe selection, marker retention, branch round-trip, hit testing and the
versioned model/service-worker cache.

The initial closeout capture exposed a visual defect not caught by interaction assertions: a
closed waypoint sphere filled the camera with a flat wall. The generated junction shell was
removed, the suite was rerun and the durable screenshots now show the airway rings and the
configured occlusion directly in the viewport.

## Durable screenshots

Desktop:

- [Endoscopic finding](evidence/phase-11/desktop-endoscopic-finding.png)
- [Localisation](evidence/phase-11/desktop-localisation.png)
- [Results](evidence/phase-11/desktop-results.png)
- [Comparison](evidence/phase-11/desktop-compare.png)

375 px touch emulation:

- [Endoscopic finding](evidence/phase-11/375px-endoscopic-finding.png)
- [Localisation](evidence/phase-11/375px-localisation.png)
- [Results](evidence/phase-11/375px-results.png)
- [Comparison](evidence/phase-11/375px-compare.png)

The Playwright golden-path test rewrites these tracked paths on every complete run.

## Limitations and blockers

- Chromium viewport and touch emulation is not physical-device approval. It does not establish real
  phone GPU performance, hardware touch behavior, haptics, safe-area behavior, installed-PWA
  lifecycle, memory pressure or iOS Safari behavior.
- P9-M01 through P9-M03 remain open pending physical Android/iOS evidence on the hosted build or an
  authorized waiver.
- All claims in `phase-11-golden-case-content-review.md` remain clinically unreviewed and
  unapproved. External presentation remains blocked pending the recorded respiratory SME,
  anatomy/pathology and client/legal sign-offs.
- The test renderer is software SwiftShader. It proves the WebGL code path and interaction contract,
  not performance on presentation hardware.

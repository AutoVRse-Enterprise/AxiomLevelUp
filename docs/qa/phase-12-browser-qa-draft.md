# Phase 12 browser QA draft

## Draft result

**P12-T11 technical pass; audience readiness remains for P12-T12.**

All four configured cases and the PRD section 80 product tour pass against a production preview in
desktop Chromium and 375 px touch/mobile Chromium. This draft is evidence for finalization, not
clinical, legal, hosting or physical-device approval.

## Environment

- Date: 2026-10-04
- Host: Windows 10 build 19045 (`win32`)
- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Git branch/base: `master` at `362a9bf`, with the uncommitted Phase 12 worktree
- Node: `v24.19.0`
- npm: `11.17.0`
- Playwright: `1.63.0`
- Browser: Playwright Chromium/headless-shell build 1243
- Preview: Vite production build, `http://127.0.0.1:4181`, strict port, `VITE_E2E=true`
- Desktop project: 1440 × 900
- Phone project: 375 × 812, mobile/touch context, device scale factor 1
- WebGL flags: `--use-angle=swiftshader --use-gl=angle --enable-unsafe-swiftshader`
- Service workers: blocked by default; explicitly allowed by the dedicated current-build and
  verified offline-package tests
- DICOM: real Cornerstone3D runtime and the local 125-instance `thoracic-ct-series`
- Execution: serial (`--workers=1`) for the final gate and timing runs

## P12-T11 coverage

Eight production-preview case completions cover all four cases on both projects:

- `asthma-foundation`: overview marker, real exploration, projected lobe selection and configured
  procedural apical-segment volume, then results and authored comparison.
- `copd-intermediate`: clue-first image, ambiguous COPD/asthma/bronchiectasis/heart-failure
  differential, remaining configured interactions, results and comparison.
- `exacerbation-advanced`: real endoscopic branch traversal, projected patient-specific finding,
  multi-level localisation, severity/physiology/diagnosis/consequence, results and comparison.
- `wheeze-quick`: real marker entry/exploration, compact configured decisions, results and
  comparison.

Four product-tour tests cover two robust sequences on both projects:

- Home seeded state → Translational Science pathway → Interpreting Thoracic CT knowledge/visual
  sequence → real DICOM preset and slice interaction → Imaging Lab guided inspection, region point
  and calibrated line measurement → XP/mastery/stars and Imaging Explorer badge.
- Daily Challenge completion → Weekly, Monthly and All-time Leaderboard views → Profile mastery,
  achievements, activity and unlocked award.

The case tests assert a nonempty real WebGL renderer. Desktop uses real pointer paths; the phone
project uses touch for projected anatomy. Keyboard/list alternatives remain covered by the
catalogue accessibility suite, while DICOM uses its real viewport, preset, slice, point and line
paths rather than fixtures.

## Timing evidence

Automated timings are deterministic test execution, not human presentation time.

The focused P12 breadth/product run passed **10/10 in 121.010 seconds**:

- Desktop: foundation 10.491 s; intermediate 10.038 s; quick 7.297 s.
- Phone: foundation 8.567 s; intermediate 8.342 s; quick 5.641 s.
- Desktop product tour: learning/DICOM 13.342 s; engagement 8.923 s; 22.265 s combined measured
  interaction time.
- Phone product tour: learning/DICOM 12.148 s; engagement 7.261 s; 19.409 s combined measured
  interaction time.

The practical presenter rehearsal used the same production-preview automation with a deliberate
30-second pause at each showcase beat. It is a **scripted rehearsal**, not a human observation:

- Desktop product tour: 2:42.198 learning/DICOM + 1:38.905 engagement = **4:21.103**.
- Phone product tour: 2:41.754 learning/DICOM + 1:37.652 engagement = **4:19.406**.
- Desktop Case Lab: **4:33.565**.
- Phone Case Lab: **4:18.624**.
- Combined route: **8:54.668 desktop** and **8:38.030 phone** before live discussion variance.

## Durable screenshots

Phase 12 evidence is isolated from the retained Phase 11 evidence. Each folder contains 21 PNGs
(42 total):

- Desktop: [`evidence/phase-12/desktop/`](evidence/phase-12/desktop/)
- 375 px: [`evidence/phase-12/375px/`](evidence/phase-12/375px/)

Case evidence in each folder:

- `case-foundation-state.png`, `case-foundation-results.png`, `case-foundation-compare.png`
- `case-intermediate-state.png`, `case-intermediate-results.png`, `case-intermediate-compare.png`
- `case-advanced-state.png`, `case-advanced-results.png`, `case-advanced-compare.png`
- `case-quick-state.png`, `case-quick-results.png`, `case-quick-compare.png`

Product-tour evidence in each folder:

- `tour-home.png`, `tour-pathway.png`
- `tour-lesson-dicom.png`, `tour-lesson-complete.png`
- `tour-dicom-region.png`, `tour-dicom-complete.png`
- `tour-daily-challenge.png`, `tour-leaderboard.png`, `tour-profile.png`

Captures wait for fonts and two animation frames and disable animations. DICOM state captures use
the live Cornerstone canvas. The Phase 12 tests do not write Phase 11 evidence paths.

## Verification status

- Focused breadth and product-tour run: **10/10 passed**, one worker, 121.010 seconds.
- Scripted product-tour rehearsal: **4/4 passed**, one worker, 541.245 seconds.
- Scripted Case Lab rehearsal: **2/2 passed**, one worker, 549.369 seconds.
- `npm run check`: **passed in 84.296 seconds**. TypeScript and ESLint passed; Vitest passed
  66 files / 456 tests in 34.81 seconds; content validation passed 5 courses / 13 lessons / 4 cases
  / 1 anatomy map with zero warnings; production build and every bundle budget passed.
- Complete serial Playwright suite: **50 passed, 2 intentional project skips, 0 failures in
  424.094 seconds (7.0 minutes)**. The skips are the deliberately desktop-only learner-copy route
  sweep and verified offline-package service-worker check.
- Final automated advanced golden path: **11.760 seconds desktop** and **8.540 seconds phone**
  inside the measured path.
- Final full-suite product sequence: **21.614 seconds desktop** and **19.432 seconds phone** across
  the measured learning/DICOM and engagement sections.

During implementation, mobile DICOM controls required opening the responsive instructions sheet;
the final flow does so through the visible UI. The calibrated line uses viewport-specific rendered
geometry and is asserted against the authored 17.6 mm ±10% acceptance range. Final focused runs
passed without retry.

## Limitations for P12-T12

- 375 px Chromium touch emulation is not physical Android or iOS approval. P9-M01 through P9-M03
  remain open for real touch/GPU, orientation, safe areas, installation, memory pressure, Safari
  and offline lifecycle evidence.
- SwiftShader proves the real WebGL path and contracts but not presentation-device performance.
- The DICOM run proves the bundled local series. A production cross-origin host still requires the
  Phase 9 HTTPS, CORS, stability and PHI preflight.
- The four case claim ledgers remain clinically, anatomically/pathologically and client/legal
  unapproved. The app remains educational and non-diagnostic.
- Procedural segment volumes, branches and findings are illustrative configured geometry, not
  patient-derived segmentation.
- Existing Vite build output reports Cornerstone codec browser-externalization notices, a large
  lazy imaging chunk advisory and the Rolldown `inlineDynamicImports` deprecation; these did not
  fail build or runtime checks.
- P12-T12 must publish the audience-specific verdict and may not promote this technical pass to
  unsupervised external approval without the outstanding reviews and device evidence.

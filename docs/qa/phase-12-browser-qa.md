# Phase 12 browser QA

## Final result

**Technical pass.** All four configured cases and the PRD section 80 product tour pass against a
production preview in desktop Chromium and 375 px touch/mobile Chromium. Phase 12 app
implementation is complete.

This evidence is not clinical, anatomy/pathology, legal, hosting or physical-device approval.
Audience decisions are recorded separately in `phase-12-demo-readiness-verdict.md`.

## Candidate and environment

- Date: 2026-10-04
- Host: Windows 10 build 19045 (`win32`)
- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Git branch/base: `master` at `73d845f438b1cdb3306f5deccec0358b2bca6699`
  (`test(P12-T11): rehearse complete demo`)
- Worktree: uncommitted P12-T12 closeout documentation and the learner-copy correction; the user's
  untracked `docs/reference docs/` remains untouched. No P12-T12 candidate commit exists yet.
- Node: `v24.19.0`
- npm: `11.17.0`
- Playwright: `1.63.0`
- Browser: Playwright Chromium/headless-shell build 1243
- Preview: Vite production build, `http://127.0.0.1:4181`, strict port, `VITE_E2E=true`
- Desktop project: 1440 × 900
- Phone project: 375 × 812, mobile/touch context, device scale factor 1
- WebGL flags: `--use-angle=swiftshader --use-gl=angle --enable-unsafe-swiftshader`
- Service workers: blocked by default; explicitly allowed by the current-build and verified
  offline-package tests
- DICOM: real Cornerstone3D runtime and the local 125-instance `thoracic-ct-series`
- Final execution: serial (`--workers=1`)

## Coverage

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
catalogue accessibility suite. DICOM uses its real viewport, preset, slice, point and line paths.

## Final commands and results

The final quality command was:

```powershell
npm run check
```

It passed in **47.420 seconds**:

- TypeScript and ESLint passed.
- Vitest: **66 files / 456 tests passed in 19.10 seconds**.
- Content: **5 courses / 13 lessons / 4 cases / 1 anatomy map / 0 warnings**.
- Production app, content worker and service worker built successfully.
- Entry, imaging, anatomy and confetti bundle budgets passed.

The final production-preview browser command was:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'
npx playwright test --workers=1
```

It ran **52 tests using one worker**: **50 passed, 2 intentional project skips, 0 failures in
6.9 minutes**; measured command wall time was **415.861 seconds**. The skips are the touch duplicate
of the intentionally desktop-only learner-copy sweep and the touch duplicate of the intentionally
desktop-only verified offline-package worker check.

The final serial run measured these automated interaction paths:

- Desktop breadth: foundation **10.156 s**, intermediate **9.724 s**, quick **7.674 s**.
- Phone breadth: foundation **8.256 s**, intermediate **8.433 s**, quick **5.853 s**.
- Advanced golden path: **12.366 s desktop**, **8.526 s phone**.
- Desktop product sequences: **12.756 s** learning/DICOM + **8.959 s** engagement =
  **21.715 s**.
- Phone product sequences: **11.362 s** learning/DICOM + **7.080 s** engagement =
  **18.442 s**.

An attempted `npm run check:demo -- --workers=1` did not forward `--workers` through its nested npm
script and therefore ran with the configured two workers. That non-final run exposed the authored
phrase `reversible-flow`, which matched a machine option ID in the learner-copy sweep. The copy was
changed to learner-facing language; a focused one-worker rerun passed **1 test with 1 intentional
project skip in 29.8 seconds**, then the complete final serial suite above passed. The failed
non-serial run is not used as gate evidence.

`npm run schema:export` and `npm run assets:hash` were not required because P12-T12 changed no
schema or asset metadata.

## Presenter timing evidence

Automated timings above are deterministic test execution, not human presentation time. The P12-T11
practical presenter rehearsal used the same production preview with a deliberate 30-second pause
at each showcase beat:

- Desktop product tour: 2:42.198 learning/DICOM + 1:38.905 engagement = **4:21.103**.
- Phone product tour: 2:41.754 learning/DICOM + 1:37.652 engagement = **4:19.406**.
- Desktop Case Lab: **4:33.565**.
- Phone Case Lab: **4:18.624**.
- Combined route: **8:54.668 desktop** and **8:38.030 phone** before live discussion variance.

These are scripted rehearsals, not observed human usability timings.

## Durable screenshots

Each Phase 12 folder contains 21 PNGs, 42 total:

- Desktop: [`evidence/phase-12/desktop/`](evidence/phase-12/desktop/)
- 375 px: [`evidence/phase-12/375px/`](evidence/phase-12/375px/)

Each viewport contains state, results and comparison captures for foundation, intermediate,
advanced and quick cases, plus Home, pathway, lesson DICOM/completion, Imaging Lab
region/completion, Daily Challenge, Leaderboard and Profile captures. Captures wait for fonts and
two animation frames and disable animation. DICOM captures use the live Cornerstone canvas.
Phase 11 evidence remains separately retained.

## Accessibility and performance

`phase-12-accessibility-performance.md` records 236 axe-core WCAG A/AA scans with zero violations,
200% text and keyboard coverage, WebGL/model/session recovery, Lighthouse accessibility 100 on
every audited route and Home performance 86 mobile / 99 desktop. The final serial suite reran the
Playwright accessibility, text-scaling, keyboard and resilience checks on both projects.

The headed workstation anatomy observation remains 6.1 ms median frame interval (163.9 displayed
FPS) on an NVIDIA RTX 3060 Ti. This is a single workstation observation, not physical-device or GPU
execution-time certification. The final automated projects used ANGLE Vulkan SwiftShader.

## Finding and timeout closure

`phase-10-demo-readiness-audit.md` records task/evidence closure for F10, F12, F26, F28, F29,
F31–F33, F39, F46, F47 and F51. The general timeout item is closed by the shared
primitive-definition `committed_progress` policy: completed localisation levels retain evaluated
weighted credit, while the submission remains timed out and its step-speed factor remains zero.
There is no silently deferred Phase 12 finding.

F19 remains a physical-device boundary under Phase 9. F21 remains an unapproved
clinical/anatomy/pathology/client/legal review boundary.

## Limitations

- 375 px Chromium touch emulation is not physical Android or iOS approval. P9-M01 through P9-M03
  remain open for real touch/GPU, orientation, safe areas, installation, memory pressure, Safari
  and offline lifecycle evidence or explicit authorized waivers.
- SwiftShader proves the real WebGL path and contracts, not presentation-device performance.
- The DICOM run proves the bundled local series. A production cross-origin host still requires the
  Phase 9 HTTPS, CORS, stability and PHI preflight.
- The four case claim ledgers remain clinically, anatomically/pathologically and client/legal
  unapproved. The app remains educational and non-diagnostic.
- Procedural segment volumes, branches and findings are illustrative configured geometry, not
  patient-derived segmentation.
- Existing build output reports Cornerstone codec browser-externalization notices, a large lazy
  imaging chunk advisory and the Rolldown `inlineDynamicImports` deprecation. They did not fail the
  build, runtime checks or enforced budgets.

## Audience disposition

- Internal engineering demo: **Go**.
- Supervised client technical preview: **Conditional Go** under the presenter controls and explicit
  boundaries in `phase-12-demo-readiness-verdict.md`.
- Unsupervised/external use: **No-go** until clinical, anatomy/pathology, client/legal and Phase 9
  physical-device approvals or authorized waivers are recorded.

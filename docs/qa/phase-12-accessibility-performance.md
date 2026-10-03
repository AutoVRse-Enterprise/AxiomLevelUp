# Phase 12 accessibility and performance evidence

Date: 2026-10-04

## Environment

- Windows 10 22H2, Node 24.19.0 and npm 11.17.0.
- Playwright 1.63 Chromium ran with WebGL 2 through ANGLE Vulkan SwiftShader on the 1440 × 900
  desktop project and the 375 × 812 touch-phone project.
- Lighthouse 13.5.0 ran against a production Vite preview with its default simulated mobile
  throttling and its desktop preset. The host browser reported Headless Chrome 154 and a Lighthouse
  benchmark index of approximately 4000–4200 across runs.
- The eight Lighthouse JSON reports are in `docs/qa/evidence/phase-12/lighthouse/`.

## Accessibility

Playwright injects the installed `axe-core` source after fonts and route motion settle, then runs
the `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` tags. A visible modal is scanned as the active
document surface; otherwise the complete document is scanned.

- 33 stable learner routes were scanned on each viewport.
- All stage boundaries, steps, completed-step feedback, localisation levels, scenario nodes and
  consequences, results and comparison states for all four catalogue cases were scanned. This is
  85 dynamic case-state scans per viewport.
- Total: 118 scans per viewport, 236 scans across both projects, with zero violations.
- Lighthouse accessibility was 100 for every audited route and viewport.

Markup and presentation corrections made during the audit include valid definition-list structure,
a single main landmark during lazy loading, AA neutral text contrast and safer wrapping/minimum
width behavior in shared cards, buttons and comparison layouts.

## 200% text and keyboard

Text-resize coverage sets the root font size to `200% !important` while retaining the configured
viewport. This deterministically exercises WCAG text resize without scaling the viewport itself.
Both Playwright projects verify zero document-level horizontal overflow and reachable primary
actions for the CasePlayer anatomy viewer, Clues, Notes, saved CaseResults and CaseCompare.

The keyboard-only smoke uses Tab/focus plus Enter or Space for controls and the anatomy list as the
canvas-equivalent path. It verifies a rendered `:focus-visible` treatment and completes the
`wheeze-quick` case on desktop and touch-phone projects without pointer activation.

## Anatomy diagnostics and resilience

Development builds expose an authoring readout under `?anatomyDebug=1`. The controller keeps the
latest 120 `requestAnimationFrame` intervals and reports sample count, rolling median frame
milliseconds, derived median FPS and WebGL renderer. Production builds omit the readout.

A headed local Chrome sample on this workstation reported 6.1 ms median frame time (163.9 FPS) and
`ANGLE (NVIDIA GeForce RTX 3060 Ti Direct3D11)`. This is a single workstation observation, not a
physical-device acceptance result or GPU execution-time measurement. Automated Playwright reported
ANGLE Vulkan SwiftShader, so its timing is not presented as hardware-GPU evidence.

Resilience checks pass on both viewports:

- `WEBGL_lose_context` loss and restoration returns the viewer to a rendered, ready state.
- A deterministic first GLB response failure exposes Retry; retry uses a cache-busting attempt URL
  and recovers the real model. Pointer capture no longer intercepts nested viewport controls.
- Navigating away during a case and returning preserves the active stage/task and pinned clue
  evidence.

## Lighthouse results

Each entry is `performance / accessibility`:

- Home: mobile **86 / 100**; desktop **99 / 100**.
- Learn: mobile **75 / 100**; desktop **75 / 100**.
- Foundation case intro: mobile **76 / 100**; desktop **95 / 100**.
- Scientific Imaging lesson: mobile **75 / 100**; desktop **99 / 100**.

Home now exceeds the 85 target on both profiles and all accessibility scores remain 100. The
initial mobile trace scored 78 with 3.0 s FCP, 3.6 s LCP and 310 ms total blocking time; bootup
diagnostics attributed about 700 ms of simulated CPU time to main-bundle script evaluation. Runtime
content fetching and full Zod/semantic validation now execute in a module worker. The UI still
blocks on validated content and reconstructs typed validation failures before rendering, while the
worker and content remain service-worker precached for offline startup. The optional celebration
dialog/effects module also loads only when a persisted celebration is pending.

Two isolated verification runs under the unchanged mobile profile scored 85 and 86. Both reported
2.8 s FCP, 3.1 s LCP and zero layout shift; total blocking time was 230 ms and 180 ms respectively.
The retained `home-mobile.json` is a third run scoring 86 with 2.8 s FCP, 3.1 s LCP, 2.8 s Speed
Index, 180 ms total blocking time and zero layout shift.

## Commands and results

```text
npm run check
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npm run test:e2e -- --workers=1
npm run preview -- --host 127.0.0.1 --port 4190 --strictPort
npx --yes lighthouse <route> --chrome-path=<chrome.exe> --only-categories=performance,accessibility --output=json --output-path=<evidence.json> --quiet --chrome-flags="--headless --no-sandbox"
```

- `npm run check`: 66 Vitest files and 456 tests passed; content validation found 5 courses,
  13 lessons, 4 cases, 1 anatomy map and zero warnings; build and bundle budgets passed.
- Complete Playwright suite: 40 passed and 2 intentionally skipped touch-only duplicates in
  5.0 minutes. All 20 P12-T10 project-level tests passed with no skips.
- The automated viewports do not replace Phase 9 physical Android/iOS installation, safe-area,
  memory-pressure, Safari or device-GPU testing.

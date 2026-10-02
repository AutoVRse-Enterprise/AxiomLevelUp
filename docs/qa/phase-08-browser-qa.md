# Phase 8 browser QA

Date: 2026-10-02

## Environment

- Chromium desktop and mobile emulation against a production Vite preview.
- Current production bundle with the advanced learner seed.
- Lighthouse 13.0.1 mobile navigation profile.
- Physical Android Chrome and iOS Safari checks remain in Phase 9.

## Responsive matrix

| Viewport | Surfaces exercised                              | Result                                                                                                                                                         |
| -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 375×812  | Home, Profile, lesson player, primitive gallery | Pass. Mobile navigation is visible and there is no document overflow.                                                                                          |
| 812×375  | Home and DICOM gallery                          | Pass. The compact layout has no document overflow; DICOM expansion uses an 812×375 fixed fallback when element fullscreen is unavailable.                      |
| 768×900  | Home                                            | Pass. Tablet spacing and mobile navigation fit without document overflow.                                                                                      |
| 1280×900 | Home, Learn, Profile, primitive gallery         | Pass. Desktop header navigation replaces the bottom bar, the content column remains bounded and DICOM instructions remain visible in the persistent side pane. |

The pass found and fixed three containment issues before closeout:

- the Home continue-learning image now shrinks within its grid at enlarged text sizes;
- Profile preference controls, statistics and PWA notices no longer retain an overflowing
  min-content width;
- the pan/zoom image viewport now respects its container when its aspect ratio and minimum height
  compete on a narrow screen.

## Text and motion preferences

- Home and Profile were exercised at a 200% root text size at 375×812. Both retain all content and
  actions with `scrollWidth === clientWidth`.
- With the device preference set to System and Chromium emulating
  `prefers-reduced-motion: reduce`, the runtime resolves `html[data-motion="reduced"]`.
- After the reduced-motion route settled, no animation remained in the running state. CSS and
  Motion components therefore follow the same resolved preference.

## Keyboard and accessibility

- Skip links are the first focusable controls in both application layouts.
- Route changes retain a single named page heading and the route-transition focus target.
- Header/bottom navigation, lesson actions, Profile controls, image controls and DICOM controls
  expose native focusable roles and accessible names.
- The expanded DICOM fallback keeps a named Exit button available while the viewer occupies the
  full viewport.
- Automated route-focus coverage and four WCAG A/AA axe checks back the browser inspection.

## Error and offline paths

- A missing lesson image renders `Image unavailable` with Retry and Continue actions.
- Browser-level offline emulation on a non-downloaded lesson renders
  `This lesson has not been downloaded` with Return to course and Choose an offline lesson actions.
- Connectivity was restored after the check. No simulated-offline flag was left enabled.

## Lighthouse comparison

| Metric                   | Baseline | Phase 8 final | Change |
| ------------------------ | -------: | ------------: | -----: |
| Performance              |       86 |            84 |     -2 |
| Accessibility            |       96 |           100 |     +4 |
| Best practices           |      100 |           100 |      0 |
| SEO                      |       92 |            92 |      0 |
| First Contentful Paint   |    2.7 s |         2.8 s | +0.1 s |
| Largest Contentful Paint |    3.2 s |         3.6 s | +0.4 s |
| Speed Index              |    2.7 s |         2.8 s | +0.1 s |
| Total Blocking Time      |   180 ms |        130 ms | -50 ms |
| Cumulative Layout Shift  |    0.013 |             0 | -0.013 |

The small throttled paint-score variation is accompanied by lower blocking time, zero measured
layout shift and a substantially smaller entry bundle. Accessibility reaches 100 after the ARIA,
focus and contrast work. Raw output is retained in
`docs/qa/phase-08-lighthouse-final.json`.

## Result

Phase 8 browser QA passes. The four target viewport classes, 200% text, reduced motion, keyboard
semantics, offline recovery and Lighthouse audit meet the phase exit criteria. Physical-device
fullscreen, vibration, installation and DICOM gesture checks remain explicitly deferred to
Phase 9.

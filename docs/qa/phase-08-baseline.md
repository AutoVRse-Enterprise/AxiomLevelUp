# Phase 8 baseline

Date: 2026-10-02

## Bundle

Measured from the default production build before Phase 8 runtime changes.

- Entry: 717,191 raw / 214,583 gzip bytes.
- Lazy imaging controller: 3,703,170 raw / 1,006,573 gzip bytes.
- Main stylesheet: 48.51 kB raw / 9.67 kB gzip.
- PWA precache: 104 entries / 5,670.43 KiB.

The enforced entry limit is 230,000 gzip bytes, leaving 15,417 bytes above the measured baseline.
The imaging budget allows only build-level variance. Celebration confetti must remain in a separate
chunk below 8,000 gzip bytes.

## Mobile Lighthouse

Lighthouse 13.0.1 ran against the production preview with its mobile navigation profile.

- Performance: 86
- Accessibility: 96
- Best practices: 100
- SEO: 92
- First Contentful Paint: 2.7 s
- Largest Contentful Paint: 3.2 s
- Speed Index: 2.7 s
- Total Blocking Time: 180 ms
- Cumulative Layout Shift: 0.013

The accessibility deduction is the known `aria-label` on presentational weekly-activity `span`
elements. Phase 8 accessibility work will replace that invalid relationship and add skip
navigation. Missing production source maps are informational and do not affect the scored
best-practices result.

## Responsive baseline

The Phase 7 production browser pass verified 375×812, 812×375, 768×900 and 1280×900 with no
document-level overflow. Current limitations carried into Phase 8 are:

- the mobile bottom navigation remains visible on desktop;
- DICOM instructions always use a Sheet rather than a persistent desktop pane;
- there are no orientation-specific artifact rules;
- image and video assets do not expose designed network-loading states;
- route transitions, route-heading focus and skip navigation are absent.

The raw Lighthouse report is retained as `docs/qa/phase-08-lighthouse-baseline.json`.

# Phase 8 contrast audit

Date: 2026-10-02

WCAG relative-luminance checks for the semantic text/background pairs used by new Phase 8
components:

- `brand-700` on white: 6.46:1
- `neutral-600` on white: 6.91:1
- `success-700` on `success-50`: 6.21:1
- `warning-700` on `warning-50`: 6.10:1
- `danger-700` on `danger-50`: 6.40:1
- `info-700` on `info-50`: 6.22:1
- white on `brand-700`: 6.46:1

All audited normal-text combinations exceed WCAG AA's 4.5:1 target. Decorative pale colors are not
used as text. Clinical controls retain white or `neutral-200` content on `clinical-900`/`950`.
Automated axe and Lighthouse checks supplement, but do not replace, this token audit.

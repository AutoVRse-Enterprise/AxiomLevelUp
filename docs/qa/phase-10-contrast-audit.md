# Phase 10 branding contrast audit

Date: 2026-10-03

The ratios below use the WCAG 2 relative-luminance formula. Normal text must reach 4.5:1 and
large text must reach 3:1.

## In-use AA pairs

- Primary `#5C4ACF` on white: **6.30:1** (AA normal text).
- Primary `#5C4ACF` on brand 50 `#F7F5FC`: **5.82:1** (AA normal text).
- White on primary `#5C4ACF`: **6.30:1** (AA normal text).
- Accent `#7E48B7` on white: **6.00:1** (AA normal text).
- Brand 800 `#493AA9` on brand 100 `#EEE9F8`: **7.17:1** (AAA normal text).
- Brand 900 `#382D82` on brand 50 `#F7F5FC`: **10.41:1** (AAA normal text).
- Brand 100 `#EEE9F8` on primary `#5C4ACF`: **5.29:1** (AA normal text).
- Brand 200 `#E3DCF3` on primary `#5C4ACF`: **4.74:1** (AA normal text).
- White on brand 900 `#382D82`: **11.25:1** (AAA normal text).

The changed text/background combinations used by the application meet WCAG AA.

## Restricted tokens

- Primary strong `#8564D4` on white is **4.40:1**. It passes for large text but not normal text,
  so it is limited to non-text controls, borders, focus treatment, and large text on white.
- Decorative accent `#C46DD2` on white is **3.25:1**. It is reserved for decoration and large
  text. It may be used for normal text only on a verified dark background; for example, it is
  **4.67:1** on brand 950 `#241C59`.

Inter remains the application typeface. Automated axe checks supplement, but do not replace, this
token audit. Lighthouse coverage is part of the final Phase 10 QA pass.

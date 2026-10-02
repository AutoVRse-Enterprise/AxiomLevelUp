# Phase 9 showcase audit

Date: 2026-10-02

## Result

The internal `runtime-showcase` course is hidden from the learner catalogue and its
`primitive-showcase` lesson now contains 26 ordered steps:

- all 25 types exported by `src/content/primitiveTypes.ts`;
- all 25 strict primitive schemas;
- all 25 pure primitive definitions;
- all 25 lazy component registrations;
- one additional `image_hotspot` step so both explore and assess modes are exercised.

The audit found one gap: `dicom_guided` was registered and used by Scientific Imaging but absent
from the internal showcase. `showcase-dicom-guided` now covers ordered preset, slice-range and
acknowledgement requirements plus the embedded scored checkpoint.

## PRD section 75 coverage

The original 18-item product checklist remains fully represented:

1. Rich text — `rich_text`
2. Scientific image — `image`
3. Zoomable image — `zoomable_image`
4. Hotspot — `image_hotspot` in explore and assess modes
5. Video — `video`
6. Data table — `data_table`
7. Chart — `chart`
8. MCQ — `multiple_choice`
9. Multi-select — `multiple_select`
10. Matching — `match_pairs`
11. Classification — `classification`
12. Ordering — `ordering`
13. Numeric answer — `numeric`
14. Scenario — `scenario`
15. DICOM exploration — `dicom_explore`
16. DICOM target identification — `dicom_identify_region`
17. DICOM measurement — `dicom_measure`
18. Completion/reward — the real activity completion, reward summary and learner-event pipeline

## Additional implemented runtime coverage

- `image_compare`
- `audio`
- `carousel`
- `formula`
- `pdf_reference`
- `true_false`
- `fill_blank`
- `dicom_guided`

## Invariants

- Course visibility remains `internal`; learner-facing catalogues must not expose the fixture.
- Showcase content is validated through the production content loader.
- The real lesson route, activity planner, primitive registry, player and event pipeline are used.
- DICOM steps use the de-identified `thoracic-ct-series` and retain `educationalUseOnly: true`.
- The parity test must fail whenever a registered primitive type has no showcase step.

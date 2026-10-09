# Agent handoff

## Current phase/task

Added a fifth Respiratory Challenge round that reuses the default Imaging Lab scrollable
thoracic CT exploration in `npm run dev:sanofi`.

Phase 13 remains Active and independent. Its human, HTTPS and physical-device gates remain open.

## Done

- Added a `dicom_explore` game mechanic, requirement scoring (including visited CT windows), and a
  Lock in stage around the existing DICOM viewer.
- Authored `thoracic-ct-scroll` and inserted it between histology and the clinical call.
- Registered `thoracic-ct-series` in Sanofi content and copied all 125 slices into
  `public/assets/dicom/thoracic-ct/files`. The Sanofi static release keeps that series.
- Raised the Respiratory Challenge duration window to 120–400 seconds (ADR-116).
- Confirmed in the browser: Round 4 of 5 loaded the 125-slice stack, Lock in enabled after Lung and
  Mediastinal comparison, the round scored 1000, and the result listed five rounds.

## In progress

- Sanofi Playwright against `preview:sanofi` still needs a live run; DICOM is served only from the
  workspace during preview, not packaged in the release.

## Next three steps

1. Run `npm run test:e2e:sanofi` and update visual goldens if Round 1 of 5 / intro layout shifted.
2. Host the Sanofi artifact with a reachable DICOM base URL before an offline PWA rehearsal.
3. Continue HTTPS, physical-device and clinician review gates.

## Blockers/questions for the user

- Hosted Sanofi deployments need DICOM at `/assets/dicom/` or `VITE_DICOM_BASE_URL`.
- The CT round cannot complete while the Sanofi service worker is offline, because the series is
  not precached.
- Default `npm run validate:content` currently fails on unrelated SVG size/hash mismatches in
  `public/content/assets.json` (CRLF vs declared hashes).

## Environment notes

- Workspace: `d:\Projects\AxiomLevelUp`.
- Sanofi dev: http://localhost:5174/ (`npm run dev:sanofi`).
- Browser check used `/play/respiratory-challenge?difficulty=warmup&seed=2020`. Result strip:
  Inspect the CT stack + 1000.
- Focused Vitest for mechanic, scoring, answers, DICOM primitives, scoped-public and the Sanofi
  content bundle passed.

## Gotchas

- The thoracic CT slices must stay in `public/assets/dicom/thoracic-ct/files`. The nested
  `public/public/` tree is not served.
- `initialSlice` on the DICOM viewer is only the mount value. Feeding the live slice back into it
  restarts the study and flashes the loading overlay.
- Do not edit the stray `public/public/` tree.
- `dicom_explore.scored()` stays false so the default Imaging lesson is not a graded question.

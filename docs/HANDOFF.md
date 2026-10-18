# Agent handoff

## Current phase/task

Completed P20-T12, the final clinical-call and result UX follow-up for the Respiratory Challenge.
Phase 20 remains Complete. Phase 13's human, HTTPS and physical-device gates remain open.

## Done

- Marked the breath sample as non-speech and removed its transcript disclosure while preserving
  title/description accessibility.
- Changed the 81 KB breath sample to direct-source automatic preload and added multiple reliable
  ready signals plus the existing retry path.
- Constrained clinical grid tracks, clues and charts so the peak-flow SVG scrolls within its card
  and does not resize the document.
- Added the configured **Back to play** result CTA.
- Added unit, playback, overflow and desktop/phone visual coverage; recorded ADR-117.

## In progress

- None for P20-T12.

## Next three steps

1. Resolve the existing `react-hooks/refs` lint findings in `useDicomViewer.ts` before the next
   full `npm run check`.
2. Host the Sanofi artifact with a reachable DICOM base URL before an offline PWA rehearsal.
3. Continue HTTPS, physical-device and clinician review gates.

## Blockers/questions for the user

- Hosted Sanofi deployments need DICOM at `/assets/dicom/` or `VITE_DICOM_BASE_URL`.
- The CT round cannot complete while the Sanofi service worker is offline, because the series is
  not precached.
- Full repository lint currently reports two pre-existing ref writes during render in
  `src/imaging/viewer/useDicomViewer.ts`; all P20-T12 files pass focused ESLint.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`.
- Sanofi dev: http://127.0.0.1:5174/ (`npm run dev:sanofi`).
- The local breath asset is valid AAC/M4A, 8.46 seconds, mono, and served as `audio/mp4`.
- Typecheck, content validation, focused Vitest/ESLint and the targeted desktop/phone visual run
  pass. The visual spec decodes and starts the actual breath asset.

## Gotchas

- `nonSpeech` is explicit; ordinary speech audio still fails content validation without a
  transcript.
- Keep the peak-flow SVG's `40rem` minimum width inside its `overflow-x-auto` region. The grid and
  clue wrappers need `min-w-0` for that containment to work.
- Do not fold the unrelated game-engine working-tree edits into this task.

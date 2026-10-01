# Agent handoff

## Current phase/task

Phase 1 is complete. Phase 2 — Application surfaces — is next; no Phase 2 implementation has started.

## Done

- Built the React 19/Vite 8 strict-TypeScript PWA shell, Tailwind token system, Radix-based UI foundations and complete route structure.
- Added Zod content contracts, JSON Schema export, runtime/CLI loading, cross-reference validation and seeded content for four courses and twelve lessons.
- Added versioned Zustand state in IndexedDB, derived selectors, the typed learner-event bus, bounded event history and URL-only demo controls.
- Added the web app manifest, generated icons, app/content precaching, online status and a verified DICOM CacheFirst runtime cache.
- Completed the isolated Cornerstone3D spike with a 125-slice de-identified CT stack, desktop/touch bindings, presets, measurement, fullscreen, progress and data preparation/audit scripts.
- Added 19 automated tests across content, persistence, events, selectors and route layouts. `npm run check` passes.

## In progress

- None.

## Next three steps

1. Review and approve the Phase 2 outline in `docs/phases/phase-02-app-surfaces.md`.
2. Map each application-surface field and state to `ContentRegistry`, learner state or a derived selector.
3. Replace placeholder routes incrementally, starting with shared presentation components and Home.

## Blockers/questions for the user

- The DICOM technical note referenced by the PRD is not present.
- Real Android Chrome and iOS Safari DICOM/PWA checks still require an HTTPS host and physical devices.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Node: 24.19.0
- npm: 11.17.0
- Package manager: npm
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Production PWA check: `npm run build`, then `npm run preview`.
- Local DICOM setup and attribution are documented in `public/assets/dicom/spike/README.md`.

## Gotchas

- DICOM binaries are intentionally ignored; the committed manifest and provenance file do not install the local stack.
- The development routes are URL-only and must not be linked from learner navigation.
- Do not import Cornerstone outside the lazy spike module.
- The PWA icon files are excluded from Workbox's glob because vite-plugin-pwa adds manifest icons separately; including both creates conflicting precache entries and breaks service-worker evaluation.
- The DICOM route is a feasibility spike, not the Phase 6 production primitive.
- `npm run format:check` currently reports the repository's existing line-ending/style baseline; the required `npm run check` gate is green.

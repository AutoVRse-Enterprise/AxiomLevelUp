# PRD analysis

## Product thesis

The Learning Runtime is a mobile-first, installable scientific learning PWA for adult pharmaceutical and medical R&D learners. It renders structured course specifications and combines short learning activities with domain-native interactions, immediate feedback, mastery tracking and persistent gamification.

It is not an LMS, authoring tool, Axiom integration, multi-user backend, diagnostic workstation or analytics platform. Phase 1 is entirely static, local and unauthenticated.

## Non-negotiable architecture

- The UI renders configuration; adding course content must not require React changes.
- Scientific artifacts are lesson primitives with explicit completion, scoring and feedback contracts.
- Gamification and mastery are global engines driven by a typed learner-event stream.
- Content is validated before it reaches UI components.
- Substantive progress is persisted in IndexedDB.
- Large features, especially Cornerstone3D, are lazy-loaded.
- Medical assets must be demonstrably de-identified before entering the repository.

## Requirement-to-phase traceability

| PRD area | Delivery phase |
| --- | --- |
| Foundation, schemas, persistence, events, shell | Phase 1 |
| Home, Learn, Pathway, Challenge, Leaderboard, Profile | Phase 2 |
| Lesson progression, renderer, feedback | Phase 3 |
| Standard content, assessment and scenario primitives | Phase 4 |
| XP, levels, stars, streaks, goals, badges, mastery | Phase 5 |
| Educational DICOM modes | Phase 6 |
| Course downloads, install UX and offline assets | Phase 7 |
| Motion, responsive refinement, accessibility, errors | Phase 8 |
| 18-primitive showcase lesson and device QA | Phase 9 |
| Prospect-specific demo course | Phase 10 |

## Phase 1 risks

1. **Cornerstone/mobile feasibility:** touch behavior, WebGL, codecs, memory and iOS Safari need proof before the full DICOM phase.
2. **Offline storage limits:** a useful CT stack can exceed mobile cache quotas. The spike uses a curated subset and records total size.
3. **Schema drift:** prematurely strict schemas can block future primitives. Phase 1 strictly types only rich text, image and multiple choice while preserving warnings for unknown types.
4. **Derived-state inconsistency:** level, rank and course completion are selectors rather than persisted values.
5. **PWA false confidence:** browser install/offline behavior differs by platform. Desktop checks are automated where possible; real-device checks remain explicit.

## Open inputs

- The PRD references an attached DICOM technical note, but that document is not in this repository. Add it under `docs/reference/` if available.
- A public, de-identified DICOM series and its license/provenance must be selected before the spike can be declared complete.
- A permanent HTTPS preview host has not been selected. A secure tunnel or preview deployment is required for real-device PWA testing.
- iOS Safari does not expose Chromium's `beforeinstallprompt`; custom installation guidance belongs to Phase 7.

## Out of scope for Phase 1

Finished learner surfaces, lesson playback, standard primitive interactions, full gamification/mastery logic, production DICOM learning modes, arbitrary course downloads, polished celebrations, backend services and real organization data.

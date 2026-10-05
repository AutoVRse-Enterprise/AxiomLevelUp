# PRD analysis

This document began as the Phase 1 implementation analysis. The original risks remain useful
historical context; the current product and testing entry point is `README.md`.

## Product thesis

The Learning Runtime is a mobile-first, installable scientific learning PWA for adult pharmaceutical and medical R&D learners. It renders structured course specifications and combines short learning activities with domain-native interactions, immediate feedback, mastery tracking and persistent gamification.

It is not an LMS, authoring tool, Axiom integration, multi-user backend, diagnostic workstation or analytics platform. Phase 1 is entirely static, local and unauthenticated.

## Current implementation

Phases 1–8 and 10–12 are complete. Phase 9 remains open for physical-device evidence, while Phase
13 has completed implementation and local automated regression coverage but remains open for human
usability, hosted HTTPS/DICOM preflight and physical-device approval.

The runtime currently validates five courses, thirteen lessons, four Case Lab cases, one anatomy
map and 29 strict primitive contracts. Case Lab is now the flagship end-to-end experience: mission,
continuous patient timeline, 3D reconstruction, clue review, differential checkpoints, evidence
citation, conclusion, prioritized results and Model answer comparison.

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
| 27 showcase-compatible primitives and physical-device QA | Phase 9 |
| Reusable Case Lab contracts, player and 3D anatomy | Phase 10 |
| Golden-case hardening and browser evidence | Phase 11 |
| Multi-tier case depth, offline packages and product tour | Phase 12 |
| Guided Case Lab flow, demo profiles and client-readiness gates | Phase 13 |

## Original Phase 1 risks

1. **Cornerstone/mobile feasibility:** touch behavior, WebGL, codecs, memory and iOS Safari need proof before the full DICOM phase.
2. **Offline storage limits:** a useful CT stack can exceed mobile cache quotas. The spike uses a curated subset and records total size.
3. **Schema drift:** prematurely strict schemas can block future primitives. Phase 1 strictly types only rich text, image and multiple choice while preserving warnings for unknown types.
4. **Derived-state inconsistency:** level, rank and course completion are selectors rather than persisted values.
5. **PWA false confidence:** browser install/offline behavior differs by platform. Desktop checks are automated where possible; real-device checks remain explicit.

## Current open inputs

- A permanent HTTPS preview host and production DICOM origin have not been selected.
- Five qualifying unaided Case Lab usability sessions have not been run.
- Physical Android Chrome and iPhone Safari/installed-app evidence remains outstanding.
- The user has not approved a desktop-only-demo waiver.
- Clinical, anatomy/pathology, legal and regulatory approval remain outside the current engineering
  evidence.

## Original Phase 1 exclusions

Finished learner surfaces, lesson playback, standard primitive interactions, full
gamification/mastery logic, production DICOM learning modes, arbitrary course downloads and
polished celebrations were out of scope for Phase 1 and were implemented in later phases. Backend
services and real organization data remain out of scope.

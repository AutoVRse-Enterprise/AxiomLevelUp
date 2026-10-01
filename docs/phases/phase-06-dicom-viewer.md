# Phase 6: DICOM learning viewer

**Status:** Complete

## Goal

Turn the four deferred DICOM types into strict, configuration-driven learning primitives backed by
a lazy Cornerstone3D viewer. Phase 6 ends when learners can explore a curated study, follow guided
inspection steps, identify a region and submit a calibrated measurement in desktop Chrome and
mobile emulation.

## Scope

- Strict schemas and semantic validation for `dicom_explore`, `dicom_guided`,
  `dicom_identify_region` and `dicom_measure`.
- Externally hosted, curated DICOM series resolved through a configurable base URL.
- A production imaging boundary that is the only importer of Cornerstone packages.
- Slice navigation, zoom, pan, window/level, configured presets, fit/reset and immersive mode.
- Progressive loading, bounded memory, recoverable loading errors and resource cleanup.
- Configuration-driven exploration, ordered guidance, region grading and calibrated measurement.
- Typed DICOM learner events routed through the existing player and event pipeline.
- Review-mode annotation reveal controlled by the shared reveal policy.
- Runtime-showcase and scientific-imaging fixtures covering the DICOM learning modes.
- Out of scope: PACS/DICOMweb, OHIF, diagnostic use, multiple-series browsing, volume rendering,
  fusion, reporting and arbitrary large studies.

### Resolved product decisions

- Slice numbers in content are one-based and inclusive.
- Regions and lines use normalized image coordinates.
- Named window presets are authored in primitive content.
- Graded measurement requires calibrated metadata and authoritative physical units.
- The initial teaching targets use unambiguous normal anatomy, are educational-only and require
  later subject-matter-expert review.
- DICOM binaries remain outside Git and are served from a configurable external host.
- Physical Android Chrome and iOS Safari testing is deferred to Phase 9; Phase 6 closes on desktop
  Chrome and mobile emulation with the deviation recorded.

## Checklist

- [x] P6-T00 — Formalize scope, architecture, decisions, task sequence and PRD traceability.
- [x] P6-T01 — Add the series manifest, external-host resolver, verification and CORS pipeline.
- [x] P6-T02 — Author and document calibrated normal-anatomy teaching targets.
- [x] P6-T03 — Add strict DICOM primitive and asset schemas with semantic validation.
- [x] P6-T04 — Add pure imaging geometry, requirements, evaluation and primitive definitions.
- [x] P6-T05 — Add typed DICOM interactions, events and product configuration.
- [x] P6-T06 — Add the production Cornerstone adapter and progressive stack controller.
- [x] P6-T07 — Add the shared responsive and immersive DICOM viewer shell.
- [x] P6-T08 — Implement explore and guided inspection primitives.
- [x] P6-T09 — Implement slice-aware region identification.
- [x] P6-T10 — Implement calibrated length measurement.
- [x] P6-T11 — Integrate DICOM with player layout, resume, failure and production planning.
- [x] P6-T12 — Migrate scientific-imaging and runtime-showcase content.
- [x] P6-T13 — Replace the isolated spike route with the production DICOM sandbox.
- [x] P6-T14 — Add schema, domain, component, player and import-boundary coverage.
- [x] P6-T15 — Run responsive, interaction, cross-origin, offline, memory and bundle QA.
- [x] P6-T16 — Run the final gate, record ADRs and close Phase 6 documentation.

## Rules

- Course content owns series references, tools, presets, target regions, expected measurements and
  tolerances. Components contain no course-specific coordinates or values.
- Primitive components report callbacks only. The player maps interactions into learner events.
- Cornerstone imports are confined to `src/imaging/cornerstone` and remain behind dynamic imports.
- Hosted and configured series metadata must agree before a graded activity starts.
- A non-physical or unsupported measurement unit is unavailable, not an incorrect learner answer.
- Imaging resources and listeners are released when the primitive unmounts.
- DICOM responses are not application-precache entries. Phase 7 owns explicit course downloads.
- DICOM assets are educational and de-identified; the viewer is not for diagnosis.

## PRD traceability

- Sections 18–20 and 57–59: P6-T01, P6-T03, P6-T06, P6-T07
- Sections 21.1–21.2: P6-T04, P6-T08
- Sections 21.3–21.4: P6-T04, P6-T09
- Sections 21.5–21.6: P6-T04, P6-T10
- Sections 22–24 and 78: P6-T01, P6-T02, P6-T03
- Sections 55 and 71–73: P6-T01, P6-T06, P6-T07, P6-T15
- Sections 69–70: P6-T07, P6-T15
- Sections 75, 79–81: P6-T05, P6-T11, P6-T12, P6-T14
- Section 82: P6-T15, with physical-device checks deferred to Phase 9

## Exit criteria

- All four DICOM types are strictly validated and playable in production without course-specific
  React changes.
- Learners can load a study; navigate by wheel, touch, slider and keyboard; zoom; pan; window;
  choose a preset; fit/reset; identify a region; and submit one calibrated measurement.
- Explore requirements, ordered guidance, grading, retries and annotation reveal are deterministic
  and covered by tests.
- DICOM interactions emit typed events. XP, mastery and primitive rewards continue to flow only
  through the central pipeline.
- Cornerstone is absent from the entry chunk and imported only by the production imaging adapter.
- The external-host verifier passes, cross-origin loading works and missing studies are recoverable.
- Responsive desktop/mobile-emulation QA, memory observation, offline reload and bundle comparison
  are recorded in `docs/qa/phase-06-browser-qa.md`.
- `npm run check` passes and phase documentation is current.

## Deviations

- Physical Android Chrome and iOS Safari checks are deferred to Phase 9 because no HTTPS device
  session is available during Phase 6.

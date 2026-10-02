# Phase 9: Showcase and device QA

**Status:** In progress — agent-executable work active; physical-device gate pending

## Goal

Turn the internal runtime showcase into the durable release fixture for every implemented primitive,
then collect enough automated, emulated-browser and physical-device evidence to approve the runtime
for prospect-specific course work. Phase 9 ends only when the showcase stays in parity with the
primitive registry and the Android/iOS matrix is completed or explicitly waived.

## Scope

- One internal lesson that covers all registered primitive types and any materially different mode
  needed for runtime QA.
- A complete real-player flow through feedback, retries, completion, rewards and learner events.
- Automated parity checks between primitive types, definitions, lazy components and showcase
  content.
- Production-preview browser QA for the showcase at target viewport, motion and connectivity modes.
- Cross-origin DICOM verification, visited-series offline reload and timing/cache evidence.
- Executable Android Chrome and iOS Safari/installed-app scripts with a consistent evidence record.
- Physical touch, installation, haptic, memory-pressure and mobile-browser validation.
- Out of scope: prospect-specific Sanofi content, clinical claims and diagnostic validation.

## Execution boundary

### Agent-executable

- Content, schema and registry audits.
- Showcase additions and automated completion coverage.
- Desktop Chromium and mobile/tablet emulation.
- Local production preview, cross-origin DICOM, service-worker and offline-cache checks.
- Performance measurements, defect fixes, documentation and release evidence templates.

### Requires user or device-lab participation

- HTTPS deployment and production DICOM host confirmation.
- Physical Android Chrome and iOS Safari/installed-PWA runs.
- Real touch gestures, vibration, safe areas, orientation transitions, browser lifecycle and memory
  pressure.
- Screenshots/recordings from both devices and device-specific console logs.
- SME approval of the educational region and 17.6 mm reference before customer or clinical use.

## Checklist

- [x] P9-T00 — Formalize Phase 9 scope, PRD traceability, acceptance gates and terminology.
- [ ] P9-T01 — Audit the showcase against every registered primitive and PRD category.
- [ ] P9-T02 — Add automated showcase exhaustiveness and complete-flow coverage.
- [ ] P9-T03 — Run showcase browser QA across viewports, motion, keyboard semantics and failures.
- [ ] P9-T04 — Verify cross-origin DICOM, offline revisit, cache behavior and performance evidence.
- [ ] P9-T05 — Prepare Android/iOS execution scripts, evidence templates and hosting prerequisites.
- [ ] P9-T06 — Run the final agent gate and update architecture, decisions, roadmap and handoff.
- [ ] P9-M01 — Execute the physical Android Chrome matrix.
- [ ] P9-M02 — Execute the physical iOS Safari and installed-app matrix.
- [ ] P9-M03 — Triage device findings, rerun affected checks and approve or explicitly waive release.

## Rules

- The canonical showcase requirement is parity with the implemented primitive registry. The PRD's
  18-item list remains the minimum product-category trace, not a frozen implementation count.
- The showcase remains internal content and must run through the same schemas, registry, player,
  event pipeline and reward presentation as ordinary configured lessons.
- Automated tests may substitute a deterministic unavailable-viewer boundary for Cornerstone, but
  browser and physical checks use the real viewer and de-identified 125-slice study.
- Physical-device results must record device, OS/browser, network state, build, timing and evidence.
- No device-only defect is closed from emulation evidence alone.
- DICOM content remains educational-only and contains no diagnostic claim.

## PRD traceability

- Sections 5 and 75: P9-T01, P9-T02, P9-T03.
- Sections 70–73: P9-T03, P9-T04, P9-M01, P9-M02.
- Sections 76–79: P9-T01, P9-T02, P9-T06.
- Sections 81–84: P9-T03 through P9-M03.

## Exit criteria

- Every registered primitive type appears in the internal showcase, and intentional duplicate modes
  are documented.
- The real showcase lesson completes in order and verifies feedback, retry, completion, reward and
  typed event behavior.
- Production-preview browser QA passes the target viewport, reduced-motion, keyboard, error and
  offline matrix without document overflow.
- Cross-origin DICOM verifies all 125 instances and a visited series reloads offline.
- Android Chrome and iOS Safari/installed-app evidence satisfies
  `docs/qa/phase-09-device-checklist.md`, with defects fixed or explicitly accepted.
- `npm run check` passes and Phase 9 evidence, decisions, roadmap and handoff are current.

## Known external gates

- A production HTTPS app URL and CORS-capable DICOM host are not yet supplied.
- Physical Android and iOS devices or an approved remote-device service are not connected.
- The DICOM technical note remains unavailable.
- The educational tracheal target and measurement reference still require SME approval.

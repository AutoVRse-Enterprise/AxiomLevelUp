# Phase 7: Complete PWA/offline

**Status:** In progress

## Goal

Make configured courses deliberately downloadable, verifiable, removable and playable without a
network connection. Phase 7 ends when the application shell, selected course content and the
Scientific Imaging DICOM study survive an offline reload with clear install, update, quota,
integrity and recovery UX.

## Scope

- Asset-manifest integrity and offline-availability metadata.
- Pure course-package derivation from validated content references.
- Device-scoped offline download metadata, quota checks and persistent-storage requests.
- Explicit foreground downloads with byte progress, bounded concurrency, pause, resume and cancel.
- SHA-256 verification before assets enter the verified course cache.
- Shared-asset-aware removal, startup reconciliation, eviction repair and version invalidation.
- An inject-manifest service worker with app precache, verified course assets, passive DICOM cache,
  media range requests and a service-worker-enforced simulated offline mode.
- Per-course and per-lesson offline status, download controls, gating and storage management.
- Engagement-gated install guidance and service-worker update UX.
- Automated domain, manager, store, route and service-worker-helper coverage plus browser QA.
- Out of scope: Background Fetch, backend-hosted download records, arbitrary large studies,
  automatic downloading of all courses and physical-device testing.

### Resolved product decisions

- Keep the existing expiring `dicom-studies-v1` cache as a best-effort visited-study layer.
- Store explicit verified downloads separately in `offline-courses-v1`; only this cache contributes
  to offline-ready status.
- Verify and promote compatible passive-cache responses instead of fetching them again.
- Derive course packages and lesson readiness from validated content references.
- Reference-count shared URLs when removing a course download.
- Keep download records as device state, separate from learner progress and demo-seed resets.
- Run downloads in the foreground and require the application to remain open.
- Enforce the developer simulated-offline toggle in the service worker.

## Checklist

- [x] P7-T00 — Formalize scope, architecture, decisions, task sequence and PRD traceability.
- [x] P7-T01 — Add the asset-manifest v0.2 offline and integrity contract.
- [x] P7-T02 — Add asset hashing and local manifest verification tooling.
- [x] P7-T03 — Add pure course-package, readiness, size and fingerprint derivation.
- [x] P7-T04 — Add device-scoped offline state, learner migration and product configuration.
- [x] P7-T05 — Add cache, storage, hashing and fetch platform adapters.
- [x] P7-T06 — Add the verified course download manager and reconciliation.
- [x] P7-T07 — Add typed course-download lifecycle events.
- [x] P7-T08 — Replace generated service-worker routing with an inject-manifest worker.
- [x] P7-T09 — Add real and simulated connectivity state.
- [ ] P7-T10 — Add course, catalog and lesson offline download status controls.
- [ ] P7-T11 — Gate unavailable lessons and challenges while offline.
- [ ] P7-T12 — Add profile storage and download management.
- [ ] P7-T13 — Add engagement-gated install and service-worker update prompts.
- [ ] P7-T14 — Add schema, domain, manager, store, component, route and worker coverage.
- [ ] P7-T15 — Run install, download, offline, removal, eviction, update and responsive browser QA.
- [ ] P7-T16 — Run the final gate, record ADRs and close Phase 7 documentation.

## Rules

- Primitives remain callback-only and contain no cache, download or connectivity logic.
- Only size- and SHA-256-verified bytes enter `offline-courses-v1`.
- Offline readiness is derived from current validated content and verified cache state.
- Download events are informational and never award XP or mutate gamification.
- DICOM binaries stay outside Git and the application precache.
- Removal must retain URLs referenced by another available course download.
- Every quota, integrity, network and eviction failure presents a recovery action.
- Install prompts appear only after configured learner engagement and respect dismissal cooldowns.

## PRD traceability

- Sections 44–45: P7-T04, P7-T09, P7-T12
- Section 51: P7-T01, P7-T02, P7-T03
- Sections 52–53: P7-T03, P7-T06, P7-T08, P7-T10, P7-T11
- Section 54: P7-T09, P7-T10, P7-T11
- Section 55: P7-T01, P7-T03, P7-T06, P7-T08, P7-T15
- Section 56: P7-T13
- Section 73: P7-T06, P7-T10, P7-T11, P7-T12
- Section 81: P7-T13, P7-T15
- Section 82: P7-T15, with physical-device checks deferred to Phase 9

## Exit criteria

- Scientific Imaging reports an estimated size and can be downloaded with progress, verified,
  resumed, repaired, updated and removed.
- After download, every course lesson including all DICOM modes plays after an offline hard reload.
- Undownloaded required content is gated with a clear connection or offline-course recovery path.
- Shared assets are deduplicated, removals are reference-safe and browser eviction is detected.
- Quota, integrity, network and cache failures are recoverable and covered by tests.
- The application is installable, can apply a waiting service-worker update and supports the
  service-worker-enforced demo offline mode.
- `npm run check` passes and Phase 7 browser QA and documentation are current.

## Planned deviations

- Physical Android Chrome and iOS Safari install/offline checks remain Phase 9 work.
- Downloads require the application to stay open; Background Fetch is not used.
- If browser automation cannot impose a storage quota, quota paths are verified with injected test
  adapters.

# Architecture decision records

## ADR-001: Application stack

**Status:** Accepted

**Context:** The runtime is a static, installable React application with validated local content and persistent learner state.

**Decision:** Use React, strict TypeScript, Vite, React Router, Zustand, Zod 4, idb-keyval, vite-plugin-pwa/Workbox, Vitest and Testing Library. Use npm. The local Node 24 toolchain is newer than the plan's minimum and is supported by the selected packages.

**Consequences:** The deployment is static and backend-free. Package APIs are locked through the npm lockfile.

## ADR-002: Styling and accessible primitives

**Status:** Accepted

**Decision:** Use Tailwind CSS 4 with CSS-variable tokens via `@theme`, Radix Dialog for the sheet primitive, Lucide icons and locally bundled Inter Variable.

**Consequences:** Tokens remain usable in CSS and utilities; interactive foundations are accessible and work offline.

## ADR-003: Runtime content delivery

**Status:** Accepted

**Decision:** Fetch JSON documents under `public/content/`, validate them with Zod and expose an immutable indexed registry.

**Consequences:** New courses require content changes only and mirror the future Axiom contract.

## ADR-004: Learner persistence

**Status:** Accepted

**Decision:** Use Zustand persistence with a custom idb-keyval adapter, a state version and migrations. Store tiny preferences in localStorage. Derive level, rank and completion.

**Consequences:** Reloads retain meaningful state without creating duplicate sources of truth.

## ADR-005: DICOM engine

**Status:** Accepted

**Decision:** Use Cornerstone3D core, tools and DICOM image loader. Do not use OHIF, PACS or DICOMweb. Lazy-load the entire spike.

**Consequences:** The learning UI remains custom and the normal shell avoids the imaging bundle cost.

## ADR-006: DICOM assets in Git

**Status:** Accepted

**Decision:** Ignore DICOM binaries initially. Commit only preparation/audit scripts, manifest metadata and provenance.

**Consequences:** The repository remains safe and small. A verified local dataset is required to exercise the spike; Git LFS will be reconsidered in Phase 6.

## ADR-007: Primitive registry

**Status:** Accepted

**Decision:** Maintain one canonical set of primitive type IDs. Strictly type the Phase 1 primitives and allow record-shaped content for registered future types.

**Consequences:** Future content can be represented without pretending unimplemented behavior is already validated.

## ADR-008: DICOM caching and memory boundary

**Status:** Accepted

**Context:** The 125-slice spike is approximately 66 MB, while Cornerstone's default in-memory cache is too large for the mobile target and DICOM binaries should not inflate the application precache.

**Decision:** Keep DICOM files out of Workbox precache, cache successful `/assets/dicom/` responses in a dedicated CacheFirst cache capped at 180 entries for 30 days, and cap Cornerstone's in-memory cache at 256 MiB. Exclude manifest-declared PWA icons from the precache glob because vite-plugin-pwa adds those entries separately.

**Consequences:** A visited study can reload offline without delaying service-worker installation on the full dataset. Phase 7 must add explicit download, quota and eviction UX before multiple studies are supported.

## ADR-009: Effective learning availability is derived

**Status:** Accepted

**Context:** Seed files contain display states, but prerequisite completion is the authoritative reason that an activity can be entered.

**Decision:** Treat persisted `completed`, `current` and `new` lesson states as explicit. Derive `available` and `locked` from lesson and course prerequisite completion, including human-readable unmet prerequisite names.

**Consequences:** Surface lock states cannot drift from the configured graph. Phase 5 progression can update completion without duplicating unlock decisions throughout the UI.

## ADR-010: Demo seed dates are reference-relative

**Status:** Accepted

**Context:** Fixed activity dates make the established demo account appear stale after the seed was authored.

**Decision:** Every seed declares a `referenceDate`. When a seed is first applied or reset, shift its activity dates by the whole-day difference from an injectable application clock. Persisted progress then ages normally.

**Consequences:** Resetting the demo always produces current-week activity while tests remain deterministic. Existing persisted learner state is retained by the version 2 migration.

## ADR-011: Surface navigation emits learner intent

**Status:** Accepted

**Decision:** Add `pathway_opened` and `challenge_opened` to the typed learner event taxonomy. Course details continue to emit `course_opened`; surfaces never invoke gamification mutations directly.

**Consequences:** Future analytics and engines can observe discovery behavior without coupling routes to those systems.

## ADR-012: Product presentation limits are configured

**Status:** Accepted

**Decision:** Store week start, revision mastery threshold/count, leaderboard window and recent-achievement count in the app configuration `product` block.

**Consequences:** Surface behavior can be tuned for a deployment without editing React. Generic interface labels remain presentation copy.

## ADR-013: Activity sessions are separate and resumable

**Status:** Accepted

**Decision:** Persist one versioned active activity session under a separate IndexedDB key. Match it
by activity kind, ID and course version; invalidate mismatches and clear it after completion or demo
reseed.

**Consequences:** Reloads can resume exact interaction state without turning transient responses into
aggregate learner state.

## ADR-014: First attempts determine learning scores

**Status:** Accepted

**Decision:** Weight assessment score by configured `scoring.weight` and count correctness only on
the first attempt. Retries remain learning opportunities. Activities without assessments score 100,
and lifetime question statistics count first attempts only.

**Consequences:** Retry behavior cannot inflate scores while content-only lessons can complete
normally.

## ADR-015: Primitive components report; the player decides

**Status:** Accepted

**Decision:** Primitive components receive configuration and callbacks only. Pure evaluators determine
results, the activity player applies completion policy and emits typed learner events, and engines
subscribe to those events.

**Consequences:** Primitives stay reusable and cannot directly mutate progress or gamification.

## ADR-016: Unsupported primitives fail gracefully

**Status:** Accepted

**Decision:** Development plans retain unsupported steps and render an explicit fallback. Production
plans skip unsupported steps. An activity with no supported steps reports unavailable instead of
completing silently.

**Consequences:** Partially implemented courses remain demonstrable without masking activities that
cannot actually run.

## ADR-017: Primitive behavior contracts are typed and extensible

**Status:** Accepted

**Decision:** Type known completion modes, scoring fields and feedback controls in Zod while retaining
loose-object compatibility for registered future primitive fields and unknown completion modes.
Player retry limits and defaults live in app configuration.

**Consequences:** Phase 3 behavior is validated before rendering without blocking Phase 4 and Phase 6
contracts from evolving.

# Architecture

## Layers

```text
public/content JSON
        |
        v
content loader + strict Zod/semantic validation
        |
        v
read-only ContentRegistry -----> routes -----> activity plan
        |                                        |
        |                               pure primitive definitions
        |                               (support/family/layout/scoring/
        |                                review/completion/evaluation)
        |                                        |
        |                                        v
        +----> pure view selectors <----- activity/case player + session v5
                        ^                  /                   \
                        |                 v                     v
          learner state + clock   lazy primitive UI      typed event bus
                        ^                                  /       |       \
                        |                                 v        v        v
                    IndexedDB                    event history  effects  ordered pipeline
                                                                subscriber       |
                                                                      +-----------+-----------+
                                                                      v           v           v
                                                                  progress  gamification  mastery
                                                                      +-----------+-----------+
                                                                                  |
                                                                                  v
                                                                          learner store v7
```

## Boundaries

- `src/content`: contracts, parsing, validation, references and immutable registry.
- `src/app`: providers, startup and routing.
- `src/routes`, `src/layouts`, `src/components`: presentation and user intent.
- `src/events`: framework-independent event taxonomy and transport.
- `src/engines/learning`: pure activity planning, session v5, completion, scoring and event
  reduction.
- `src/engines/gamification`: pure XP, stars, levels, calendar, challenge and achievement rules.
- `src/engines/mastery`: pure deterministic concept-score updates and bounded history.
- `src/engines/cases`: pure case planning, clue resolution and composite scoring.
- `src/engines/pipeline.ts`: ordered learner-event reduction and one aggregate state result.
- `src/player`: activity lifecycle orchestration, draft persistence, timers, review/reveal and
  shared player presentation; `src/player/case` composes the staged case shell.
- `src/primitives/definitions`: React-free source of truth for implemented support, family, scoring,
  layout, review prompts, exploration keys and evaluation.
- `src/primitives/components` and `src/primitives/componentRegistry.ts`: callback-only primitive UI
  loaded through per-type lazy imports.
- `src/primitives/shared`: reusable artifact overlay, image geometry, shuffle and review
  infrastructure.
- `src/state`: persisted learner state, reference-date rebasing and pure derived view selectors.
- `src/lib/clock.ts`: the injectable source of current date/time for deterministic calendar views.
- `src/offline`: pure course/case packages and readiness, verified download orchestration, platform
  adapters and the device-scoped offline library.
- `src/pwa`: custom service worker, request/cache policy, registration, install/update UX and real
  plus simulated connectivity state.
- `src/anatomy3d`: lazy Three.js anatomy controller, model cache and accessible viewer boundary.
- `src/design/motion`: lazy Motion boundary, resolved motion preference and shared transitions.
- `src/effects`: event-subscribed presentation effects such as throttled haptics and lazy confetti.
- `src/spikes`: isolated technical experiments; production code must not depend on these.

## Content loading

The app fetches `public/content/manifest.json`, resolves the app configuration, courses, cases,
anatomy maps, learner seed and asset manifest, validates every document, then performs
cross-reference and per-primitive semantic checks. Lesson primitives, challenge items, case clues
and case-stage steps use the same strict parser. Typed asset references verify manifest existence
and media type; scenario graphs, formula syntax, case references, anatomy hierarchy and waypoint
graphs receive content-layer validation. UI receives a read-only registry indexed by identifier,
plus learner-visible catalogue projections. Parse failures include source file and JSON path.

Production startup performs fetching and the complete validation pipeline in a module worker, then
structured-clones the validated registry and its identifier maps to the main thread. The provider
continues to gate all routes on successful validation and reconstructs typed validation errors for
the eager error screen. Worker scripts and content JSON are precached, preserving the same offline
startup contract; environments without Worker support retain the direct asynchronous loader.

## State and events

Components emit typed learner input events. One subscriber queues and reduces them through learning
progress, case progress, gamification and mastery, commits one learner-state v7 snapshot and
publishes informational reward events. The event-history subscriber records a bounded audit trail.
Output events are not reduced again. Persisted reward ledgers make lesson, case, perfect, daily and
badge awards idempotent.
Level, leaderboard rank, badge progress, displayed streak and aggregate course progress remain
derived.

Local-calendar helpers use the injectable clock and configured week start for streaks, weekly goals,
weekly XP and challenge periods. Badge and weekly-challenge criteria are validated with content.
Leaderboard rows carry optional monthly and lifetime snapshots; absent historical fields fall back
to weekly values, while the current learner always uses live weekly and total XP. A pure
period-aware selector derives ranking windows. Weekly challenge cards use a pure criterion resolver
to select the next unlocked, incomplete matching lesson or case, with collection-route fallbacks
when a criterion has no specific safe destination.
Mastery applies configured weighted gains/losses to first-attempt fractional scores and keeps
bounded per-concept history. Case questions update mastery but do not award per-question XP; case
completion awards configured XP and stores bounded per-case attempt history. Badge and level
transitions enter a persisted celebration queue.

Application surfaces consume view models from `src/state/selectors/`. Effective lesson availability
is derived from prerequisites, and route components do not duplicate progression logic. Demo seed
dates are shifted from their declared `referenceDate` when the seed is applied; persisted state then
ages normally.

Device presentation preferences are persisted separately from learner state. `MotionProvider`
resolves the stored System, Reduced or Full choice against the browser media query and applies the
same result to Motion and CSS through `html[data-motion]`. Haptics, confetti and live announcements
subscribe to typed learner events; primitives never call device or reward effects directly.
Lesson, challenge and case completion surfaces share compact outcome metrics for stars, awarded XP,
mastery change and badge outcome. Saved case attempts explicitly report unavailable outcome facts
that were not persisted rather than reconstructing them.

## Activity and case execution

Routes adapt a configured lesson or challenge into an immutable activity plan. Planning first parses
the strict primitive contract, then resolves its pure definition and derives support, family, scoring,
layout, prompt, exploration keys and timer compatibility. The player advances a pure reducer and
persists one version 4 activity session separately from aggregate learner state. Session progress
stores resumable drafts, first/latest fractional scores, distinct interactions and monotonic media
coverage; first-attempt scores remain authoritative.

The player lazy-renders callback-only primitive components, debounces drafts, applies completion
rules, owns per-attempt timers and renders submitted work read-only before feedback. It re-runs the
pure evaluator for review and applies the configured reveal policy. Primitive interactions are
translated into typed learner events; the learning progress engine updates lesson, course, challenge
and lifetime aggregates. Navigation away from an active session is blocked until the learner
confirms the saved exit.

A case document compiles to a flattened `case` activity plan with stage boundaries and resolved
case-scoped findings. `CasePlayer` uses ActivityPlayer extension points for stage chrome, atomic clue
presentation, focus-trapped boundary transitions, active timing and completion. Session v5 persists
opened clues with first-open context, independently reviewed clue IDs, local evidence/differential
state, step and case elapsed time and clock expiry. Blocking stage and phone clue/notes dialogs pause
both question and case clocks; countdown expiry does not truncate actual elapsed duration. Primitive
definitions own timeout-credit policy: `anatomy_locate` evaluates committed levels on expiry while
retaining timed-out state and zero step speed. Only resolved scored steps enter attempt timing,
component/speed denominators, persisted step results and comparison.

The pure case scorer combines first-attempt anatomy and diagnosis scores with independent time-only
step and case speed, then applies only eligible pre-response optional-clue cost. Step speed includes
only first attempts meeting the configured score threshold. Learner-state result-v7 attempts persist
effective weights, speed eligibility and counts, both speed components, timing/timeout-credit
semantics, normalized responses, reviewed clues, local evidence/differential state, actual duration
and the XP awarded by the central pipeline. Legacy result-v5/v6 attempts remain readable without
fabricated detail. Results explain points out of 100; comparison uses authored labels, normalized
response equality, expert path/evidence/diagnosis teaching and de-duplicated attempt history.

Case benchmark validation is deterministic: authored benchmark responses are evaluated against
the configured primitives, explicit per-scored-step elapsed/timeout facts are passed to the same
pure case scorer used by the player, and mismatched authored component breakdowns fail content
loading. Case semantics also reject empty stages, unconsumed orient entry modes and clues with no
stage, step, finding or teaching reference.

Development plans preserve unsupported steps for diagnosis. Production plans include all 27
implemented primitive types, including the four DICOM modes, while retaining the fallback for
unknown or malformed primitives. An activity with no implemented steps is unavailable. The player
emits results only; the central pipeline awards XP, stars and mastery without primitive or
learning-engine coupling.

Loading, empty and failure presentation uses shared contracts. Artifact errors report intent to the
player, which owns retry, continue or skip behavior. Content, route, offline and quota failures
offer recovery actions at their owning boundary rather than mutating progress inside presentation
components.

## Delivery and presentation runtime

Learner, player and developer pages are route-level lazy modules with a designed route fallback.
Motion uses `LazyMotion` with `domAnimation`; optional confetti is a separate dynamic chunk.
Production builds are checked against role-based gzip budgets for the entry, imaging controller,
anatomy controller and confetti chunks.

The application shell renders bottom navigation below the large breakpoint and header navigation
at desktop widths. Route transitions restore scroll and focus the page heading, while skip links
bypass shell navigation. DICOM uses a persistent instructions pane on desktop. Video, hotspot,
compare and DICOM artifacts use the Fullscreen API where available and a fixed safe-area-aware
fallback otherwise.

## DICOM imaging boundary

Strict DICOM primitive content resolves a validated series asset. The shared viewer dynamically
imports `src/imaging/cornerstone/createController.ts`, the only production module permitted to
import Cornerstone packages. Per-instance controllers load externally hosted static Part-10 files
through `wadouri:` image IDs, prefetch nearby slices first, cap the global image cache and release
series resources after the last viewer unmounts. Pure geometry, requirement and evaluation modules
remain independent from Cornerstone and React.

The external manifest v0.2 supplies immutable file paths, byte sizes, SHA-256 hashes, geometry and
attribution. Runtime loading compares its geometry with the already validated asset manifest before
rendering. `VITE_DICOM_BASE_URL` selects the host; the service worker keeps visited responses in a
separate runtime cache rather than the application precache.

Explore and guided primitives reduce configured observations into requirement keys. Identify-region
and measurement primitives keep normalized drafts and delegate fractional grading to pure
evaluators. All components report typed slice, window, tool, region, measurement, requirement and
viewer-lifecycle interactions to the player. The central event pipeline remains the only owner of
XP, mastery and the first-DICOM reward.

## 3D anatomy boundary

Strict anatomy primitives resolve a validated anatomy map and a hash-versioned GLB model asset. The
shared viewer dynamically imports `src/anatomy3d/three/createAnatomyController.ts`, the only
production module permitted to import Three.js. Per-instance controllers reuse a
reference-counted model cache, cap device pixel ratio, support orbit/pan/zoom and raycast picking,
and release scenes and renderer resources after the last viewer unmounts.

Anatomy maps keep the runtime organ-agnostic: ordered hierarchy levels bind structures to prepared
mesh names, while an acyclic waypoint graph drives reversible authored endoscopic travel. Picking
considers only the active level and resolves overlapping hits by hierarchy depth, binding
specificity and stable ID. Case-scoped finding contracts configure narrowing, occlusion, wall and
region geometry through a typed context; findings may be anchored to a structure or directed
waypoint edge and can be required exploration observations.

`anatomy_explore` records configured structures, waypoints and finding inspections;
`anatomy_locate` combines model, image-region and choice levels into weighted fractional credit. A
secondary structured button list provides equivalent keyboard selection, and reduced motion uses
camera cuts. Viewer interactions are emitted as typed learner events; primitives do not mutate case
or reward state. The endoscopic lumen and findings are illustrative authored geometry, not
patient-derived or anatomically validated reconstruction.

## Case evidence workspace

Case notes consume typed clue-review and anatomy interactions above primitives rather than mutating
the 3D viewer or scoring engine. The active session owns reviewed-clue eligibility, pinned clue and
finding references, the latest anatomy waypoint or structure and authored differential confidence.
Finding inspection is derived from persisted primitive interaction keys; location display resolves
the active case's anatomy-map labels and never falls back to raw IDs.

The existing Case Lab right rail hosts Clues and Notes tabs on desktop without pausing either clock.
At mobile widths the bottom bar exposes separate Clues and Notes actions into the same
safe-area-aware sheet, and either sheet pauses case and step timing. Pin and hypothesis transitions
emit typed learner events but remain reflective and unscored. Completion copies the session-v5
workspace into result-v7 without reconstructing unavailable legacy evidence.

## Case teaching and debrief

Case debriefs use authored `keyEvidence` references to clues or configured findings. Each entry
explains why the evidence mattered and links to one or more affected case tasks. Results resolve
those references to learner-facing labels, show review or inspection status and reopen evidence in
an accessible read-only remediation sheet. Clues reuse the shared clue content renderer without
opening penalties or progress mutations; findings render their configured label and description.

Expert comparison is also configuration-driven. An ordered authored path explains the approach,
weighted evidence marks each clue or finding as decisive, supporting or context, and diagnosis
rationale explains the final synthesis. Result-v7 supplies reviewed clues, persisted evidence and
differential ratings to both live and saved routes. Legacy result-v5/v6 attempts remain readable
and display unavailable review state rather than fabricating it. Presentation resolves all
references to labels and uses local comparison anchors without rendering raw IDs.

## Offline runtime

Asset-manifest v0.2 declares exact sizes, offline availability and non-DICOM hashes. GLB models
remain `offlineRequired: false` but may explicitly opt into package downloads. Pure package
derivation walks course images and lesson primitives or a case's anatomy model, patient image,
clue primitives and stage primitives. It deduplicates exact asset IDs, hashes and sizes, versions
model URLs with the validated hash and produces package fingerprints and total bytes. Download
records are kind-aware, device-scoped IndexedDB state separate from learner state v7.

The foreground download manager checks estimated quota, requests persistent storage, expands and
validates DICOM manifests, fetches with bounded concurrency and verifies every file before placing it
in the existing `offline-courses-v1` verified-package cache. It can promote verified responses from the expiring
`dicom-studies-v1` cache, resume completed files, cancel, reference-count shared URLs on removal and
reconcile eviction or changed package fingerprints at startup. Successful updates delete obsolete
unreferenced URLs while retaining assets shared by another ready course or case.

The inject-manifest worker precaches the application shell, serves verified package responses before
the network, supports media range requests and retains passive DICOM caching for ordinary online
viewing. A fallback `versioned-case-models-v1` CacheFirst strategy accepts only SHA-versioned GLBs
and retains at most four responses for 14 days after the verified package cache is checked. The
featured-case intro still prefetches its exact validated model URL. A visible reproducible or
deployment-supplied build ID supports stale-worker diagnosis.

Offline route gates use derived lesson or case readiness. Case intro and Learn surfaces expose
package status, and only a matching ready case fingerprint may launch while offline. Course download
lifecycle events remain logged and excluded from the learner reward pipeline. A worker-persisted
simulated-offline flag makes the URL-only developer control exercise the same cache-only behavior as
a disconnected device.

## Showcase and release evidence

The internal `runtime-showcase` course is the canonical executable fixture for the runtime. Its
single lesson contains all 27 registered primitive types across 28 steps because exploratory and
assessed image hotspots are both represented. It is hidden from learner catalogues but uses the
production loader, schema, planner, player, event bus and completion surfaces.

Automated parity coverage compares showcase types with the canonical primitive list and fails when
a new registered type has no fixture. A route integration test completes the ordered lesson,
including retry and unavailable-DICOM paths, and verifies lifecycle events and reward output. The
developer primitive gallery renders the same content in interactive, review, disabled and
missing-asset modes without mutating learner progress.

Case Lab adds a second configuration-only integration fixture: automated flows complete every
configured case plus a loader-added fixture. Its production-preview Playwright boundary completes
the foundation, intermediate, advanced and daily quick cases on desktop and 375 px touch emulation,
including canvas picking, marker retention, procedural segment selection, reversible branch travel,
configured finding inspection, evidence/debrief/comparison and the complete six-task golden path.
The same boundary runs the product tour through Home, pathway, lesson/DICOM, Imaging Lab,
completion, Daily Challenge, all Leaderboard periods and Profile. The test-only projection bridge
is build-gated by `VITE_E2E`; normal production builds omit it.

The browser QA boundary also injects axe-core across stable learner routes and every configured
Case Lab state, applies deterministic 200% root text resizing, and exercises keyboard-only
completion plus WebGL/model/session recovery on both viewports. Development anatomy sessions may
opt into `?anatomyDebug=1`, which reports the rolling median of the latest 120 animation-frame
intervals, derived FPS and renderer. The visible probe is excluded from production, while the
`VITE_E2E` bridge retains equivalent diagnostics for automated assertions.

Release evidence is split by capability. Chromium emulation covers repeatable responsive, motion,
keyboard, recovery, cross-origin, cache and offline checks. Physical Android/iOS scripts own
browser-specific installation, touch gestures, haptics, safe areas, lifecycle, memory pressure and
WebGL recovery for both DICOM and 3D anatomy; emulation cannot satisfy that release gate.

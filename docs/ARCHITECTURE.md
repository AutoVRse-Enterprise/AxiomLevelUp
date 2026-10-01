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
        +----> pure view selectors <----- activity player/session v2
                        ^                  /                   \
                        |                 v                     v
          learner state + clock   lazy primitive UI      typed event bus
                        ^                                      /       \
                        |                                     v         v
                    IndexedDB                         event history  ordered pipeline
                                                                      |
                                                       +--------------+-------------+
                                                       v              v             v
                                                   progress     gamification     mastery
                                                       +--------------+-------------+
                                                                      |
                                                                      v
                                                              learner store v3
```

## Boundaries

- `src/content`: contracts, parsing, validation, references and immutable registry.
- `src/app`: providers, startup and routing.
- `src/routes`, `src/layouts`, `src/components`: presentation and user intent.
- `src/events`: framework-independent event taxonomy and transport.
- `src/engines/learning`: pure activity planning, session v2, completion, scoring and event
  reduction.
- `src/engines/gamification`: pure XP, stars, levels, calendar, challenge and achievement rules.
- `src/engines/mastery`: pure deterministic concept-score updates and bounded history.
- `src/engines/pipeline.ts`: ordered learner-event reduction and one aggregate state result.
- `src/player`: activity lifecycle orchestration, draft persistence, timers, review/reveal and
  shared player presentation.
- `src/primitives/definitions`: React-free source of truth for implemented support, family, scoring,
  layout, review prompts, exploration keys and evaluation.
- `src/primitives/components` and `src/primitives/componentRegistry.ts`: callback-only primitive UI
  loaded through per-type lazy imports.
- `src/primitives/shared`: reusable artifact overlay, image geometry, shuffle and review
  infrastructure.
- `src/state`: persisted learner state, reference-date rebasing and pure derived view selectors.
- `src/lib/clock.ts`: the injectable source of current date/time for deterministic calendar views.
- `src/pwa`: service worker registration and connectivity state.
- `src/spikes`: isolated technical experiments; production code must not depend on these.

## Content loading

The app fetches `public/content/manifest.json`, resolves the app configuration, courses, learner seed
and asset manifest, validates every document, then performs cross-reference and per-primitive
semantic checks. Lesson primitives and challenge items use the same strict parser. Typed asset
references verify manifest existence and media type; scenario graphs and formula syntax receive
content-layer validation. UI receives a read-only registry indexed by identifier, plus a
learner-visible `catalogCourses` projection that excludes addressable internal courses. Parse
failures include source file and JSON path.

## State and events

Components emit typed learner input events. One subscriber queues and reduces them through learning
progress, gamification and mastery, commits one learner-state v3 snapshot and publishes informational
reward events. The event-history subscriber records a bounded audit trail. Output events are not
reduced again. Persisted reward ledgers make completion, perfect, daily and badge awards idempotent.
Level, leaderboard rank, badge progress, displayed streak and aggregate course progress remain
derived.

Local-calendar helpers use the injectable clock and configured week start for streaks, weekly goals,
weekly XP and challenge periods. Badge and weekly-challenge criteria are validated with content.
Mastery applies configured weighted gains/losses to first-attempt fractional scores and keeps bounded
per-concept history. Badge and level transitions enter a persisted celebration queue.

Application surfaces consume view models from `src/state/selectors/`. Effective lesson availability is derived from prerequisites, and route components do not duplicate progression logic. Demo seed dates are shifted from their declared `referenceDate` when the seed is applied; persisted state then ages normally.

## Lesson execution

Routes adapt a configured lesson or challenge into an immutable activity plan. Planning first parses
the strict primitive contract, then resolves its pure definition and derives support, family, scoring,
layout, prompt, exploration keys and timer compatibility. The player advances a pure reducer and
persists one version 2 activity session separately from aggregate learner state. Session progress
stores resumable drafts, first/latest fractional scores, distinct interactions and monotonic media
coverage; first-attempt scores remain authoritative.

The player lazy-renders callback-only primitive components, debounces drafts, applies completion
rules, owns per-attempt timers and renders submitted work read-only before feedback. It re-runs the
pure evaluator for review and applies the configured reveal policy. Primitive interactions are
translated into typed learner events; the learning progress engine updates lesson, course, challenge
and lifetime aggregates. Navigation away from an active session is blocked until the learner
confirms the saved exit.

Development plans preserve unsupported steps for diagnosis. Production plans include all 25
implemented primitive types, including the four DICOM modes, while retaining the fallback for
unknown or malformed primitives. An activity with no implemented steps is unavailable. The player
emits results only; the central pipeline awards XP, stars and mastery without primitive or
learning-engine coupling.

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

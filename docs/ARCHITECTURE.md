# Architecture

## Layers

```text
public/content JSON
        |
        v
content loader + Zod validation
        |
        v
read-only ContentRegistry -----> React routes/components
        |                             ^
        |                             |
        +----> pure view selectors <--+---- learner state + application clock
                                      |
                                      v
                                typed event bus
                                  /         \
                                 v           v
                           event history   learning progress engine
                                             |
                                             v
                                     Zustand learner store
                                             |
                                             v
                                          IndexedDB
```

## Boundaries

- `src/content`: contracts, parsing, validation, references and immutable registry.
- `src/app`: providers, startup and routing.
- `src/routes`, `src/layouts`, `src/components`: presentation and user intent.
- `src/events`: framework-independent event taxonomy and transport.
- `src/engines/learning`: pure activity planning, session, completion, scoring and event reduction.
- `src/player`: activity lifecycle orchestration and shared player presentation.
- `src/primitives`: lazy primitive registration, pure evaluators and isolated components.
- `src/state`: persisted learner state, reference-date rebasing and pure derived view selectors.
- `src/lib/clock.ts`: the injectable source of current date/time for deterministic calendar views.
- `src/pwa`: service worker registration and connectivity state.
- `src/spikes`: isolated technical experiments; production code must not depend on these.

## Content loading

The app fetches `public/content/manifest.json`, resolves the app configuration, courses and learner seed, validates every document, then performs cross-reference checks. UI receives a read-only registry indexed by identifier. Parse failures include source file and JSON path.

## State and events

Components emit typed learner events. The event-history subscriber records a bounded audit trail. The learning progress engine updates the learner store; gamification and mastery remain future independent subscribers. Persisted state is versioned and migrated on hydration. Level, leaderboard rank and aggregate course progress remain derived.

Application surfaces consume view models from `src/state/selectors/`. Effective lesson availability is derived from prerequisites, and route components do not duplicate progression logic. Demo seed dates are shifted from their declared `referenceDate` when the seed is applied; persisted state then ages normally.

## Lesson execution

Routes adapt a configured lesson or challenge into an immutable activity plan. The player advances a
pure session reducer and persists the single active session separately from aggregate learner state.
Primitive components report interactions and responses through callbacks; pure evaluators and
completion rules produce results. The player emits lifecycle events, and the learning progress engine
updates lesson, course, challenge and lifetime aggregates. Navigation away from an active session is
blocked until the learner confirms the saved exit.

Unsupported steps render explicit fallbacks in development and are omitted from production plans. An
activity with no implemented steps is unavailable. Gamification and mastery remain independent future
subscribers to the same event stream.

## DICOM spike isolation

The `/dev/dicom-spike` route dynamically imports all Cornerstone code. The normal application shell must not import Cornerstone modules. The spike loads a curated local manifest and DICOM files through `wadouri:` image IDs; it is evidence for the production design, not the final primitive.

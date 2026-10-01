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
                                      |
                                      v
                                typed event bus
                                  /         \
                                 v           v
                           event history   engines (later)
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
- `src/state`: persisted learner state and derived selectors.
- `src/pwa`: service worker registration and connectivity state.
- `src/spikes`: isolated technical experiments; production code must not depend on these.

## Content loading

The app fetches `public/content/manifest.json`, resolves the app configuration, courses and learner seed, validates every document, then performs cross-reference checks. UI receives a read-only registry indexed by identifier. Parse failures include source file and JSON path.

## State and events

Components emit typed learner events. The event-history subscriber records a bounded audit trail. Phase-specific engines will subscribe later and update the learner store. Persisted state is versioned and migrated on hydration. Level, leaderboard rank and aggregate course progress remain derived.

## DICOM spike isolation

The `/dev/dicom-spike` route dynamically imports all Cornerstone code. The normal application shell must not import Cornerstone modules. The spike loads a curated local manifest and DICOM files through `wadouri:` image IDs; it is evidence for the production design, not the final primitive.

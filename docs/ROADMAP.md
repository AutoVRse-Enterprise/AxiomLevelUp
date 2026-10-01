# Delivery roadmap

| Phase | Scope | Status | Exit signal |
| --- | --- | --- | --- |
| 1 | Foundation and DICOM/PWA spike | Complete | Validated content, persistent seed state, installable shell and documented DICOM verdict |
| 2 | Application surfaces | Complete | Home, Learn, Pathway, Course, Challenge, Leaderboard and Profile use live registry/state |
| 3 | Core lesson engine | Next | A configured lesson executes from start to completion |
| 4 | Standard primitives | Planned | Content, assessment and scenario primitives are playable and tested |
| 5 | Gamification and mastery | Planned | Learner events update XP, levels, stars, streaks, badges, rank and mastery |
| 6 | DICOM learning viewer | Planned | Explore, guide, identify, measure and reveal modes work on target devices |
| 7 | Complete PWA/offline | Planned | Course assets can be downloaded, verified and removed |
| 8 | Product polish | Planned | Responsive, accessible, animated, performant and resilient target flows |
| 9 | Showcase and device QA | Planned | The 18-primitive fixture passes the browser/device matrix |
| 10 | Sanofi demo course | Planned | Prospect-specific content runs without runtime code changes |

## Sequencing note

The Phase 1 DICOM/PWA spike is deliberately early. Its code is isolated and is not the production learning primitive. The findings inform Phases 6 and 7.

Phase 1 closed with 19 automated tests passing across schema/loader behavior, IndexedDB state, events, selectors and route layouts. The DICOM verdict is a conditional go pending physical Android and iOS testing. See `docs/spikes/dicom-pwa-spike.md`.

Phase 2 closed with all learner-facing surfaces driven by validated configuration and persisted state, with 35 automated tests passing. Phase 3 should replace the immersive lesson and challenge placeholders with the configured execution engine.

# Delivery roadmap

| Phase | Scope                          | Status   | Exit signal                                                                              |
| ----- | ------------------------------ | -------- | ---------------------------------------------------------------------------------------- |
| 1     | Foundation and DICOM/PWA spike | Complete | Validated content, persistent seed state, installable shell and documented DICOM verdict |
| 2     | Application surfaces           | Complete | Home, Learn, Pathway, Course, Challenge, Leaderboard and Profile use live registry/state |
| 3     | Core lesson engine             | Complete | A configured lesson executes from start to completion                                    |
| 4     | Standard primitives            | Complete | Content, assessment and scenario primitives are playable and tested                      |
| 5     | Gamification and mastery       | Complete | Learner events update XP, levels, stars, streaks, badges, rank and mastery               |
| 6     | DICOM learning viewer          | Complete | Explore, guide, identify, measure and reveal modes work on target devices                |
| 7     | Complete PWA/offline           | Complete | Course assets can be downloaded, verified and removed                                    |
| 8     | Product polish                 | Planned  | Responsive, accessible, animated, performant and resilient target flows                  |
| 9     | Showcase and device QA         | Planned  | The 18-primitive fixture passes the browser/device matrix                                |
| 10    | Sanofi demo course             | Planned  | Prospect-specific content runs without runtime code changes                              |

## Sequencing note

The Phase 1 DICOM/PWA spike is deliberately early. Its code is isolated and is not the production learning primitive. The findings inform Phases 6 and 7.

Phase 1 closed with 19 automated tests passing across schema/loader behavior, IndexedDB state, events, selectors and route layouts. The DICOM verdict is a conditional go pending physical Android and iOS testing. See `docs/spikes/dicom-pwa-spike.md`.

Phase 2 closed with all learner-facing surfaces driven by validated configuration and persisted state, with 35 automated tests passing.

Phase 3 closed with a shared resumable lesson/challenge engine, event-driven learning progress,
immediate feedback and the first three typed primitives. The quality gate passes with 10 test files
and 52 tests.

Phase 4 closed with all 21 standard primitive types strictly validated, lazy-rendered and exercised
through a 22-step internal showcase lesson. The quality gate passes with 21 test files and 187 tests;
content validation covers five courses and thirteen lessons with zero warnings. Phase 5 is next and
will subscribe gamification and mastery engines to the existing typed learner-event stream.

Phase 5 closed with one ordered event pipeline, learner state v3, configuration-driven reward and
mastery rules, replay-as-revision semantics and accessible reward summaries/celebrations. The
quality gate passes with 29 test files and 211 tests; responsive QA found no document overflow at
the four target viewports.

Phase 6 closed with four strict configuration-driven DICOM primitives, a lazy Cornerstone boundary,
externally hosted verified series assets, progressive loading and typed imaging events. The quality
gate passes with 32 test files and 221 tests; desktop Chrome and mobile emulation pass, including a
cross-origin cached-offline reload. Physical Android/iOS viewer checks remain explicitly deferred to
Phase 9.

Phase 7 closed with asset-manifest v0.2, verified course downloads, quota and eviction recovery,
derived offline activity gating, a custom service worker, storage management and install/update UX.
The quality gate passes with 34 test files and 235 tests; same-origin and cross-origin downloads
render the complete DICOM stack after a network-disabled reload.

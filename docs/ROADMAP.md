# Delivery roadmap

For a human-readable description of the current application and a practical test walkthrough,
start with `README.md`.

| Phase | Scope                          | Status   | Exit signal                                                                                |
| ----- | ------------------------------ | -------- | ------------------------------------------------------------------------------------------ |
| 1     | Foundation and DICOM/PWA spike | Complete | Validated content, persistent seed state, installable shell and documented DICOM verdict   |
| 2     | Application surfaces           | Complete | Home, Learn, Pathway, Course, Challenge, Leaderboard and Profile use live registry/state   |
| 3     | Core lesson engine             | Complete | A configured lesson executes from start to completion                                      |
| 4     | Standard primitives            | Complete | Content, assessment and scenario primitives are playable and tested                        |
| 5     | Gamification and mastery       | Complete | Learner events update XP, levels, stars, streaks, badges, rank and mastery                 |
| 6     | DICOM learning viewer          | Complete | Explore, guide, identify, measure and reveal modes work on target devices                  |
| 7     | Complete PWA/offline           | Complete | Course assets can be downloaded, verified and removed                                      |
| 8     | Product polish                 | Complete | Responsive, accessible, animated, performant and resilient target flows                    |
| 9     | Showcase and device QA         | Active   | Every implemented primitive passes the automated, browser and physical-device matrix       |
| 10    | Case Lab capability demo       | Complete | Three respiratory cases play through the case player; new cases need content only          |
| 11    | Case Lab demo hardening        | Complete | One credible five-minute exacerbation path passes the demo-readiness gate                  |
| 12    | Case Lab depth and polish      | Complete | Case depth, whole-product demo gaps and all assigned audit findings are technically closed |
| 13    | Client demo readiness          | Active   | The guided Case Lab passes functional, browser and unaided trainee usability gates         |
| 14    | Multi-experience foundation    | Complete | `VITE_EXPERIENCE` selects default or sanofi; default is provably unchanged                 |
| 15    | Game contract and engine       | Complete | Rounds and games validate; pure seeded engine scores, links and ranks runs                 |
| 16    | Game player and clinical round | Planned  | A two-round game plays end to end with timer, clues, reveal and results                    |
| 17    | Spatial rounds                 | Planned  | Look-around and limited-move rounds score proximity and read clearly on a phone            |
| 18    | Spot the finding and challenge | Planned  | The four-round Respiratory Challenge completes on every difficulty in 2–4 minutes          |
| 19    | Game hub, results and social   | Planned  | Hub, results, challenge links, leaderboard, expert runs and You page work end to end       |
| 20    | Demo polish and readiness      | Planned  | PRD success criteria have evidence; runbook and deployable sanofi build are published      |

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

Phase 8 closed with token-driven reduced-motion-aware presentation, optional event-driven haptics
and lazy confetti, designed loading/empty/error contracts, route splitting, desktop and immersive
artifact layouts, live announcements and automated accessibility checks. Browser QA passes the four
target viewports and 200% text scaling; Lighthouse accessibility reaches 100. The enforced bundle
budget passes with the entry substantially below the Phase 7 baseline and the lazy imaging boundary
unchanged.

Phase 9 agent work completed registry-parity coverage for all 25 implemented primitive types across
a 26-step internal showcase, a complete real-player integration flow, production Chromium QA and
cross-origin/offline DICOM verification. Android Chrome and iOS Safari/installed-app scripts and
evidence templates are ready; the phase remains active until those physical runs pass or are
explicitly waived.

Phase 10 was redefined on 2026-10-03 (ADR-066). Instead of a prospect-specific course, it builds a
reusable case-game capability: case documents, a staged case player, clue-linked feedback,
composite anatomy/diagnosis/speed scoring, lazy three.js anatomy and drill-down localisation. Three
respiratory sample cases and a daily quick case demonstrate it. The implementation plan was
approved on 2026-10-03.

Phase 10 closed with first-class case and anatomy-map contracts, a reusable staged player, central
case rewards and mastery, learner-state v5 attempt history, two anatomy primitives and a lazy
Three.js boundary. Automated flows complete all four configured cases and a loader-added fixture;
production Chromium QA passes the four target viewports, keyboard localisation, reduced motion,
WebGL recovery and heap-release checks. A subsequent 52-finding demo-readiness audit determined
that this establishes the technical capability but not a credible unsupervised client demo. Phase 9
remains active for physical Android/iOS DICOM and 3D anatomy evidence.

Phase 11 closed with all 40 assigned audit findings technically resolved, a real-WebGL production
preview suite passing on desktop and 375 px touch emulation, and durable golden-path screenshots.
The six-task advanced case now demonstrates branch navigation, configured finding discovery,
overlay-free localisation, truthful timing/results/rewards and comparison. Clinical claims remain
unapproved, and physical-device approval remains under Phase 9.

Phase 12 closed all 12 assigned Case Lab findings and both whole-product W-series gaps with no
silent deferral. Four differentiated cases now use explicit clue-review, timeout and speed
contracts, procedural segment anatomy, local evidence synthesis, actionable debrief, authored
expert teaching, consistent metadata/history and verified offline packages. Production-preview
coverage completes all four cases and the PRD product tour on desktop and 375 px touch Chromium,
with a unified runbook and audience-specific verdict.

This is technical app completion, not external release approval. Phase 9 remains active for
physical Android/iOS gates or approved waivers, and the clinical, anatomy/pathology and client/legal
claim ledgers remain unapproved. Unsupervised/external use is therefore still No-go.

Phase 13 was opened after an end-to-end trainee-doctor UX audit found that the technically complete
Case Lab did not communicate one coherent reasoning loop. It makes mission, evidence, differential,
spatial reconstruction, commitment and debrief causally connected; implements the unknown-point
concept; closes remaining functional demo defects; and requires unaided human usability evidence.
Clinical accuracy and medical/regulatory review are intentionally outside this phase.

Phase 13 implementation and automated regression coverage are complete. The phase remains active
until five qualifying human sessions pass the usability thresholds, an exact candidate is deployed
and preflighted over HTTPS, and physical Android/iPhone checks pass or a desktop-only waiver is
approved.

The final local Phase 13 gate covers 73 Vitest files / 500 tests and 53 passing Playwright tests
with three intentional project skips across desktop and touch-phone Chromium. On 2026-10-05 the
user chose to leave the human, hosted and physical-device gates blocked and did not authorize a
desktop-only waiver; the external-demo verdict therefore remains No-go.

Phases 14–20 were planned on 2026-10-07 from `newDemoPRD.md` (the Medical Challenge demo). They add
a second build-time experience, `sanofi`, alongside the unchanged default experience, and a
reusable game engine of timed, scored, shareable rounds built on the existing primitives, anatomy
viewer and event pipeline. The programme overview, architecture, open questions and dependency
graph are in `docs/MEDICAL_CHALLENGE_PLAN.md`; each phase has its own file under `docs/phases/`.
Phase 13's external gates remain open and independent of this programme.

Phase 14 closed on 2026-10-07 with static default/sanofi selection, independent routes, shell
configuration, content roots, metadata, theme and non-default persistence namespaces. The final
gate passed 80 Vitest files / 522 tests, default Playwright 53 passes / 3 intentional skips, both
sanofi desktop/phone smoke projects, both bundle budgets and zero content warnings. All eight
Phase 13 golden images passed unchanged. Phase 15 is next; Phase 13's human, hosted and physical
device gates remain open and independent.

Phase 15 closed on 2026-10-07 with strict round/game/configuration contracts, two validated sanofi
fixture rounds, a pure deterministic planning/scoring/proximity/session/results/link/leaderboard
engine, typed game events and learner state v9. The gate passed 95 Vitest files / 593 tests, both
content roots and builds, 53 default Playwright passes with 3 intentional skips, and both sanofi
smoke projects. Phase 16 is next; it adds the game player and clinical-call UI.

Phase 16 closed on 2026-10-07 with a shared timed game player, game-only presentation labels,
inline free and paid clinical clues, scored reveals, final results, exit/resume/abandon behavior,
and event-driven game effects. A real multimodal clinical-call round and one/two-round fixtures
complete on desktop and 375 × 812 Chromium. Phase 17 is next; it adds the two spatial airway
rounds.

Phase 17 closed on 2026-10-07 with a marker-based spatial-look round, two bounded endoscopic
exploration rounds, weighted and hierarchy-proximity scoring, dynamic lobe-child segment choices,
pin-versus-actual reveal, failure Retry/Skip and model prefetch. The deterministic spatial fixture
completes through visible and keyboard controls on desktop and 375 × 812 Chromium while default
content and all eight existing golden images remain unchanged. Phase 18 is next; it adds the
spot-the-finding round and complete four-round challenge.

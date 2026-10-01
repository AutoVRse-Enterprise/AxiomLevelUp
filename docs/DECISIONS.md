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

**Status:** Accepted; amended by ADR-019

**Decision:** Weight assessment score by configured `scoring.weight` and count correctness only on
the first attempt. Retries remain learning opportunities. Activities without assessments score 100,
and lifetime question statistics count first attempts only.

**Consequences:** Retry behavior cannot inflate scores while content-only lessons can complete
normally.

**Amendment:** ADR-019 replaces boolean weighted scoring with fractional first-attempt scoring.
First-attempt authority, the 100 score for activities without scored steps and first-attempt-only
lifetime question statistics remain unchanged.

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

## ADR-018: Primitive definitions are the runtime source of truth

**Status:** Accepted

**Context:** Phase 3 maintained separate lists for planned and rendered primitive support, while
components repeated ad hoc content checks and evaluation lived in a separate registry.

**Decision:** Give each implemented primitive a pure, React-free definition that owns its family,
scoring status, layout, review prompt, exploration metadata and evaluator. Keep strict schemas and
asset references in the content layer, and keep lazy React components in a separate component map.
Resolve a primitive through its strict schema before planning, rendering or evaluation.

**Consequences:** Planning, rendering and evaluation cannot independently claim support for a
primitive. The content layer remains independent from React, malformed registered content uses the
runtime fallback, and parity tests detect drift between schemas, definitions and components.

## ADR-019: Fractional first-attempt scores

**Status:** Accepted

**Context:** Boolean correctness cannot represent partial-credit assessments or scored scenario
paths. Retried answers must not inflate activity scores or lifetime accuracy.

**Decision:** Evaluators return a normalized score from 0 through 1 and derive `correct` from
`score === 1`. Activity score is
`round(100 × Σ(firstScore × weight) / Σ(weight))` across definition-scored steps. Accuracy and
lifetime correct-answer statistics count only fully correct first attempts. Evaluators may include
per-item `correct`, `incorrect` or `missed` results. Retries update the latest result but never
replace the first score.

**Consequences:** Multiple select, classification, matching, ordering and scenario paths can award
deterministic partial credit without weakening first-attempt authority. Existing binary evaluators
produce scores of zero or one, and content-only activities continue to score 100.

## ADR-020: Versioned primitive session state

**Status:** Accepted

**Context:** Complex primitives need resumable in-progress answers, distinct exploration tracking
and media coverage in addition to submitted responses. The version 1 session shape cannot safely
represent these fields.

**Decision:** Version activity sessions independently at version 2. Each primitive progress record
stores `firstScore`, `lastScore`, `draft`, distinct `interactionKeys` and monotonic
`mediaProgress`. Session actions update drafts, keyed interactions, media coverage and submitted
scores. Discard version 1 in-flight sessions during migration rather than guessing missing state.
Player draft writes will use the planned 300 ms debounce when draft-producing primitives are added
in P4-T03.

**Consequences:** Completion can depend on unique explored targets or configured media coverage,
and future structured primitives have a durable draft contract. Learners with a version 1
in-progress activity restart that activity once; aggregate learner progress is unaffected.

## ADR-021: Player-owned review and interaction lifecycle

**Status:** Accepted

**Context:** Assessment primitives need a consistent read-only review state, configurable answer
reveal, resumable drafts and domain-specific learner events. Implementing those concerns inside each
primitive would couple presentation components to persistence, telemetry and retry policy.

**Decision:** The activity player renders the submitted primitive above feedback in `review` mode,
passes the stored response and a fresh pure evaluation, and decides answer reveal from the
application-level `never`, `final_attempt` or `always` policy. The player persists draft callbacks
after a 300 ms debounce, flushes pending drafts at lifecycle boundaries, maps primitive interactions
to typed scenario and media events, and de-duplicates media milestones against monotonic progress.
Primitive components remain callback-only and read-only while reviewing. Feedback receives an
explicit correct, partial or incorrect state and moves focus to its heading.

**Consequences:** Every assessment gets the same retry/reveal and accessibility behavior without
accessing stores or the event bus. Draft-producing primitives can be added independently, and
first-attempt scoring remains authoritative. A submitted response is re-evaluated for review, so
evaluators must remain pure and deterministic.

## ADR-025: Structured assessment interactions and scoring

**Status:** Accepted

**Context:** Classification, matching and ordering need resumable structured responses, partial
credit and equivalent pointer, touch and keyboard paths. Ordering also needs drag interaction
without making drag a prerequisite for completion.

**Decision:** Store classification and matching drafts as source-ID-to-target-ID records and
ordering drafts as ordered item-ID arrays. Classification and matching use select-first controls;
matching gives right-side choices stable numbered visual labels and permits unpaired distractors.
Ordering uses React-19-compatible `@dnd-kit` core, sortable and utility packages with delayed,
tolerant pointer/touch activation, sortable keyboard coordinates and screen-reader announcements.
Every ordering row also retains move-up and move-down buttons. Seed each attempt into a
deterministic unsolved order. Exact modes award only zero or one; partial modes award the fraction
of correctly classified, matched or positioned items. Malformed or incomplete responses score
zero.

**Consequences:** Structured drafts remain serializable and review-safe, ordering stays completable
without drag, and all three evaluators are deterministic. Right-side distractors do not dilute the
matching denominator, while ordering partial credit measures exact positions rather than relative
pairs.

## ADR-026: Shared artifact viewport mathematics

**Status:** Accepted

**Context:** Images, hotspots, comparisons, tables and future scientific artifacts need consistent
expanded viewing, coordinate conversion and pan/zoom behavior across pointer and screen sizes.
Browser fullscreen is not consistently available, especially on iPhone Safari.

**Decision:** Use a full-viewport Radix dialog as the in-app artifact overlay. Keep clamping,
zoom-at-point and screen-to-normalized coordinate conversion in a pure math module, with interaction
state isolated in `usePanZoom`. Store authored regions as normalized coordinates. Use deterministic
seeded Fisher-Yates shuffling, with a separate guard that prevents ordering exercises from starting
in their solved order.

**Consequences:** Artifact primitives share accessible focus trapping and deterministic geometry
without depending on browser fullscreen APIs. Coordinate and ordering behavior can be unit tested
without React, while later primitives can compose the hook and overlay without duplicating input
logic.

## ADR-027: Content-layer primitive semantic validation

**Status:** Accepted

**Context:** Lesson primitives and challenge items share the same runtime contract, but challenge
items previously stopped at the permissive base schema. Asset IDs embedded in typed content also
bypassed manifest type checks, and importing runtime definitions into the content loader would
invert the content/runtime dependency.

**Decision:** Run every lesson primitive and challenge item through `parsePrimitive`, then apply one
content-layer semantic validator for scoped ID uniqueness, concept and reward references, declared
assets, typed `assetRefs` and timers. Keep the canonical timer-compatible type set in the content
layer and have supported runtime definitions derive their flag from it. Preserve unknown primitive
types as warnings.

**Consequences:** Challenge diagnostics now identify exact item paths, typed content assets must
exist with the expected manifest type, and incompatible registered primitives cannot carry timers.
Future primitive schemas must declare their asset references and keep definition parity tests green.

## ADR-028: Shared choice assessment semantics

**Status:** Accepted

**Context:** Multiple-choice, multiple-select and true/false need consistent keyboard interaction,
draft reporting and review rendering. Multiple-select also needs deterministic partial scoring that
cannot reward guessing with a negative score, while malformed persisted responses must fail closed.

**Decision:** Render all choice assessments through one native-input `ChoiceList` and accessible
`ReviewMark`. Keep option order deterministic per attempt, preserving that order when the submitted
attempt enters review. Validate responses in React-free definitions; treat duplicate, unknown,
undersized or wrongly typed responses as zero. Partial multiple-select scoring is
`max(0, (correct selections - incorrect selections) / correct options)`.

**Consequences:** Choice components share disabled and reveal behavior while remaining callback-only.
Evaluators are deterministic and review-safe, all-or-nothing remains the multiple-select default,
and future choice-like assessments can reuse the presentation contract without owning score policy.

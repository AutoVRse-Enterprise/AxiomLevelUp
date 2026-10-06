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

## ADR-022: Validated scenario graphs with resumable transitions

**Status:** Accepted

**Context:** Scenarios need authored branching, consequences, outcomes, optional scoring and
reload-safe progress without turning React components into workflow or grading engines. Invalid
references, cycles or unreachable branches could otherwise strand a learner, while treating a
scenario like one multiple-choice question would lose its decision history.

**Decision:** Represent scenarios as strict context, decision and outcome node unions. Validate
node and choice identity, the start node, every transition, acyclicity, outcome termination and
reachability in the content layer; warn when a complete path has fewer than two or more than four
decisions. A pure scenario engine owns start, choose, advance, completion and mean scored-choice
evaluation. Persist `{ path, current, revealed }` as the primitive draft, and submit the decision
path only after reaching an outcome. The lazy split-layout component reports interactions and
drafts through existing callbacks, locks each choice after selection, announces its consequence and
renders a path recap with best-choice review.

**Consequences:** Content errors fail before playback, converging branches remain easy to author,
and reload cannot skip an unrevealed consequence or reopen a locked decision. Only scenarios with
authored choice scores contribute to activity scoring; unscored choices are excluded from the mean.
The player continues to own persistence, events, review and completion policy.

## ADR-023: Strict native scientific-data primitives

**Status:** Accepted

**Context:** Data tables and charts must render authored scientific values accessibly without
course-specific React or a chart dependency. Dose-response content also needs deterministic
logarithmic plotting and an optional fitted curve rather than an unlabelled value array.

**Decision:** Define strict, reference-checked table rows and chart-specific line, bar, scatter and
dose-response contracts. Render semantic tables with scoped headers, visible authored highlight
markers, a focusable labelled scroll region, a sticky first column and the shared artifact overlay.
Render charts as in-house SVG using pure linear/log scale, tick and four-parameter-logistic
functions. Require a prose summary and labelled/unit-bearing axes, expose every datum to keyboard
focus with series-specific shapes, and provide a semantic source-data table toggle. Dose-response
x values and EC50 are positive and the x axis is always logarithmic.

**Consequences:** Scientific data stays configuration-driven and inspectable without adding a chart
runtime. The SVG renderer intentionally supports the four approved chart families rather than an
arbitrary grammar. Authors must provide stable series/point IDs and complete table rows.

## ADR-024: Lazy trusted-boundary formula rendering

**Status:** Accepted

**Context:** Scientific notation and chemical equations require proper typography, but formula code
and fonts should not increase the entry chunk. Invalid TeX should fail content checks even though
the learner runtime must degrade safely.

**Decision:** Lazy-load KaTeX, its mhchem extension and its CSS only through the formula component.
Render authored expressions with `trust: false` and `throwOnError: false`, while exposing a required
author-written accessible label and optional variable definitions. During Node content validation,
parse every formula with the same KaTeX/mhchem support using `trust: false` and
`throwOnError: true`.

**Consequences:** Formula failures are caught before deployment and runtime rendering remains
non-fatal. The formula lazy chunk includes KaTeX JavaScript, CSS and font assets.

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

## ADR-029: Typed-response normalization and numeric syntax

**Status:** Accepted

**Context:** Fill-blank responses need predictable matching across Unicode and incidental whitespace,
while numeric answers must accept the decimal conventions learners commonly enter without guessing
whether punctuation is a decimal or grouping separator.

**Decision:** Store fill-blank drafts as blank-ID-to-raw-string records and numeric drafts as raw
strings. Normalize fill-blank comparisons with NFKC, outer trimming and whitespace collapse, then
apply each blank's case-sensitivity setting. Score valid complete fill-blank responses per blank.
Require authored fill-blank tokens and definitions to match one-to-one. Numeric content uses either
an answer with one absolute or percent tolerance, or an inclusive ordered range. Parse one comma or
point as a decimal separator and reject grouping, mixed separators, exponent syntax, non-finite
values and non-string responses.

**Consequences:** Drafts preserve learner input for review, text matching is deterministic, and
numeric evaluation is locale-tolerant without silently reinterpreting grouped values. Generic input
labels avoid exposing answers to assistive technology; corrections remain reveal-policy controlled.

## ADR-030: Per-attempt timed-response lifecycle

**Status:** Accepted

**Context:** Compatible assessments may carry the existing base timer, but the runtime needs one
owner for expiry, draft submission, retry behavior, accessibility announcements and background-tab
handling. Persisting wall-clock deadlines would also make a resumed activity consume time while the
learner was away.

**Decision:** The activity player owns one timer per interactive attempt. It uses a wall-clock
deadline while visible, pauses with the remaining duration while `document.hidden`, and restarts
that remaining countdown when visible. Resuming a saved activity starts the current item's full
timer again; timer state is not persisted. Expiry flushes and submits the current draft with score
zero and `timedOut: true`, then uses the normal retry and max-attempt completion policy. The timer
badge exposes `role="timer"` without continuous live updates and announces only thresholds from
`product.player.timerAnnouncements` through a polite status region.

**Consequences:** Background time and time away from a saved activity do not penalize learners,
while every visible attempt has a deterministic limit and cannot dead-end after expiry. Timeout
events remain distinguishable from ordinary incorrect answers, and the countdown uses no
motion-dependent presentation.

## ADR-031: Normalized image-region interaction model

**Status:** Accepted

**Context:** Zoomable labels and hotspot targets must stay aligned across responsive sizes, overlay
zoom and input methods. The same hotspot primitive also needs content-style exploration and scored
assessment behavior without moving progression or grading policy into React.

**Decision:** Author circle, rectangle and polygon regions in normalized image coordinates and
validate their bounds, IDs and assessment target references strictly. Store assessment responses as
normalized points and grade them with pure inclusive-boundary hit testing. Resolve the hotspot
definition family and scoring behavior from its validated `explore` or `assess` mode. Keep pan/zoom
state local to the shared image viewer, while exploration emits unique region keys and assessment
drafts flow through player callbacks.

**Consequences:** Regions are resolution-independent and reusable in inline and overlay views;
hotspot evaluation remains deterministic and review-safe. Definition family resolution now permits
a validated primitive subtype to choose content or assessment behavior, and authored SVG dimensions
prevent layout shift when manifest metadata is available.

## ADR-032: Native media with coverage-based progression

**Status:** Accepted

**Context:** Video and audio need accessible native playback while lesson completion must reflect
media actually played rather than the current playhead, which can be moved by seeking. Carousels and
references also need durable, keyed interactions without introducing course-specific UI or a PDF
rendering dependency.

**Decision:** Use native video and audio elements with metadata preloading, authored captions and
transcripts. Compute the union of browser-reported played ranges and report every crossed five-percent
coverage step; the player remains the owner of the configured completion threshold. Keep timestamp
markers and formative video checkpoints local and callback-only. Model carousel slides as a bounded
flat collection, report each observed slide ID once through IntersectionObserver with control/scroll
fallbacks, and open PDF references natively with an optional page fragment and `noopener`. Generate
small, original media fixtures locally with ffmpeg and a deterministic Node PDF writer.

**Consequences:** Seeking cannot falsely complete media, coarse browser events cannot skip progress
increments, and media interactions remain resumable through existing player state. Captions,
transcripts, asset types and provenance are explicit. Native PDF behavior avoids a new runtime
dependency, while richer document rendering remains out of scope.

## ADR-033: Addressable internal courses and isolated primitive previews

**Status:** Accepted

**Context:** The standard primitive runtime needs one complete, playable reference lesson without
exposing development material in learner discovery. The same content must also feed a gallery that
can exercise review, disabled and missing-asset states without changing learner progress or emitting
learner events. ADR-028 was already assigned to shared choice assessment semantics at the required
starting commit, so the next available append-only number is ADR-033.

**Decision:** Add course visibility as `learner | internal`, defaulting to `learner` for existing
content. Keep all courses and lessons in the primary registry and identifier maps, while exposing a
separate `catalogCourses` collection containing only learner-visible courses. Learner-facing
discovery passes only that collection to selectors. The primitive gallery reads the internal
showcase lesson from the registry, renders it through the production primitive renderer and confines
all callback state to gallery components; missing assets are simulated through a nested read-only
content context.

**Consequences:** Internal courses remain directly routable and use ordinary persisted progress, so
the normal demo seed reset removes their progress with all other mutations. Catalog, continuation,
revision and pathway surfaces cannot discover internal content. Gallery interactions provide broad
visual state coverage without learner events, analytics or gamification side effects.

## ADR-034: One ordered learner-event pipeline

**Status:** Accepted

**Context:** Learning progress already subscribed to the event bus while a separate handler directly
applied `xp_awarded`. Adding more independent state-writing subscribers would make reward ordering,
revision detection, badge cascades and persistence nondeterministic, and could count informational
events twice.

**Decision:** Reduce every input event through one pure pipeline in learning-progress,
gamification and mastery order, then commit one learner-state snapshot. The pipeline queues
re-entrant input follow-ups such as `course_completed`. Reward events such as `xp_awarded`,
`badge_unlocked` and `mastery_updated` are informational outputs and are never reduced again.

**Consequences:** All aggregate learner changes are atomic and deterministic. The event log still
receives both input and output events, while components remain event producers rather than reward
state writers.

## ADR-035: Idempotent XP, stars and revision rewards

**Status:** Accepted

**Context:** First attempts are authoritative, while learners must be able to replay completed
lessons without farming first-completion or perfect bonuses. Authored lessons and questions already
carry reward metadata, and product configuration provides fallbacks.

**Decision:** Award rounded fractional question XP only on attempt one. Award lesson completion and
the first perfect result once through a per-lesson reward ledger. Treat every later completion as a
revision and award the configured revision amount. Pay daily challenge rewards once per local day.
Keep the best configured star result. Derive level transitions from lifetime XP after all rewards,
including badge bonuses.

**Consequences:** Replays remain useful and qualify for calendar activity without duplicating
milestone rewards. Existing content can override lesson and primitive XP while missing values use
strict product defaults.

## ADR-036: Validated achievement criteria with derived progress

**Status:** Accepted

**Context:** Seeded badge percentages were manually maintained and had already drifted from actual
lesson and course state. Badge descriptions alone could not drive unlock behavior.

**Decision:** Give every badge a validated criterion. Criteria cover lessons, courses, perfect
lessons, streaks, weekly goals, challenge completions, first-attempt answers and primitive rewards.
Resolve all referenced identifiers during content loading. Derive progress from learner facts and
persist only unlock timestamps. Use the same criterion contract for weekly challenge progress rules.

**Consequences:** Achievement progress and unlocks cannot disagree with source state. Adding a badge
is a content change rather than a React or engine branch, while new criterion types still require an
engine/schema extension.

## ADR-037: Local-calendar periods for engagement state

**Status:** Accepted

**Context:** Streaks, weekly goals, weekly XP and daily/weekly challenges require date boundaries.
Simple counters never expired and weekly XP never rolled over.

**Decision:** Use pure local-date helpers and the configured `weekStartsOn`. Lesson completion,
revision and daily challenge completion qualify for streak and weekly activity. Duplicate actions
on one day do not extend a streak. Weekly XP and incomplete weekly progress reset on the next week;
daily and weekly challenge rewards use explicit period keys.

**Consequences:** Calendar behavior is deterministic under the injectable clock and can be tested at
month/week boundaries without depending on UTC dates.

## ADR-038: Deterministic weighted mastery

**Status:** Accepted

**Context:** Mastery must remain separate from participation XP and must support partial credit,
difficulty and future engine replacement without changing primitive UI.

**Decision:** On the first attempt in a run, apply
`difficultyWeight × (score × gain - (1 - score) × loss)`, divided across the question's concept IDs.
Clamp scores from zero to one hundred and cap history to the configured limit. Use the primitive
difficulty, falling back to the configured default.

**Consequences:** Correct, partial and incorrect results all produce explainable deterministic
changes. The mastery engine stays pure and replaceable, and revision recommendations continue to
consume ordinary concept scores.

## ADR-039: Persisted accessible celebration queue

**Status:** Accepted

**Context:** Badge and level transitions may occur in a cascade and must not interrupt an active
assessment. They also need to survive navigation and refresh.

**Decision:** Persist badge and level celebrations in learner state. Present them one at a time with
a modal Radix dialog after an activity session is cleared or on a normal application route.
Dismissal is a learner input event. Keep Phase 5 motion minimal and honor reduced-motion settings.

**Consequences:** Multiple rewards cannot overwrite each other, focus is trapped and restored, and
an interrupted demo can resume its reward sequence. Richer animation, haptics and sound remain
Phase 8 work.

## ADR-040: Lazy Cornerstone imaging boundary

**Status:** Accepted

**Context:** Cornerstone3D is large, stateful and browser-specific, while primitive definitions,
grading and content validation must remain deterministic and testable without a DOM or WebGL.

**Decision:** Confine all `@cornerstonejs/*` imports to
`src/imaging/cornerstone/createController.ts`. Expose a small viewer-controller interface and load
the implementation dynamically from the shared React hook. Give each mounted viewer its own
rendering engine, viewport and tool group, with StrictMode-safe teardown and CPU rendering fallback
when WebGL is unavailable.

**Consequences:** Standard routes do not pay the imaging bundle cost, pure DICOM behavior can be
tested without Cornerstone, and an import-boundary test prevents accidental coupling. The lazy
imaging chunk remains approximately 1.02 MB gzip and is a future optimization target.

## ADR-041: Externally hosted immutable DICOM series

**Status:** Accepted

**Context:** The teaching stack is approximately 66 MB, should not be committed to Git or included
in the application precache, and needs the same content URLs in local, preview and hosted
environments.

**Decision:** Resolve series paths against `VITE_DICOM_BASE_URL`, defaulting to
`/assets/dicom/`. Host static de-identified Part-10 files with CORS and a manifest v0.2 containing
geometry, provenance, byte sizes and SHA-256 hashes. Keep the provider unspecified and verify local
or remote hosts with `dicom:verify`.

**Consequences:** Deployments can move imaging assets without changing course JSON, integrity can be
checked independently, and the binaries remain outside Git. A production URL and CORS-capable host
are required before deployment.

## ADR-042: Strict configuration-driven DICOM contracts

**Status:** Accepted

**Context:** The four deferred DICOM primitive types previously accepted record-shaped content with
ad-hoc fields, which allowed invalid slices, presets and assets to reach runtime code.

**Decision:** Define strict schemas for explore, guided, identify-region and measure. Use one-based
inclusive slice ranges, normalized image coordinates, inline presets and typed DICOM asset
references. Validate slice bounds, preset/tool references, geometry, calibration and reference-line
length against asset metadata before constructing an activity plan.

**Consequences:** Courses can author all four modes without React changes, malformed targets fail
with source paths during content loading, and primitive components remain generic.

## ADR-043: Physical-unit measurement grading

**Status:** Accepted

**Context:** Pixel distance is not a physical measurement without trustworthy spacing, and silently
assuming millimetres could mark an uncalibrated response wrong.

**Decision:** Require calibrated series metadata for graded measurement and treat Cornerstone's
reported unit as authoritative. Accept percent or absolute-millimetre tolerances. Grade slice and
value as separate items, but make any non-`mm` response ungradeable with score zero and an explicit
calibration explanation.

**Consequences:** Measurement results are deterministic and reviewable without making diagnostic
claims. Content authors must provide calibration and a target tolerance; unsupported units never
masquerade as learner error.

## ADR-044: Ordered guidance with an embedded checkpoint

**Status:** Accepted

**Context:** Guided inspection must keep the image visible while sequencing observable learner
actions, and some inspections need a scored comprehension check without becoming a separate player
step.

**Decision:** Model guidance as ordered conditions over slice range, preset, active tool,
interaction count or explicit acknowledgement. Allow one optional configured choice checkpoint in
the viewer panel. A guided primitive with a checkpoint uses answer completion; one without it uses
explored or viewed completion.

**Consequences:** Guidance remains configuration-driven and resumable, the viewer does not own
player progression, and checkpoint scoring uses the same assessment and reward pipeline as other
questions.

## ADR-045: Typed DICOM interactions and debounced slice events

**Status:** Accepted

**Context:** Imaging interactions need activity context for analytics and gamification, but rapid
scrolling can emit many slice changes and primitives must not mutate learner state directly.

**Decision:** Report slice, window, tool, region, measurement, requirement and viewer-lifecycle
interactions through primitive callbacks. The player maps them to typed learner events with activity
context. Configure slice-event debounce and tap-movement thresholds in `product.dicom`; keep grading
results separate from raw region events.

**Consequences:** DICOM actions participate in the ordered event pipeline without UI/state coupling,
high-frequency navigation is bounded, and product tuning requires configuration rather than
component edits.

## ADR-046: Nearby-first loading and reference-counted cache cleanup

**Status:** Accepted

**Context:** Loading all 125 slices concurrently delays useful work and can exceed mobile memory,
while multiple viewers may share the same series and must not evict each other's images.

**Decision:** Render the initial slice first, prefetch the configured radius by distance, then drain
the remaining queue with bounded concurrency. Cap Cornerstone's cache from `product.dicom`, cancel
work on unmount, reference-count series users and release cached image objects after the final
viewer unmounts. Treat WebGL context loss as recoverable viewer failure.

**Consequences:** The learner sees a useful image before full-stack loading, network pressure and
memory are bounded, and cleanup is deterministic. Phase 7 remains responsible for durable
download/quota management.

## ADR-047: Responsive immersive viewer and explicit skip semantics

**Status:** Accepted

**Context:** Mobile inspection needs more canvas space, iOS may not support element fullscreen, and
a failed external study must not dead-end a lesson or ambiguously affect its score.

**Decision:** Use the Fullscreen API where available and a safe-area-aware fixed overlay otherwise.
Keep prompt/actions in an accessible bottom sheet, resize on orientation changes and honor reduced
motion. On unrecoverable load failure, Skip completes unscored steps and submits scored steps with
zero; the summary already treats absent scores as zero.

**Consequences:** One viewer works across desktop and mobile emulation with explicit recovery.
Physical Android/iOS gesture, fullscreen and memory-pressure validation is deferred to Phase 9 and
tracked in its device checklist.

## ADR-048: Educational-only normal-anatomy ground truth

**Status:** Accepted

**Context:** Initial identify and measurement targets were not supplied by a subject-matter expert,
but the phase needed concrete calibrated content to verify the complete learning runtime.

**Decision:** Author targets from de-identified pixel data on unambiguous normal tracheal anatomy,
derive the measurement from declared pixel spacing, label every DICOM primitive educational-only
and document the target generation. Require later SME review before clinical or customer use.

**Consequences:** The runtime has reproducible region and length fixtures without implying
diagnostic validity. The current 17.6 mm reference and region remain explicitly provisional pending
SME approval.

## ADR-049: Verified downloads alongside passive DICOM caching

**Status:** Accepted

**Context:** The Phase 6 runtime cache made visited studies resilient but did not prove that a whole
course was complete or intact.

**Decision:** Retain the expiring `dicom-studies-v1` cache as a best-effort performance layer and add
`offline-courses-v1` for explicit downloads. Only fully verified entries in the latter contribute
to offline-ready status. Verify and promote matching passive entries when possible.

**Consequences:** Normal viewing stays fast and explicit downloads have a stronger guarantee, at
the cost of two caches and reconciliation logic.

## ADR-050: Inject-manifest service worker

**Status:** Accepted

**Context:** Generated Workbox routing could not express verified-first lookup, cache-only demo
mode, media range responses and custom update messages together.

**Decision:** Use VitePWA `injectManifest` with a typed custom worker. Precache the shell, serve the
verified cache first, then use the passive DICOM strategy or network.

**Consequences:** Worker behavior is explicit and testable, but Workbox modules and a separate
WebWorker TypeScript project are maintained directly.

## ADR-051: Device-scoped offline library

**Status:** Accepted

**Context:** Offline files belong to a browser installation, while learner progress may be reset,
seeded or eventually synchronized between devices.

**Decision:** Persist download records in a separate `offline-library` Zustand/IndexedDB store and
remove `offlineDownloads` from learner state v4.

**Consequences:** Demo resets cannot orphan or delete large caches, and device storage remains
independent from learner-domain reducers.

## ADR-052: Asset manifest v0.2 integrity contract

**Status:** Accepted

**Context:** Reliable size estimates, quota checks and verification require immutable metadata for
every downloadable response.

**Decision:** Require `offlineAvailable` and exact `sizeBytes` for every asset and lowercase
SHA-256 for non-DICOM assets. Keep per-file DICOM digests in hosted series manifest v0.2.

**Consequences:** Content validation catches stale local assets and download readiness can be
derived without course-specific code. Asset changes require regenerating metadata.

## ADR-053: Derived lesson offline readiness

**Status:** Accepted

**Context:** A course-level downloaded flag cannot explain which lessons need large assets or remain
usable from the shell alone.

**Decision:** Walk explicit and typed primitive asset references to derive packages and per-lesson
requirements. Gate a disconnected route only when one of its required downloadable assets lacks a
current verified record.

**Consequences:** Offline behavior follows authored content automatically and shell-only lessons
remain available without a course download.

## ADR-054: Storage, eviction and removal policy

**Status:** Accepted

**Context:** Browser quota and eviction are implementation-defined, and assets can be shared by more
than one course.

**Decision:** Check estimated free space with a configured safety margin, request persistent
storage, map quota failures to recovery UX, reconcile records with cache keys at startup and delete
only URLs unreferenced by another available course.

**Consequences:** Downloads fail early when possible, eviction is repairable and shared data is not
removed prematurely. Browser quota enforcement still requires adapter tests.

## ADR-055: Engagement-gated install and update prompts

**Status:** Accepted

**Context:** Immediate installation prompts are disruptive, while waiting workers can leave stale
content controlling the application.

**Decision:** Offer installation only after configured lesson engagement, honor a local dismissal
cooldown, provide iOS Safari instructions and expose waiting-worker reload and offline-ready notices.

**Consequences:** Browser use remains primary, installation is contextual and updates are explicit.

## ADR-056: Service-worker-enforced simulated offline mode

**Status:** Accepted

**Context:** Sales and development sessions need a repeatable offline demonstration without relying
on browser developer tools.

**Decision:** Persist a simulated-offline flag in worker IndexedDB. While active, the worker serves
only precached or verified responses and rejects network fallbacks; clients receive state updates.

**Consequences:** The demo exercises the real cache boundary. It is intentionally restricted to the
URL-only developer control.

## ADR-057: Lazy Motion boundary

**Status:** Accepted

**Context:** Phase 8 needs consistent, preference-aware interface motion without adding the full
animation runtime to every route or allowing ad-hoc timings to spread through components.

**Decision:** Use Motion through one application-level `LazyMotion` boundary with `domAnimation`
and `m.*` components. Resolve System, Reduced and Full preferences in `MotionProvider`, publish the
result as `html[data-motion]`, and keep durations and easing in design tokens.

**Consequences:** JavaScript and CSS motion share one accessibility policy, normal transitions use
the same presets, and unused Motion features stay out of the entry bundle.

## ADR-058: Device-scoped presentation preferences

**Status:** Accepted

**Context:** Motion and vibration are properties of the current device and browser rather than
learner progress. Demo-seed resets must not unexpectedly change them.

**Decision:** Keep motion mode, haptics enablement and install-prompt dismissal in a dedicated
persisted Zustand store. Migrate the legacy preference object, remove the unused sound setting and
do not include these fields in learner state.

**Consequences:** Presentation choices survive learner resets, unsupported haptic controls can be
hidden, and future learner-state synchronization cannot overwrite device behavior.

## ADR-059: Validated presentation-effect configuration

**Status:** Accepted

**Context:** Haptic patterns, celebration moments, confetti density and XP count-up thresholds are
product choices that must be tunable without changing primitive UI.

**Decision:** Add an optional, defaulted `presentation` block to app configuration. Load
`canvas-confetti` dynamically only for configured milestone events and skip it for reduced motion.
Keep animation mechanics in design code and product values in validated content.

**Consequences:** Existing content remains valid, effects are centrally tunable, confetti remains a
separate lazy chunk and course-specific React branches are unnecessary.

## ADR-060: Event-subscribed haptics

**Status:** Accepted

**Context:** Direct vibration calls from questions or primitives would couple learning UI to device
APIs and could duplicate pulses during rapid event bursts.

**Decision:** Subscribe one presentation-effect handler to typed learner events. Map correct
answers, badge unlocks and challenge completions to configured vibration patterns, check the device
preference and API support, and throttle repeated pulses.

**Consequences:** Primitives remain callback-only, haptics follow the same event vocabulary as
gamification and unsupported or opted-out devices remain silent.

## ADR-061: Route-level splitting and enforced bundle roles

**Status:** Accepted

**Context:** Adding motion and resilience UI risked exceeding the Phase 7 entry size while the
Cornerstone boundary and optional confetti needed independent regression protection.

**Decision:** Lazy-load every learner, player and developer route. Enforce gzip limits by bundle
role for the entry, imaging controller and confetti chunk as part of `npm run check`.

**Consequences:** The entry is substantially smaller than the Phase 7 baseline, DICOM remains
isolated, celebration code loads on demand and future growth fails the standard quality gate.

## ADR-062: Responsive navigation and artifact workspace

**Status:** Accepted

**Context:** The mobile tab bar wastes desktop space, scientific artifacts need more landscape
room, and hiding DICOM instructions in a sheet on large screens interrupts guided work.

**Decision:** Move primary navigation into the header at large widths, retain the bottom bar below
that breakpoint, render DICOM instructions in a persistent desktop side pane and provide
Fullscreen API expansion with a fixed, safe-area-aware fallback for supported artifacts.

**Consequences:** Navigation matches viewport scale, instructions remain visible beside clinical
images and video, hotspot, compare and DICOM artifacts can use the available screen without
forking course content.

## ADR-063: Action-oriented resilience contract

**Status:** Accepted

**Context:** Loading, empty and failure states were implemented inconsistently, and several errors
described a problem without giving the learner a valid next action.

**Decision:** Standardize designed loading, empty, inline notice and error components. Every
substantial artifact reserves space while loading, and each supported error maps to recovery
actions owned by the surrounding route or player, including retry, continue/skip, reload, home,
storage management or reset where appropriate.

**Consequences:** Asset, primitive, content, DICOM, offline, quota and route failures are
distinguishable and recoverable without letting primitives mutate progression or gamification
state.

## ADR-064: Registry parity defines showcase completeness

**Status:** Accepted

**Context:** PRD section 75 names 18 important showcase categories, while the runtime has evolved to
25 registered primitive types and some types have materially different modes. Treating the original
number as a fixed target could leave implemented runtime behavior outside the durable QA fixture.

**Decision:** Keep the PRD list as the minimum product-category trace, but define technical
showcase completeness as parity with `primitiveTypes`, strict schemas, definitions and lazy
components. Include more than one configured example only when a single type has meaningfully
different interaction modes, such as exploratory and assessed image hotspots.

**Consequences:** Adding a primitive type requires adding showcase content and causes the parity
test to fail until that happens. The current fixture will contain all 25 registered types across 26
steps after adding the missing guided DICOM mode.

## ADR-065: Physical-device QA remains a separate release gate

**Status:** Accepted

**Context:** Desktop Chromium can emulate target dimensions, touch input, reduced motion and network
loss, but it does not reproduce mobile browser installation, iOS safe-area/fullscreen behavior,
physical vibration, operating-system lifecycle pressure or real multi-touch arbitration reliably.

**Decision:** Complete and retain automated and emulated-browser evidence independently, but do not
mark Phase 9 complete until the scripted Android Chrome and iOS Safari/installed-app runs pass or an
authorized release approver records an explicit waiver.

**Consequences:** Agent-executable work can finish without creating false device confidence. Phase 9
stays active with P9-M01 through P9-M03 open, and each physical run uses the shared evidence template
so defects and waivers are auditable.

## ADR-066: Phase 10 is a case-game capability demo

**Status:** Accepted

**Context:** The roadmap defined Phase 10 as a prospect-specific Sanofi course that runs without
runtime code changes. A prospect's example brief instead describes a case-based diagnostic game:
3D anatomy, clue layers, drill-down localisation, composite scoring with speed, difficulty tiers,
multiplayer and segmented analytics. It is an example of possible future requirements, not a
contract, and the immediate goal is a demo of relevant capabilities using sample internet assets.

**Decision:** Redefine Phase 10 as the Case Lab capability demo. It adds runtime capabilities (a case
content type, a case player, 3D anatomy, drill-down localisation, clue-linked feedback, timing and
composite scoring) and demonstrates them with three respiratory sample cases plus a daily quick
case. Multiplayer, segmented leaderboards, a backend, DICOM inside cases, offline 3D and clinical
review are excluded.

**Consequences:** The "no runtime code changes" exit signal no longer applies to Phase 10. It now
applies to adding a further case once the capability exists. Phase 9 physical-device gates stay
open in parallel, and 3D device evidence joins them.

## ADR-067: Cases are first-class documents composed of primitive stages

**Status:** Accepted

**Context:** A case needs a patient profile, a clue catalogue, staged progression, tier rules and
an expert benchmark. Modelling it as an ordinary lesson would hide those concepts in conventions
that cannot be validated, while a bespoke case screen would violate the configuration-driven rule.

**Decision:** Add a validated case document listed in the content manifest, and a `caseLab`
section in app configuration. A case contains ordered stages (orient, observe, interpret,
diagnose), and each stage contains ordinary primitives plus references to the clues it exposes.
Clues are themselves primitives. Play uses a new `case` activity kind that wraps the existing step
player with a stage shell, clue board and resumable case session.

**Consequences:** All 25 existing primitives are reusable inside cases, and case structure is
validated before UI. Activity-kind unions in plans, sessions, events and state widen, and the
event pipeline gains case events.

## ADR-068: Clue catalogue with clue-linked feedback

**Status:** Accepted

**Context:** The brief requires every wrong answer to point to the specific clue that should have
been read. Existing feedback has one explanation per step; only scenario choices carry
per-response text.

**Decision:** Scored steps inside a case may declare `clueIds` as their default evidence. Choice
options, image or anatomy regions and scenario choices may override this per response. References
must resolve to clues in the same case; outside a case they are a validation error. The feedback
panel names the missed clues and offers to reopen them.

**Consequences:** Feedback becomes evidence-oriented without new per-primitive UI. Authors carry
extra reference work, which semantic validation keeps consistent.

## ADR-069: Configured composite case scoring

**Status:** Accepted

**Context:** Case scoring combines anatomical precision, diagnostic precision and speed, and the
agreed design penalises opening optional clues. Tiers differ in timing: none, a stopwatch or a
countdown.

**Decision:** A pure case scoring engine computes anatomy and diagnosis from first-attempt
fractional step scores grouped by stage component. Speed blends active per-step elapsed time with
total case time against configured targets. The clue penalty is applied per optional clue opened.
Weights default to 40/40/20, and when a tier has no timer, the speed weight is redistributed
proportionally. Weights, targets, penalty, cap and tier presets live in `caseLab` configuration.
Active elapsed time pauses while the page is hidden, consistent with ADR-030.

**Consequences:** Scores are deterministic, testable and explainable in the results breakdown.
`question_answered` gains optional `elapsedMs`. XP remains a pipeline rule fed by `case_completed`
rather than a component calculation.

## ADR-070: Lazy three.js anatomy boundary with online-only models

**Status:** Accepted

**Context:** The demo needs real 3D anatomy with orbit, picking, fly-through and an endoscopic camera
on phones, tablets and desktops. A 3D runtime is large, and the existing Cornerstone boundary has
proven the lazy imperative-controller pattern.

**Decision:** Use plain three.js (GLTF loading, orbit controls, raycast picking) behind
`src/anatomy3d/three/createAnatomyController.ts`, the only module allowed to import `three`. Do not use
React Three Fiber. Add a `model` asset type for GLB files, a reference-counted model cache and
explicit disposal, and a dedicated bundle-budget role. Models are online-only for this phase. Mount
the imperative renderer into a dedicated empty child element; React-owned loading and error
overlays remain sibling nodes and are never children of the controller's mount.

**Consequences:** The entry chunk is unaffected, and 3D follows the same review, testing and cleanup
rules as imaging. React reconciliation cannot remove or reorder the controller-owned canvas.
Offline packaging and physical-device 3D evidence are deferred.

## ADR-071: Configured anatomy hierarchy, waypoints and drill-down localisation

**Status:** Accepted

**Context:** Localisation must drill through anatomical levels with partial credit, and the engine
must remain organ-agnostic for future systems. Free models rarely provide bronchopulmonary segments
or airway centrelines.

**Decision:** An anatomy map document declares the model, ordered hierarchy levels with configured
labels, structures bound to mesh names and an authored airway waypoint graph. `anatomy_explore`
provides orbit and branch-by-branch fly-through. `anatomy_locate` grades each configured level
independently with configurable level weights. Levels accept model picks, normalised image regions
(reusing ADR-031) or choices, so 3D stops at lobe depth and finer levels use 2D. Every 3D selection
also has a keyboard and list alternative.

**Consequences:** A new organ system needs only a new map, model and content. Partial credit works
with the existing fractional scoring. Fly-through quality depends on authored waypoints rather
than geometry extraction.

## ADR-072: Local case attempts and benchmark comparison

**Status:** Accepted

**Context:** The Compare step needs something to compare against, but multiplayer and backends are
out of scope.

**Decision:** Each case document carries a seeded expert benchmark (path, clues opened, time and
score breakdown). Learner state v5 keeps a bounded per-case attempt history for own-history
comparison and migrates v4 snapshots. The advanced demo seed includes one prior attempt so
comparison is visible immediately.

**Consequences:** Compare works offline and deterministically. The attempt record defines a format
a future backend could store for asynchronous duels without changing the results UI.

## ADR-073: Autovrse LevelUp branding is limited to identity tokens

**Status:** Accepted

**Context:** The demo should present as an Autovrse product. A full re-theme would risk the Phase 8
contrast, motion and layout evidence.

**Decision:** Rename the application to "Autovrse LevelUp" in configuration and the PWA manifest,
add the Autovrse logo, regenerate icons and map accent tokens to the autovrse.com purple palette
(observed `#5C4ACF`, `#8564D4`, `#7E48B7`, with `#C46DD2` limited to large or decorative use unless
it passes AA). Typography stays Inter, which autovrse.com also uses.

**Consequences:** Branding changes are confined to configuration, tokens and static assets. Contrast
is re-audited only for changed tokens.

## ADR-074: Separate Case Lab capability completion from demo readiness

**Status:** Accepted

**Context:** Phase 10 completed the reusable Case Lab contracts, player, anatomy boundary, sample
content and automated flow coverage. A subsequent client-demo audit found 52 issues, including
eight P0 blockers and twenty P1 defects. Real canvas picking, branch navigation, pathology
discovery, mobile hit-testing, timing and clue semantics, result truthfulness and physical-device
acceptance were not established by automated completion or Chromium no-overflow checks.

**Decision:** Retain Phase 10 as the completed technical capability foundation, but do not treat it
as client-demo approval. Add Phase 11 to produce one five-minute golden exacerbation path and fix
shared-engine P0/P1 defects, including the P2 issues necessary for that path's coherence and
delivery. Add Phase 12 for remaining case breadth, learning depth and presentation polish. Keep
P9-M01 through P9-M03 as the sole physical Android/iOS release gate; neither later phase may infer
device approval from emulation.

**Consequences:** Roadmap status distinguishes architecture completion from experience readiness.
Every audit finding maps to a phase and task in
`docs/qa/phase-10-demo-readiness-audit.md`. Demo approval now requires meaningful 3D evidence,
truthful lifecycle and scoring behavior, real-WebGL coverage and a rehearsed build, while broader
Case Lab refinement can proceed without obscuring the immediate golden-path blockers.

## ADR-075: Production-preview WebGL acceptance boundary

**Status:** Accepted

**Context:** Phase 10 browser-flow tests replaced the anatomy runtime with an unavailable-viewer
double. They proved route and fallback behavior but could not detect broken raycasting, canvas
input, renderer startup or patient-finding projection. The Phase 11 repair sequence needs one
stable browser boundary before those behaviors change.

**Decision:** Use Playwright against a fresh production build served by Vite preview on fixed port 4181. Block service workers in every context, apply the advanced seed before each test, and run
Chromium projects at 1440×900 and touch-enabled 375×812 with SwiftShader WebGL launch flags. An
optional `window.__anatomyTest` bridge exists only when the build-time `VITE_E2E` value is `true`.
The typed bridge reports renderer diagnostics and projected viewport coordinates for configured
structures, findings and markers; normal production builds do not install or retain the global.
Keep the real-WebGL seeded smoke and screenshot active now. Add executable skipped specifications
for picking, marker retention, branch traversal, configured findings and the complete golden path,
then enable each assertion in its owning Phase 11 task.

**Consequences:** `npm run test:e2e` owns its build and preview lifecycle and fails if its dedicated
port is occupied or WebGL cannot start. Browser binaries are an explicit local/CI prerequisite.
The current suite establishes real renderer startup on both target emulations without pretending
that downstream defects are fixed; later tasks must remove their corresponding skips rather than
replace the canvas with mocks.

## ADR-076: Case assessment and finding contracts

**Status:** Accepted

**Context:** Case result construction previously treated every planned step as assessed. An
unscored exploration step inside an anatomy stage therefore contributed a zero to the anatomy and
per-step speed means, appeared in persisted step results and was shown against an expert response.
The generic player also started its per-attempt elapsed tracker for every supported step even when
the primitive definition marked that step unscored. The same exploration path also lacked a
validated way to describe patient-specific spatial findings: adding disease-specific React or
Three.js branches would couple one demo case to the shared runtime and leave clue, anchor and
completion references unchecked.

**Decision:** Treat the activity plan's resolved `step.scored` flag as the authority for question
timing and case assessment inclusion. Only scored steps start attempt timers, report timed
attempts, contribute to component or per-step speed means, enter persisted case step results and
appear in expert comparison. Continue to include all supported steps in progression, completion,
interaction events, primitive-completion events, resume state and total case duration. Scored
steps continue to use the first submitted score, response, timeout and elapsed duration.

Define findings at case scope with stable IDs, learner-facing labels and descriptions, normalized
severity, local clue references, one of four organ-agnostic kinds (`lumen_narrowing`,
`lumen_occlusion`, `wall_thickening`, `region`) and a discriminated anchor. Waypoint anchors
identify a directed `waypoint` → `toWaypoint` edge plus normalized `t`; structure anchors use
`structure` to identify a configured anatomy structure. Anatomy explore and locate steps opt into
findings by ID, and exploration may require finding inspection for completion. `buildCasePlan`
resolves those IDs into a typed per-step map supplied through an anatomy finding context rather
than adding course-specific component behavior.

Keep all visual parameters under `product.anatomy3d.findingStyles`. The generic Three.js controller
owns deterministic geometry, visibility, picking and projection: local lumen sleeves represent
narrowing or wall thickening, seeded clustered geometry represents occlusion, and translucent
overlays represent regions. React owns only configured labels, descriptions, equivalent controls
and status. Inspection emits the typed `anatomy_finding_inspected` learner event.

**Consequences:** `anatomy_explore` and any future definition-unscored case primitive can carry
completion requirements without lowering assessment results or creating misleading comparison
rows. Exploration still consumes total case time when the tier uses a case clock, while retries
cannot replace the first-attempt evidence used for scoring. Finding IDs, clue IDs, anchors,
directed waypoint edges and case/map alignment fail semantic validation before playback. New organ
systems and cases can reuse the same rendering contract, while clinical meaning and geometry
placement remain authored content. The generated overlays are illustrative and do not claim
patient-derived reconstruction.

## ADR-077: Shared anatomy interaction and navigation contract

**Status:** Accepted

**Context:** Anatomy interaction was split across loosely related controller calls. A raycast
against a lobe mesh also matched the respiratory-system aggregate because that parent
intentionally binds every respiratory mesh, while `flyTo` always restored the outside model and
therefore made an authored endoscopic route impossible to traverse. The viewer had no route
history, current-location context or explicit way to leave the lumen at the same waypoint.
Localisation also forced orbit navigation instead of honoring authored primitive settings.

**Decision:** Pass the viewer's currently selectable level IDs into controller picking. Resolve
ordered raycast mesh-name hits one hit at a time, considering only eligible structures and ranking
same-hit candidates by deepest `parentId` ancestry, then fewer bound mesh names, then structure ID.
Reject two structures on the same level that bind the same mesh, while allowing expected
aggregate-parent overlap across different levels.

Use the controller as the shared boundary for both outside and endoscopic navigation.
`travelTo(waypointId)` preserves the active view mode, records a reversible authored route and
exposes its parent/path context; `enterEndoscopic` and `exitEndoscopic` switch representations
without changing the current waypoint. Reduced-motion callers pass `animate: false`. The outside
view can frame all structures selectable at the current level. The endoscopic renderer builds
organ-agnostic tapered curves from waypoint position, look target and radius, with map-authored
ring counts and app-configured material, lighting, fog, bounded pointer look and ring appearance.
React owns labelled branch/back controls, breadcrumb and landmark context, orientation cues,
Outside/Airway mode controls and the collapsed equivalent structure list. Both anatomy primitives
pass their authored start view, navigation and marker configuration into that shared viewer.

**Consequences:** The nearest rendered hit remains authoritative, aggregate map structures remain
useful, and canvas picking deterministically selects the most-specific eligible structure.
Ambiguous same-level authoring fails before runtime. The real-WebGL acceptance check uses the
foundation case's stable visible surface after advancing to its lobe level because the current
golden case deliberately starts with the surface model hidden in endoscopic mode. Endoscopic
travel no longer leaks into outside mode, parent navigation retraces the actual route even in
graphs with shared descendants, and future organs can author the same waypoint/lumen contract
without controller branches. Procedural lumen visuals remain illustrative rather than
patient-specific anatomy and add no `three` import outside `src/anatomy3d/three`.

## ADR-078: Blocking case states pause one active-time model

**Status:** Accepted

**Context:** Question countdowns and elapsed-attempt tracking could start while a stage transition
covered the task, and the mobile clue sheet could continue consuming answer and case time while it
blocked the task. The case countdown also stopped at its authored maximum, so persisted duration
and results hid time spent after expiry. Untimed cases suppressed their clock entirely even though
their real completion duration remains useful.

**Decision:** `ActivityPlayer` accepts an explicit `pauseTiming` signal and applies it to both
active elapsed tracking and the authored attempt timer without resetting either timer. `CasePlayer`
owns the blocking-state aggregate: stage transitions and the open mobile clue presenter pause both
question timing and the case clock, while non-blocking desktop evidence remains available without
stopping time. Stage transitions use a focus-trapped Radix Dialog. Every fresh attempt presents the
first stage transition before its first task; resumed attempts return directly to their saved task.

All case clock modes track active elapsed duration. Countdown elapsed time is unbounded, remaining
time clamps to zero, expiry derives from actual elapsed time, and persistence retains the actual
duration after expiry. Untimed cases display elapsed time with an explicit “Speed not scored”
label; scoring continues to redistribute the configured speed weight and records zero speed.
Per-step timers remain limited to supported, definition-scored, timer-compatible steps with an
authored timer. Exploration and clue-reading countdown removal remains a content-authoring change
for P11-T11 rather than a case-specific runtime exception.

**Consequences:** Hidden questions cannot expire behind stage or mobile clue dialogs, and pausing
does not grant a fresh countdown. Case results and history can preserve truthful overrun duration,
while untimed learners still see elapsed progress without implying a speed score. The generic
runtime remains content-driven; P11-T11 must remove the unwanted authored countdowns from the
golden case's exploration and evidence-reading steps.

## ADR-079: Case-owned atomic clue presentation and first-open context

**Status:** Accepted

**Context:** Clue selection and the mobile sheet were owned by different components. Clue-first
entry could record evidence without showing it on a phone, the mobile trigger could display the
first clue without recording it, feedback reopen changed selection without opening the sheet and
selected evidence could leak across stages. Scoring also penalized every opened optional clue,
including evidence first opened as post-response remediation.

**Decision:** `CasePlayer` owns `{ selectedClueId, presenterOpen }` and exposes one
`presentClue(id, context)` action for `entry`, `browse` and `remediation`. The action selects and
visibly presents the clue, then records and emits only its first opening. `ClueBoard` is controlled;
its phone trigger opens the unselected list without opening a clue. Stage changes clear both
presentation fields. Persist each first opening's context and whether it preceded the current
response in session `caseProgress`; session v4 migrates older progress with an empty context map so
unknown legacy openings are not retroactively penalized.

Only optional clues whose first recorded context is `entry` or `browse` and whose opening preceded
the response contribute to the configured clue penalty. Remediation never creates a penalty, while
reopening a pre-response hint retains that hint's original scoring status.

**Consequences:** Mobile entry and remediation always show the same sheet whose visibility pauses
timing, desktop cards retain their inline presentation and one typed `case_clue_opened` event is
emitted per clue. Resume preserves first-open scoring semantics without guessing about legacy
sessions. General clue-consumption and permanent attempt-history context remain deferred to their
Phase 12 and P11-T10 contracts.

## ADR-080: Persist truthful case results and central rewards

**Status:** Accepted

**Context:** Learner-state v5 stored only aggregate case speed, then the saved-attempt route reused
that value as both step speed and case speed and recomputed clue penalties and weights from current
configuration. Results also displayed configured completion XP even when the central gamification
engine awarded revision, perfect-case or badge XP instead. Older records cannot supply the missing
facts without inventing them.

**Decision:** Learner-state v6 distinguishes legacy result-v5 records from complete result-v6
records. New records persist step speed, case speed, effective component weights, clue cost,
timing mode, whether speed was scored, normalized first responses and the actual XP from the
matching central gamification activity result. Migrated v5 records retain only known values and
the UI omits unavailable detail. Expert comparison resolves authored prompts, ignores unscored
steps, compares recursively key-sorted objects and order-normalized arrays, and may show validated
per-step benchmark rationales.

**Consequences:** Saved results no longer reinterpret history through current configuration or
duplicate aggregate speed values. Live and saved views can explain component points and rewards
from persisted facts, while legacy attempts remain usable with an explicit limitation. Current
attempt IDs are filtered from comparison history, including challenge-hosted case completion.

## ADR-081: Golden case is a focused six-task authored composition

**Status:** Accepted

**Context:** The advanced exacerbation case was a ten-minute, eight-task draft whose title and
repeated warning copy disclosed the intended diagnosis, whose first task skipped exploration, and
whose temporary focal narrowing did not support a complete spatial story. P11-T11 needs one
repeatable five-to-six-minute path without adding disease-specific runtime behavior or presenting
unreviewed sample content as clinically approved.

**Decision:** Author `exacerbation-advanced` as four stages and exactly six tasks: unscored
endoscopic exploration from the mid trachea, scored lobe/segment/structure localisation with no
finding overlay, one multi-select severity task, one CO₂ reasoning task, one diagnosis task and one
urgent-escalation consequence task. The exploration requires both arrival at the right lower lobe
posterior basal segmental waypoint and canvas inspection of its dominant configured mucus
occlusion. Add generic superior, lateral basal and posterior basal branch alternatives to the
shared lung map. Represent diffuse wall thickening with mild narrowing and the dominant occlusion
as case-configured findings linked to authored clues.

Use a neutral title, one disclaimer, a 300-second target, a 480-second maximum, no per-step timers,
authored benchmark responses/rationales, a debrief and one prior result-v6 advanced-seed attempt.
Keep the complete browser path deterministic: use real branch controls and projected finding
canvas interaction in both projects, while the separately retained P11-T03 check remains the
authoritative model-raycast localisation proof. Expose camera position, target and waypoint through
`?anatomyDebug=1` only in development builds. Record every clinical claim as unreviewed in the
focused QA ledger until named SME and client sign-off are supplied.

**Consequences:** The featured case now demonstrates the repaired runtime in a compact sequence
without hard-coded case behavior. The shared lung map gains illustrative segmental authoring
waypoints that other content may use, but their coordinates are not validated anatomy. Production
builds do not expose the authoring readout. Technical completion does not confer clinical approval;
external presentation remains conditional on the review recorded in
`docs/qa/phase-11-golden-case-content-review.md`.

## ADR-082: Hash-versioned featured-model preflight

**Status:** Accepted

**Context:** The featured case and the anatomy viewer loaded the same GLB through an unversioned
path, so a browser could not distinguish an updated response reliably and the case intro could not
verify that its exact model had been fetched. Pre-caching all 3D assets would exceed Phase 11 and
could imply unsupported offline-3D behavior. Demo operators also lacked an on-screen build
identifier for detecting a stale service worker.

**Decision:** Derive model request URLs from the validated asset SHA-256 and use that exact URL for
both featured-case prefetch and viewer loading. Apply a service-worker `CacheFirst` route only to
GLBs with a SHA-256 query version or a hash in the filename, with a dedicated cache limited to four
entries and 14 days. The featured case intro fully reads its configured anatomy model response and
reports preparing, ready or recoverable failure state without blocking the case CTA; unrelated
case intros do not prefetch.

Expose a client-visible build ID from configured `VITE_BUILD_ID`, CI commit metadata or a
deterministic digest of application/content build inputs. Keep the existing prompt update model:
a waiting worker is activated through `SKIP_WAITING` and reload, while a blocked/unsupported
registration clears stale update state without logging an expected capability failure.

**Consequences:** A successful featured-case preflight and the runtime viewer address the same
immutable model version, and old versions age out within explicit bounds. This is targeted
performance/freshness caching, not a guarantee that 3D works offline. Operators can compare the
visible build to deployment notes and follow a documented clean-origin recovery. Source changes
alter the fallback build ID reproducibly; deployments may supply their own traceable ID.

## ADR-083: Phase 12 closes Case Lab and the whole product demo

**Status:** Accepted

**Context:** Phase 11 established one credible Case Lab golden path, but the PRD's product demo also
depends on Home, pathway, lesson, DICOM, completion, challenge, leaderboard and profile. Keeping
Phase 12 limited to Case Lab would leave disabled Leaderboard periods, inert weekly-challenge cards
and no integrated browser proof or presenter script. The remaining anatomy-depth finding cannot be
implemented as segment meshes because the licensed GLB exposes only gross lobes and central
airways.

**Decision:** Expand Phase 12 to close both the 12 deferred Case Lab findings and the whole
learner-facing PRD section 80 tour. Establish scoring, timeout, clue and persistence contracts
before re-authoring cases; then add evidence synthesis, teaching debriefs, catalogue breadth,
metadata, offline packages and whole-product polish. Represent segment-level learning targets as
configured, pickable procedural volumes inside their parent lobes and add authored airway
waypoints. Keep bronchiole and alveolar depth as validated choices. Do not source a replacement
model.

**Consequences:** Phase 12 has one larger readiness gate, one runbook and one audience-specific
verdict instead of two partially polished demonstrations. Procedural segment regions remain
illustrative learning geometry and require explicit review language, overlap validation and
real-WebGL coverage. Clinical/client sign-off and Phase 9 physical Android/iOS evidence remain
external approval gates.

## ADR-084: Case speed is time-only for eligible first attempts

**Status:** Accepted

**Context:** The previous Case Lab formula multiplied per-step timing by answer accuracy and
multiplied case elapsed-time performance by mean anatomy and diagnosis accuracy. This mixed speed
and correctness twice, allowed low-quality responses to dilute the step-speed average and made the
displayed speed component difficult to explain.

**Decision:** Use `time_eligible` as the result-v7 speed model. A scored step is eligible for
per-step speed only when its first-attempt score is at least the configured
`caseLab.scoring.speedEligibility.minStepScore`, defaulting to `0.5`. Average time factors only
across eligible steps; retain the eligible and total scored counts, and return zero per-step speed
when none qualify. Timed-out eligible steps remain in that average with zero speed. Case speed is
the case elapsed-time factor alone. Untimed tiers continue to redistribute the configured speed
weight across anatomy and diagnosis.

**Consequences:** Accuracy remains represented by anatomy and diagnosis components while speed is
independently understandable. Fast wrong or sub-threshold steps receive no step-speed contribution,
but case-level time remains a pure clock measure. Result v7 persists the model, configured
threshold and eligible/total counts so saved results never reinterpret history through later
configuration; result-v5 and result-v6 attempts remain legacy records.

## ADR-085: Timeout credit is a primitive-definition policy

**Status:** Accepted

**Context:** `ActivityPlayer` previously forced every timer expiration to score zero even when a
multi-level primitive had valid committed progress. Implementing anatomy-specific timeout behavior
inside Case Lab would fork the shared player and make future primitive policies inconsistent.

**Decision:** Every resolved primitive definition exposes a pure `timeoutCredit` policy with a
default of `none`. `anatomy_locate` opts into `committed_progress`; on expiry the shared player
evaluates its current draft through the existing primitive evaluator, which awards weighted credit
for valid completed levels and marks missing levels as missed. The submission remains timed out and
its step-speed factor is zero. Definitions using `none` retain forced zero-on-timeout behavior.

Session v5 also initializes local Phase 12 placeholders for reviewed clue IDs, pinned clue/finding
evidence, current waypoint/structure and differential confidence. Learner state and result v7
persist those fields plus whether committed-progress timeout handling was applied. Migration adds
empty session placeholders where required but does not synthesize unavailable facts into legacy
result-v5 or result-v6 attempts.

**Consequences:** Timeout scoring remains generic, deterministic and testable without a second case
engine. Localisation can preserve demonstrated progress while maintaining an explicit timeout and
zero step speed. Future primitives must opt in deliberately; existing primitive behavior is
unchanged by default.

## ADR-086: Clue review is distinct from clue opening

**Status:** Accepted

**Context:** Opening a clue currently records its scoring context and optional-clue penalty, but it
does not prove that the learner consumed the evidence. Treating the two actions as equivalent also
makes result debriefs overstate reviewed evidence, while stage-scoped clue counts change as the
learner progresses and obscure the stable size of the case catalogue.

**Decision:** Keep ADR-079 opening and penalty semantics unchanged, and add a separate idempotent
review transition. Configure the review thresholds at `caseLab.clueReview`: static clues require an
uninterrupted visible dwell, media clues require primitive completion or configured playback
progress, and interactive visual clues require a primitive interaction or completion signal.
`CasePlayer` persists reviewed clue IDs in the existing session-v5/result-v7 fields and emits one
typed `case_clue_reviewed` event per clue per case session. Sessions migrated from versions before
v5 start with no reviewed clues.

Display a stable `Case: reviewed/total` count from the complete case clue catalogue and a separate
stage-availability count. Cards expose unopened, opened and reviewed states. Tiers with
`labelEssentialClues: false` expose neither essential/recommended nor optional labels. Results
derive missed key evidence from reviewed clues rather than opened clues.

**Consequences:** Opening remains the auditable hint-cost action while review becomes the durable
evidence-consumption fact. Resume preserves reviews without emitting duplicate events, and
remediation can open a clue without claiming it was reviewed. Existing result-v5/v6 records remain
readable but cannot prove review, so their missed-evidence display conservatively treats key clues
as unreviewed.

## ADR-087: Procedural ellipsoids extend anatomy depth

**Status:** Accepted

**Context:** The licensed lung GLB exposes gross lobes and central airways but no bronchopulmonary
segment meshes. Replacing it would add provenance, download and visual-regression risk, while
hard-coded respiratory geometry would violate the organ-agnostic runtime boundary. Illustrative
coordinates also cannot support brittle claims of exact physical containment.

**Decision:** Make anatomy structures an exclusive union of existing non-empty mesh bindings and
configured procedural ellipsoid volumes. Validate each volume against its resolved hierarchy and
the available authoring envelope: child axis extremes must fit a volume ancestor, while volumes
under mesh ancestry must fit the model asset bounds. Apply configured tolerance to this approximate
fit and reject same-level volumes whose center-line penetration ratio exceeds the configured
overlap tolerance.

Render volumes only when their level is selectable, retain the nearest mesh ancestor at configured
faded opacity and keep picking, highlighting, framing, projection and disposal inside the shared
Three.js controller. Configure all material, tessellation and validation values under
`product.anatomy3d`. Author 18 illustrative lung-segment volumes and corresponding airway branches;
use the right upper apical volume in the foundation localisation while retaining the advanced
golden case's existing choice IDs.

**Consequences:** Segment-level spatial selection works without changing or duplicating the GLB,
and the runtime remains configuration-driven and organ-agnostic. Validation catches missing
parents, out-of-envelope volumes and excessive same-level overlap, but model-bound checks are an
authoring safeguard rather than anatomical segmentation proof. The added regions and airway paths
remain illustrative and require anatomy/clinical review before external claims.

## ADR-088: Case notes are local reflective evidence

**Status:** Accepted

**Context:** Case Lab needs a compact way to retain reviewed evidence, preserve spatial context and
revise a small authored differential without turning the learning runtime into clinical
decision-support or adding a synchronized notes backend. Session v5 and result v7 already reserve
evidence, current-location and differential fields, but no authored hypothesis contract or
learner-facing workspace populates them.

**Decision:** Allow an optional top-level case `differential` with at least two uniquely identified
learner-facing hypotheses; three to four are the authoring recommendation. Present clues and notes
as tabs in the desktop right rail and as separate Clues and Notes actions in the mobile bottom bar.
Only reviewed clues and inspected configured findings may be pinned. Reopening a pinned clue uses
the existing remediation context, so the action cannot add a clue penalty.

Derive current location while a case is active from typed anatomy waypoint and structure events,
persist the stable reference in session v5 and resolve only configured structure or waypoint labels
for display. Unknown references use neutral fallback copy rather than exposing raw IDs. Infer
finding inspection from persisted primitive interaction keys. Differential confidence is one of
`unlikely`, `possible` or `likely`; updates and pin transitions emit typed
`case_hypothesis_updated` and `case_evidence_pinned` events. Mobile notes are blocking UI and pause
case and step clocks; the desktop rail remains non-blocking. Stage transitions prompt review when
a differential exists but never require it.

**Consequences:** Evidence synthesis remains local, authored, reflective and unscored. Session
resume and result-v7 completion preserve exactly what the learner recorded, while older migrated
sessions retain the empty placeholders established by ADR-085. The runtime stores stable IDs for
referential integrity but never renders unresolved identifiers to learners.

## ADR-089: Case teaching is authored and reference-safe

**Status:** Accepted

**Context:** Case results identified missed clues only by title, while comparison showed score and
per-step differences without explaining the expert's reasoning path, evidence weighting or
diagnostic synthesis. A teaching debrief also needs to include configured findings, connect
evidence to affected tasks and remain truthful for legacy attempts that predate reviewed-clue and
evidence persistence.

**Decision:** Replace `debrief.keyClueIds` with non-empty typed `keyEvidence` entries containing a
clue or finding reference, affected step IDs and authored significance text. Require every
learner-visible case task to have an expert rationale. Add a strict ordered expert path of
`{ label, detail }`, typed evidence weights and notes, and an authored diagnosis rationale.
Semantic validation resolves all teaching references and rejects evidence that is not exposed
through a case stage.

Results render labelled key-evidence cards with learner review or inspection state, affected task
labels and links into comparison. Evidence review is a read-only remediation sheet: clue content
uses the shared renderer without opening, review or penalty mutations, while findings show their
configured description. Comparison presents expert approach, weighted evidence, diagnosis
reasoning and then the existing first-response task comparison. Result-v7 data drives current
status and differential ratings; result-v5/v6 remains readable and reports unavailable status
instead of inventing history.

**Consequences:** Teaching content remains deterministic, validated and independent of React.
Authors must now supply complete rationale, path, evidence-weight and debrief fields for every
learner-visible case. Stable IDs remain persistence and reference keys but are resolved to authored
labels before learner presentation.

## ADR-090: Catalogue semantics are executable content contracts

**Status:** Accepted

**Context:** The non-golden catalogue still exposed diagnosis names in entry copy, repeated
educational warnings, inert entry configuration, overlong task sequences and benchmark breakdowns
that could drift from the production scorer. Existing semantic validation resolved references but
did not prove that a stage contained work, that an orient primitive consumed the configured entry,
that every clue contributed to the case, or that benchmark numbers followed from authored
responses and timing facts.

**Decision:** Re-author the foundation, intermediate and daily cases as synthetic,
configuration-only compositions with one case-summary disclaimer, neutral entry copy, required
unscored anatomy observation and five-to-six tasks for full cases or three for the daily case.
Preserve the advanced golden case's exact six tasks, route, findings, timing and tested prompts.
Require every stage to contain a step, every entry mode to be consumed by an anatomy primitive in
the orient stage, every clue to be referenced by stage/step evidence, findings or teaching, and
every learner-visible task to have an authored benchmark response and rationale.

Add explicit benchmark `stepTimings` with elapsed milliseconds and timeout state for every scored
task. Evaluate benchmark responses and pass the resulting scores and timing facts through the
production pure case scorer; reject any authored anatomy, diagnosis or speed component that differs
from recomputation. Seed one unique result-v7 attempt for foundation, intermediate and advanced
with normalized first responses, speed eligibility, reviewed clues, evidence and differential
state. Keep all four clinical claim ledgers explicitly unreviewed.

**Consequences:** Catalogue intent is enforceable rather than dependent on review convention, and
benchmark displays cannot claim unsupported scores. Authors must provide complete timing facts even
for untimed-tier benchmark tasks because those records make scoring inputs explicit and future
changes auditable. The configured findings and clinical teaching remain illustrative drafts;
technical validation does not confer clinical, anatomy or legal approval.

## ADR-091: Period rankings and challenge continuation are derived

**Status:** Accepted

**Context:** The leaderboard exposed disabled monthly and all-time controls, and weekly challenge
cards reported progress without a continuation path. Historical cohort data also needs to remain
compatible with older configuration that supplied only weekly XP.

**Decision:** Add optional validated monthly and lifetime XP snapshots to each strict leaderboard
row. Missing values fall back to the nearest available period, while the current learner uses live
weekly XP, live total XP and a monthly value derived from its configured snapshot plus subsequent
XP. Rank and visible-window selection are recalculated for the selected period; movement is shown
only for weekly data because that is the only period with authored previous-rank history.

Resolve each weekly challenge action through a pure criterion-to-activity function. It selects the
next unlocked, incomplete matching lesson or case and never routes to a locked activity. Criteria
without a specific eligible target use an honest Learn or Challenge collection destination.
Completion screens share compact stars, awarded-XP, mastery and badge outcomes; unavailable saved
case facts are labelled unavailable rather than inferred.

**Consequences:** All leaderboard tabs and weekly cards are actionable without hard-coded content
IDs. Older leaderboard configuration remains readable, new period data is strictly bounded and
ordered, and completion presentation does not manufacture rewards that were not persisted.

## ADR-092: Offline packages are kind-aware and integrity-verified

**Status:** Accepted

**Context:** Course downloads already provided quota checks, persistent-storage requests, bounded
concurrency, SHA verification, cancellation, resumption and shared-URL retention. Case Lab's
separate model preflight used an expiring runtime cache and did not establish that a case's model,
patient image or evidence assets were complete before offline launch. A parallel case downloader
would duplicate storage policy and risk conflicting ownership of shared assets.

**Decision:** Generalize the existing package record and manager to `course` and `case` kinds while
retaining course IDs as their existing record keys and namespacing case keys. Derive a case package
purely from its case document, anatomy map and asset registry: include the hash-versioned model,
optional patient image, clue primitive assets and stage primitive assets; deduplicate by asset ID;
and fingerprint the case version plus each exact asset ID, SHA-256 and byte size.

Models remain `offlineRequired: false` and opt into downloads only through
`offlineAvailable: true`. Store every verified package response in the existing verified cache.
The service worker checks that cache before its bounded versioned-model runtime strategy. Readiness
requires a matching kind, ID, available status and current fingerprint. Reconciliation marks
fingerprint drift or browser eviction, updates remove obsolete unreferenced URLs, and removal
retains URLs referenced by another ready course or case.

**Consequences:** Case Lab gains the same quota, integrity, persistence, progress, retry, repair,
cancel and removal behavior as courses without a second implementation. A downloaded case can
launch under the worker's simulated-offline mode and an undownloaded or stale case cannot. Shared
models occupy one verified cache entry until their final package reference is removed. The existing
`offline-courses-v1` cache name is retained for deployed-cache continuity even though its contents
are now generic verified packages.

## ADR-093: Browser quality evidence follows runtime state

**Status:** Accepted

**Context:** Static component checks did not prove accessibility across every configured Case Lab
stage, nested localisation level or scenario consequence. Browser emulation also needed repeatable
text-resize, keyboard and recovery evidence without presenting SwiftShader frame timing as
hardware-GPU performance.

**Decision:** Drive all four catalogue cases from their validated documents and run axe-core at
each stage, step, feedback, nested level, scenario and result state on desktop and 375 px touch
projects. Test 200% text resizing by setting the root font size while retaining viewport dimensions,
and keep keyboard interaction on semantic controls, including the list equivalent for canvas
selection. Expose a development-only anatomy readout under `?anatomyDebug=1` using the median of the
latest 120 animation-frame intervals and renderer diagnostics. Keep deterministic WebGL context,
failed-model retry and session-resume checks in the production-preview browser boundary.

**Consequences:** New catalogue states and stable learner routes have an executable WCAG A/AA
regression gate, and layout/recovery regressions are checked on both configured viewports. Frame
intervals describe observed presentation cadence rather than GPU execution time; automated
SwiftShader results remain distinct from headed workstation and physical-device evidence.

## ADR-094: Runtime content validation executes off the main thread

**Status:** Accepted

**Context:** Lighthouse attributed the remaining Home mobile deficit primarily to main-thread
script evaluation. The runtime content loader imports strict schemas, primitive definitions,
scoring and semantic checks and must complete before any learner route renders. Removing or
deferring validation until after Home would weaken correctness and eager error handling.

**Decision:** Run the existing content fetch and complete validation pipeline in a module worker.
Keep `ContentProvider` as the route gate, structured-clone the validated registry and identifier
maps back to the main thread, and serialize/reconstruct `ContentValidationError` issues for the
existing eager error screen. Retain a direct asynchronous loader fallback where Worker is
unavailable. Include the generated worker in the service-worker precache so online and offline
startup use the same validated boundary. Load celebration dialog/effects code only when persisted
state contains a pending celebration.

**Consequences:** Schema and semantic evaluation no longer blocks Home's main thread, while no
unvalidated content reaches UI or learner state. Worker startup adds a small module request and
structured-clone cost, but the asset and content remain available offline. Optional celebrations
may appear after their lazy chunk resolves, while their persisted queue prevents loss.

## ADR-095: Phase 13 is an evidence-led guided Case Lab redesign

**Status:** Accepted

**Context:** Phase 12 proved the configured runtime, four respiratory cases, spatial primitives,
evidence notes, scoring and expert comparison. A fresh trainee-doctor walkthrough nevertheless
completed the advanced case with 100% Anatomy and Diagnosis after reviewing only one of five clues,
then showed every differential hypothesis as `Not rated`. The player also exposes stages, tasks,
levels, clues, notes, penalties and timing before teaching how they form one reasoning loop.

The next client audience is IT and engineering stakeholders evaluating concept and technical
feasibility. Clinical accuracy, medical approval and regulatory release are not the acceptance
question for this phase.

**Decision:** Open Phase 13 around a single explicit loop:

`mission → spatial reconstruction → evidence gathering → differential checkpoint → interpretation
→ evidence citation and conclusion → prioritized debrief`.

Every Case Lab screen must answer what the learner is doing, why it matters and what action comes
next. The current task, relevant evidence and primary action stay visible together. Scored
decisions depend on reviewed evidence rather than restating it in answer choices. Optional systems
must gain a visible in-flow purpose or be removed.

Phase 13 also owns the flagship unknown-point mechanic, remaining functional demo defects,
client-safe demo profiles, bridge-free browser evidence and moderated unaided usability. Real
multiplayer/backends, real KOL identity, clinical/anatomical/legal approval, AI reasoning and a
cross-specialty pack remain outside the phase.

**Consequences:** Case documents, player chrome, evidence state, primitives, results and navigation
will change together rather than receive isolated presentation patches. New schema and state
versions must retain legacy records. Automated tests remain necessary but cannot close the phase
without human usability results. A presenter-led technical build may become ready before
unsupervised use, but both verdicts must be stated separately.

## ADR-096: Case 0.2 makes mission and evidence dependencies explicit

**Status:** Accepted

**Context:** Case 0.1 described a patient, stages and clues but did not state the learner's role,
objective or expected outputs. Stage intros could describe activity without explaining its
purpose, patient change had no structured timeline, and finding descriptions could not separate
what was visible from why it mattered. Scored tasks could also repeat exact clue values while clue
review remained optional.

**Decision:** Require Case schema `0.2` documents to define `mission.role`, `mission.objective` and
two-to-four `mission.deliverables`. Every stage defines `purpose` and may define a structured
patient `update` with time label and narrative. Findings may define learner-facing `significance`.

Semantic validation requires the advertised duration in seconds to fall between the authored case
target and maximum, and every scored task to reference at least one decisive clue. Learner-visible
cases fail validation when an ASCII numeric token from a decisive clue is repeated in the task
stem or option labels. The lint deliberately targets exact numeric leakage rather than attempting
clinical-language inference.

**Consequences:** Briefing, stage banners, timeline, clue relevance and finding feedback can render
from one validated source. Authors must keep durations and evidence dependencies coherent.
Legitimate numeric recall questions must be redesigned to ask for interpretation or must use
evidence that is intentionally visible in-flow; the validator does not assess semantic or clinical
correctness.

## ADR-097: Case stages are continuous and onboarding is learner-scoped

**Status:** Accepted

**Context:** Case 0.1 placed a blocking dialog before every stage and required a “Begin stage”
action that did not represent a learner decision. The header simultaneously counted stage, task and
tier, while clues and notes were introduced without teaching their role. The resulting flow felt
like disconnected screens and the case clock could continue behind instructional overlays.

**Decision:** Render stage changes as inline `StageBanner` regions sourced from Case 0.2 purpose
and patient-update fields. Announce the changed stage and move focus to its heading without
requiring acknowledgement. The header shows one stage-progress model and a persistent
“How this works” action.

Introduce a four-step coach walkthrough for Task, Evidence, Case notes and Primary action. It opens
automatically once per learner, can be replayed, pauses all active case timing and persists
`caseLab.walkthroughSeen` in learner state v8. Existing v7 and older learners migrate with the
walkthrough unseen; the experienced demo seed opts out and the fresh seed sees it naturally.

**Consequences:** Stage boundaries preserve narrative and event tracking without interaction-only
gates. Focus ownership moves from the generic hidden task heading to the visible stage banner when
case chrome is present. Opening any blocking clue or walkthrough pauses both case and per-task
timing, and resuming does not add hidden elapsed time.

## ADR-098: Case reasoning uses required checkpoints and reviewed evidence

**Status:** Accepted

**Context:** A learner could previously reach a correct diagnosis without externalizing a
differential or reviewing the evidence that justified it. Notes stored only a latest optional
rating, so comparison could report every hypothesis as `Not rated` after an otherwise successful
attempt.

**Decision:** Add an unscored `case_differential` primitive at the end of every Observe and
Interpret stage in full learner-visible cases. It requires a rating for every authored hypothesis
and snapshots each checkpoint. Add a scored `case_evidence_select` primitive before the final
Diagnose conclusion; only reviewed clues and inspected findings are selectable, and partial credit
is calculated from the configured correct evidence set. Semantic validation enforces placement,
references and inclusion of every decisive clue.

Persist checkpoint history in activity session v6 and case result v8 while defaulting missing
history for legacy sessions and attempts. Keep these primitives out of the lesson showcase because
their availability and meaning depend on Case Lab context.

**Consequences:** The learner must expose a changing hypothesis model and cite evidence before
committing. Expert comparison receives meaningful checkpoint data, and full diagnosis credit now
depends on evidence use. Authors must provide complete checkpoint responses, rationales and timing
metadata, and benchmark findings must have been inspected by the authored path.

## ADR-099: Unknown-point anatomy attempts resolve from a persisted seed

**Status:** Accepted

**Context:** The advanced Case Lab previously started at a named, known airway and then asked the
learner to select that same location. This demonstrated navigation but not reconstruction. A useful
unknown-point task must avoid revealing anatomical names before commitment, survive resume without
moving the learner, and remain deterministically testable without exposing test controls in normal
builds.

**Decision:** Add a Case 0.2 `unknown_waypoint` entry mode with at least two candidate waypoint IDs
and required neutral navigation labels. Draw the candidate from an integer attempt seed, persist
that seed in activity session v6 and rebuild the case plan from it on resume. Waypoints author
`answerIds` by localisation level; an `anatomy_locate` primitive with `answerFrom: "entry"` resolves
its expected answers from the selected waypoint. While the entry remains unknown, branch controls
use authored `neutralLabel` text and the viewer and Case notes conceal named location breadcrumbs.
The location is revealed after the learner commits the localisation.

Semantic validation checks candidate uniqueness, map membership, neutral labels, answer coverage
for every localisation level and benchmark compatibility for every candidate. The advanced case
uses the mechanic. A `caseSeed` URL override is accepted only in `VITE_E2E=true` builds.

**Consequences:** Each advanced attempt begins with a genuine spatial inference whose answer can
vary while remaining stable across refresh and resume. Authors must provide neutral navigation and
complete answer mappings for each candidate. Automated tests can select a known candidate without
making deterministic seed controls part of production behavior. Neutral labels intentionally trade
anatomical specificity for pre-commit concealment and require moderated usability validation.

## ADR-100: Case Lab has a recommendation-led entry point and fixed learner glossary

**Status:** Accepted

**Context:** Home promoted one configured advanced case even for a new learner, Learn presented
every case without progression cues, and “View all cases” did not lead to a dedicated case
catalogue. The product also alternated between Evidence and Clues, Notes and Case notes, Findings
and Spatial findings, and Diagnose and Conclude, making the learning model harder to infer.

**Decision:** Add a `recommended` featured-case mode that selects the first incomplete non-daily
case in Foundation, Intermediate, Advanced order, retaining the configured feature as fallback.
Create `/learn/cases` as the canonical Case Lab hub with a tier ladder, Start here and Recommended
next cues, and a separate daily case section. Configure and display concise definitions for
Pathway, Course, Case Lab and Daily challenge on Learn and Challenge.

Use the learner-facing glossary “Clues”, “Spatial findings”, “Case notes” and “Conclude” throughout
the Case Lab. Keep internal schema identifiers such as the `diagnose` stage kind unchanged for
compatibility. Extend route-level copy checks to include the hub and reject deprecated standalone
labels.

**Consequences:** Fresh learners enter at Foundation while experienced learners advance to the
first unfinished tier. Product surfaces have explicit, stable meanings and one destination for all
cases. Existing deep links remain valid, and content authors can revise surface explanations
without changing React components.

## ADR-101: Demo identity and progress are explicit, replaceable configuration

**Status:** Accepted

**Context:** The previous client build opened as Maya Chen with substantial history and an
industry role, so first-time onboarding and the Foundation recommendation were hidden. Seeded
leaderboard peers could also be mistaken for live users. Presenters needed a reliable way to
demonstrate both a first-use journey and an established learner without clearing browser storage.

**Decision:** Add an optional `demo` app-config block that declares enabled presenter profiles,
their labels and seed mappings. The enabled default must match `manifest.defaultSeed`, every
profile ID and seed mapping must be unique, and each seed must exist in the manifest. Use the
zero-history Fresh trainee seed as the client-build default and retain Maya Chen as an Experienced
learner with the role “Respiratory medicine trainee.”

When demo mode is enabled, Profile exposes explicit switch and reset controls that replace local
learner state through the existing validated seed path. Label the configured ranking scope
“Sample cohort” so seeded identities are not presented as live data.

**Consequences:** A client session naturally starts with onboarding and a Foundation Case Lab
recommendation, while presenters can restore either deterministic demonstration state without
developer tools. Switching or resetting intentionally replaces all local learner progress on that
device. Demo controls remain absent when the configuration is disabled.

## ADR-102: Case Lab regression proof separates visible-control behavior from deterministic images

**Status:** Accepted

**Context:** Earlier browser coverage proved WebGL state through an E2E-only anatomy bridge and
saved evidence screenshots without image assertions. That was useful for renderer diagnostics but
could not prove that a learner could finish the unknown-point case through the controls they can
actually see. The Phase 13 workspace also needs prompt/action viewport checks and stable visual
regression coverage without making every browser path dependent on pixel comparisons.

**Decision:** Keep bridge-based tests for renderer internals, context loss and canvas hit testing,
but add a separate advanced-case route that never reads `__anatomyTest`, never clicks known canvas
coordinates and completes through accessible buttons, radios, checkboxes and configured clue
controls. The shared Case Lab driver now understands differential checkpoints, evidence review and
citation, the continuous stage flow and current Model answer copy. At each step it verifies that
the task prompt and a primary interaction can share the current viewport at both 1440 × 900 and
375 × 812.

Retain direct component tests for `ClueBoard`, `CaseNotes` and `StageBanner`. Add eight
`toHaveScreenshot` assertions for the desktop guided route: briefing, spatial reconstruction,
finding feedback, localisation, differential, evidence citation, prioritized result and Model
answer. Use the E2E-only case seed solely for deterministic golden images; the bridge-free
completion runs without that override. Phone remains behavior- and viewport-tested rather than
duplicating the desktop pixel baselines.

**Consequences:** A green suite distinguishes learner-operable navigation from renderer
instrumentation, and committed images now detect unintended layout changes on the client-demo
route. Baseline updates must be deliberate and reviewed. The desktop images are platform-specific;
phone confidence comes from semantic and viewport assertions, not pixel identity.

## ADR-103: External demo approval remains evidence-gated

**Status:** Accepted

**Context:** Phase 13 implementation and local automation pass, but no qualifying human usability
sessions, HTTPS deployment target, production DICOM origin, Android device or iPhone were
available. A desktop-only-demo waiver was offered as the explicit alternative to physical-device
approval.

**Decision:** On 2026-10-05 the user chose to leave all three external gates blocked and did not
authorize a desktop-only-demo waiver. Keep P13-T15 and P13-T16 open, retain the external
client-demo No-go verdict and describe local automation only as engineering evidence.

**Consequences:** The local guided Case Lab can be rehearsed within its documented limitations,
but it must not be represented as passing unaided usability, hosted delivery, service-worker/CORS
preflight or physical-device validation. Phase 13 closes only after new evidence or an explicit
future waiver decision.

## ADR-104: The repository root README is the human entry point

**Status:** Accepted

**Context:** The original PRD records product intent across many delivery phases, while
architecture, schema, phase and QA documents each assume a specialized reader. After thirteen
phases, a new reviewer had no single current explanation of what the application does, how to run
it, which experience to test first or which claims remain unapproved.

**Decision:** Use `README.md` as the canonical human-first product and testing guide. Preserve the
PRD as the product-intent record, add a dated implementation snapshot to it, and link specialized
documents from the README instead of duplicating their full contracts. Keep implementation status
and approval boundaries explicit: local engineering pass is distinct from human usability,
hosted-delivery and physical-device approval.

**Consequences:** New reviewers can understand and exercise the product before reading source code.
Maintainers must update the README when learner surfaces, setup commands, primary walkthrough,
verification results or approval boundaries materially change. Architecture and schema documents
remain authoritative for technical contracts; QA verdicts remain authoritative for readiness.

## ADR-105: Demo experiences are selected at build time

**Status:** Proposed (confirm in P14-T00)

**Context:** The Medical Challenge demo (`newDemoPRD.md`) needs a second experience with its own
homepage, navigation, theme and content while the existing homepage and application must remain
unchanged as the default. Shared functionality, components, game logic and APIs must not be
duplicated. A runtime registry of experiences would either eagerly bundle every homepage into the
default entry or turn the eager Home route into a lazy one, both of which change the default.

**Decision:** Select the active experience with `VITE_EXPERIENCE` (`default` or `sanofi`), set by
committed `.env.default` / `.env.sanofi` files and Vite `--mode`, exposed through `dev:default` and
`dev:sanofi` scripts (plus `build:sanofi`, `preview:sanofi`, `test:e2e:sanofi`). A static
`@experience` alias resolves to `src/experiences/<id>/` so only the selected definition, routes and
homepage enter the bundle. Unknown ids and mode/variable mismatches fail the build. Experiences
contain only composition (definition, routes, homepage, theme overrides); everything else stays in
shared modules and ESLint boundaries forbid cross-experience imports. Each experience has its own
content root; non-default experiences namespace persisted storage keys and caches, while the
default keeps its legacy keys.

**Consequences:** The default build stays byte-for-byte equivalent in behaviour, bundle shape and
persisted data. A single build cannot switch experiences at runtime; each experience is a separate
artifact (`dist/`, `dist-sanofi/`) and host. Adding a future experience means a new folder, mode
file and content root, not new shared code. Details: `docs/phases/phase-14-multi-experience-foundation.md`.

## ADR-106: Games are a new content type over shared primitives

**Status:** Proposed (confirm in P15-T00)

**Context:** The Medical Challenge needs timed, scored, replayable, shareable rounds with
difficulty, clue costs, seeded challenge links and a per-game leaderboard. Courses, lessons and
cases carry learning-path semantics (objectives, mastery, XP, debriefs) that the demo must not
expose, and their players are tuned to lessons or staged cases.

**Decision:** Add a round library and game documents as a new validated content type with a pure
engine under `src/engines/games/` (mechanics, plan, seed, scoring, proximity, session, results,
links, leaderboard, progress), typed `game_*` learner events through the existing pipeline,
learner state v9 game history and a separate `game-session` store. Rounds reuse existing
primitives and the anatomy viewer through default-off capability options rather than new
renderers. All scoring, timing, difficulty, messages and copy live in configuration.

**Consequences:** One engine supports many formats composed purely from content, which is the
PRD's reusability claim. Existing course, lesson and case contracts are unaffected. The cost is a
new schema family, a migration to learner state v9 and a dedicated player (ADR-107, Phase 16).
Details: `docs/phases/phase-15-game-contract-and-engine.md`.

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

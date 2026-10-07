# Activity log

This file is append-only.

### [2026-10-01 15:51] P1-PLAN - Product and implementation planning

- **Agent/session:** Cursor planning session
- **Action:** Read all 86 PRD sections, separated the delivery into ten phases, selected Foundation plus an isolated DICOM/PWA spike for Phase 1, and selected Tailwind CSS 4 plus Radix UI.
- **Files changed:** None in the workspace; the approved external plan was created.
- **Commands run:** Read-only workspace inspection.
- **Result/verification:** The user approved execution of the attached Phase 1 plan.
- **Follow-ups:** Preserve the three architectural rules and create durable handoff documentation before implementation.

### [2026-10-01 16:05] P1-T00 - Repository and documentation foundation

- **Agent/session:** Cursor implementation session
- **Action:** Verified the toolchain, initialized Git, created the agent guide, PRD analysis, roadmap, architecture, schema overview, ADRs, handoff and activity log.
- **Files changed:** `.gitignore`, `AGENTS.md`, `docs/PRD-ANALYSIS.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `git status --short --branch`, `node --version`, `npm --version`, `git init`.
- **Result/verification:** Git repository initialized. Node 24.19.0 and npm 11.17.0 are available. Documentation protocol is in place.
- **Follow-ups:** Add the phase checklist and DICOM reference placeholders, then scaffold the application.

### [2026-10-01 16:18] P1-T01 - React and TypeScript scaffold

- **Agent/session:** Cursor implementation session
- **Action:** Created the npm project, installed the application/quality toolchain, configured strict TypeScript with unchecked-index protection and `@/` imports, added ESLint/Prettier, and created the Vite entry point.
- **Files changed:** `package.json`, `package-lock.json`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/styles/globals.css`.
- **Commands run:** `npm init -y`, dependency installs, `npm run typecheck`, `npm run build`.
- **Result/verification:** TypeScript and the production Vite build pass. The installed current stack uses React 19.3, React Router 8.4, TypeScript 6 and Vite 8.
- **Follow-ups:** Build the token system and accessible component foundations.

### [2026-10-01 16:28] P1-T02 - Design tokens and UI foundations

- **Agent/session:** Cursor implementation session
- **Action:** Added the scientific/product token palette, type scale, radii, shadows, motion and reduced-motion behavior. Built accessible buttons, icon buttons, cards, chips, progress, skeleton and responsive Radix sheet components plus the internal preview page.
- **Files changed:** `src/styles/*`, `src/lib/cn.ts`, `src/components/ui/*`, `src/routes/dev/TokenPreviewPage.tsx`, `src/app/App.tsx`, `src/main.tsx`, `eslint.config.js`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** All three commands pass; the base UI compiles into the production build.
- **Follow-ups:** Wire the preview and learner placeholders into the complete route tree.

### [2026-10-01 16:38] P1-T03 - Routing and application shell

- **Agent/session:** Cursor implementation session
- **Action:** Added the complete Phase 1 route tree, a mobile-safe five-tab shell, route-aware header, constrained desktop layout, immersive lesson/challenge layout, lazy DICOM route, placeholders and React/route error boundaries.
- **Files changed:** `src/app/*`, `src/layouts/*`, `src/routes/*`, `src/components/feedback/*`, `eslint.config.js`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** Navigation compiles and builds; the DICOM route is emitted as a separate lazy chunk and immersive screens omit the learner bottom navigation.
- **Follow-ups:** Replace temporary display values with validated content and persisted state.

### [2026-10-01 16:52] P1-T04 - Content schema v0.1

- **Agent/session:** Cursor implementation session
- **Action:** Defined the canonical primitive IDs; base, typed primitive, course, lesson, pathway, concept, badge, challenge, leaderboard, gamification, asset, manifest and learner-state schemas. Added unknown-primitive warning behavior and generated six JSON Schema documents.
- **Files changed:** `src/content/primitiveTypes.ts`, `src/content/schema/index.ts`, `scripts/export-json-schema.ts`, `schemas/*.schema.json`, `docs/CONTENT_SCHEMA.md`.
- **Commands run:** `npm run typecheck`, `npm run schema:export`, `npm run lint`, `npm run build`.
- **Result/verification:** Schema export, static checks and build pass. Rich text, image and MCQ content are strict; registered future primitives remain extensible.
- **Follow-ups:** Add a content loader that applies these schemas and validates cross-document references.

### [2026-10-01 17:06] P1-T05 - Content loading and validation

- **Agent/session:** Cursor implementation session
- **Action:** Added browser and CLI content loading, immutable registries, duplicate/reference validation, primitive warning collection, actionable error structures, a loading provider and a dedicated content error screen.
- **Files changed:** `src/content/loader.ts`, `src/app/ContentProvider.tsx`, `src/app/contentContext.ts`, `src/components/feedback/ContentErrorScreen.tsx`, `scripts/validate-content.ts`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass. End-to-end validation awaits the seed files in P1-T06.
- **Follow-ups:** Create a complete valid bundle and exercise the CLI loader.

### [2026-10-01 17:25] P1-T06 - Demo content and learner seeds

- **Agent/session:** Cursor implementation session
- **Action:** Added the content manifest, gamification and product configuration, eight concepts, a branching pathway, ten badges, daily and weekly challenges, a 15-person cohort, four courses with twelve lessons, lightweight local imagery, fresh/advanced learner seeds and invalid/unknown fixtures. Wired the runtime provider and replaced shell placeholders with validated values.
- **Files changed:** `public/content/**`, `public/assets/images/**`, `src/app/App.tsx`, `src/layouts/AppShell.tsx`, `src/routes/PlaceholderPages.tsx`.
- **Commands run:** `npm run validate:content`, `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** CLI validation reports 4 courses, 12 lessons and 0 warnings; all static checks and the production build pass.
- **Follow-ups:** Hydrate the advanced seed into a versioned IndexedDB-backed learner store.

### [2026-10-01 17:36] P1-T07 - Persistent learner state

- **Agent/session:** Cursor implementation session
- **Action:** Added a versioned Zustand learner store, explicit async hydration, IndexedDB storage adapter with quota messaging, seed initialization/replacement, XP mutation, local preferences and selectors for level, rank and course completion. Updated visible shell data to use persisted state.
- **Files changed:** `src/state/**`, `src/app/App.tsx`, `src/layouts/AppShell.tsx`, `src/routes/PlaceholderPages.tsx`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** Static checks and build pass. The store hydrates before routing and initializes once from the validated advanced seed.
- **Follow-ups:** Route all learner actions through a typed event bus.

### [2026-10-01 17:45] P1-T08 - Learner event system

- **Agent/session:** Cursor implementation session
- **Action:** Added the complete PRD event taxonomy plus XP awards, a framework-independent publish/subscribe bus, generated event IDs/timestamps and an IndexedDB-persisted event history capped at 500 records.
- **Files changed:** `src/events/types.ts`, `src/events/bus.ts`, `src/events/eventLogStore.ts`, `src/main.tsx`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** Event infrastructure compiles, initializes before React and leaves subscriber failures isolated.
- **Follow-ups:** Add the demo controls and the first event-to-state subscriber.

### [2026-10-01 17:54] P1-T09 - Demo reset and diagnostics

- **Agent/session:** Cursor implementation session
- **Action:** Expanded the URL-only developer page with reset, fresh/advanced seed switching, an XP simulation that travels through the event bus, a persisted event viewer and clearly labelled future controls. Added the first event-to-state handler.
- **Files changed:** `src/routes/dev/DevPage.tsx`, `src/events/handlers.ts`, `src/state/seed.ts`, `src/main.tsx`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** All controls compile and the XP action updates the same persistent state shown in the application shell.
- **Follow-ups:** Add service worker registration, manifest assets and offline status.

### [2026-10-01 18:04] P1-T10 - Installable PWA shell

- **Agent/session:** Cursor implementation session
- **Action:** Generated standard and maskable icons from the source SVG, added the web app manifest, prompt-mode service worker registration, app/content precaching, an online-status hook and a calm offline indicator.
- **Files changed:** `public/assets/icons/**`, `vite.config.ts`, `index.html`, `src/pwa/**`, `src/components/feedback/OfflineIndicator.tsx`, `src/layouts/AppShell.tsx`, `src/main.tsx`.
- **Commands run:** `npx pwa-assets-generator --preset minimal ...`, `npm run typecheck`, `npm run lint`, `npm run build`.
- **Result/verification:** Production build emits `manifest.webmanifest`, `sw.js` and Workbox runtime; 40 assets (801.79 KiB) are precached.
- **Follow-ups:** Add an explicit DICOM CacheFirst policy while implementing the isolated imaging spike.

### [2026-10-01 17:25] P1-T11 - Isolated DICOM and offline spike

- **Agent/session:** Cursor implementation session
- **Action:** Added the lazy Cornerstone3D stack viewer, imaging controls, bounded preload queue, public CT preparation/de-identification/PHI-audit tooling, curated series metadata and provenance, DICOM CacheFirst handling and measured spike findings. Corrected duplicate Workbox manifest-icon entries that prevented service-worker handlers from installing.
- **Files changed:** `package.json`, `package-lock.json`, `vite.config.ts`, `.gitignore`, `src/app/router.tsx`, `src/routes/dev/DicomSpikeRoute.tsx`, `src/spikes/dicom/**`, `scripts/dicom/**`, `public/assets/dicom/spike/manifest.json`, `public/assets/dicom/spike/README.md`, `docs/spikes/dicom-pwa-spike.md`.
- **Commands run:** Cornerstone dependency installs, IDC download/de-identification/preparation commands, `npm run dicom:audit -- public/assets/dicom/spike/files`, `npm run typecheck`, `npm run lint`, `npm run build`, production-preview browser checks with offline network emulation.
- **Result/verification:** PHI audit passed for 125 files. The lazy route renders and navigates the 125-slice stack, presets and tools work, Cornerstone remains outside the main chunk, Workbox stores 42 shell/content responses plus all 125 DICOM responses, and the stack reloads successfully while offline.
- **Follow-ups:** Add the Phase 1 automated test suites and run the complete quality gate.

### [2026-10-01 17:44] P1-T12 - Automated tests and quality gate

- **Agent/session:** Cursor implementation session
- **Action:** Added Vitest/jsdom setup and suites for seed/schema validation, useful invalid paths, runtime content loading, unknown primitive warnings, cross-reference failures, IndexedDB persistence, seed reset, typed bus subscriptions, the 500-event cap, derived selectors and shell/immersive navigation behavior.
- **Files changed:** `vitest.config.ts`, `src/test/setup.ts`, `src/test/contentFixtures.ts`, `src/content/content.test.ts`, `src/state/learnerStore.test.ts`, `src/state/selectors.test.ts`, `src/events/events.test.ts`, `src/app/router.test.tsx`.
- **Commands run:** `npm run test`, `npm run check`, `npm run format:check`.
- **Result/verification:** `npm run check` passes: 5 test files and 19 tests pass, content validation reports 4 courses and 12 lessons with 0 warnings, and the production build succeeds. The standalone format audit reports the repository's existing CRLF/style baseline and is not part of `npm run check`.
- **Follow-ups:** Close Phase 1 documentation and draft the Phase 2 application-surfaces outline.

### [2026-10-01 17:48] P1-T13 - Phase 1 close-out

- **Agent/session:** Cursor implementation session
- **Action:** Marked Phase 1 complete, refreshed the handoff with commands, constraints and known issues, recorded the DICOM conditional-go verdict, and drafted the Phase 2 application-surfaces task outline.
- **Files changed:** `docs/ROADMAP.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/phases/phase-01-foundation.md`, `docs/phases/phase-02-app-surfaces.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `git status --short --branch`, `git log --oneline --decorate -5`.
- **Result/verification:** Every Phase 1 checklist item is complete, the required quality gate is green and Phase 2 has a documented entry point.
- **Follow-ups:** Obtain user approval for Phase 2 scope and complete physical-device DICOM/PWA checks when an HTTPS preview and devices are available.

### [2026-10-01 19:45] P2-T00 - Surface contracts and data mapping

- **Agent/session:** Cursor implementation session
- **Action:** Added configurable surface limits, reference-dated demo seeds, deterministic clock support, seed-date rebasing, learner-state version 2 migration, asset indexing and stricter course/pathway validation.
- **Files changed:** `public/content/app-config.json`, `public/content/seeds/*.json`, `src/content/**`, `src/lib/clock.ts`, `src/state/learnerStore.ts`, `src/state/seedDates*`, `schemas/**`, `docs/CONTENT_SCHEMA.md`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run schema:export`, `npm run typecheck`, `npm run validate:content`.
- **Result/verification:** Schemas exported, TypeScript passed and all 4 courses/12 lessons validate with no warnings.
- **Follow-ups:** Build the complete pure selector/view-model layer.

### [2026-10-01 19:48] P2-T01 - Derived surface view models

- **Agent/session:** Cursor implementation session
- **Action:** Added pure derivation for effective prerequisite locks, course summaries, continuation, pathway DAG layers, weekly activity, revision recommendations, contextual leaderboard rows, badges, profile statistics, level progress and greetings.
- **Files changed:** `src/state/selectors.ts`, `src/state/selectors/**`, `src/state/selectors.test.ts`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run test`.
- **Result/verification:** All static checks pass; 26 tests pass including branch, date-boundary, fresh-state and zero-accuracy cases.
- **Follow-ups:** Build shared presentation components and dynamic route headers.

### [2026-10-01 19:52] P2-T02 - Shared presentation and route structure

- **Agent/session:** Cursor implementation session
- **Action:** Added reusable course, lesson, progress, badge, stat, mastery, activity, avatar and leaderboard components; introduced the badge icon registry and asset hook; added content-derived headers and split every placeholder into a focused route module.
- **Files changed:** `src/components/learning/**`, `src/components/navigation/PageHeader.tsx`, `src/content/useAssetUrl.ts`, `src/layouts/*`, `src/routes/**`, `src/app/router*`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run test`.
- **Result/verification:** TypeScript, lint and all 26 tests pass. Nested routes receive back navigation and content-derived document titles.
- **Follow-ups:** Compose the complete Home dashboard from these view models and components.

### [2026-10-01 19:57] P2-T03 - Home dashboard

- **Agent/session:** Cursor implementation session
- **Action:** Built all eight PRD Home sections from registry, learner state and selectors, including advanced and fresh-account states.
- **Files changed:** `src/routes/home/HomePage.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Home compiles cleanly with configured challenges, pathways, badges, course assets and reward values; no course-specific copy remains in React.
- **Follow-ups:** Build the filterable Learn catalog.

### [2026-10-01 20:02] P2-T04 - Learn catalog

- **Agent/session:** Cursor implementation session
- **Action:** Added active-pathway discovery, grouped responsive course cards and URL-backed status filtering with effective course progress and lock states.
- **Files changed:** `src/routes/learn/LearnPage.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** The catalog compiles and lints cleanly; all course metadata, assets, state and filters are configuration driven.
- **Follow-ups:** Render the pathway DAG as an accessible journey.

### [2026-10-01 20:07] P2-T05 - Accessible pathway journey

- **Agent/session:** Cursor implementation session
- **Action:** Rendered validated pathway DAG layers as a vertical journey with branch groups, six node types, derived progress/current/locked states, keyboard-operable lock explanations and typed pathway-open events.
- **Files changed:** `src/routes/learn/PathwayPage.tsx`, `src/events/types.ts`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass. Relationships and state are available as semantic ordered-list text while connectors remain decorative.
- **Follow-ups:** Build course details and lesson navigation.

### [2026-10-01 20:11] P2-T06 - Course detail

- **Agent/session:** Cursor implementation session
- **Action:** Built content-derived course heroes, metadata, completion requirements, aggregate progress, prerequisite messaging and lesson rows with effective lock, score and star states.
- **Files changed:** `src/routes/learn/CoursePage.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass; available lesson links enter the immersive route and opening a course emits `course_opened`.
- **Follow-ups:** Build daily and weekly challenge landing states.

### [2026-10-01 20:15] P2-T07 - Challenge landing

- **Agent/session:** Cursor implementation session
- **Action:** Built configuration-driven daily and weekly challenge cards with duration, item, reward, completion, best-score and target progress states plus immersive player links.
- **Files changed:** `src/routes/challenge/ChallengePage.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass; starting a daily challenge emits the typed `challenge_opened` event while gameplay remains deferred.
- **Follow-ups:** Build the contextual weekly leaderboard.

### [2026-10-01 20:19] P2-T08 - Contextual leaderboard

- **Agent/session:** Cursor implementation session
- **Action:** Built a weekly cohort leaderboard centred on the current learner, with rank, live weekly XP, movement, initials avatars and visibly inactive future periods.
- **Files changed:** `src/routes/leaderboard/LeaderboardPage.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass; rank is derived from learner weekly XP and responds to the existing event-driven XP simulator.
- **Follow-ups:** Build the learner profile.

### [2026-10-01 20:23] P2-T09 - Learner profile

- **Agent/session:** Cursor implementation session
- **Action:** Built the learner summary, configurable level progress, lifetime stats and accuracy, sorted concept mastery, grouped locked/unlocked badges and current-week activity.
- **Files changed:** `src/routes/profile/ProfilePage.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass and all profile values originate in configuration, persisted learner state or selectors.
- **Follow-ups:** Add route-level state, keyboard, event and anti-hard-coding coverage.

### [2026-10-01 20:28] P2-T10 - Surface behavior tests

- **Agent/session:** Cursor implementation session
- **Action:** Added route-surface coverage for all Home sections, configuration-driven course identity, URL filters, locked lesson/pathway behavior, unknown/fresh states, event emission, live leaderboard rank and fresh-profile arithmetic.
- **Files changed:** `src/routes/surfaces.test.tsx`, `docs/phases/phase-02-app-surfaces.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run test`.
- **Result/verification:** Seven test files and 35 tests pass. Keyboard activation, typed intents and event-driven rank changes are covered.
- **Follow-ups:** Run the complete gate, perform browser QA and close Phase 2 documentation.

### [2026-10-01 20:34] P2-T11 - Phase 2 quality gate and close-out

- **Agent/session:** Cursor implementation session
- **Action:** Ran the full quality gate, checked Home, Learn, Pathway and Profile at mobile/tablet/desktop widths, corrected learner-stat contrast, recorded the Phase 2 architecture decisions and moved the handoff to Phase 3.
- **Files changed:** `src/components/learning/index.tsx`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`, `docs/phases/phase-02-app-surfaces.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run check`, `git diff --check`, browser checks at 375 × 812, 768 × 900 and 1280 × 900.
- **Result/verification:** All 35 tests, content validation, type checking, lint and production build pass. Browser accessibility snapshots and visual checks passed for the target surface set.
- **Follow-ups:** Plan and implement Phase 3's configured lesson execution engine; retain physical-device DICOM/PWA verification as an external follow-up.

### [2026-10-01 20:28] P3-T00 - Phase 3 acceptance map

- **Agent/session:** Cursor implementation session
- **Action:** Defined the Core lesson engine scope, architecture boundaries, task checklist, PRD traceability and exit criteria.
- **Files changed:** `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** None.
- **Result/verification:** Phase 3 has an executable checklist that preserves the Phase 4, 5 and 6 boundaries.
- **Follow-ups:** Type the primitive runtime contracts and configurable player defaults.

### [2026-10-01 20:36] P3-T01 - Typed player contracts

- **Agent/session:** Cursor implementation session
- **Action:** Added typed, forward-compatible completion, scoring and feedback schemas plus configurable retry defaults; regenerated JSON Schemas.
- **Files changed:** `src/content/schema/index.ts`, `public/content/app-config.json`, `schemas/**`, `docs/CONTENT_SCHEMA.md`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run schema:export`, `npm run validate:content`, `npm run typecheck`.
- **Result/verification:** Four courses and twelve lessons validate with no warnings; TypeScript passes.
- **Follow-ups:** Build a pure activity-plan adapter for lessons and challenges.

### [2026-10-01 20:39] P3-T02 - Activity plan builder

- **Agent/session:** Cursor implementation session
- **Action:** Added pure lesson and challenge adapters, primitive classification, configured feedback resolution and environment-specific unsupported-step handling.
- **Files changed:** `src/engines/learning/plan.ts`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`.
- **Result/verification:** Lesson and challenge definitions compile into a shared activity plan; empty and unsupported-only activities return an explicit unavailable result.
- **Follow-ups:** Add the pure session state machine, completion rules and scoring summary.

### [2026-10-01 20:43] P3-T03 - Session engine

- **Agent/session:** Cursor implementation session
- **Action:** Added the pure activity session reducer, completion-rule evaluator, progress selectors and weighted first-attempt scoring summary.
- **Files changed:** `src/engines/learning/completionRules.ts`, `src/engines/learning/session.ts`, `src/content/schema/index.ts`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`.
- **Result/verification:** Session transitions, completion modes, no-assessment scoring and missed-item/source summaries compile under strict TypeScript.
- **Follow-ups:** Persist and invalidate the active session independently of learner aggregates.

### [2026-10-01 20:46] P3-T04 - Resumable session persistence

- **Agent/session:** Cursor implementation session
- **Action:** Added a versioned IndexedDB-backed activity-session store, plan/version invalidation, hydration alongside learner state and session clearing on demo reseed.
- **Files changed:** `src/engines/learning/sessionStore.ts`, `src/state/LearnerStateProvider.tsx`, `src/state/learnerStore.ts`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`.
- **Result/verification:** One incomplete activity session can be restored independently from aggregate learner state.
- **Follow-ups:** Extend typed events to cover activity lifecycle, primitive completion and result summaries.

### [2026-10-01 20:49] P3-T05 - Player event taxonomy

- **Agent/session:** Cursor implementation session
- **Action:** Expanded typed events for lesson and challenge start, primitive context/completion, exits, result summaries and course completion.
- **Files changed:** `src/events/types.ts`, `src/events/events.test.ts`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`, `npm run test -- --run src/events/events.test.ts`.
- **Result/verification:** Type checking and both event-bus tests pass; XP remains descriptive data on answer events and is not awarded.
- **Follow-ups:** Reduce learning events into aggregate learner progress and follow-up events.

### [2026-10-01 20:53] P3-T06 - Learning progress engine

- **Agent/session:** Cursor implementation session
- **Action:** Added a pure learning-event reducer and registered it against the content registry to update lesson attempts/resume points, first-attempt statistics, completion/best scores, course completions and challenge results.
- **Files changed:** `src/engines/learning/progress.ts`, `src/events/handlers.ts`, `src/state/learnerStore.ts`, `src/state/LearnerStateProvider.tsx`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`, focused event/store tests.
- **Result/verification:** Strict typing and four existing persistence/event tests pass; follow-up course completion remains event-driven.
- **Follow-ups:** Add the primitive registry, pure evaluator and Phase 3 components.

### [2026-10-01 20:58] P3-T07 - Primitive runtime

- **Agent/session:** Cursor implementation session
- **Action:** Added lazy primitive registration, render-error fallback, a pure multiple-choice evaluator and accessible rich-text, image, multiple-choice and unsupported components.
- **Files changed:** `src/primitives/**`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass; primitive components depend only on their props, asset resolution and shared UI.
- **Follow-ups:** Compose the player lifecycle, immediate feedback, review and completion screens.

### [2026-10-01 21:04] P3-T08 - Activity player shell

- **Agent/session:** Cursor implementation session
- **Action:** Composed the intro/resume flow, focused step frame, immediate live feedback, configured retry behavior, saved exit confirmation and result/review completion summary.
- **Files changed:** `src/player/**`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`.
- **Result/verification:** Static checks pass; one player orchestration path handles both activity kinds and emits lifecycle events without awarding rewards.
- **Follow-ups:** Resolve and guard lesson/challenge routes and replace the placeholders.

### [2026-10-01 21:09] P3-T09 - Playable immersive routes

- **Agent/session:** Cursor implementation session
- **Action:** Replaced both immersive placeholders with content-resolved lesson and challenge players, including mismatch, lock, unavailable and replay paths.
- **Files changed:** `src/routes/play/**`, `src/app/router.tsx`, `src/routes/ImmersivePlaceholder.tsx` (deleted), `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`, focused router tests.
- **Result/verification:** Static checks and all six router tests pass; daily challenges share the same runtime while empty weekly challenges report unavailable.
- **Follow-ups:** Add citation-bearing content and complete player fixtures.

### [2026-10-01 21:12] P3-T10 - Player content fixtures

- **Agent/session:** Cursor implementation session
- **Action:** Added a scientific source to the configured lesson assessment and reusable fixtures for typed, mixed, unsupported-only and empty activity plans.
- **Files changed:** `public/content/courses/scientific-imaging.json`, `src/test/contentFixtures.ts`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run validate:content`, `npm run typecheck`.
- **Result/verification:** All four courses and twelve lessons validate with no warnings; fixtures compile against the production contracts.
- **Follow-ups:** Add comprehensive engine, primitive and route behavior tests and run responsive browser QA.

### [2026-10-01 21:19] P3-T11 - Engine and player verification

- **Agent/session:** Cursor implementation session
- **Action:** Added schema/plan/session/completion/scoring/progress unit tests, primitive/player component tests, route guards, challenge play-through, resume/restart/exit and architecture-boundary coverage; checked the lesson intro and step at 375, 768 and 1280 px.
- **Files changed:** `src/engines/learning/learningEngine.test.ts`, `src/player/player.test.tsx`, `src/routes/play/playerRoutes.test.tsx`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`, `npm run lint`, `npm run test`; browser accessibility and visual checks at 375 × 812, 768 × 900 and 1280 × 900.
- **Result/verification:** Ten test files and 52 tests pass. No horizontal overflow or IDE lint diagnostics were found.
- **Follow-ups:** Run the complete quality gate and close architecture, ADR, roadmap and handoff documentation.

### [2026-10-01 21:23] P3-T12 - Phase 3 quality gate and close-out

- **Agent/session:** Cursor implementation session
- **Action:** Protected every active-session navigation with confirmation, recorded ADR-013 through ADR-017, updated architecture/roadmap/handoff/phase documentation and closed Phase 3.
- **Files changed:** `src/player/ActivityPlayer.tsx`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`, `docs/phases/phase-03-lesson-engine.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** focused player/route tests, `npm run check`, `git diff --check`.
- **Result/verification:** All 52 tests, content validation, type checking, lint and production build pass. Existing Cornerstone browser-externalization and large lazy DICOM chunk warnings remain non-failing.
- **Follow-ups:** Plan Phase 4 standard content, assessment and scenario primitives.

### [2026-10-01 21:02] P4-T00 - Phase 4 execution plan

- **Agent/session:** Cursor planning session
- **Action:** Audited the Phase 3 primitive, session, scoring, validation and content contracts against PRD sections 14–17, 41–43, 49–50 and 75–76. Defined the Phase 4 scope, primitive catalogue, contract upgrades (unified definitions, fractional scoring, session v2 drafts, review/reveal, keyed completion), 17-task checklist across five milestones, sequencing, risks, planned ADRs, open decisions and exit criteria.
- **Files changed:** `docs/phases/phase-04-standard-primitives.md`, `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `git status`, `git log`, `ffmpeg -version`, `python --version`.
- **Result/verification:** The plan records gaps that must be closed before strict schemas land: duplicated support lists, boolean-only scoring, unvalidated challenge items and content asset references, and placeholder scenario/ordering/chart content. ffmpeg 7.1 is available for synthetic media fixtures.
- **Follow-ups:** Confirm the four open decisions, then start P4-T01 primitive definitions.

### [2026-10-01 21:06] P4-T00 - Phase 4 decisions confirmed

- **Agent/session:** Cursor planning session
- **Action:** Recorded the user's decisions: synthetic ffmpeg media fixtures, lazy KaTeX with mhchem, `@dnd-kit` drag for ordering on top of button/keyboard reordering, and an internal hidden showcase course. Updated the catalogue, P4-T06, constraints, risks and ADR-025 accordingly.
- **Files changed:** `docs/phases/phase-04-standard-primitives.md`, `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** None.
- **Result/verification:** No open Phase 4 product decisions remain.
- **Follow-ups:** Start P4-T01 primitive definitions.

### [2026-10-01 21:13] P4-T00 - Formalize standard primitives phase

- **Agent/session:** Cursor implementation session
- **Action:** Recast the approved Phase 4 execution plan as the formal phase snapshot used by Phase 3, preserving the standard primitive catalogue, resolved user decisions, task checklist, PRD traceability, architecture constraints and exit criteria without duplicating implementation detail.
- **Files changed:** `docs/phases/phase-04-standard-primitives.md`, `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `git status --short`, `git diff --check`, `git diff --stat`.
- **Result/verification:** P4-T00 is checked complete, P4-T01 through P4-T16 remain unchecked, the handoff points to P4-T01, and the documentation-only diff passes `git diff --check`.
- **Follow-ups:** Start P4-T01 primitive definitions and record the Phase 3 bundle baseline.

### [2026-10-01 21:24] P4-T01 - Unify primitive definitions

- **Agent/session:** Cursor implementation session
- **Action:** Recorded the entry-bundle baseline; moved strict `rich_text`, `image` and
  `multiple_choice` schemas into content-owned modules with typed asset references; introduced pure
  definitions and a typed lazy component map; derived planning and evaluation behavior from those
  definitions; added strict renderer fallback, parity and architecture coverage; recorded ADR-018.
- **Files changed:** `src/content/schema/**`, `src/primitives/**`,
  `src/engines/learning/{plan,session,learningEngine.test}.ts`,
  `src/player/{ActivityPlayer,player.test}.tsx`, `docs/DECISIONS.md`,
  `docs/phases/phase-04-standard-primitives.md`, `docs/HANDOFF.md`,
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** Baseline `npm run build`; focused `npm run typecheck`, `npm run lint` and
  `npm run test`; formatting; final `npm run check`; `git diff --check`.
- **Result/verification:** Baseline entry chunk: 595.12 kB raw / 182.85 kB gzip. The final quality
  gate passes with 11 test files and 56 tests, four courses and twelve lessons validate with no
  warnings, and the production build remains green. Existing Cornerstone browser-externalization
  and large lazy DICOM chunk warnings remain non-failing.
- **Follow-ups:** Start P4-T02 fractional scoring and session v2; do not expand standard primitive
  behavior before its scheduled task.

### [2026-10-01 21:33] P4-T02 - Upgrade primitive session contracts

- **Agent/session:** Cursor implementation session
- **Action:** Added normalized fractional evaluations and first-attempt weighted summaries; upgraded
  activity sessions to version 2 with drafts, distinct interaction keys, monotonic media progress
  and first/latest scores; added exploration, media-progress and answer-compatible ordering
  completion; expanded typed learner events and adapted the player payloads; amended ADR-014 and
  recorded ADR-019/020.
- **Files changed:** `src/primitives/**`, `src/engines/learning/**`, `src/events/**`,
  `src/player/{ActivityPlayer,player.test}.tsx`, `src/content/schema/{index,primitiveBase}.ts`,
  `public/content/app-config.json`, `docs/{DECISIONS,HANDOFF,ACTIVITY_LOG}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Starting-state Git checks, Prettier on changed files, focused type checking and
  tests, `npm run lint`, `npm run test`, `npm run check`, `git diff --check`.
- **Result/verification:** The complete quality gate passes: 11 test files and 62 tests, four
  courses and twelve lessons with no content warnings, and a successful production build.
  `git diff --check` passes; existing Cornerstone browser-externalization and large lazy chunk
  warnings remain non-failing.
- **Follow-ups:** Implement P4-T03 review/reveal rendering, debounced draft persistence, focus and
  shared artifact infrastructure without changing first-attempt score authority.

### [2026-10-01 21:42] P4-T03 - Add player review infrastructure

- **Agent/session:** Cursor implementation session
- **Action:** Added player-owned read-only review and configurable reveal behavior; debounced draft
  persistence; focused correct, partial and incorrect feedback; labelled stacked/split step frames
  with a timer slot; typed scenario/media event mapping with milestone de-duplication; a full-screen
  Radix artifact overlay; pure pan/zoom and normalized-coordinate math; and deterministic seeded
  shuffle helpers that keep ordering tasks unsolved. Recorded ADR-021 and ADR-026.
- **Files changed:** `public/content/app-config.json`, `src/content/schema/index.ts`,
  `src/engines/learning/plan.ts`, `src/player/**`, `src/primitives/components/MultipleChoicePrimitive.tsx`,
  `src/primitives/shared/**`, `docs/DECISIONS.md`, `docs/HANDOFF.md`,
  `docs/phases/phase-04-standard-primitives.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier on changed files, focused TypeScript/lint/test checks,
  `npm run check`, `git diff --check`.
- **Result/verification:** The full gate passes with 12 test files and 70 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. Existing Cornerstone
  browser-externalization and large lazy chunk warnings remain non-failing.
- **Follow-ups:** Start P4-T04 challenge-item, asset-reference, timer and unique-ID validation.

### [2026-10-01 21:54] P4-T04 - Harden primitive content validation

- **Agent/session:** Cursor implementation session
- **Action:** Unified lesson and challenge-item parsing and semantic checks; added precise challenge
  paths, scoped primitive-ID uniqueness, concept/reward/declared-asset validation, typed content
  asset existence/type checks, content-layer timer compatibility and challenge warning propagation.
  Extended asset metadata, added fixture/mutation coverage, regenerated schemas and recorded
  ADR-027.
- **Files changed:** `src/content/**`, `src/primitives/definitions/**`,
  `src/primitives/primitives.test.ts`, `public/content/fixtures/invalid-challenge-primitive.json`,
  `scripts/export-json-schema.ts`, `schemas/**`, `docs/{CONTENT_SCHEMA,DECISIONS,HANDOFF,ACTIVITY_LOG}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Focused Prettier, typecheck and Vitest runs; `npm run schema:export`;
  `npm run check`; `git diff --check`.
- **Result/verification:** The complete quality gate passes with 12 test files and 78 tests, four
  courses and twelve lessons with no content warnings, and a successful production build.
  Generated schemas include text assets, optional MIME/dimension metadata and current completion
  modes. Existing Cornerstone browser-externalization and large lazy chunk warnings remain
  non-failing.
- **Follow-ups:** Start P4-T05 multiple-select and true/false primitives; keep new schemas'
  `assetRefs` and timer compatibility in parity.

### [2026-10-01 21:59] P4-T05 - Add choice assessments

- **Agent/session:** Cursor implementation session
- **Action:** Added strict multiple-select and true/false schemas, pure malformed-safe response
  evaluators, bounded partial scoring, multiple-choice shuffle, shared accessible choice/review UI,
  draft-aware lazy components and table-driven evaluator/component coverage. Recorded ADR-028.
- **Files changed:** `src/content/schema/primitives/**`, `src/primitives/**`,
  `src/player/player.test.tsx`, `docs/{CONTENT_SCHEMA,DECISIONS,HANDOFF,ACTIVITY_LOG}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Focused Prettier, typecheck and Vitest runs; `npm run schema:export`;
  `npm run lint`; `npm run test`; `npm run check`; `git diff --check`.
- **Result/verification:** The complete quality gate passes with 13 test files and 95 tests, four
  courses and twelve lessons with no content warnings, and a successful production build.
  Definition/schema/component parity and generated strict-schema documentation include all three
  choice assessments. Existing Cornerstone browser-externalization and large lazy chunk warnings
  remain non-failing.
- **Follow-ups:** Start P4-T06 classification, matching and accessible ordering using the shared
  review semantics without coupling components to player state.

### [2026-10-01 22:04] P4-T06 - Install ordering interaction dependencies

- **Agent/session:** Cursor implementation session
- **Action:** Verified the current `@dnd-kit` packages accept React 19 through their published peer
  ranges, then installed core, sortable and utility packages for accessible ordering interactions.
- **Files changed:** `package.json`, `package-lock.json`.
- **Commands run:** `npm view @dnd-kit/{core,sortable,utilities}@latest`; `npm install
@dnd-kit/core@^6.3.1 @dnd-kit/sortable@^10.0.0 @dnd-kit/utilities@^3.2.2`.
- **Result/verification:** npm resolved compatible packages successfully. The existing audit reports
  12 transitive vulnerabilities; no forced dependency changes were applied.
- **Follow-ups:** Add strict structured-assessment schemas, evaluators, components and tests.

### [2026-10-01 22:10] P4-T06 - Add structured assessments

- **Agent/session:** Cursor implementation session
- **Action:** Added strict classification, match-pairs and ordering schemas with semantic reference
  checks; pure exact/partial evaluators; resumable draft and reveal-aware review components;
  select-first classification/matching interactions; and accessible drag, keyboard and button
  ordering. Migrated safety `escalation-order`, recorded ADR-025 and completed the phase checklist.
- **Files changed:** `package.json`, `package-lock.json`,
  `public/content/courses/safety-assessment.json`, `src/content/schema/primitives/**`,
  `src/primitives/{components,definitions}/**`, `src/primitives/componentRegistry.ts`,
  `src/primitives/structuredAssessments.test.tsx`, `src/{engines/learning,player}/*.test.ts*`,
  `docs/{ACTIVITY_LOG,CONTENT_SCHEMA,DECISIONS,HANDOFF}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Focused Prettier, typecheck, lint and Vitest runs; `npm run schema:export`;
  `npm run validate:content`; `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 14 test files and 114 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. IDE lint diagnostics
  are clear. Existing Cornerstone browser-externalization and large lazy chunk warnings remain
  non-failing; ordering is emitted as a lazy 49.87 kB minified chunk.
- **Follow-ups:** Start P4-T07 fill-blank and numeric typed-response assessments.

### [2026-10-01 22:18] P4-T07 - Add typed-response assessments

- **Agent/session:** Cursor implementation session
- **Action:** Added strict fill-blank and numeric schemas, one-to-one blank token validation, pure
  NFKC text normalization, locale-safe numeric parsing, per-blank and tolerance/range evaluators,
  accessible draft-aware lazy components and reveal-controlled review. Extended generic review
  labels, schema documentation and coverage; recorded ADR-029.
- **Files changed:** `src/content/schema/primitives/**`, `src/primitives/{components,definitions}/**`,
  `src/primitives/{componentRegistry,shared/ReviewMark,typedResponseAssessments.test}.tsx`,
  `src/player/player.test.tsx`, `docs/{ACTIVITY_LOG,CONTENT_SCHEMA,DECISIONS,HANDOFF}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Focused Prettier, typecheck, lint and Vitest runs; `npm run schema:export`;
  `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 15 test files and 131 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. The first full-gate
  run exposed and corrected the primitive-module count assertion. Existing Cornerstone
  browser-externalization and large lazy chunk warnings remain non-failing.
- **Follow-ups:** Start P4-T08 timed-response wrapper, announcements and timeout behavior.

### [2026-10-01 22:26] P4-T08 - Add timed responses

- **Agent/session:** Cursor implementation session
- **Action:** Added player-owned per-attempt timers for timer-compatible assessments, a semantic
  timer badge with configured polite announcements, hidden-document pause/restart behavior,
  full-duration activity-resume semantics and zero-score timeout submission of the current draft.
  Timeout now persists on step progress, emits `question_answered.timedOut`, shows generic feedback
  and follows the existing retry/max-attempt policy. Recorded ADR-030 because ADR-029 was already
  allocated to P4-T07 at the required starting commit.
- **Files changed:** `public/content/app-config.json`, `schemas/app-config.schema.json`,
  `src/content/schema/index.ts`, `src/engines/learning/{plan,session}.ts`,
  `src/player/{ActivityPlayer,StepFrame,TimerBadge}.tsx`, `src/player/useAttemptTimer.ts`,
  `src/player/player.test.tsx`, `docs/{ACTIVITY_LOG,DECISIONS,HANDOFF}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Focused Prettier, typecheck, lint and player Vitest runs;
  `npm run schema:export`; `npm run test`; `npm run validate:content`; `npm run check`;
  `git diff --check`.
- **Result/verification:** The full gate passes with 15 test files and 134 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. Fake-timer coverage
  verifies timeout draft submission, configured announcements, retry exhaustion, hidden-tab pause
  and full timer restart on activity resume. Existing Cornerstone browser-externalization and large
  lazy chunk warnings remain non-failing.
- **Follow-ups:** Start P4-T09 zoomable, hotspot and comparison image primitives.

### [2026-10-01 22:43] P4-T09 - Add interactive image primitives

- **Agent/session:** Cursor implementation session
- **Action:** Upgraded ordinary images with manifest-sized rendering, annotation toggles and a
  pan/zoom artifact overlay. Added strict zoomable-image, hotspot and comparison schemas,
  definition-driven content/assessment behavior, pure normalized circle/rectangle/polygon hit
  testing, accessible pointer/pinch/wheel/keyboard interactions, review targets and responsive
  comparison layouts. Added original synthetic SVG fixtures with provenance and recorded ADR-031.
- **Files changed:** `public/assets/images/showcase/**`, `public/content/assets.json`,
  `src/content/{schema/primitives,useAssetUrl.ts}/**`, `src/engines/learning/{plan.ts,
learningEngine.test.ts}`, `src/primitives/{components,definitions,shared}/**`,
  `src/primitives/{componentRegistry.ts,imagePrimitives.test.tsx}`,
  `src/player/player.test.tsx`, `docs/{ACTIVITY_LOG,CONTENT_SCHEMA,DECISIONS,HANDOFF}.md`,
  `docs/phases/phase-04-standard-primitives.md`.
- **Commands run:** Focused Prettier, typecheck, lint and Vitest runs; `npm run schema:export`;
  `npm run test`; `npm run validate:content`; `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 16 test files and 147 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. IDE lint diagnostics
  are clear. Existing Cornerstone browser-externalization and large lazy chunk warnings remain
  non-failing.
- **Follow-ups:** Start P4-T10 data-table, chart and formula primitives.

### [2026-10-01 22:53] P4-T10 - Add scientific data primitives

- **Agent/session:** Cursor implementation session
- **Action:** Added strict data-table, chart and formula schemas, pure definitions and lazy
  components. Tables provide scoped headers, focusable horizontal scrolling, sticky first columns,
  authored emphasis/highlights and artifact expansion. In-house SVG charts support line, bar,
  scatter and dose-response data with labelled axes, source tables, keyboard-focusable
  shape-distinguished points and pure scale/tick/4PL math. KaTeX and mhchem load only with formulas;
  Node content validation parses TeX strictly while runtime rendering remains untrusted and
  non-throwing. Migrated `dose-curve` and recorded ADR-023/024.
- **Files changed:** Package manifests; the data-interpretation course; content validation/export
  scripts; primitive schemas, definitions, lazy components and tests; player parity coverage; and
  Phase 4 activity, schema, decision and handoff documentation.
- **Commands run:** Installed `katex` and `@types/katex`; focused Prettier, typecheck, lint and
  Vitest runs; `npm run schema:export`; `npm run validate:content`; `npm run build`;
  `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 17 test files and 157 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. Data table, chart and
  formula lazy JavaScript chunks are 2.97 kB, 8.38 kB and 294.17 kB minified; formula CSS is a
  separate 28.83 kB lazy asset. Existing Cornerstone browser-externalization and large DICOM/entry
  chunk warnings remain non-failing.
- **Follow-ups:** Start P4-T11 video, audio, carousel and PDF-reference primitives.

### [2026-10-01 23:06] P4-T11 - Add media and reference primitives

- **Agent/session:** Cursor implementation session
- **Action:** Added strict video, audio, carousel and PDF-reference schemas, pure definitions and
  lazy components; upgraded rich text with safe first-term/emphasis tokenization. Native media now
  reports unioned played-range coverage in five-percent steps, video supports required captions,
  markers and formative pause checkpoints, audio exposes a transcript disclosure, carousels report
  distinct observed slides with keyboard/control fallbacks, and PDF citations open native page
  fragments. Added a deterministic ffmpeg/Node fixture generator, hand-authored accessibility text,
  provenance and ADR-032 (ADR-027 was already allocated at baseline).
- **Files changed:** `package.json`, `scripts/media/**`, `public/assets/media/showcase/**`,
  `public/content/assets.json`, `src/content/schema/primitives/**`,
  `src/primitives/{components,definitions}/**`, `src/primitives/{componentRegistry,mediaProgress,
richTextTokenizer,mediaPrimitives.test}.ts*`, engine/player parity tests, generated schema
  documentation and Phase 4 activity/decision/handoff documentation.
- **Commands run:** `npm run media:fixtures`; ffprobe codec/duration audit; focused Prettier,
  typecheck, lint and Vitest runs; `npm run schema:export`; `npm run validate:content`;
  `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 18 test files and 166 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. The generated H.264/
  AAC MP4 is 24 seconds at 640×360; all committed showcase fixture files total 444,375 bytes.
  Existing Cornerstone browser-externalization and large DICOM/entry chunk warnings remain
  non-failing.
- **Follow-ups:** Start P4-T12 scenario schemas, engine and resumable UI.

### [2026-10-01 23:19] P4-T12 - Add branching scenarios

- **Agent/session:** Cursor implementation session
- **Action:** Added strict context, decision, choice and outcome schemas; pure graph validation and
  scenario transitions; mean scored-choice evaluation; and a lazy split-layout component with
  resumable path/current/revealed drafts, locked choices, live consequences, outcome submission and
  best-choice review. Migrated `case-intro` and `trial-case` to real three-decision converging
  scenarios and recorded ADR-022, which was the intentionally open number before ADR-023.
- **Files changed:** Scenario schema, engine, definition, lazy component and tests; content parser,
  primitive registries, player outcome submission and parity coverage; scientific-imaging and
  clinical-research course content; route/content tests; schema export and generated content-schema
  documentation; Phase 4 checklist, ADR and handoff documentation.
- **Commands run:** Focused Prettier, typecheck, lint and Vitest runs; `npm run schema:export`;
  `npm run validate:content`; `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 19 test files and 176 tests, four courses and
  twelve lessons with no content warnings, and a successful production build. The first full-gate
  run exposed and corrected the primitive-module count assertion. IDE lint diagnostics are clear.
  Existing Cornerstone browser-externalization and large DICOM/entry chunk warnings remain
  non-failing.
- **Follow-ups:** Start P4-T13 internal showcase course and primitive gallery.

### [2026-10-01 23:29] P4-T13 - Add internal primitive showcase

- **Agent/session:** Cursor implementation session
- **Action:** Added defaulted learner/internal course visibility and a filtered `catalogCourses`
  registry collection, then moved learner discovery, continuation, revision and pathway course
  lookup to that collection while preserving complete direct-route indexes. Added the internal
  `runtime-showcase` course with all 21 implemented standard types across 22 ordered examples.
  Added `/dev/primitives` with local-only interactive, review, disabled, reset and missing-asset
  controls, plus `/dev` links to the gallery and real lesson route. Recorded ADR-033 because
  ADR-028 was already allocated at baseline.
- **Files changed:** Course/content schemas and generated schema docs; content loader and manifest;
  `runtime-showcase` content; learner-facing route surfaces; dev gallery, links and router; hotspot
  review disabling; content, route, gallery and reset tests; Phase 4 checklist, ADR and handoff
  documentation.
- **Commands run:** `npm run validate:content`; focused TypeScript, lint and Vitest runs;
  `npm run schema:export`; focused Prettier; `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 20 test files and 182 tests. Content validation
  reports five courses, thirteen lessons and zero warnings; four courses and twelve lessons remain
  learner-visible. The production build succeeds with the existing Cornerstone browser
  externalization and large-chunk warnings.
- **Follow-ups:** Start P4-T14 cross-runtime, resume, timeout and validation boundary coverage.

### [2026-10-01 23:37] P4-T14 - Cover standard primitive flows

- **Agent/session:** Cursor implementation session
- **Action:** Added a real-route play-through of all 22 showcase steps with exact ordered lifecycle
  events and first-attempt partial-credit summary coverage. Added remount tests for revealed scenario
  and changed ordering drafts, expanded internal-course surface isolation and precise challenge
  semantic diagnostics, and tightened primitive component import boundaries. Audited and retained
  the existing timeout/`timedOut`, duplicate-ID and asset-type mismatch coverage. Fixed production
  planning to skip only deferred DICOM types, de-duplicated media completion events during burst
  progress updates, and removed React key-spread warnings from image-region overlays.
- **Files changed:** `src/routes/play/showcaseFlow.test.tsx`, `src/player/{ActivityPlayer,player.test}.tsx`,
  `src/engines/learning/{plan,learningEngine.test}.ts`, `src/content/{primitiveTypes,content.test}.ts`,
  `src/routes/surfaces.test.tsx`, `src/primitives/shared/ImageRegionOverlay.tsx`,
  `docs/phases/phase-04-standard-primitives.md`, `docs/{ACTIVITY_LOG,HANDOFF}.md`.
- **Commands run:** focused Vitest runs; `npm run typecheck`; `npm run lint`; focused Prettier;
  `npm run check`; `git diff --check`.
- **Result/verification:** The full gate passes with 21 test files and 186 tests. Content validation
  reports five courses, thirteen lessons and zero warnings; the production build succeeds with the
  existing Cornerstone browser-externalization and large-chunk warnings. The 22-step route test
  reaches completion at 95% score and 90% first-attempt accuracy after a partial-credit retry.
- **Follow-ups:** Start P4-T15 responsive, accessibility and bundle QA.

### [2026-10-02 00:50] P4-T15 - Verify standard primitive UX

- **Agent/session:** Cursor implementation session
- **Action:** Finalized responsive, accessibility and bundle QA from the supplied browser evidence
  and the existing P4-T15 defect fixes at `56f4a1a`. Verified all 22 gallery examples/21 standard
  types and the real showcase route without document overflow at four target viewports; recorded
  focus, accessibility-tree, keyboard, reduced-motion and contrast checks. Documented the blocked
  synthetic divider drag, its automated pointer regression coverage and the entry-bundle deviation.
- **Files changed:** `docs/phases/phase-04-standard-primitives.md`,
  `docs/ACTIVITY_LOG.md`, `docs/HANDOFF.md`.
- **Commands run:** `npm run check`; focused Prettier check; `git diff --check`; repository status
  and commit inspection; final documentation commit.
- **Result/verification:** The full gate passes with 21 test files and 187 tests; content validation
  reports five courses, thirteen lessons and zero warnings. The production entry is 649.39 kB raw /
  197.80 kB gzip, 54.27 / 14.95 kB above baseline and 4.95 kB gzip above target. Lazy standard
  primitive chunks remain split; the PWA precache contains 98 entries totaling 5553.13 KiB.
  Existing Cornerstone browser-externalization and large-chunk warnings remain non-failing.
- **Follow-ups:** Run P4-T16 closing quality gate and finish Phase 4 documentation.

### [2026-10-02 00:56] P4-T16 - Close standard primitives phase

- **Agent/session:** Cursor implementation session
- **Action:** Audited P4-T00 through P4-T15 and every Phase 4 exit criterion against the commit
  sequence, implementation boundaries and automated/browser evidence. Verified the unique
  ADR-001–ADR-033 sequence and reconciled the Phase 4 ADR-018–ADR-033 decision map without
  renumbering history. Updated the definitions/player architecture, generated content-contract
  summary, roadmap, Phase 5 handoff and final phase verification/deviations.
- **Files changed:** `scripts/export-json-schema.ts`, `docs/ARCHITECTURE.md`,
  `docs/CONTENT_SCHEMA.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`,
  `docs/phases/phase-04-standard-primitives.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run schema:export`; `npm run check`; focused Prettier check/write;
  IDE lint inspection; ADR, implementation, test and pending-claim searches; `git diff --check`.
- **Result/verification:** Phase 4 is complete. Type checking and lint pass; 21 test files with 187
  tests pass; content validation reports five courses, thirteen lessons and zero warnings; the
  production build succeeds with 98 precache entries totaling 5553.13 KiB. The entry remains
  649.39 kB raw / 197.80 kB gzip, 4.95 kB gzip above the approved growth target. The only browser
  limitation is the blocked synthetic comparison-divider drag, covered by keyboard operation and
  the pointer regression test.
- **Follow-ups:** Commit the closeout, then begin Phase 5 planning.

### [2026-10-02 01:39] P4-T16 - Post-close documentation audit

- **Agent/session:** Cursor documentation audit
- **Action:** Re-audited the Phase 4 phase record, architecture, generated content-schema summary,
  decision log, roadmap, handoff and activity history against the final implementation and commit
  sequence. Corrected the handoff's stale pre-close commit reference.
- **Files changed:** `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** Documentation searches, `git status`, `git log`, `git diff --check`.
- **Result/verification:** The phase checklist, verification and deviations are complete; ADR-001
  through ADR-033 are unique; the roadmap points to Phase 5; architecture and schema documentation
  reflect the runtime; and the handoff now references final Phase 4 close-out commit `3710374`.
- **Follow-ups:** Begin Phase 5 planning.

### [2026-10-02 01:58] P5-T00 - Plan gamification and mastery

- **Agent/session:** Cursor implementation session
- **Action:** Audited the Phase 4 handoff, PRD gamification/mastery requirements, current event
  handlers, progress reducer, learner state, selectors, player summaries, surfaces, configuration
  and seed data. Formalized the Phase 5 scope, replay-as-revision policy, functional reward UI,
  ordered pipeline, state-v3 direction, task sequence, PRD traceability and exit criteria.
- **Files changed:** `docs/phases/phase-05-gamification-mastery.md`, `docs/ROADMAP.md`,
  `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** Repository status/history inspection and documentation/code searches.
- **Result/verification:** Phase 5 has an implementation-ready checklist from P5-T00 through P5-T16.
  The roadmap and handoff now identify Phase 5 as in progress.
- **Follow-ups:** Add strict gamification configuration and validated achievement criteria.

### [2026-10-02 02:01] P5-T01 - Validate gamification content

- **Agent/session:** Cursor implementation session
- **Action:** Added strict XP/mastery settings, achievement criteria, weekly challenge progress
  rules and semantic reference validation; reconciled badge copy and criteria.
- **Files changed:** `src/content/schema/index.ts`, `src/content/loader.ts`,
  `public/content/app-config.json`, generated schemas and schema documentation.
- **Commands run:** Typecheck, content validation and schema export.
- **Result/verification:** Five courses and thirteen lessons validate with zero warnings.
- **Follow-ups:** Add learner state v3.

### [2026-10-02 02:04] P5-T02 - Add learner state v3

- **Agent/session:** Cursor implementation session
- **Action:** Added reward ledgers, challenge periods, counters, run/results, celebrations and
  digital rewards; added v2 migration, date rebasing and consistent v3 seeds.
- **Files changed:** `src/state/learnerStore.ts`, `src/state/seedDates.ts`,
  `public/content/seeds/advanced.json`, `public/content/seeds/fresh.json`.
- **Commands run:** Focused state/migration tests, typecheck and content validation.
- **Result/verification:** Migration and reset preserve idempotency and seed state.
- **Follow-ups:** Expand typed events.

### [2026-10-02 02:06] P5-T03 - Split learner event roles

- **Agent/session:** Cursor implementation session
- **Action:** Added question difficulty, typed reward outputs, demo commands and celebration
  dismissal; removed the misleading authored-XP result field.
- **Files changed:** `src/events/types.ts`, `src/player/ActivityPlayer.tsx`, affected tests.
- **Commands run:** Event and player tests; typecheck.
- **Result/verification:** Input/output payloads compile and existing event coverage passes.
- **Follow-ups:** Compose the ordered pipeline.

### [2026-10-02 02:09] P5-T04 - Add atomic event pipeline

- **Agent/session:** Cursor implementation session
- **Action:** Composed learning, gamification and mastery reducers, replaced direct XP mutation and
  added a re-entrant event queue with one store commit per input.
- **Files changed:** `src/engines/pipeline.ts`, `src/events/handlers.ts`, `src/main.tsx`,
  `src/state/learnerStore.ts`.
- **Commands run:** Pipeline/handler tests and typecheck.
- **Result/verification:** Informational outputs do not double count and `course_completed` queues.
- **Follow-ups:** Implement calendar rules.

### [2026-10-02 02:11] P5-T05 - Implement calendar engagement

- **Agent/session:** Cursor implementation session
- **Action:** Added local date/week helpers, streak extension/reset, weekly activity, XP rollover,
  target rewards and daily/weekly challenge period keys.
- **Files changed:** `src/engines/gamification/calendar.ts`,
  `src/engines/gamification/streak.ts`, gamification state/reducer and tests.
- **Commands run:** Calendar and pipeline tests.
- **Result/verification:** Month/week boundaries, missed days and weekly target awards pass.
- **Follow-ups:** Add all XP, star and level rules.

### [2026-10-02 02:13] P5-T06 - Implement XP stars and levels

- **Agent/session:** Cursor implementation session
- **Action:** Added fractional first-attempt XP, completion/revision/perfect/challenge rewards,
  reward ledgers, best stars, run summaries and level transitions.
- **Files changed:** `src/engines/gamification/index.ts`, `levels.ts`, `stars.ts`,
  `src/engines/pipeline.test.ts`.
- **Commands run:** Focused pipeline tests.
- **Result/verification:** Repeat rewards are idempotent and badge XP participates in level checks.
- **Follow-ups:** Add mastery.

### [2026-10-02 02:15] P5-T07 - Implement mastery

- **Agent/session:** Cursor implementation session
- **Action:** Added configured weighted fractional mastery, concept splitting, clamping and bounded
  history on first attempts.
- **Files changed:** `src/engines/mastery/mastery.ts`, `mastery.test.ts`.
- **Commands run:** Focused mastery tests.
- **Result/verification:** Partial credit, retry exclusion, clamping and history limits pass.
- **Follow-ups:** Add achievement evaluation.

### [2026-10-02 02:17] P5-T08 - Implement badges and rewards

- **Agent/session:** Cursor implementation session
- **Action:** Added derived criteria evaluation, idempotent unlocks, badge XP cascades, primitive
  rewards and the abstract digital reward ledger.
- **Files changed:** `src/engines/gamification/criteria.ts`, `index.ts`, pipeline tests.
- **Commands run:** Badge/primitive reward pipeline tests.
- **Result/verification:** Primitive rewards unlock once and badge XP triggers one level transition.
- **Follow-ups:** Add derived selectors.

### [2026-10-02 02:18] P5-T09 - Add gamification selectors

- **Agent/session:** Cursor implementation session
- **Action:** Added current streak, challenge period, activity result, criterion description and
  derived badge progress selectors; updated pathway challenge periods.
- **Files changed:** `src/state/selectors/gamification.ts`, `viewModels.ts`, selector tests.
- **Commands run:** Selector tests.
- **Result/verification:** Seeded badge progress is now consistent with source learner facts.
- **Follow-ups:** Surface activity rewards.

### [2026-10-02 02:19] P5-T10 - Surface earned rewards

- **Agent/session:** Cursor implementation session
- **Action:** Replaced the completion placeholder with XP, stars, mastery, rank and streak; added
  question XP to feedback.
- **Files changed:** `src/components/rewards/RewardSummary.tsx`,
  `src/player/CompletionSummary.tsx`, `FeedbackPanel.tsx`, `ActivityPlayer.tsx`.
- **Commands run:** Reward presentation and player tests.
- **Result/verification:** Activity results render from committed pipeline state.
- **Follow-ups:** Add queued celebrations.

### [2026-10-02 02:20] P5-T11 - Add reward celebrations

- **Agent/session:** Cursor implementation session
- **Action:** Added persisted, queued Radix badge/level dialogs with focus management, Escape/click
  dismissal and active-session suppression.
- **Files changed:** `src/components/rewards/CelebrationHost.tsx`, layout integration and tests.
- **Commands run:** Celebration component tests.
- **Result/verification:** Badge reason/XP and level transitions are accessible and queue-safe.
- **Follow-ups:** Update all learner surfaces.

### [2026-10-02 02:21] P5-T12 - Update learner surfaces

- **Agent/session:** Cursor implementation session
- **Action:** Updated Home, Profile, Challenge and Pathway to consume derived streak, badge and
  challenge-period data; leaderboard continues to react to current weekly XP.
- **Files changed:** surface routes and gamification selectors.
- **Commands run:** Surface and selector tests.
- **Result/verification:** All required surfaces update from shared state without local reward rules.
- **Follow-ups:** Enable demo controls.

### [2026-10-02 02:22] P5-T13 - Enable reward simulation

- **Agent/session:** Cursor implementation session
- **Action:** Enabled Grant XP, Unlock all, Simulate badge and Simulate level-up controls through
  typed `demo_command` events.
- **Files changed:** `src/routes/dev/DevPage.tsx`, `DevPage.test.tsx`.
- **Commands run:** Developer tools component test.
- **Result/verification:** All four controls emit pipeline inputs; no control mutates the store.
- **Follow-ups:** Complete integration coverage.

### [2026-10-02 02:24] P5-T14 - Complete gamification coverage

- **Agent/session:** Cursor implementation session
- **Action:** Added engine, calendar, mastery, migration, persistence/reset, handler, criteria,
  reward UI, dev control, rewarded challenge-flow and import-boundary coverage.
- **Files changed:** Phase 5 test files across `src/engines`, `src/events`, `src/state`,
  `src/components` and `src/routes`.
- **Commands run:** Full tests and focused suites.
- **Result/verification:** 29 test files with 211 tests pass.
- **Follow-ups:** Run browser and bundle QA.

### [2026-10-02 02:29] P5-T15 - Verify reward UX

- **Agent/session:** Cursor implementation session
- **Action:** Exercised badge and level simulation, Profile achievement/mastery output, focus,
  Escape dismissal, reduced motion and four responsive viewports in the browser; recorded bundle
  output.
- **Files changed:** Phase documentation.
- **Commands run:** `npm run check`, local Vite server and browser accessibility/CDP inspection.
- **Result/verification:** No overflow at 375×812, 812×375, 768×900 or 1280×900. Continue received
  dialog focus; reduced motion yielded 0.001-second animation/transition durations. Final entry
  bundle is 674.74 kB raw / 204.44 kB gzip; precache is 98 entries / 5580.88 KiB.
- **Follow-ups:** Close Phase 5 documentation.

### [2026-10-02 02:32] P5-T16 - Close gamification and mastery

- **Agent/session:** Cursor implementation session
- **Action:** Recorded ADR-034 through ADR-039, regenerated schemas, updated architecture, roadmap,
  phase verification and handoff, and ran the final quality gate.
- **Files changed:** `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`,
  `docs/ROADMAP.md`, `docs/HANDOFF.md`, `docs/phases/phase-05-gamification-mastery.md`,
  `docs/ACTIVITY_LOG.md`, generated schemas.
- **Commands run:** Schema export, focused formatting, `npm run check`, `git diff --check`.
- **Result/verification:** Phase 5 is complete with 29 test files and 211 tests, zero content
  warnings and a successful production build.
- **Follow-ups:** Begin Phase 6 DICOM learning viewer planning.

### [2026-10-02 02:35] P5-T16 - Commit phase implementation

- **Agent/session:** Cursor implementation session
- **Action:** Committed the complete Phase 5 implementation and recorded the handoff commit.
- **Files changed:** `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** `git add`, Conventional Commit, repository status.
- **Result/verification:** Implementation commit `6736a96` contains the complete tested Phase 5
  change set.
- **Follow-ups:** Commit this documentation note; Phase 6 is next.

### [2026-10-02 03:00] P6-T00 - Define DICOM viewer phase

- **Agent/session:** Cursor implementation session
- **Action:** Defined Phase 6 scope, resolved product decisions, architecture rules, task sequence,
  PRD traceability, exit criteria and the physical-device deviation.
- **Files changed:** `docs/phases/phase-06-dicom-viewer.md`, `docs/ROADMAP.md`,
  `docs/HANDOFF.md`.
- **Commands run:** Documentation review and repository-status inspection.
- **Result/verification:** Phase 6 has an actionable implementation contract; the roadmap marks it
  in progress.
- **Follow-ups:** Build the externally hosted series pipeline.

### [2026-10-02 03:09] P6-T01 - Add hosted series pipeline

- **Agent/session:** Cursor implementation session
- **Action:** Added a v0.2 DICOM manifest with geometry, file sizes and SHA-256 hashes; local and
  remote verification; a development CORS server; configurable series URL resolution; external-host
  Workbox matching; and production-series provenance/hosting guidance.
- **Files changed:** `scripts/dicom/prepare-series.mjs`, `scripts/dicom/verify-series.mjs`,
  `scripts/dicom/serve-series.mjs`, `src/imaging/seriesUrl.ts`, `vite.config.ts`, `package.json`,
  `.env.example`, `public/assets/dicom/thoracic-ct/`, phase documentation.
- **Commands run:** `npm run dicom:prepare`, `npm run dicom:verify`, Prettier, typecheck, lint.
- **Result/verification:** All 125 instances and 65,894,350 bytes passed size and SHA-256
  verification. Type checking passed; lint identified Node-global declarations and was corrected.
- **Follow-ups:** Author calibrated educational targets from the stack.

### [2026-10-02 03:15] P6-T02 - Author DICOM teaching targets

- **Agent/session:** Cursor implementation session
- **Action:** Added a dependency-light CT preview/geometry helper, inspected the curated stack and
  authored a tracheal identification region and transverse air-column measurement.
- **Files changed:** `scripts/dicom/preview-series.py`,
  `docs/reference/dicom-teaching-targets.md`, `package.json`, phase documentation.
- **Commands run:** Generated mediastinal/lung previews; inspected representative slices; derived
  the slice-81 air component from HU thresholding; verified normalized line length.
- **Result/verification:** The 18-column reference line evaluates to 17.578 mm at the declared
  0.976562 mm spacing. The target is labelled educational-only and requires SME review.
- **Follow-ups:** Encode the four DICOM modes as strict content contracts.

### [2026-10-02 03:27] P6-T03 - Add strict DICOM contracts

- **Agent/session:** Cursor implementation session
- **Action:** Added strict schemas for explore, guided, region-identification and measurement
  primitives; required calibrated DICOM asset metadata; and validated slice bounds, references,
  presets, tools and reference-line geometry.
- **Files changed:** DICOM/content schemas, loader semantic validation, asset/course fixtures,
  schema exporter and generated schema documentation.
- **Commands run:** Prettier, schema export, typecheck and content validation.
- **Result/verification:** Five courses and thirteen lessons validate with zero warnings; all 25
  primitive types now have strict content contracts.
- **Follow-ups:** Add pure imaging functions and DICOM primitive definitions.

### [2026-10-02 03:33] P6-T04 - Add pure DICOM domain

- **Agent/session:** Cursor implementation session
- **Action:** Added React-free slice/geometry, preset, exploration/guidance and evaluation functions;
  registered all four DICOM definitions with the `viewer` layout.
- **Files changed:** `src/imaging/`, DICOM definitions, definition/component registries and a
  temporary lazy DICOM presentation boundary.
- **Commands run:** Prettier, typecheck and lint.
- **Result/verification:** All DICOM types resolve through the same definition contract as standard
  primitives; region and measurement evaluators return fractional item results.
- **Follow-ups:** Extend interactions, events and product configuration.

### [2026-10-02 03:39] P6-T05 - Add DICOM event contracts

- **Agent/session:** Cursor implementation session
- **Action:** Added typed slice, window, tool, region, measurement, requirement and viewer-lifecycle
  interactions; enriched DICOM events with activity context; mapped them through the player; and
  added validated DICOM loading/input limits to product configuration.
- **Files changed:** primitive/event types, interaction mapper, app configuration/schema and
  generated app-config schema.
- **Commands run:** Prettier, typecheck, focused event/pipeline/player tests and schema export.
- **Result/verification:** Type checking passes and 22 focused tests pass. DICOM events remain
  ordinary pipeline inputs and preserve the callback-only primitive boundary.
- **Follow-ups:** Build the production Cornerstone adapter.

### [2026-10-02 03:50] P6-T06 - Add production imaging adapter

- **Agent/session:** Cursor implementation session
- **Action:** Added strict hosted-manifest loading and metadata reconciliation, a lazy
  Cornerstone-only adapter, per-instance engines/tool groups, CPU fallback, coordinate transforms,
  progressive nearby-first prefetch, calibrated measurement callbacks, context-loss handling and
  reference-counted cache cleanup.
- **Files changed:** `src/imaging/series.ts`, `src/imaging/viewer/`,
  `src/imaging/cornerstone/createController.ts`, DICOM exported types.
- **Commands run:** Cornerstone API inspection, Prettier, typecheck and lint.
- **Result/verification:** The production adapter compiles without any eager Cornerstone import
  outside `src/imaging/cornerstone`; initialization and cleanup are StrictMode-tolerant.
- **Follow-ups:** Build the responsive shared viewer shell.

### [2026-10-02 04:03] P6-T07 - Add DICOM viewer shell

- **Agent/session:** Cursor implementation session
- **Action:** Added the shared viewer with loading/error/retry/skip states, configured tools and
  presets, range and keyboard slice navigation, fit/reset, coordinate-aware annotation overlay,
  touch tap discrimination and fullscreen/fixed-overlay immersive behavior with instructions sheet.
- **Files changed:** `src/imaging/viewer/DicomViewer.tsx`, `AnnotationOverlay.tsx`,
  `useDicomViewer.ts`, phase documentation.
- **Commands run:** Prettier, typecheck and lint.
- **Result/verification:** The viewer shell is keyboard-labelled, responsive, safe-area aware and
  keeps imaging behind the lazy controller boundary.
- **Follow-ups:** Implement explore and guided primitive behavior.

### [2026-10-02 04:14] P6-T08 - Implement DICOM exploration and guidance

- **Agent/session:** Cursor implementation session
- **Action:** Added callback-only explore and guided primitives with resumable viewer state,
  configuration-driven requirement tracking, ordered guided steps, acknowledge conditions and an
  optional in-viewer checkpoint assessment.
- **Files changed:** `DicomExplorePrimitive.tsx`, `DicomGuidedPrimitive.tsx`, DICOM component
  helpers/registry and the Cornerstone preset callback.
- **Commands run:** Prettier, typecheck and lint.
- **Result/verification:** Both modes resolve through lazy primitive components; completion remains
  player-owned through interaction keys or checkpoint submission.
- **Follow-ups:** Implement slice-aware region identification.

### [2026-10-02 04:21] P6-T09 - Implement DICOM region identification

- **Agent/session:** Cursor implementation session
- **Action:** Added tap-versus-drag region selection, resumable marker state, slice-aware submission,
  retry-safe review and reveal-policy-controlled target overlays.
- **Files changed:** `DicomIdentifyRegionPrimitive.tsx`, component registry and phase
  documentation.
- **Commands run:** Prettier, typecheck and lint.
- **Result/verification:** Region responses include both selected slice and normalized image point;
  pure evaluation can award partial credit for slice or location.
- **Follow-ups:** Implement calibrated length measurement.

### [2026-10-02 04:27] P6-T10 - Implement DICOM measurement

- **Agent/session:** Cursor implementation session
- **Action:** Added a single-length measurement primitive with live physical-unit readout,
  calibration gating, resumable response, scored submission and reveal-policy-controlled reference
  line/expected value.
- **Files changed:** `DicomMeasurePrimitive.tsx`, component registry and Cornerstone annotation
  lifecycle.
- **Commands run:** Prettier, typecheck and lint.
- **Result/verification:** A new measurement replaces the previous annotation; unknown units cannot
  be submitted as a graded response.
- **Follow-ups:** Integrate viewer layout, production planning and failure semantics.

### [2026-10-02 04:31] P6-T11 - Integrate DICOM with player

- **Agent/session:** Cursor implementation session
- **Action:** Enabled supported DICOM steps in production plans, added the wide viewer player layout,
  preserved DICOM draft resume and connected recoverable skip behavior to unscored completion or a
  zero-score assessment submission.
- **Files changed:** activity planning, `StepFrame.tsx`, learning/player tests and phase
  documentation.
- **Commands run:** Prettier, typecheck and focused learning/player tests.
- **Result/verification:** 22 focused tests pass; production retains DICOM and only unknown
  primitives use the unsupported fallback. Missing scores already contribute zero to summaries.
- **Follow-ups:** Add the complete DICOM fixture flow to configured course content.

### [2026-10-02 04:40] P6-T12 - Add configured DICOM flows

- **Agent/session:** Cursor implementation session
- **Action:** Expanded Imaging Lab into guided inspection, slice-aware trachea identification and
  calibrated measurement; added explore, identify and measure to the internal runtime showcase; and
  corrected the DICOM primitive type in reward coverage.
- **Files changed:** scientific-imaging/runtime-showcase content, pipeline and showcase route tests,
  phase documentation.
- **Commands run:** Content validation and focused showcase/pipeline tests.
- **Result/verification:** Five courses and thirteen lessons validate with zero warnings. The
  25-step showcase completes through a deterministic unavailable-viewer test boundary and emits
  ordered lifecycle events.
- **Follow-ups:** Replace the legacy spike route with a production DICOM sandbox.

### [2026-10-02 04:46] P6-T13 - Retire the DICOM spike

- **Agent/session:** Cursor implementation session
- **Action:** Removed the isolated spike route/source and old tracked spike manifest, linked the
  developer area to production DICOM primitives in the callback-only gallery, and documented the
  production imaging boundary and superseded spike.
- **Files changed:** router, developer surfaces/tests, `src/spikes/dicom/` removal, old spike asset
  metadata removal and architecture/spike/handoff documentation.
- **Commands run:** Prettier, typecheck and focused router/developer tests.
- **Result/verification:** Ten focused tests pass; no application route imports the old spike.
- **Follow-ups:** Complete DICOM unit, component, integration and import-boundary coverage.

### [2026-10-02 04:58] P6-T14 - Add DICOM automated coverage

- **Agent/session:** Cursor implementation session
- **Action:** Added pure URL/manifest/geometry/requirements/evaluation tests, callback component
  tests against a fake viewer, a real player-to-pipeline XP/mastery/badge test and an enforced
  Cornerstone import boundary. Updated fixture counts and moved the full DICOM sequence into Imaging
  Lab as intended.
- **Files changed:** DICOM domain/component/player tests, player import-boundary assertion, content
  fixtures/count assertions and the viewer props export.
- **Commands run:** Typecheck, focused suites, full Vitest suite, lint and IDE diagnostics.
- **Result/verification:** 32 test files and 221 tests pass; lint and IDE diagnostics are clean.
- **Follow-ups:** Run browser, cross-origin, responsive, offline, performance and bundle QA.

### [2026-10-02 05:18] P6-T15 - Verify DICOM browser behavior

- **Agent/session:** Cursor implementation session
- **Action:** Exercised all configured DICOM learning modes in Chrome, checked the four target
  viewports with touch emulation, verified immersive fallback and the instructions sheet, graded a
  calibrated measurement, tested the external host and completed a service-worker-backed offline
  reload. Recorded the Phase 9 physical-device matrix.
- **Files changed:** `docs/qa/phase-06-browser-qa.md`,
  `docs/qa/phase-09-device-checklist.md`, phase documentation and activity log.
- **Commands run:** Cross-origin production builds, remote `dicom:verify`, production preview and
  Chrome CDP viewport/touch/offline/heap checks.
- **Result/verification:** No document overflow at 375×812, 812×375, 768×900 or 1280×900. The
  125-instance external series verified, 126 study responses populated the runtime cache, and
  slice 81 rendered after a fully offline reload. First image was 236 ms cold and 45–83 ms warm;
  observed heap was about 249 MiB. The 1,014.74 kB gzip imaging chunk remains lazy and the 208.43 kB
  gzip entry contains no Cornerstone.
- **Follow-ups:** Run the final gate, record Phase 6 ADRs and close documentation.

### [2026-10-02 05:32] P6-T16 - Close Phase 6

- **Agent/session:** Cursor implementation session
- **Action:** Recorded ADR-040 through ADR-048, updated the architecture and generated content-schema
  narrative, marked the roadmap and phase checklist complete, and rewrote the handoff for Phase 7.
- **Files changed:** `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/DECISIONS.md`,
  `docs/HANDOFF.md`, `docs/ROADMAP.md`, `docs/phases/phase-06-dicom-viewer.md`,
  `scripts/export-json-schema.ts` and activity log.
- **Commands run:** `npm run schema:export`, Prettier and `npm run check`.
- **Result/verification:** The first gate inherited the temporary cross-origin
  `VITE_DICOM_BASE_URL` and correctly failed the default URL unit assertion. After clearing the QA
  variable, the complete gate passed: typecheck and lint clean, 32 files / 221 tests passing, five
  courses / thirteen lessons / zero content warnings, and a successful production build. The final
  default entry is 690.68 kB raw / 208.45 kB gzip; the lazy imaging chunk is 3,704.96 kB raw /
  1,014.72 kB gzip.
- **Follow-ups:** Begin Phase 7 planning; supply a production DICOM host and complete physical-device
  validation in Phase 9.

### [2026-10-02 10:06] P7-T00 - Start complete offline phase

- **Agent/session:** Cursor implementation session
- **Action:** Formalized the complete PWA/offline scope, resolved cache and simulated-offline
  policies, added the Phase 7 task sequence and PRD traceability, and marked the roadmap in progress.
- **Files changed:** `docs/phases/phase-07-pwa-offline.md`, `docs/ROADMAP.md`, activity log.
- **Commands run:** Repository status inspection.
- **Result/verification:** Phase 7 now has explicit rules and exit criteria for verified course
  downloads, passive DICOM caching, offline gating, install/update UX and browser QA.
- **Follow-ups:** Implement asset-manifest v0.2 and local integrity tooling.

### [2026-10-02 10:15] P7-T01 - Add offline asset contract

- **Agent/session:** Cursor implementation session
- **Action:** Bumped the asset manifest to v0.2, required exact byte sizes and offline availability,
  required SHA-256 for non-DICOM assets, retained hosted-manifest hashes for DICOM and added a
  semantic warning for impossible offline requirements.
- **Files changed:** content schemas and loader, `public/content/assets.json`, generated schema and
  content-schema documentation, Phase 7 checklist.
- **Commands run:** `npm run assets:hash`, `npm run schema:export`, `npm run validate:content`,
  `npm run typecheck`.
- **Result/verification:** All 16 configured assets now carry measured sizes and offline policy;
  non-DICOM assets carry current hashes. Five courses and thirteen lessons validate with no
  warnings and TypeScript is clean.
- **Follow-ups:** Keep manifest metadata synchronized through the new asset tooling.

### [2026-10-02 10:16] P7-T02 - Verify local asset integrity

- **Agent/session:** Cursor implementation session
- **Action:** Added an `assets:hash` command and extended content validation to compare every local
  asset's file size and digest, plus the DICOM asset size against hosted manifest `totalBytes`.
- **Files changed:** `scripts/assets/hash-assets.ts`, `scripts/validate-content.ts`, `package.json`,
  Phase 7 checklist and activity log.
- **Commands run:** `npm run assets:hash`, `npm run validate:content`, `npm run typecheck`.
- **Result/verification:** Manifest generation and validation pass; missing, stale, size-mismatched
  and hash-mismatched local assets now fail the content gate.
- **Follow-ups:** Build pure per-course package derivation from the validated asset graph.

### [2026-10-02 10:25] P7-T03 - Derive offline packages

- **Agent/session:** Cursor implementation session
- **Action:** Added a browser-independent package domain that walks course images, explicit
  primitive assets and typed primitive references; groups requirements per lesson; classifies shell
  and downloadable assets; estimates bytes; and fingerprints course/challenge packages.
- **Files changed:** `src/offline/package.ts`, Phase 7 checklist and activity log.
- **Commands run:** `npm run typecheck`.
- **Result/verification:** Package derivation is configuration-driven and typechecks cleanly.
- **Follow-ups:** Persist device-scoped download records and add offline product configuration.

### [2026-10-02 10:35] P7-T04 - Separate device offline state

- **Agent/session:** Cursor implementation session
- **Action:** Added a persisted device-scoped offline library, moved learner state to v4 without
  download metadata, added configurable download/quota/install policy and centralized cache names
  and passive-cache limits.
- **Files changed:** offline library store, PWA cache policy, learner store/schema/seeds,
  app configuration, generated schemas/documentation, Phase 7 checklist and activity log.
- **Commands run:** Schema export, content validation, learner-store tests and typecheck.
- **Result/verification:** Five courses and thirteen lessons validate, learner migration tests pass
  and TypeScript is clean. Demo seed replacement no longer owns course-download records.
- **Follow-ups:** Add injectable platform adapters and the download manager.

### [2026-10-02 10:42] P7-T05 - Add offline platform adapters

- **Agent/session:** Cursor implementation session
- **Action:** Added injectable Cache Storage, StorageManager, fetch and SHA-256 boundaries, with
  clone-safe in-memory cache and configurable storage fakes for deterministic tests.
- **Files changed:** `src/offline/platform.ts`, Phase 7 checklist and activity log.
- **Commands run:** `npm run typecheck`.
- **Result/verification:** Browser and in-memory implementations satisfy one typed platform
  boundary and TypeScript passes.
- **Follow-ups:** Build the verified download lifecycle on the adapters.

### [2026-10-02 10:58] P7-T06 - Add verified download manager

- **Agent/session:** Cursor implementation session
- **Action:** Added foreground course downloads with quota checks, persistent-storage requests,
  DICOM manifest expansion and geometry validation, passive-cache promotion, bounded concurrency,
  size/SHA-256 verification, progress, pause/resume, cancellation, reference-safe removal and
  startup eviction/version reconciliation.
- **Files changed:** `src/offline/downloadManager.ts`, Phase 7 checklist and activity log.
- **Commands run:** `npm run typecheck`.
- **Result/verification:** Only verified content enters `offline-courses-v1`; manager boundaries are
  injectable and TypeScript passes.
- **Follow-ups:** Map download lifecycle outcomes into the typed learner event stream.

### [2026-10-02 11:08] P7-T07 - Type download lifecycle events

- **Agent/session:** Cursor implementation session
- **Action:** Added typed start, complete, failure and removal events, wired the runtime download
  manager to emit them, and made the learner-state pipeline explicitly ignore device-only events
  while the event log continues to record them.
- **Files changed:** event types/handlers, offline runtime, learner migration assertion, Phase 7
  checklist and activity log.
- **Commands run:** Typecheck and focused pipeline tests.
- **Result/verification:** Typecheck passes. The focused suite identified and corrected its expected
  learner-state version from 3 to 4.
- **Follow-ups:** Install the custom service worker and verified-first request routing.

### [2026-10-02 11:22] P7-T08 - Add verified-first service worker

- **Agent/session:** Cursor implementation session
- **Action:** Replaced generated Workbox routing with an inject-manifest worker that precaches the
  shell, serves verified course assets first with byte-range support, retains the expiring passive
  DICOM cache, persists simulated-offline mode in worker IndexedDB and accepts update/offline
  messages. Added a separate worker TypeScript project and explicit Workbox dependencies.
- **Files changed:** service worker, request/cache policy, Vite and TypeScript configuration,
  package manifests, Phase 7 checklist and activity log.
- **Commands run:** Workbox package install and `npm run build`.
- **Result/verification:** Production build passes; the custom worker is emitted as `dist/sw.js`
  with 104 precache entries / 5,646.55 KiB. Entry and imaging chunks remain separated.
- **Follow-ups:** Connect service-worker simulated state to application connectivity and controls.

### [2026-10-02 11:31] P7-T09 - Connect simulated offline state

- **Agent/session:** Cursor implementation session
- **Action:** Added a shared connectivity hook combining browser reachability and worker-enforced
  simulation, synchronized worker state at registration, updated the calm header indicator and
  enabled the developer offline toggle.
- **Files changed:** connectivity and registration modules, offline indicator, developer page,
  Phase 7 checklist and activity log.
- **Commands run:** Typecheck and focused developer-route tests.
- **Result/verification:** TypeScript and the developer-route test pass; worker state changes are
  broadcast to open application clients.
- **Follow-ups:** Add course download controls and offline readiness status.

### [2026-10-02 11:43] P7-T10 - Add course offline controls

- **Agent/session:** Cursor implementation session
- **Action:** Added pure course/lesson readiness selectors and a course control covering estimates,
  download progress, cancel, retry, update, repair and confirmed removal. Added compact offline
  badges to course cards and lesson rows.
- **Files changed:** offline readiness, course offline component, Learn/Course routes, shared
  learning cards, Phase 7 checklist and activity log.
- **Commands run:** Typecheck and ten route-surface tests.
- **Result/verification:** TypeScript and all focused surface tests pass; controls remain driven by
  package and download-store state.
- **Follow-ups:** Gate lessons and challenges while disconnected and surface offline courses first.

### [2026-10-02 11:52] P7-T11 - Gate unavailable offline activities

- **Agent/session:** Cursor implementation session
- **Action:** Added content-derived lesson and challenge gates for disconnected sessions, the PRD
  recovery message and links, an Available offline catalog filter, and offline-first catalog
  ordering while disconnected.
- **Files changed:** readiness selectors, lesson/challenge player routes, Learn catalog, Phase 7
  checklist and activity log.
- **Commands run:** Typecheck and ten route-surface tests.
- **Result/verification:** Configured shell-only activities remain playable; required uncached media
  and DICOM content are gated before the player mounts.
- **Follow-ups:** Add profile storage reporting and download removal management.

### [2026-10-02 12:01] P7-T12 - Add offline storage management

- **Agent/session:** Cursor implementation session
- **Action:** Added a profile section showing browser usage/quota, persistence status and every
  device download with per-course and remove-all actions. Added startup reconciliation after the
  content registry and offline store hydrate.
- **Files changed:** offline storage manager/reconciler, content provider, Profile route, Phase 7
  checklist and activity log.
- **Commands run:** Typecheck and ten route-surface tests.
- **Result/verification:** TypeScript and focused surface tests pass; stale versions and browser
  eviction are now checked on application startup.
- **Follow-ups:** Add install eligibility, iOS guidance and worker update feedback.

### [2026-10-02 12:15] P7-T13 - Add install and update prompts

- **Agent/session:** Cursor implementation session
- **Action:** Added engagement- and cooldown-gated install prompting, standalone detection, iOS
  Add to Home Screen guidance, service-worker update/reload UX and a dismissible offline-ready
  notice. Added a virtual-PWA registration test adapter.
- **Files changed:** PWA prompt host, service-worker registration state, preferences, app shell,
  Vitest configuration/mock, Phase 7 checklist and activity log.
- **Commands run:** Typecheck and eighteen router/surface tests.
- **Result/verification:** TypeScript and focused application tests pass; prompts remain subtle,
  dismissible and absent in installed standalone mode.
- **Follow-ups:** Add comprehensive automated coverage for packages, manager failures and routes.

### [2026-10-02 12:30] P7-T14 - Cover offline behavior

- **Agent/session:** Cursor implementation session
- **Action:** Added asset-contract, package closure, readiness, successful download, passive-cache
  promotion, integrity, quota, pause, cancel, shared removal, eviction, version drift, request
  routing, install-cooldown and offline route-gate coverage. Updated the existing asset and learner
  migration assertions.
- **Files changed:** offline/PWA tests, player route and content tests, small testability helpers and
  adapters, Phase 7 checklist and activity log.
- **Commands run:** Focused suites, full Vitest suite, typecheck and lint.
- **Result/verification:** 34 test files and 235 tests pass; TypeScript and ESLint are clean.
- **Follow-ups:** Exercise production install, download, reload, removal and responsive behavior.

### [2026-10-02 12:55] P7-T15 - Verify offline browser behavior

- **Agent/session:** Cursor implementation session
- **Action:** Exercised install metadata, same-origin and cross-origin course downloads, worker
  updates, simulated and browser-level offline reloads, DICOM rendering, removal, unavailable
  lesson gating, eviction detection/repair and the four target viewports.
- **Files changed:** `docs/qa/phase-07-browser-qa.md`, Phase 7 checklist and activity log.
- **Commands run:** Default and cross-origin production builds, production preview, CORS DICOM
  server and Chromium CDP cache/network/viewport checks.
- **Result/verification:** Both download modes produced 126 verified entries (manifest plus 125
  files); slice 81 rendered with network disabled; removal and repair behaved correctly; the web
  manifest had zero parse errors; and no target viewport overflowed.
- **Follow-ups:** Run the final gate, record Phase 7 ADRs and close documentation.

### [2026-10-02 13:18] P7-T16 - Close complete offline phase

- **Agent/session:** Cursor implementation session
- **Action:** Recorded ADR-049 through ADR-056, documented the offline runtime boundary, marked the
  roadmap and phase complete, restored the default build and rewrote the handoff for Phase 8.
- **Files changed:** `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`,
  `docs/ROADMAP.md`, `docs/phases/phase-07-pwa-offline.md` and activity log.
- **Commands run:** `npm run check`, default production build and IDE diagnostics.
- **Result/verification:** The complete gate passes: typecheck and lint clean, 34 files / 235 tests
  passing, five courses / thirteen lessons / zero content warnings, and a successful production
  build. The default entry is 717.19 kB raw / 216.52 kB gzip; the lazy imaging chunk remains
  3,703.17 kB raw / 1,013.90 kB gzip.
- **Follow-ups:** Begin Phase 8 product-polish planning; complete physical-device validation in
  Phase 9 and supply a production DICOM host before deployment.

### [2026-10-02 11:40] P8-T00 - Start product-polish phase

- **Agent/session:** Cursor implementation session
- **Action:** Audited the current motion, loading, error, empty, responsive, accessibility and
  performance baseline; formalized Phase 8 scope, decisions, tasks, rules, traceability and exit
  criteria; and marked the roadmap active.
- **Files changed:** `docs/phases/phase-08-product-polish.md`, `docs/ROADMAP.md`,
  `docs/HANDOFF.md` and activity log.
- **Commands run:** Repository/dependency inspection and read-only source/documentation audits.
- **Result/verification:** P8-T00 is complete with 21 sequenced tasks and explicit ownership for
  Motion, haptics, loading/error resilience, responsive refinement, accessibility and budgets.
- **Follow-ups:** Capture and enforce the pre-motion bundle and browser baselines.

### [2026-10-02 11:52] P8-T01 - Establish polish budgets

- **Agent/session:** Cursor implementation session
- **Action:** Captured the pre-motion bundle and mobile Lighthouse baselines, documented existing
  responsive limitations and added an enforced role-based bundle budget.
- **Files changed:** `scripts/budget/check-bundle.ts`, `scripts/budget/bundle-budget.json`,
  `package.json`, `docs/qa/phase-08-baseline.md`, raw Lighthouse JSON, Phase 8 checklist and log.
- **Commands run:** `npm run build`, `npm run budget`, production preview and Lighthouse 13 mobile.
- **Result/verification:** Entry is 214,583 gzip bytes against a 230,000-byte limit; imaging is
  1,006,573 against 1,010,000; Lighthouse scored 86 performance, 96 accessibility, 100 best
  practices and 92 SEO. The bundle budget passes and now runs in `npm run check`.
- **Follow-ups:** Add the motion runtime while retaining the entry and imaging budgets.

### [2026-10-02 12:10] P8-T02 - Add motion foundation

- **Agent/session:** Cursor implementation session
- **Action:** Installed Motion and canvas-confetti, added LazyMotion/MotionConfig, centralized
  variants, expanded duration/layer tokens, connected CSS to resolved motion preference, migrated
  preferences to a device store and split player/developer routes to preserve the entry budget.
- **Files changed:** package manifests, `src/design/motion/`, preferences, app/provider/router,
  PWA prompt host, global styles/tokens, Phase 8 checklist and activity log.
- **Commands run:** dependency install, typecheck, lint, production build and bundle budget.
- **Result/verification:** TypeScript and lint pass. The split entry is 225,380 gzip bytes under the
  230,000 budget; imaging remains 1,006,576 gzip bytes. Motion is globally preference-aware.
- **Follow-ups:** Validate presentation effect configuration and connect haptics.

### [2026-10-02 12:18] P8-T03 - Configure presentation effects

- **Agent/session:** Cursor implementation session
- **Action:** Added a backward-compatible product presentation contract for haptic patterns,
  confetti moments/particle count and XP count-up thresholds, then exported the schema.
- **Files changed:** app configuration, content schema/test, exported app-config schema, Phase 8
  checklist and activity log.
- **Commands run:** `npm run schema:export`, focused content tests, content validation and typecheck.
- **Result/verification:** Older configurations receive safe defaults; configured content validates
  with five courses, thirteen lessons and zero warnings; 21 focused tests pass.
- **Follow-ups:** Subscribe device haptics to the typed learner-event stream.

### [2026-10-02 12:26] P8-T04 - Add haptic experience controls

- **Agent/session:** Cursor implementation session
- **Action:** Added a throttled event-bus haptic subscriber for correct answers, badges and
  challenge completion and added device-scoped Motion and Haptic controls to Profile.
- **Files changed:** `src/effects/haptics.ts`, haptics tests, learner-state provider, Profile page,
  Phase 8 checklist and activity log.
- **Commands run:** Focused tests, typecheck and lint.
- **Result/verification:** Supported browsers use configured patterns only when enabled; unsupported
  browsers receive explanatory copy. Two focused tests, TypeScript and ESLint pass.
- **Follow-ups:** Build reusable animated and resilient UI primitives.

### [2026-10-02 12:34] P8-T05 - Extend the UI kit

- **Agent/session:** Cursor implementation session
- **Action:** Added reduced-motion-aware number animation, designed loading and semantic inline
  notice components; added button press, interactive card and spring progress treatments; and
  exposed the additions in the token preview.
- **Files changed:** `src/components/ui/`, token preview, Phase 8 checklist and activity log.
- **Commands run:** Typecheck and lint.
- **Result/verification:** Shared polish primitives compile and lint cleanly and preserve semantic
  progress/status output.
- **Follow-ups:** Apply the motion primitives to answer feedback and player transitions.

### [2026-10-02 12:43] P8-T06 - Animate learner feedback

- **Agent/session:** Cursor implementation session
- **Action:** Added spring selection response, step entry transitions, success/error feedback
  reveals and a count-up XP chip while preserving existing focus movement and semantics.
- **Files changed:** choice list, feedback panel, step frame, activity player, Phase 8 checklist and
  activity log.
- **Commands run:** Typecheck and lint.
- **Result/verification:** Feedback and player motion compile and lint cleanly and inherit the
  global reduced-motion policy.
- **Follow-ups:** Add staged completion and configured celebration effects.

### [2026-10-02 12:49] P8-T07 - Stage activity completion

- **Agent/session:** Cursor implementation session
- **Action:** Added sequenced completion entry, star reveals, XP count-up and lazy configured
  confetti for three-star lessons and challenge completion.
- **Files changed:** completion/reward summaries, confetti effect, Phase 8 checklist and activity log.
- **Commands run:** Typecheck and lint.
- **Result/verification:** Completion effects respect resolved reduced motion; confetti is guarded,
  deduplicated and dynamically imported.
- **Follow-ups:** Apply the same presentation language to queued badge and level celebrations.

### [2026-10-02 12:54] P8-T08 - Polish milestone celebrations

- **Agent/session:** Cursor implementation session
- **Action:** Rebuilt queued badge and level dialogs with entrance/icon motion, configured optional
  confetti and XP bonus count-up; animated persistent header XP and streak values.
- **Files changed:** celebration host, page header, Phase 8 checklist and activity log.
- **Commands run:** Typecheck and lint.
- **Result/verification:** Existing FIFO, focus trap, dismissal and session-suppression behavior is
  retained while visual effects follow the resolved motion preference.
- **Follow-ups:** Animate pathway and general progress surfaces.

### [2026-10-02 12:58] P8-T09 - Animate progress surfaces

- **Agent/session:** Cursor implementation session
- **Action:** Added spring entry/update motion to progress bars and weekly activity, interactive
  course-card lift and one-time pathway node transitions tracked per browser session.
- **Files changed:** shared learning components, progress bar, pathway page, Phase 8 checklist and
  activity log.
- **Commands run:** Typecheck and lint.
- **Result/verification:** Progress motion is shared across mastery/course/pathway surfaces and
  pathway state transitions do not replay after their session state is recorded.
- **Follow-ups:** Add route-level transition, focus and bypass behavior.

### [2026-10-02 13:03] P8-T10 - Add route transitions

- **Agent/session:** Cursor implementation session
- **Action:** Added reduced-motion-aware outlet transitions, browser scroll restoration, visible
  skip links and route-heading focus to both application layouts.
- **Files changed:** route transition component, application/immersive layouts, Phase 8 checklist
  and activity log.
- **Commands run:** Typecheck and lint.
- **Result/verification:** Both route trees share one transition/focus implementation and retain
  their existing shell and celebration boundaries.
- **Follow-ups:** Replace generic boot and artifact placeholders with designed loading states.

### [2026-10-02 13:15] P8-T11 - Design loading states

- **Agent/session:** Cursor implementation session
- **Action:** Replaced generic boot/route/primitive skeletons with contextual loading states; added
  image fade/shimmer and retry, video buffering/poster/error handling, audio preparation/error
  handling and explicit DICOM study/slice copy.
- **Files changed:** providers, router fallback, primitive registry, image/video/audio primitives,
  DICOM viewer, Phase 8 checklist and activity log.
- **Commands run:** Typecheck, lint and focused media/DICOM tests.
- **Result/verification:** Two focused files with ten tests pass. Substantial artifacts now reserve
  space, explain current work and surface recoverable media failures.
- **Follow-ups:** Complete the shared error contract and required PRD error variants.

### [2026-10-02 13:27] P8-T12 - Complete recovery states

- **Agent/session:** Cursor implementation session
- **Action:** Extended shared error presentation with primary/secondary recovery, added concise
  content-validation details, retryable renderer/media failures, explicit unsupported continuation,
  typed missing-DICOM handling and guided quota recovery.
- **Files changed:** feedback components, primitive registry and fallback, DICOM context,
  offline-course control, motion test compatibility, Phase 8 checklist and activity log.
- **Commands run:** Focused player/media tests, typecheck and lint.
- **Result/verification:** Asset, unsupported primitive, corrupted specification, DICOM, offline and
  quota failures now explain the issue and expose an appropriate recovery route.
- **Follow-ups:** Standardize empty states across learner surfaces.

### [2026-10-02 13:34] P8-T13 - Standardize empty states

- **Agent/session:** Cursor implementation session
- **Action:** Expanded the shared empty-state contract with tone, semantic heading and multiple
  actions, then applied it to filtered learning, missing course/pathway, fresh Home, zero-mastery,
  zero-activity and empty offline-storage states.
- **Files changed:** shared EmptyState and Home, Learn, Course, Pathway, Profile and offline storage
  surfaces plus Phase 8 documentation.
- **Commands run:** Surface tests, typecheck and lint.
- **Result/verification:** Empty experiences now retain heading hierarchy and offer a useful next
  action rather than passive placeholder copy.
- **Follow-ups:** Refine desktop and landscape layouts and artifact immersion.

### [2026-10-02 13:48] P8-T14 - Refine responsive artifacts

- **Agent/session:** Cursor implementation session
- **Action:** Added desktop header navigation, hid the mobile tab bar at large widths, added a
  persistent desktop DICOM instruction pane, compact landscape artifact sizing, reusable
  Fullscreen API/fixed-fallback immersion for video/hotspot/compare and rem-scaled chart labels.
- **Files changed:** navigation/shell, DICOM viewer, video/hotspot/compare/chart primitives,
  immersive-artifact hook, global CSS, Phase 8 checklist and log.
- **Commands run:** Typecheck, lint and focused DICOM/media/surface tests.
- **Result/verification:** Twenty focused tests pass; large artifacts have immersive paths and
  desktop DICOM no longer hides instructions behind a sheet.
- **Follow-ups:** Complete the cross-surface visual refinement and contrast pass.

### [2026-10-02 13:56] P8-T15 - Refine visual language

- **Agent/session:** Cursor implementation session
- **Action:** Refined the page atmosphere, selection color, completion surface, interactive cards
  and locked/unlocked badge treatment while retaining the restrained clinical palette.
- **Files changed:** global styles, shared learning tiles, completion summary, contrast audit,
  Phase 8 checklist and activity log.
- **Commands run:** Token contrast calculation, typecheck and lint.
- **Result/verification:** All audited normal-text semantic pairs range from 6.10:1 to 6.91:1,
  exceeding WCAG AA.
- **Follow-ups:** Add automated axe coverage and finish semantic live announcements.

### [2026-10-02 14:05] P8-T16 - Harden accessibility

- **Agent/session:** Cursor implementation session
- **Action:** Added a centralized learner-event live announcer, fixed invalid weekly-activity ARIA,
  retained accessible final values during number animation and added direct axe-core coverage for
  Home, Learn, Profile and player feedback.
- **Files changed:** application root, presentation announcer, animated number, accessibility test,
  package manifests, Phase 8 checklist and activity log.
- **Commands run:** Accessibility tests, typecheck and lint.
- **Result/verification:** Four WCAG A/AA axe checks pass; route focus and skip links are already
  active in both shell layouts.
- **Follow-ups:** Profile the completed motion/loading work and enforce final budgets.

### [2026-10-02 14:18] P8-T17 - Profile and split polish runtime

- **Agent/session:** Cursor implementation session
- **Action:** Split every learner surface behind its route boundary, moved progress animation to
  transform-only `scaleX`, measured all protected chunks and documented runtime loading boundaries.
- **Files changed:** router, progress bar, performance report, Phase 8 checklist and activity log.
- **Commands run:** Production build and enforced bundle budget.
- **Result/verification:** Entry is 130,031 gzip bytes (84,552 below baseline); imaging is unchanged
  at 1,006,572; confetti is isolated at 4,244. Every budget passes.
- **Follow-ups:** Complete focused coverage for preferences, effects and route focus.

### [2026-10-02 14:30] P8-T18 - Cover polish behavior

- **Agent/session:** Cursor implementation session
- **Action:** Added coverage for legacy preference migration, system/explicit motion resolution,
  designed loading/error/empty contracts, route-heading focus and the missing-DICOM recovery path;
  re-ran existing haptic and celebration sequencing coverage.
- **Files changed:** polish, route-transition and DICOM tests plus small animation testability
  fixes, Phase 8 checklist and activity log.
- **Commands run:** Five focused test files, typecheck and lint.
- **Result/verification:** Five files and twelve focused tests pass with clean TypeScript and ESLint.
- **Follow-ups:** Run final browser QA across all target viewports and preferences.

### [2026-10-02 14:48] P8-T19 - Complete browser QA

- **Agent/session:** Cursor implementation session
- **Action:** Exercised the production preview at all four target viewports, 200% text, reduced
  motion, desktop/mobile navigation, lesson recovery, browser-level offline gating, DICOM desktop
  instructions and landscape immersion; corrected the containment issues found during the pass.
- **Files changed:** Home and Profile routes, PWA prompt host, pan/zoom image container, browser QA
  report and final Lighthouse JSON.
- **Commands run:** Production builds, browser viewport/network/motion emulation and Lighthouse 13
  mobile.
- **Result/verification:** All target layouts have no document overflow. Reduced mode resolves with
  no running animations after settle. Lighthouse scores 84 performance, 100 accessibility, 100
  best practices and 92 SEO.
- **Follow-ups:** Record Phase 8 ADRs and run the final quality gate.

### [2026-10-02 15:02] P8-T20 - Close Phase 8

- **Agent/session:** Cursor implementation session
- **Action:** Recorded ADR-057 through ADR-063, updated architecture and delivery documentation,
  aligned regression assertions with animated presentation and dual responsive navigation, and
  closed the roadmap, phase checklist and handoff.
- **Files changed:** decision, architecture, roadmap, phase, handoff and activity documentation;
  router, player, reward and image-primitive regression tests.
- **Commands run:** Focused regression tests and `npm run check`.
- **Result/verification:** The full gate passes: 38 test files and 247 tests, zero content warnings,
  entry 130,029 gzip bytes, imaging 1,006,573 and confetti 4,244. All bundle roles are within budget.
- **Follow-ups:** Begin Phase 9 showcase and physical Android/iOS validation.

### [2026-10-02 15:15] P9-T00 - Define showcase and device QA

- **Agent/session:** Cursor implementation session
- **Action:** Formalized Phase 9 scope, split agent-executable work from physical-device gates,
  traced the PRD and made registry parity the canonical showcase-completeness rule.
- **Files changed:** `docs/phases/phase-09-showcase-device-qa.md`, `docs/ROADMAP.md`,
  `docs/DECISIONS.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** Documentation and repository audit.
- **Result/verification:** Phase 9 is active with explicit automated, browser, hosted-environment and
  physical-device acceptance gates. ADR-064 reconciles the PRD's 18 categories with 25 implemented
  primitive types.
- **Follow-ups:** Add the missing guided DICOM showcase step and enforce registry parity.

### [2026-10-02 15:29] P9-T01 - Audit showcase coverage

- **Agent/session:** Cursor implementation session
- **Action:** Compared the internal showcase with canonical primitive types, schemas, definitions,
  components and PRD section 75; added the missing guided DICOM flow.
- **Files changed:** Runtime showcase content, content regression expectation, showcase audit,
  Phase 9 checklist and activity log.
- **Commands run:** `npm run validate:content`.
- **Result/verification:** Validated 5 courses and 13 lessons with zero warnings. The showcase now
  has 26 steps covering all 25 registered types plus both hotspot modes.
- **Follow-ups:** Replace count-only regression coverage with an exhaustive parity assertion and
  extend the complete real-player flow to the guided DICOM step.

### [2026-10-02 15:40] P9-T02 - Enforce showcase parity

- **Agent/session:** Cursor implementation session
- **Action:** Added an exhaustive registry-parity invariant and extended the real-route completion
  test through all 26 showcase steps, including unavailable-viewer retry behavior.
- **Files changed:** Showcase route integration test, Phase 9 checklist and activity log.
- **Commands run:** Focused Vitest run, `npm run typecheck`, `npm run lint` and IDE diagnostics.
- **Result/verification:** Two focused files and 25 tests pass. The complete lesson emits ordered
  view/completion events for every step, clears resumable state and reports 73 score/69 accuracy
  after deterministic unavailable-DICOM paths.
- **Follow-ups:** Exercise the expanded showcase in the production preview across the Phase 9
  browser matrix.

### [2026-10-02 16:08] P9-T03 - Run showcase browser QA

- **Agent/session:** Cursor implementation session
- **Action:** Exercised the production lesson and full primitive gallery across phone portrait,
  phone landscape, tablet and desktop viewports; checked resume, review, missing assets, reduced
  motion and keyboard pan/zoom semantics.
- **Files changed:** Phase 9 browser QA report, Phase 9 checklist and activity log.
- **Commands run:** Production build/preview and Chromium viewport, touch, motion and DOM
  diagnostics.
- **Result/verification:** Every viewport had zero document overflow. All 26 gallery cards rendered,
  keyboard zoom announced 125%, route reload exposed Resume, and media/DICOM missing-asset
  fallbacks remained recoverable.
- **Follow-ups:** Capture explicit DICOM host, cache, offline-reload, timing and memory evidence.

### [2026-10-02 16:31] P9-T04 - Validate DICOM and offline runtime

- **Agent/session:** Cursor implementation session
- **Action:** Verified the hosted study and CORS contract, built against a separate DICOM origin,
  loaded all four imaging modes, inspected passive cache and heap state, then hard-reloaded the
  gallery with Chromium fully offline.
- **Files changed:** Runtime evidence report, Phase 9 checklist and activity log.
- **Commands run:** DICOM fixture server, `npm run dicom:verify`, cross-origin production build and
  preview, Chromium network/cache/performance diagnostics, `npm run budget`.
- **Result/verification:** 125 instances and 65,894,350 bytes passed integrity verification;
  `dicom-studies-v1` held 126 responses; all four viewers restored offline; the 174 MB four-viewer
  heap stress case and all three bundle roles remained within documented limits.
- **Follow-ups:** Convert the physical Android/iOS checklist into executable scripts and evidence
  records for the hosted build.

### [2026-10-02 16:47] P9-T05 - Prepare physical-device packet

- **Agent/session:** Cursor implementation session
- **Action:** Converted the deferred device matrix into hosted-environment prerequisites,
  step-by-step Android and iOS scripts and a repeatable result/evidence template.
- **Files changed:** Phase 9 device checklist, hosting prerequisites, Android script, iOS script,
  result template, Phase 9 checklist and activity log.
- **Commands run:** Documentation audit and formatting.
- **Result/verification:** The remaining physical work now has explicit setup, order, pass
  conditions, timing fields, evidence requirements and defect/sign-off rules for browser and
  installed-app contexts.
- **Follow-ups:** Run the final automated gate and hand off P9-M01 through P9-M03.

### [2026-10-02 17:02] P9-T06 - Close agent-executable Phase 9 work

- **Agent/session:** Cursor implementation session
- **Action:** Updated the architecture, release decisions, roadmap and handoff; aligned the gallery
  regression count with the 26-step fixture and ran the complete repository gate.
- **Files changed:** Architecture, decisions, roadmap, handoff, phase and activity documentation;
  primitive-gallery regression test.
- **Commands run:** `npm run check`.
- **Result/verification:** The first gate exposed the stale 25-card assertion. After updating it,
  the full gate passed: 38 test files and 248 tests, 5 courses and 13 lessons with zero warnings,
  entry 130,029 gzip bytes, imaging 1,006,573 and confetti 4,244.
- **Follow-ups:** P9-M01 and P9-M02 require the hosted URLs and physical devices; use the prepared
  scripts and result template, then triage findings under P9-M03.

### [2026-10-03 02:20] P10-T00 - Plan Case Lab capability demo

- **Agent/session:** Cursor planning session
- **Action:** Analysed the prospect's example brief (`docs/reference docs/Sanofi artifact
requirement.pdf` plus three images sent separately in chat) against the runtime. Agreed scope in
  three clarification rounds, then wrote the Phase 10 plan, proposed ADR-066 through ADR-073,
  redefined the Phase 10 roadmap row and refreshed the handoff.
- **Files changed:** `docs/phases/phase-10-case-lab.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`,
  `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** Repository and schema inspection; autovrse.com page fetch for palette and
  typography.
- **Result/verification:** Documentation only; no runtime code changed. The plan and decisions are
  marked Proposed pending user review.
- **Follow-ups:** After approval, mark ADR-066 through ADR-073 Accepted and start P10-T01 (asset and
  3D feasibility spike).

### [2026-10-03 02:33] P10-T00 - Approve Case Lab implementation plan

- **Agent/session:** Cursor implementation session
- **Action:** Adopted the detailed Phase 10 implementation plan, marked ADR-066 through ADR-073
  Accepted, activated the roadmap phase and aligned the phase and handoff snapshots.
- **Files changed:** `docs/phases/phase-10-case-lab.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`,
  `docs/HANDOFF.md`, `docs/ACTIVITY_LOG.md`.
- **Commands run:** Documentation formatting and focused diff review.
- **Result/verification:** The approved defaults, task dependencies and acceptance criteria are now
  the execution baseline. No runtime code changed.
- **Follow-ups:** Start P10-T01 and the parallel contract/scoring workstreams.

### [2026-10-03 03:02] P10-T01 - Prove 3D anatomy feasibility

- **Agent/session:** Cursor implementation session
- **Action:** Selected the open BodyParts3D respiratory dataset, built a reproducible eight-group
  respiratory fixture, added a standalone Three.js spike and evaluated structure preservation,
  overview rendering, mobile performance, memory and the endoscopic limitation. Identified open
  audio and histology candidates and recorded provenance.
- **Files changed:** `package.json`, `package-lock.json`, `src/spikes/anatomy3d/`,
  `docs/spikes/anatomy3d-spike.md`, Phase 10 checklist and activity log.
- **Commands run:** `npm install` for pinned `three`, types and model tooling; BodyParts3D
  extraction; `obj2gltf`; glTF Transform inspect/optimise; standalone Vite build; desktop and
  390×844 Chromium checks; TypeScript and lint checks.
- **Result/verification:** Conditional go. The 128,350-triangle fixture compresses to 649,292 bytes,
  preserves eight structures and rendered at 82.6 fps desktop / 81.5 fps emulated mobile. The lazy
  spike bundle is 166,240 bytes gzip. The source mesh has no credible lumen, so the production
  endoscopic view will use a configured procedural tube driven by the authored waypoint graph.
- **Follow-ups:** Formalise anatomy maps/model assets in P10-T03 and keep all Three.js imports
  inside the production anatomy boundary in P10-T04.

### [2026-10-03 03:18] P10-T02 - Add Case Lab content contracts

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added strict case and Case Lab configuration schemas, manifest paths, loader and
  registry support, semantic reference validation, fixtures, tests and exported JSON Schemas. Added
  a deliberately minimal anatomy-map envelope for P10-T03 to make strict.
- **Files changed:** Content schemas, loader, content fixtures/tests, manifest, validation and schema
  export scripts, generated schemas, `docs/CONTENT_SCHEMA.md`, Phase 10 checklist and activity log.
- **Commands run:** `npm run typecheck`, `npm run lint`, focused content tests,
  `npm run validate:content`, `npm run schema:export`.
- **Result/verification:** 26 focused tests pass. Five courses and thirteen lessons validate with
  zero warnings, and eight JSON Schema documents export successfully. Cases remain optional until
  P10-T15 registers demo content.
- **Follow-ups:** Replace the minimal anatomy-map envelope with the strict P10-T03 contract and use
  the case contracts in P10-T10.

### [2026-10-03 03:26] P10-T08 - Add active case timing

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added a visibility-aware active elapsed-time hook, emitted per-attempt `elapsedMs`
  from assessment events and implemented a pure resumable case clock for none, stopwatch and
  countdown modes.
- **Files changed:** Event payloads, activity player, active-time hook and tests, case clock module
  and tests, Phase 10 checklist and activity log.
- **Commands run:** Focused Vitest run, `npm run typecheck`, `npm run lint`.
- **Result/verification:** Three focused test files and 17 tests pass. Hidden time is not charged,
  assessment attempts carry active milliseconds, and restored countdowns preserve accumulated
  active time and expiry.
- **Follow-ups:** Persist the case clock in session v3 and render it through the case player in
  P10-T10.

### [2026-10-03 03:34] P10-T09 - Add composite case scoring

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added a pure case scoring engine for weighted anatomy and diagnosis accuracy,
  per-step and whole-case speed, no-timer weight redistribution and capped optional-clue penalties.
- **Files changed:** `src/engines/cases/scoring.ts`, its focused tests, Phase 10 checklist and
  activity log.
- **Commands run:** Focused Vitest run, `npm run typecheck`, `npm run lint`.
- **Result/verification:** 23 focused scoring tests pass, covering defaults, custom weights,
  no-timer redistribution, timeouts, fast wrong answers, empty components, invalid values and the
  clue-penalty cap.
- **Follow-ups:** Feed first-attempt case results and persisted timing into this engine in P10-T10.

### [2026-10-03 03:48] P10-T03 - Add anatomy map and model pipeline

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Replaced the placeholder anatomy-map envelope with strict hierarchy, mesh binding and
  waypoint contracts; added model assets and provenance; validated parent levels, model meshes and
  acyclic waypoint graphs; added model hashing and a production glTF preparation command.
- **Files changed:** Anatomy and asset schemas, loader validation and tests, content fixtures,
  generated schemas, model/hash scripts and tests, package manifests, `docs/CONTENT_SCHEMA.md`,
  Phase 10 checklist and activity log.
- **Commands run:** Focused tests, `npm run model:prepare` against the spike GLB,
  `npm run schema:export`, `npm run validate:content`, `npm run typecheck`, `npm run lint`.
- **Result/verification:** Thirty focused tests pass. The preparation command preserved eight named
  meshes, reduced the fixture to 96,152 triangles and 514,852 bytes and emitted matching bounds and
  SHA-256 metadata. Content validates with zero warnings.
- **Follow-ups:** Build the lazy controller against this contract in P10-T04.

### [2026-10-03 04:02] P10-T04 - Build lazy anatomy viewer boundary

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added the sole Three.js importer and framework-free anatomy controller, safe model
  reuse and disposal, picking/highlighting/markers, waypoint movement, procedural-lumen
  endoscopy, a lazy React hook and an accessible list-based viewer alternative. Added anatomy
  configuration, import enforcement and a dedicated optional bundle role.
- **Files changed:** `src/anatomy3d/`, app configuration and schema, ESLint configuration, bundle
  budget, generated app-config schema, tests, Phase 10 checklist and activity log.
- **Commands run:** Focused anatomy tests, `npm run typecheck`, `npm run lint`,
  `npm run validate:content`, `npm run build`, `npm run budget`.
- **Result/verification:** Nine focused tests pass. Production build and budgets pass; entry remains
  133,086 gzip bytes. The measured standalone anatomy controller is 804,722 raw / 182,665 gzip,
  below its 850,000 / 220,000 limits. The role remains optional until a primitive consumes it.
- **Follow-ups:** Integrate the boundary through `anatomy_explore` and `anatomy_locate`, then perform
  real Chromium and disposal checks in P10-T16.

### [2026-10-03 04:18] P10-T05 - Add anatomy exploration primitive

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added the `anatomy_explore` schema, definition, lazy component, completion rules and
  typed interactions. Promoted the prepared BodyParts3D model and anatomy map into validated
  content, and added showcase/gallery coverage including unavailable-model behavior.
- **Files changed:** Primitive schemas, definitions, registry and component; anatomy viewer/event
  integration; public model, anatomy map, manifest and assets; showcase, gallery/player tests,
  generated schemas and content documentation; Phase 10 checklist and activity log.
- **Commands run:** Asset hashing, schema export, focused tests, `npm run typecheck`,
  `npm run lint`, `npm run validate:content`, `npm run build`, `npm run budget`.
- **Result/verification:** Forty-eight focused tests pass. Content validates with one anatomy map
  and zero warnings. Showcase parity is 26 types across 27 steps. The emitted anatomy chunk is
  680,835 raw / 171,975 gzip, below budget.
- **Follow-ups:** Add assessed drill-down localisation and bring parity to 27 types in P10-T06.

### [2026-10-03 04:34] P10-T06 - Add anatomy localisation primitive

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added `anatomy_locate` with model, image-region and choice levels, weighted
  fractional grading, structured responses, review reveal, keyboard paths and timer compatibility.
  Added semantic map/asset validation and gallery/showcase coverage.
- **Files changed:** Anatomy primitive schema, validation, definition and component; anatomy viewer
  filtering; image-region clue metadata; showcase/map content; gallery, parity and assessment
  tests; content documentation, Phase 10 checklist and activity log.
- **Commands run:** Schema export, focused tests, `npm run validate:content`,
  `npm run typecheck`, `npm run lint`, `npm run build`, `npm run budget`.
- **Result/verification:** Forty-eight focused tests pass, including weighted partial credit.
  Showcase parity is now 27 types across 28 steps. Content validates with zero warnings and all
  bundle roles pass.
- **Follow-ups:** Resolve case clue references into evidence-linked feedback in P10-T07.

### [2026-10-03 04:44] P10-T07 - Add clue-linked feedback

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added clue references to primitive and response contracts, enforced that references
  resolve only inside cases, implemented pure missed-evidence resolution and idempotent clue
  opening, and extended feedback/player APIs with accessible reopen actions.
- **Files changed:** Primitive and response schemas, anatomy map/case schemas, loader validation,
  case clue engine and tests, ActivityPlayer and FeedbackPanel tests, generated schemas, Phase 10
  checklist and activity log.
- **Commands run:** Focused and full Vitest runs, schema export, `npm run validate:content`,
  `npm run typecheck`, `npm run lint`.
- **Result/verification:** Forty-nine focused tests pass; the implementation sub-run also passed all
  319 tests. Response-level evidence overrides fall back to step clues, and reopening an existing
  clue does not add a second open.
- **Follow-ups:** Connect the clue context to the CasePlayer and ClueBoard in P10-T10.

### [2026-10-03 04:53] P10-T10 - Add case player and session v3

- **Agent/session:** Cursor implementation session with focused implementation subagents
- **Action:** Added deterministic case-plan construction, entry-view overrides, a resumable case
  shell with stage boundaries and clue gating, case-aware ActivityPlayer extension points, and
  accessible clue, transition, results and comparison surfaces. Migrated active sessions to v3
  with persisted case progress, timing and clue state.
- **Files changed:** Case plan engine and tests, learning session schema/store and migration tests,
  `ActivityPlayer`, case player components, active-elapsed integration, anatomy start-view
  contract, semantic validation, Phase 10 checklist and activity log.
- **Commands run:** Focused Vitest runs and `npm run typecheck`.
- **Result/verification:** Seven focused plan/session tests pass, all pre-existing player and
  lesson/challenge tests remain compatible, and TypeScript passes. Endoscopic case entries now
  reach the controller as explicit endoscopic start views.
- **Follow-ups:** Route case completion through the central learner pipeline and persist scored
  attempt history in P10-T11.

### [2026-10-03 05:02] P10-T11 - Integrate cases with learner progression

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added typed case lifecycle events and connected the CasePlayer to the central event
  bus. Added first-completion, perfect-case and replay XP through an idempotent reward ledger,
  retained case-question mastery without per-question XP, tracked per-case completion totals and
  bounded attempt history, and added derived case badge criteria. Migrated learner state and seeds
  to v5, including the configured prior foundation-case attempt in the advanced seed.
- **Files changed:** Event contracts, case progress reducer, gamification pipeline and criteria,
  learner state/schema/migrations/seeds, CasePlayer integration, selectors, generated schemas and
  focused tests.
- **Commands run:** Focused and full Vitest runs, `npm run schema:export`,
  `npm run validate:content`, `npm run typecheck`, `npm run lint`, `git diff --check`.
- **Result/verification:** All 331 tests pass; 22 focused pipeline, migration, badge and player
  tests pass independently. TypeScript, lint, content validation and generated schemas pass.
- **Follow-ups:** Expose the case catalogue, intro/player/history routes and home/learn entry
  surfaces in P10-T12.

### [2026-10-03 05:14] P10-T12 - Add Case Lab routes and surfaces

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added pure case catalogue, featured-case, results and comparison selectors; lazy
  case intro, immersive player and attempt routes; Case Lab cards on Learn and Home; and a
  developer reset action for case attempts. All surfaces remain hidden safely when no Case Lab
  content is configured.
- **Files changed:** App router, new case route pages and tests, Case Lab card, Home and Learn
  surfaces, case result components, learner-store reset action, selectors and developer tools.
- **Commands run:** Focused Vitest run, `npm run typecheck`, `npm run lint`, `git diff --check`.
- **Result/verification:** Twenty focused route, selector, surface and reset tests pass. TypeScript,
  lint and diff checks pass.
- **Follow-ups:** Bind the existing daily challenge route to the configured quick case in P10-T13.

### [2026-10-03 05:22] P10-T13 - Wire the daily quick case

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added mutually exclusive item-backed and case-backed challenge contracts, semantic
  validation for case references and the configured daily quick case, and CasePlayer routing from
  the existing challenge URL. Preserved ordinary challenge behavior and updated challenge
  summaries so case-backed activities are not described as question sets.
- **Files changed:** App-config schema and generated JSON Schema, content validation and tests,
  ChallengePlayer route and tests, Home/Challenge surfaces, learning/gamification helpers and
  offline packaging.
- **Commands run:** Focused Vitest run, `npm run schema:export`, `npm run typecheck`,
  `npm run lint`, `git diff --check`.
- **Result/verification:** Sixty-six focused content, route, surface and pipeline tests pass.
  TypeScript, lint, schema generation and diff checks pass.
- **Follow-ups:** Add the configured quick-case document and daily challenge entry with the rest
  of the respiratory demo content in P10-T15.

### [2026-10-03 05:37] P10-T14 - Apply Autovrse LevelUp branding

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Renamed the product and PWA, sourced the official Autovrse SVG mark, applied the
  approved purple token palette, placed the mark in the shell and profile footer, regenerated the
  PWA icon set, expanded the token preview, and documented WCAG contrast results and restrictions.
- **Files changed:** App config, HTML/PWA metadata, brand and icon assets, design tokens, header,
  profile and token preview surfaces, route/content tests, and
  `docs/qa/phase-10-contrast-audit.md`.
- **Commands run:** `npx pwa-assets-generator --preset minimal public/assets/icons/app-icon.svg`,
  focused Vitest run, `npm run typecheck`, `npm run lint`, `npm run validate:content`,
  `npm run build`, manifest assertions, browser smoke checks and `git diff --check`.
- **Result/verification:** Sixty focused tests pass, including axe coverage. Production build,
  TypeScript, lint, content validation and generated manifest checks pass. Primary and accent
  normal-text pairs meet AA; the lighter purple tokens are explicitly restricted.
- **Follow-ups:** Populate the branded Case Lab with the three respiratory cases and daily quick
  case in P10-T15.

### [2026-10-03 06:04] P10-T15 - Add respiratory Case Lab content

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Added foundation asthma, intermediate COPD and advanced exacerbation cases plus a
  two-stage daily wheeze case. Added the configured tiers, scoring, XP, clues, expert benchmarks,
  respiratory concepts and three case badges; extended the lung airway map; integrated an
  advanced-seed attempt; and registered optimized histology, airway and respiratory-audio assets
  with source, licence, author, hashes and metadata.
- **Files changed:** Four case documents, lung anatomy map, app config, manifest, asset manifest,
  advanced/fresh seeds, optimized case image/audio assets and content/plan tests.
- **Commands run:** `npm run assets:hash`, focused and full Vitest runs, `npm run check`,
  `npm run validate:content`, `npm run typecheck`, `npm run lint`, `npm run build`,
  `npm run budget`.
- **Result/verification:** All 348 tests and the full quality gate pass. Content validation reports
  5 courses, 13 lessons, 4 cases, 1 anatomy map and zero warnings. The three main cases each have
  four stages, 6–7 clues and eight scored steps; the quick case has two stages and three clues.
- **Follow-ups:** Exercise all four cases through automated flows and complete viewport,
  accessibility, motion and 3D performance QA in P10-T16.

### [2026-10-03 06:15] P10-T16 - Verify Case Lab flows and browser behavior

- **Agent/session:** Cursor implementation session
- **Action:** Added end-to-end route coverage for all three catalogue cases, the daily quick case
  and a loader-added fourth fixture case; verified results, compare and central-pipeline updates.
  Exercised the production player across four Chromium viewports, reduced motion, keyboard-only
  localisation, unavailable-WebGL recovery, animation cadence and mount/unmount heap behavior.
  Fixed a React/Three.js canvas ownership crash, restored the persistent tablet clue pane, avoided
  a squeezed nested anatomy grid and aligned the advanced seed badge with its qualifying attempt.
- **Files changed:** Case-flow and anatomy-viewer tests; anatomy viewer, step frame and clue board;
  advanced seed; `docs/qa/phase-10-browser-qa.md`; Phase 10 checklist and activity log.
- **Commands run:** Focused Vitest runs, production build and preview, Chromium CDP viewport,
  accessibility-tree, reduced-motion, keyboard, failure, frame-rate and heap checks,
  `git diff --check`.
- **Result/verification:** The focused final run passes 2 files / 12 tests. All target viewports
  have zero document overflow; the 768×900 layout keeps its persistent clue pane. Used JavaScript
  heap returned from about 18 MiB loaded to about 11 MiB after unmount. The automated unavailable-3D
  state has no detected axe WCAG A/AA violations.
- **Follow-ups:** Complete P10-T17 documentation, add the physical-device 3D addendum and run the
  final quality gate.

### [2026-10-03 06:25] P10-T17 - Close Case Lab capability phase

- **Agent/session:** Cursor implementation session
- **Action:** Closed the Phase 10 architecture and schema narratives, recorded the imperative-canvas
  ownership detail in ADR-070, marked the roadmap and phase complete, rewrote the handoff and added
  3D anatomy checks to the Phase 9 Android, iOS, shared-checklist and evidence templates.
- **Files changed:** `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/DECISIONS.md`,
  `docs/ROADMAP.md`, `docs/HANDOFF.md`, Phase 9/10 phase files, Phase 9 device scripts/templates and
  activity log.
- **Commands run:** `npm run check`, `git diff --check`, documentation and repository-state audits.
- **Result/verification:** The complete gate passes: TypeScript and lint are clean, 52 test files /
  356 tests pass, 5 courses / 13 lessons / 4 cases / 1 anatomy map validate with zero warnings, the
  production build succeeds and entry, imaging, anatomy3d and confetti bundle roles remain within
  budget.
- **Follow-ups:** Run or explicitly waive Phase 9's physical Android/iOS gate, including the new 3D
  anatomy addendum.

### [2026-10-03 06:26] P10-T17 - Correct BodyParts3D licence attribution

- **Agent/session:** Cursor implementation session with asset-research follow-up
- **Action:** Rechecked the official BodyParts3D publisher licence and corrected the respiratory
  model provenance from the legacy source-comment notice to the current CC BY 4.0 terms and
  required attribution. Retained the legacy notice only as explanatory history.
- **Files changed:** Model provenance in `public/content/assets.json`, the anatomy spike report,
  spike asset README, preparation helper, handoff and activity log.
- **Commands run:** Official licence-page fetch and search, repository provenance audit,
  `npm run validate:content`, `git diff --check`.
- **Result/verification:** The publisher's licence page was updated on 2025-02-27 and identifies CC
  BY 4.0 as current. Runtime provenance and reproducible preparation documentation now agree.
- **Follow-ups:** None for Phase 10; retain the HRA unified lung GLB as a possible future
  higher-detail alternative if segment-level model geometry is required.

### [2026-10-03 16:41] P11-T00 - Rebaseline Case Lab demo readiness

- **Agent/session:** Cursor documentation planning session
- **Action:** Transcribed all 52 Case Lab demo-readiness findings into a durable QA audit and mapped
  each to severity, evidence and a Phase 11 or Phase 12 task. Added the golden exacerbation
  hardening phase and the later breadth/depth/polish phase, recorded ADR-074, updated roadmap/PRD
  wording, corrected clue and device QA claims, and rewrote the handoff for Phase 11.
- **Files changed:** `PRD.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`, `docs/ROADMAP.md`,
  `docs/phases/phase-10-case-lab.md`, `docs/phases/phase-11-case-lab-demo-hardening.md`,
  `docs/phases/phase-12-case-lab-depth-and-polish.md`,
  `docs/qa/phase-10-demo-readiness-audit.md`, `docs/qa/phase-10-browser-qa.md`,
  `docs/qa/phase-09-android-script.md`, `docs/qa/phase-09-ios-script.md`,
  `docs/qa/phase-09-device-checklist.md`, `docs/qa/phase-09-device-results-template.md` and
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** Targeted repository searches and reads; audit ID/severity/target validation;
  Prettier checks and formatting for changed documentation; stale-wording scan; `git diff --check`;
  repository status/diff review.
- **Result/verification:** P11-T00 is complete. The audit contains exactly 52 unique findings
  (P0 8, P1 20, P2 19, P3 5), every finding has a Phase 11/12 target, changed documentation passes
  Prettier and whitespace checks, no implementation code changed and no commit was created.
- **Follow-ups:** Start P11-T01 with the golden exacerbation content/asset decision; retain
  P9-M01 through P9-M03 as the active physical-device gate.

### [2026-10-03 16:46] P11-T00 - Correct approved Phase 11 task plan

- **Agent/session:** Cursor documentation correction session
- **Action:** Corrected the Phase 11/12 split to the approved plan. Replaced the invented Phase 11
  task grouping with the authoritative P11-T00 through P11-T13 checklist, remapped all 52 audit
  findings, moved cross-catalogue semantics and depth back to Phase 12 and refreshed the handoff.
  This entry supersedes the prior P11-T00 follow-up that incorrectly named golden-case authoring as
  P11-T01; the prior entry remains unchanged under the append-only protocol.
- **Files changed:** `docs/phases/phase-11-case-lab-demo-hardening.md`,
  `docs/phases/phase-12-case-lab-depth-and-polish.md`,
  `docs/qa/phase-10-demo-readiness-audit.md`, `docs/HANDOFF.md` and
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** Exact Phase 11 task-ID validation; 52-finding audit mapping validation;
  targeted phase-split searches; Prettier formatting/check; `git diff --check`; repository
  status/diff review.
- **Result/verification:** The Phase 11 checklist contains exactly P11-T00 through P11-T13, with
  only P11-T00 complete. Phase 11 explicitly includes F24, F35–F38, F50 and F52. Phase 12 retains
  the approved breadth, general clue/timeout/schema semantics, deeper anatomy, evidence/debrief,
  metadata/history, accessibility/polish and offline-model work. No code or plan file changed.
- **Follow-ups:** Start P11-T01 with the Playwright real-WebGL harness; keep P9-M01 through P9-M03
  active.

### [2026-10-03 16:55] P11-T01 - Add real-WebGL acceptance harness

- **Agent/session:** Cursor implementation session
- **Action:** Added Playwright production-preview coverage with deterministic advanced-seed setup,
  blocked service workers, desktop and touch-phone Chromium projects and SwiftShader launch flags.
  Added an E2E-gated typed anatomy bridge for renderer diagnostics and projected structure,
  finding and marker coordinates. Kept real-WebGL startup, screenshot capture and baseline case
  assertions active while adding executable skips owned by P11-T03 through P11-T06 and P11-T11.
- **Files changed:** Playwright configuration and golden-path spec; package manifests and E2E
  TypeScript project; anatomy viewer/controller types and implementation; Vite environment types;
  ADR-075, Phase 11 checklist, handoff and activity log.
- **Commands run:** `npm install --save-dev @playwright/test`, `npx playwright install chromium`,
  `npm run typecheck`, `npm run lint`, focused anatomy Vitest, `npm run build`,
  `npx playwright test --list`, `npm run test:e2e`, Prettier checks and `git diff --check`.
- **Result/verification:** TypeScript, lint, 8 focused anatomy tests, production build and whitespace
  checks pass. The production bundle contains no `__anatomyTest` or `VITE_E2E` global. Playwright
  passes the active real-WebGL smoke in both 1440×900 desktop and 375×812 touch-phone projects (2
  passed); 10 downstream assertions are intentionally skipped and assigned to their owning tasks.
- **Follow-ups:** Enable each focused browser assertion when P11-T03 through P11-T06 land, then
  enable the complete five-minute path in P11-T11. Start P11-T02 next.

### [2026-10-03 17:05] P11-T02 - Exclude unscored case steps

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Made resolved plan-step scoring status authoritative for question attempt timing,
  case component and per-step speed means, emitted/persisted scored-step results and comparison
  rows. Preserved progression, completion and lifecycle events for unscored steps and retained
  first-attempt score, response, timeout and elapsed semantics for scored retries.
- **Files changed:** Case scoring engine and tests; ActivityPlayer timing boundary; CasePlayer
  result construction and tests; ADR-076; Phase 11 checklist; handoff and activity log.
- **Commands run:** Focused Vitest runs, `npm run typecheck`, `npm run lint`, IDE diagnostics and
  `git diff --check`.
- **Result/verification:** Forty-two focused scoring and player tests pass, including an unscored
  `anatomy_explore` case that completes and emits its event but is absent from component/speed
  denominators, case-completion step results and expert comparison. TypeScript, lint and IDE
  diagnostics pass.
- **Follow-ups:** Start P11-T03 and enable its projected-point canvas-picking Playwright assertion.

### [2026-10-03 17:12] P11-T03 - Resolve most-specific canvas picks

- **Agent/session:** Cursor implementation session
- **Action:** Added a pure ordered-hit structure resolver, passed selectable anatomy levels into
  controller picking and replaced document-order aggregate matching with ancestry depth, mesh-count
  and deterministic-ID resolution. Added same-level mesh-binding validation while preserving
  aggregate-parent overlap across levels. Enabled the real-WebGL lobe-selection assertion on the
  foundation case's visible surface route because the golden case currently opens with its surface
  model hidden in endoscopic mode.
- **Files changed:** Anatomy resolver and focused tests; Three.js controller and controller-facing
  viewer test; content loader and semantic validation tests; Playwright golden-path specification;
  ADR-077; Phase 11 checklist; handoff and activity log.
- **Commands run:** Focused Vitest runs, Prettier, `npm run typecheck`, `npm run lint`,
  `npm run validate:content`, focused P11-T03 Playwright desktop/touch-phone run, IDE diagnostics
  and `git diff --check`.
- **Result/verification:** Forty-eight focused resolver, viewer and content tests pass. TypeScript,
  lint, content validation and IDE diagnostics pass. Real-WebGL click/tap selects the right upper
  lobe in both Playwright projects (2 passed). The first browser attempt selected successfully but
  exceeded the default teardown budget; marking this GPU-backed test slow produced a clean rerun.
- **Follow-ups:** Start P11-T04 and preserve configured overview markers across asynchronous model
  readiness, reset, remount and resume.

### [2026-10-03 17:18] P11-T04 - Preserve authored anatomy markers

- **Agent/session:** Cursor implementation session
- **Action:** Changed marker resolution so an explicit runtime marker wins, otherwise a marker
  authored in the anatomy start view remains active. Enabled the production-preview reset
  assertion in both Playwright projects and lengthened the shared WebGL bridge readiness poll for
  slower software-rendered mobile startup.
- **Files changed:** `src/anatomy3d/viewer/AnatomyViewer.tsx`, its focused test,
  `e2e/golden-path.spec.ts`, Phase 11 checklist, handoff and activity log.
- **Commands run:** Focused Vitest and desktop/touch-phone P11-T04 Playwright runs.
- **Result/verification:** Seven focused viewer tests pass. The configured foundation marker is
  visible before and after reset in desktop and 375 px touch-phone real-WebGL Chromium.
- **Follow-ups:** Implement reversible authored endoscopic navigation in P11-T05.

### [2026-10-03 17:27] P11-T05 - Add navigable endoscopic mode

- **Agent/session:** Cursor implementation session
- **Action:** Replaced mode-switching waypoint flight with controller-owned `travelTo` route
  history that preserves endoscopic mode and supports same-waypoint outside exit. Added
  branch/parent controls, breadcrumb and current-landmark context, Outside/Airway controls,
  orientation cues, bounded pointer look, selectable-level outside framing and a collapsed
  equivalent structure disclosure that opens on WebGL failure. Rebuilt the procedural lumen with
  smooth tapered curves, authored ring counts and configured ring, headlight and fog properties.
  Made anatomy localisation forward authored navigation/marker settings, expanded ADR-077 into the
  shared interaction/navigation contract and enabled the P11-T05 real-WebGL route.
- **Files changed:** Anatomy controller/viewer contracts, implementation and tests; anatomy
  primitive/map/app schemas and generated schemas; lung/fixture maps and golden case; localisation
  primitive/tests; Playwright route; Vitest collection boundary; content-schema documentation;
  ADR-077; Phase 11 checklist; handoff and activity log.
- **Commands run:** `npm run schema:export`; focused Vitest (4 files / 67 tests);
  `npm run typecheck`; `npm run lint`; `npm run validate:content`; `npm run test`;
  `npm run build`; `npm run test:e2e -- --grep "P11-T05"`; targeted Prettier checks;
  import/API searches; `git diff --check`; status/diff review.
- **Result/verification:** TypeScript, lint, 53 Vitest files / 372 tests, content validation (5
  courses, 13 lessons, 4 cases, 1 anatomy map, zero warnings), production build and whitespace
  checks pass. P11-T05 traverses Carina → Right main airway → Carina in both desktop and
  touch-phone Chromium with real WebGL (2 passed). The first full Vitest run exposed Playwright
  collection; excluding `e2e/**` in Vitest restored the intended independent unit/browser gates.
- **Follow-ups:** Implement P11-T06 configured patient-specific findings. Physical Android/iOS
  gates P9-M01 through P9-M03 remain open.

### [2026-10-03 17:46] P11-T06 - Add configured anatomy findings

- **Agent/session:** Cursor implementation session
- **Action:** Added case-scoped findings with organ-agnostic kinds, normalized severity, local clue
  references and structure or directed-waypoint anchors. Resolved step `findingIds` into the typed
  case plan, added `requiredFindingIds` exploration completion, typed inspection events and a
  context boundary that keeps course data out of React. Added app-configured Three.js narrowing,
  deterministic occlusion, wall-thickening and translucent-region overlays with mode-aware
  visibility, picking, projection, equivalent controls and a labelled status card. Added a
  temporary focal narrowing and authored carina framing to the advanced case; P11-T11 still owns
  final case re-authoring.
- **Files changed:** Case/anatomy/app schemas and generated JSON schemas; content loader and tests;
  case plan/context and tests; anatomy controller/viewer/primitives/events and tests; app config,
  lung map, case fixtures and advanced case; Playwright golden path; schema documentation/export
  script; ADR-076; Phase 11 checklist; handoff and activity log.
- **Commands run:** Prettier on changed files; `npm run schema:export`; focused Vitest (6 files / 75
  tests); `npm run typecheck`; `npm run lint`; `npm run test`; `npm run validate:content`;
  `npm run build`; `npm run test:e2e -- --project touch-phone-chromium --grep "P11-T06"`;
  `npm run test:e2e -- --grep "P11-T06"`; IDE diagnostics; `git diff --check`; repository
  status/diff review.
- **Result/verification:** Schema export, TypeScript, lint, 54 Vitest files / 375 tests, content
  validation (5 courses, 13 lessons, 4 cases, 1 anatomy map, zero warnings), production build and
  IDE diagnostics pass. P11-T06 projects and activates the configured narrowing through the real
  canvas in desktop and touch-phone Chromium (2 passed). The first browser run exposed an
  ambiguous generic status locator and an off-viewport phone tap; scrolling the canvas before
  projection and selecting the finding-labelled status made the pointer evidence deterministic.
- **Follow-ups:** P11-T07 must pause question timing across transitions and blocking evidence.
  P11-T11 must re-author and clinically review the final golden-case finding; current geometry is
  explicitly illustrative rather than patient-derived reconstruction. Physical Android/iOS gates
  P9-M01 through P9-M03 remain open.

### [2026-10-03 18:01] P11-T07 - Pause blocked case timing

- **Agent/session:** Cursor implementation session
- **Action:** Added `ActivityPlayer.pauseTiming` and resumable attempt countdown behavior; made
  CasePlayer pause attempt and case clocks for stage transitions and the blocking mobile clue
  presenter. Converted stage transitions to focus-trapped Radix dialogs and showed the first stage
  before a fresh attempt's first task while preserving direct resume. Made case elapsed time
  unbounded after countdown expiry, persisted actual elapsed duration, displayed elapsed time in
  untimed mode and explicitly labelled speed as not scored. Kept per-step timers gated by resolved
  scored/timer-compatible metadata and deferred content timer removal to P11-T11.
- **Files changed:** `src/engines/cases/{clock,clock.test}.ts`; `src/player/ActivityPlayer.tsx`;
  `src/player/useActiveElapsed.test.tsx`; `src/player/useAttemptTimer.ts`;
  `src/player/useAttemptTimer.test.tsx`;
  `src/player/case/{CasePlayer,ClueBoard,CaseResults,CaseCompare,casePlayer.test}.tsx`;
  `src/routes/cases/{CaseAttemptPage,caseRoutes.test}.tsx`;
  `src/routes/play/{caseFlow.test,playerRoutes.test}.tsx`; ADR-078, Phase 11 checklist, handoff and
  activity log.
- **Commands run:** Prettier write/check; focused timing/player Vitest (5 files / 29 tests);
  focused route Vitest (3 files / 20 tests); `npm run test`; `npm run typecheck`; `npm run lint`;
  `npm run validate:content`; IDE diagnostics; `git diff --check`; repository status/diff review.
- **Result/verification:** P11-T07 is complete. Focused suites pass; the full suite passes 55 files
  / 380 tests; TypeScript, lint and content validation (5 courses, 13 lessons, 4 cases, 1 anatomy
  map, zero warnings) pass. The first full run correctly exposed eight flows that needed to
  acknowledge the new initial stage dialog; all were updated and the rerun is green. No content
  timer was removed and no commit was created.
- **Follow-ups:** P11-T08 should consolidate all clue entry/reopen paths into one CasePlayer-owned
  atomic presenter. P11-T11 should remove exploration/evidence countdowns in authored content.

### [2026-10-03 18:09] P11-T08 - Unify atomic clue presentation

- **Agent/session:** Cursor implementation session
- **Action:** Lifted selected-clue and presenter-open state into CasePlayer and routed clue-first
  entry, clue cards and feedback remediation through one context-aware `presentClue` action. Made
  ClueBoard controlled; its phone trigger now opens an unselected list without recording a clue,
  while clue-first and feedback reopen visibly present the selected clue on phone. Cleared stale
  presentation at stage boundaries, preserved first-open/no-double-event behavior and extended the
  typed clue event with first-open context and pre-response status. Added session-v4 migration for
  clue context and restricted optional clue penalties to entry/browse openings made before the
  response, excluding remediation and unknown legacy openings.
- **Files changed:** Case clue/scoring/session contracts and tests; session-store migration; typed
  learner events; `CasePlayer`, controlled `ClueBoard` and focused component tests; ADR-079; Phase
  11 checklist; handoff and activity log.
- **Commands run:** Targeted Prettier; focused Vitest runs (3 files / 45 tests and 2 files / 15
  tests); `npm run typecheck`; `npm run lint`; `npm run validate:content`; `npm run test`; IDE
  diagnostics; final diff/whitespace review.
- **Result/verification:** P11-T08 is complete. TypeScript, lint and content validation (5 courses,
  13 lessons, 4 cases, 1 anatomy map, zero warnings) pass. The final full suite passes 55 files /
  383 tests. The first full run exposed one desktop flow regression because the test environment
  lacked `matchMedia`; the viewport fallback now uses `innerWidth`, and both the desktop flow and
  controlled phone presenter pass on rerun. No schema export was needed because authored content
  contracts did not change. No commit was created.
- **Follow-ups:** P11-T09 should harden the artifact-first responsive player layout. P11-T10 owns
  permanent attempt-v6 persistence of complete result data; Phase 12 still owns general
  clue-consumption semantics.

### [2026-10-03 18:22] P11-T09 - Harden artifact-first case layout

- **Agent/session:** Cursor implementation session with focused implementation subagent
- **Action:** Removed the second case start screen by adding an explicit ActivityPlayer
  auto-start/resume option used only by the catalogue case route. Replaced technical primitive type
  names in focused step headings with authored labels/prompts; removed generic progress in case
  mode and added current-stage task context. Reworked case chrome into a full-width artifact
  workspace with a controlled collapsed desktop clue rail, fixed safe-area-aware phone clue
  action/sheet, compact responsive stage header and approximately 60dvh phone anatomy viewport.
  Added global safe-area scroll padding/margins and desktop/touch-phone production-preview
  `elementFromPoint` coverage for the start, stage, canvas, branch and clue controls. Kept the
  equivalent structure list secondary and used ADR-074 rather than creating a redundant ADR.
- **Files changed:** Activity player and step frame; case player, stage header and clue board; case
  route wrapper; anatomy viewer and global styles; component, route, showcase and Playwright tests;
  Phase 11 checklist, handoff and activity log.
- **Commands run:** Targeted Prettier; focused Vitest (5 files / 47 tests); `npm run typecheck`;
  `npm run lint`; `npm run validate:content`; `npm run test`; `npm run build`; focused P11-T09 and
  P11-T03 Playwright runs; full `npm run test:e2e`; IDE diagnostics; final diff/whitespace review.
- **Result/verification:** P11-T09 is complete. TypeScript, lint, content validation (5 courses, 13
  lessons, 4 cases, 1 anatomy map, zero warnings), production build and IDE diagnostics pass. The
  full suite passes 55 files / 385 tests. Playwright passes 12 active checks across desktop and
  touch-phone Chromium; the two P11-T11 checks remain intentionally skipped. The first full unit
  run exposed legacy technical-title assertions, and the first browser run exposed a hidden
  equivalent-list assertion; both were updated to authored-heading and canvas-state evidence before
  clean reruns. No commit was created.
- **Follow-ups:** Start P11-T10 attempt-v6 result persistence. Physical Android/iOS gates P9-M01
  through P9-M03 remain open.

### [2026-10-03 18:40] P11-T10 - Persist truthful case results

- **Agent/session:** Cursor implementation session
- **Action:** Upgraded learner state to v6 with discriminated legacy-v5 and complete result-v6
  attempt records. Persisted separate step/case speed, effective weights, clue cost, timing mode,
  speed-scored status, normalized first responses, actual duration and XP from the matching central
  gamification activity result. Rebuilt saved/live results and comparison around persisted facts,
  authored scored-step prompts, normalized equality, optional validated expert rationales,
  accessible stars, `/100`, `mm:ss`, first-attempt disclosure and de-duplicated history. Added
  ADR-080 and updated generated schemas/documentation and the Phase 11 checklist.
- **Files changed:** Learner/case schemas and seeds; learner migration; case scoring, progress,
  response normalization and gamification/pipeline integration; case result, compare, intro and
  attempt-route UI; focused migration, selector, result, compare, route, challenge and pipeline
  tests; generated schemas/content-schema documentation; ADR-080; Phase 11 checklist; handoff and
  activity log.
- **Commands run:** Targeted Prettier; `npm run schema:export`; focused Vitest (10 files / 114
  tests, then 7 files / 48 tests after focused additions); `npm run test`; `npm run typecheck`;
  `npm run lint`; `npm run validate:content`; `npm run build`; IDE diagnostics; `git diff --check`;
  repository status/diff review.
- **Result/verification:** P11-T10 is complete. The full suite passes 56 files / 389 tests.
  TypeScript, lint, content validation (5 courses, 13 lessons, 4 cases, 1 anatomy map, zero
  warnings), schema export, production build and IDE diagnostics pass. Legacy attempts never
  synthesize unavailable details; current attempts display the central activity-result XP.
- **Follow-ups:** P11-T11 should compose and clinically review the five-minute golden case.
  Physical Android/iOS gates P9-M01 through P9-M03 remain open.

### [2026-10-03 19:01] P11-T11 - Compose focused golden case

- **Agent/session:** Cursor implementation session
- **Action:** Re-authored the featured advanced case as a neutral four-stage, six-task,
  five-to-six-minute path. Added required mid-trachea-to-posterior-basal exploration, generic
  right-lower-lobe segmental branches, diffuse wall change and dominant mucus-occlusion findings,
  overlay-free scored localisation, one severity selection, one CO₂ interpretation, diagnosis and
  urgent-consequence tasks. Removed all per-step timers, set 300/480-second case timing, authored
  benchmark responses/rationales and debrief, and seeded one prior result-v6 attempt. Added a
  development-only `?anatomyDebug=1` camera/target/waypoint readout, focused clinical-claim ledger,
  ADR-081, content/flow tests and a complete real-UI Playwright path in both projects.
- **Files changed:** `public/content/cases/exacerbation-advanced.json`,
  `public/content/anatomy/lung-map.json`, `public/content/seeds/advanced.json`,
  `src/anatomy3d/viewer/{AnatomyViewer,AnatomyViewer.test}.tsx`,
  `src/content/content.test.ts`, `src/routes/play/caseFlow.test.tsx`,
  `e2e/golden-path.spec.ts`, `docs/qa/phase-11-golden-case-content-review.md`,
  `docs/DECISIONS.md`, Phase 11 checklist, handoff and activity log.
- **Commands run:** Targeted Prettier; focused Vitest (3 files / 59 tests);
  `npm run schema:export`; `npm run test`; `npm run typecheck`; `npm run lint`;
  `npm run validate:content`; `npm run build`; targeted and full `npm run test:e2e`; IDE
  diagnostics; `git diff --check` and targeted diff review. `npm run assets:hash` was not run
  because no asset changed.
- **Result/verification:** The final full suite passes 56 files / 390 tests. TypeScript, lint,
  content validation (5 courses, 13 lessons, 4 cases, 1 anatomy map, zero warnings), schema export,
  production build, IDE diagnostics and whitespace checks pass. Playwright passes all 14 tests,
  including P11-T11 completion through branch controls and projected finding canvas interaction in
  desktop and touch-phone Chromium. Initial browser runs exposed an achievement dialog and
  animation-sensitive projected coordinates; the test now dismisses configured celebrations and
  waits for a stable projected point before canvas activation.
- **Follow-ups:** Obtain the explicitly outstanding respiratory SME, anatomy/pathology and
  client/legal sign-offs in the focused claim ledger before external presentation. Continue with
  P11-T12 deployment/cache resilience; physical Android/iOS gates P9-M01 through P9-M03 remain
  open.

### [2026-10-03 19:24] P11-T12 - Preflight versioned model and build

- **Agent/session:** Cursor implementation session
- **Action:** Derived every model runtime URL from validated SHA-256 metadata and added a dedicated
  CacheFirst service-worker route limited to four versioned GLBs and 14 days. Prefetched only the
  configured featured case's exact model on intro, exposed accessible loading/ready/recoverable
  failure state without blocking its CTA, and kept unrelated cases untouched. Added a visible
  configured/CI-or-source-derived build ID. Preserved prompt-based waiting-worker activation and
  reload, while clearing stale update state and suppressing expected errors when service workers
  are blocked. Added unit and real-service-worker browser coverage, ADR-082 and the exact
  clean-origin/model/build/seed/viewport/recovery/six-task demo runbook.
- **Files changed:** `vite.config.ts`; `scripts/build/{build-id,build-id.test}.ts`;
  `src/{sw,vite-env.d}.ts`; `src/pwa/{cachePolicy,modelCache,modelCache.test,registerSW,
registerSW.test}.ts(x)`; `src/test/pwaRegisterMock.ts`; `src/content/useAssetUrl.ts`;
  anatomy primitive context/components; `CaseIntroPage` and route tests; `BuildStamp`, `AppShell`
  and router test; `e2e/pwa-resilience.spec.ts`; ADR-082; Phase 11 checklist; demo runbook; handoff
  and activity log.
- **Commands run:** Targeted Prettier; focused Vitest (5 files / 24 tests); `npm run typecheck`;
  `npm run lint`; `npm run validate:content`; `npm run test`; `npm run build`; `npm run budget`;
  focused P11-T12 Playwright; `npm run check`; full `npm run test:e2e -- --workers=2`; IDE
  diagnostics; `git diff --check`; repository status/diff review.
- **Result/verification:** P11-T12 is complete. The full quality gate passes: 59 Vitest files / 400
  tests, 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, production PWA build
  and all bundle budgets. The service-worker preflight passes in both browser projects and the full
  browser suite passes 16/16. An initial concurrent four-worker browser/full-check run caused
  resource-contention timeouts; the same complete suites passed sequentially with two browser
  workers. The unoverridden build ID is `0.1.0+765186c09b76`. No commit was created.
- **Follow-ups:** Run P11-T13 closeout. External presentation remains conditional on the recorded
  clinical/client review, and P9-M01 through P9-M03 remain open pending physical-device evidence or
  an authorized waiver.

### [2026-10-03 19:37] P11-T13 - Close Phase 11

- **Agent/session:** Cursor implementation session
- **Action:** Audited all 52 demo-readiness findings against the approved Phase 11/12 split;
  retained the 12 approved Phase 12 deferrals and closed the 40 Phase 11 findings with
  task/browser evidence. Added repeatable full-page screenshots at finding, localisation, results
  and comparison for desktop and 375 px paths; recorded exact environment, command timing, WebGL
  renderer and emulation limits. Refreshed architecture, content contracts, roadmap, phase,
  audit disposition and handoff. Confirmed ADR-074 through ADR-082 remain accepted, sequential and
  accurately referenced.
- **Files changed:** `e2e/golden-path.spec.ts`; `playwright.config.ts`;
  `docs/qa/evidence/phase-11/*.png`; `docs/qa/phase-11-browser-qa.md`;
  `docs/qa/phase-10-demo-readiness-audit.md`; `docs/ARCHITECTURE.md`;
  `docs/CONTENT_SCHEMA.md`; `docs/ROADMAP.md`;
  `docs/phases/phase-11-case-lab-demo-hardening.md`; `docs/HANDOFF.md`; activity log.
- **Commands run:** `npm run check:demo` (two prerequisite failures before browser launch);
  `npx playwright install chromium`; `npm run check:demo` with the installed browser cache;
  focused Playwright renderer diagnostics; `npm run check`; targeted Prettier check/write; IDE
  diagnostics; `git diff --check`; repository status/evidence review.
- **Result/verification:** Phase 11 is complete. The final `npm run check:demo` passes in 180.387 seconds:
  typecheck, lint and 16/16 production-preview Playwright tests. Desktop and 375 px automated golden
  paths complete in 17.654 and 17.043 seconds, using WebGL 2 through ANGLE Vulkan SwiftShader.
  Eight durable screenshots cover both targets. `npm run check` passes in 41.589 seconds with 59
  Vitest files / 400 tests, zero content warnings, a successful production build and all bundle
  budgets. IDE diagnostics and whitespace checks pass. No schema export or asset hashing was needed
  because P11-T13 changed no runtime schema or asset. No commit was created, and the user's
  `docs/reference docs/` remained untouched.
- **Follow-ups:** Start P12-T00 from the 12 explicit deferrals. Before any external presentation,
  obtain the unapproved clinical/anatomy/pathology/client sign-offs. Complete P9-M01 through P9-M03
  on physical Android/iOS hardware or record an authorized waiver.

### [2026-10-03 19:48] P11-T13 - Correct final endoscopic visual

- **Agent/session:** Cursor implementation session
- **Action:** Reviewed the durable screenshots rather than relying only on interaction assertions,
  found that a closed procedural waypoint sphere filled the endoscopic camera with a flat wall and
  removed those generated shells. Open tapered tube ends now expose airway depth, cartilage rings
  and the configured mucus occlusion.
- **Files changed:** Three.js anatomy controller; refreshed Phase 11 desktop/mobile screenshots;
  Phase 11 browser QA, handoff and activity log.
- **Commands run:** Focused desktop/touch golden-path Playwright run, `npm run check`, final
  `npm run check:demo` and visual inspection of refreshed evidence.
- **Result/verification:** The refreshed screenshots visibly show the airway and occlusion.
  Fifty-nine Vitest files / 400 tests, content validation, build, budgets and all 16 Playwright
  tests pass. The final browser gate completes in 93.259 seconds.
- **Follow-ups:** Clinical/client sign-off and Phase 9 physical-device gates remain external
  blockers; Phase 12 begins with the 12 approved deferrals.

### [2026-10-03 20:55] P12-T00 - Rebaseline and start Phase 12

- **Agent/session:** Cursor implementation session
- **Action:** Ran the complete Phase 11 quality and real-WebGL gates, committed the previously
  uncommitted 127-file Phase 11 implementation as `e4d36d3`, and preserved the user's untracked
  `docs/reference docs/`. Rebaselined all 12 deferred Case Lab findings, recorded two whole-product
  demo gaps (Leaderboard placeholder periods and weekly challenge cards without continuation),
  expanded Phase 12 to close the PRD product tour and recorded ADR-083. Selected configured
  procedural segment volumes and authored waypoints rather than a new licensed GLB.
- **Files changed:** Phase 12 phase file; Phase 10 audit; Phase 12 baseline; decisions; handoff and
  activity log.
- **Commands run:** `git status --short`; `git diff --stat`; `git diff --check`; `npm run check`;
  `npm run check:demo` with the installed Playwright browser path; Phase 11 commit.
- **Result/verification:** `npm run check` passes with 59 Vitest files / 400 tests, zero content
  warnings, successful production build and all bundle budgets. `npm run check:demo` passes all
  16 real-WebGL checks across desktop and 375 px touch emulation. Phase 12 is active.
- **Follow-ups:** P12-T01 defines speed eligibility, committed-progress timeout credit and the next
  durable session/result contracts. Clinical/client sign-off and Phase 9 physical-device gates
  remain external blockers.

### [2026-10-03 21:01] P12-T01 - Define scoring and persistence contracts

- **Agent/session:** Cursor implementation session
- **Action:** Replaced accuracy-adjusted speed with configured time-only eligibility, including
  eligible/total step counts and an explanatory result display. Added primitive-definition timeout
  credit with a conservative default and committed-progress evaluation for `anatomy_locate`.
  Upgraded sessions to v5 and learner state/current attempts to v7 with reviewed-clue, evidence,
  location, differential and timeout-credit fields while preserving result-v5/v6 records as
  legacy. Exported schemas, recorded ADR-084/ADR-085 and closed P12-T01.
- **Files changed:** Case scoring, progress, event and player/result contracts; primitive
  definitions and anatomy evaluation; session/learner migrations; app config and seeds; focused
  tests; schema exporter and generated schemas/content documentation; Phase 12 checklist,
  decisions, handoff and activity log.
- **Commands run:** Targeted Vitest (10 files / 114 tests); `npm run typecheck`; `npm run lint`;
  `npm run validate:content`; `npm run schema:export`; `npm run check:demo`; targeted Prettier; IDE
  diagnostics; `git diff --check`.
- **Result/verification:** All targeted tests pass. TypeScript, lint and content validation pass
  with 5 courses, 13 lessons, 4 cases, 1 anatomy map and zero warnings. Schema export passes, and
  the Phase 11 real-WebGL demo gate passes all 16 desktop/touch-phone checks. No commit was created;
  the user's untracked `docs/reference docs/` was not touched.
- **Follow-ups:** Start P12-T02 clue review and stable totals. Clinical/client sign-off and Phase 9
  physical-device gates remain external blockers.

### [2026-10-03 21:18] P12-T02 - Separate clue review from opening

- **Agent/session:** Cursor implementation session
- **Action:** Added configured clue-review dwell and media thresholds; separated idempotent review
  from ADR-079 clue opening and its unchanged penalty semantics. Wired clue primitive completion,
  interaction and media-progress signals; persisted reviewed clues in session v5/result v7 and
  emitted one typed review event per clue per session. Replaced stage-relative opened totals with
  stable case reviewed totals plus stage availability, added accessible clue states, suppressed
  importance labels for advanced tiers and based missed key evidence on reviews. Recorded ADR-086
  and closed P12-T02. Refreshed the Phase 11 evidence captures through the required real-WebGL
  demo run.
- **Files changed:** Case Lab config and generated app-config schema; clue engine/event/session,
  player, board and results; focused unit/integration tests; ADR-086; Phase 12 checklist; handoff
  and activity log; `docs/qa/evidence/phase-11/*.png`.
- **Commands run:** Targeted Prettier; focused Vitest (9 files / 99 tests); `npm run typecheck`;
  `npm run lint`; `npm run validate:content`; `npm run schema:export`; two `npm run check:demo`
  runs with the installed Playwright browser path; IDE diagnostics; `git diff --check`.
- **Result/verification:** Focused tests pass 99/99. TypeScript, lint and content validation pass
  with 5 courses, 13 lessons, 4 cases, 1 anatomy map and zero warnings. Schema export passes. The
  first demo run found a clue-trigger accessible-name compatibility regression; after restoring
  the established `Clues` prefix, the full Phase 11 gate passed all 16 desktop/touch-phone real-
  WebGL checks in 213.947 seconds. No commit was created, and the user's untracked
  `docs/reference docs/` was not touched.
- **Follow-ups:** Start P12-T03 configured procedural segment volumes and segmental waypoints.
  Clinical/client sign-off and Phase 9 physical-device gates remain external blockers.

### [2026-10-03 21:39] P12-T03 - Add procedural segment anatomy

- **Agent/session:** Cursor implementation session
- **Action:** Extended anatomy structures to an exclusive mesh-binding or configured ellipsoid
  volume union. Added pure rotated-bound, tolerant ancestor-fit and same-level overlap validation;
  configured volume materials and tolerances; and integrated selectable-level volume rendering,
  faded mesh-parent context, picking, highlighting, framing, projection and disposal into the
  shared Three.js controller. Authored 18 labelled segment volumes and 18 useful segmental airway
  branches across all five lobes, moved the foundation apical-segment task onto real 3D selection
  and preserved the featured golden route and choice labels. Added ADR-087 and closed P12-T03.
- **Files changed:** Anatomy schema/loader and new volume-validation helper/tests; app config and
  generated schemas; Three.js controller/viewer contracts and tests; lung map and foundation case;
  real-WebGL browser coverage and refreshed golden screenshots; schema exporter/content
  documentation; ADR-087; Phase 12 checklist; handoff and activity log.
- **Commands run:** Targeted Prettier; focused Vitest (7 files / 78 tests);
  `npm run schema:export`; `npm run validate:content`; `npm run typecheck`; `npm run lint`;
  `npm run check`; focused P12-T03 Playwright; full `npm run test:e2e -- --workers=2` and serial
  rerun with `--workers=1`; IDE diagnostics; `git diff --check`.
- **Result/verification:** Schema export passes. Focused tests pass 78/78. The complete quality gate
  passes 61 Vitest files / 415 tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map
  with zero warnings, builds production output and passes all bundle budgets without adjustment.
  The projected segment pick passes in desktop and touch-phone Chromium, and the final complete
  browser suite passes 18/18 serially. The initial two-worker browser run had one transient timeout
  in the pre-existing desktop finding stability poll while its touch and full-path equivalents
  passed. No commit was created, and `docs/reference docs/` was not touched.
- **Follow-ups:** Start P12-T04 local evidence notes, current location and differential confidence.
  Obtain the outstanding clinical/anatomy/client review and complete the Phase 9 physical-device
  gates before external approval.

### [2026-10-03 21:57] P12-T04 - Add local case notes

- **Agent/session:** Cursor implementation session
- **Action:** Added optional authored case differentials with semantic ID uniqueness and four
  featured-case hypotheses. Built the reflective Case notes workspace with eligible clue/finding
  pins, remediation reopening, mapped location labels and confidence controls. Integrated
  Clues/Notes tabs in the desktop rail and separate compact mobile actions using the same
  timing-pausing sheet behavior. Persisted session-v5 state into result v7, emitted typed pin and
  hypothesis events, prompted note review at stage boundaries, exported schemas and recorded
  ADR-088.
- **Files changed:** Case schema/loader and generated case schema; featured case content; evidence
  helpers and tests; typed events; Case player, clue board and new Case notes component; case/pipeline
  tests; architecture/content contracts; ADR-088; Phase 12 checklist; handoff; refreshed automated
  Phase 11 screenshots.
- **Commands run:** Targeted Prettier; focused Vitest (4 files / 68 tests); `npm run
schema:export`; `npm run typecheck`; `npm run lint`; `npm run validate:content`; `npm run test`;
  focused touch-phone P11-T03 Playwright; two full serial `npm run test:e2e` runs; `npm run check`;
  IDE diagnostics; `git diff --check`; repository status/diff review.
- **Result/verification:** P12-T04 is complete. The final full quality gate passes 62 Vitest files /
  421 tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds
  production and passes all bundle budgets. The final real-WebGL suite passes 18/18 on desktop and
  375 px touch emulation. The first browser run found that the initial two-action mobile label could
  wrap over a projected canvas target; compact visible text with the full status retained in the
  accessible name fixed the regression. No commit was created, and `docs/reference docs/` was not
  touched.
- **Follow-ups:** Start P12-T05 actionable key-evidence debrief and expert teaching. Clinical/client
  sign-off and Phase 9 physical-device gates remain external blockers.

### [2026-10-03 22:15] P12-T05 - Add actionable expert teaching

- **Agent/session:** Cursor implementation session
- **Action:** Replaced clue-only debrief IDs with typed clue/finding key evidence, affected task
  references and authored significance. Added strict expert path, evidence weight/note, diagnosis
  rationale and per-scored-task rationale contracts with semantic reference and usability checks.
  Populated the golden case with the complete teaching model including its mucus finding and added
  temporary valid teaching fields to the other cases. Rebuilt results with status-aware evidence
  cards, read-only remediation sheets and comparison anchors; expanded comparison with expert path,
  weighted evidence, differential ratings and diagnosis reasoning. Persisted inspected finding IDs
  in new result-v7 attempts while preserving older result readability. Recorded ADR-089.
- **Files changed:** Case and learner-result schemas, semantic loader and primitive-type metadata;
  all four case documents and case fixtures; Case player, clue renderer, results, comparison and
  saved-result route; focused schema/UI/route tests; generated schemas; architecture, content
  schema, Phase 12 checklist, decisions, handoff, activity log and refreshed automated Phase 11
  browser evidence.
- **Commands run:** Targeted Prettier; focused Vitest (8 files / 100 tests); `npm run
schema:export`; `npm run typecheck`; `npm run lint`; `npm run validate:content`; full `npm run
check`; serial `npm run test:e2e -- --workers=1` with the installed Playwright browser cache; IDE
  diagnostics; `git diff --check`.
- **Result/verification:** P12-T05 is complete. The full quality gate passes 63 Vitest files / 428
  tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds
  production and passes all bundle budgets. The complete real-WebGL demo suite passes all 18 tests
  on desktop and 375 px touch emulation. No commit was created, and the user's untracked
  `docs/reference docs/` was not touched.
- **Follow-ups:** Re-author the non-golden catalogue in P12-T06. Clinical/client sign-off and Phase
  9 physical-device gates remain external blockers.

### [2026-10-03 22:59] P12-T06 - Re-author Case Lab catalogue

- **Agent/session:** Cursor implementation session
- **Action:** Re-authored foundation and intermediate as six-task cases and the daily case as a
  three-task case with neutral entry copy, one disclaimer, configured findings, required unscored
  exploration, deeper localisation, authored differentials and complete teaching metadata.
  Preserved the advanced golden case composition while adding explicit benchmark timing facts.
  Enforced nonempty stages, orient-entry consumption, used clues, all-step rationales and pure
  benchmark scorer agreement. Migrated the three seeded prior attempts to unique result-v7 records,
  added focused invalid fixtures/tests, published the four-case unreviewed claim ledger and
  recorded ADR-090.
- **Files changed:** All four case documents; advanced learner seed; case schema, semantic loader,
  generated case schema and TypeScript validation configuration; content/state/route/browser tests
  and invalid fixtures; architecture, content schema, Phase 12 checklist, ADRs, QA ledger, handoff
  and activity log.
- **Commands run:** Targeted Prettier; focused Vitest (3 files / 64 tests and 7 files / 98 tests);
  `npm run schema:export`; repeated `npm run typecheck`, `npm run lint` and
  `npm run validate:content`; full `npm run check`; focused four-test real-WebGL regression; serial
  `npm run test:e2e -- --workers=1`; IDE diagnostics; `git diff --check`.
- **Result/verification:** P12-T06 is complete. The final quality gate passes 63 Vitest files / 434
  tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds
  production and passes all bundle budgets. The final real-WebGL suite passes 18/18 on desktop and
  375 px touch emulation. No commit was created, and the user's untracked `docs/reference docs/`
  was not touched.
- **Follow-ups:** Start P12-T07 metadata and quick-case history standardization. All four case claim
  ledgers remain clinically/anatomically/client unreviewed, and Phase 9 physical-device gates remain
  external blockers.

### [2026-10-03 23:13] P12-T07 - Standardize Case Lab metadata

- **Agent/session:** Cursor implementation session
- **Action:** Added configured organ-system labels with semantic resolution for every case and
  centralized Case Lab tier, organ-system, estimated-time, duration, score and XP formatters.
  Appended the configured daily quick case to the catalogue without changing `caseIds`, added its
  Daily badge and preserved its intro/history route and daily-challenge behavior. Filtered the
  completed challenge attempt before supplying comparison history while retaining the comparison
  component's defensive filter, and added explicit duplicate-current-attempt route coverage.
- **Files changed:** App config, Case Lab schema/semantic loader and generated app-config schema;
  shared case formatters; Case Lab selectors/cards, intro/results/comparison and challenge
  surfaces; focused content, selector, route, formatter and flow tests; Phase 12 checklist, content
  schema and handoff.
- **Commands run:** Targeted Prettier; focused Vitest (8 files / 93 tests and 1 file / 7 tests);
  `npm run schema:export`; `npm run typecheck`; `npm run lint`; `npm run validate:content`;
  `npm run check`; serial `npm run test:e2e -- --workers=1` with the installed Playwright browser
  path; IDE diagnostics; `git diff --check`.
- **Result/verification:** P12-T07 is complete. The full quality gate passes 64 Vitest files / 438
  tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds
  production and passes all bundle budgets. The serial real-WebGL suite passes 18/18 on desktop
  and 375 px touch emulation; one intermediate run had a transient touch projected-lobe selection
  miss, and the immediate complete rerun passed. No commit was created, and the user's untracked
  `docs/reference docs/` was not touched.
- **Follow-ups:** Start P12-T08 whole-app W-series demo closure. Clinical/client sign-off and Phase
  9 physical-device gates remain external blockers.

### [2026-10-03 23:49] P12-T08 - Close whole-app demo gaps

- **Agent/session:** Cursor implementation session
- **Action:** Added functional keyboard-accessible weekly, monthly and all-time leaderboard views
  with strict optional historical snapshots, migration-safe fallbacks and live current-learner
  values. Added a pure weekly-criterion continuation resolver that skips completed and locked
  activities. Unified truthful XP, star, mastery and badge completion metrics across lesson,
  challenge and case results. Removed learner-facing placeholder and implementation copy, added a
  manifest-derived desktop route guard for primitive names/content IDs, resolved W01/W02 and
  recorded ADR-091.
- **Files changed:** App configuration and generated schema; leaderboard selectors/UI/tests;
  weekly challenge resolver/UI/tests; shared completion metrics and result tests; learner-facing
  route/content copy; Playwright terminology coverage; architecture/content contracts, Phase 12
  baseline/checklist, decisions, handoff and activity log.
- **Commands run:** Targeted Prettier; focused Vitest (7 files / 95 tests); `npm run typecheck`;
  `npm run lint`; `npm run validate:content`; `npm run schema:export`; focused desktop Playwright
  terminology audit; full `npm run check`; serial `npx playwright test --workers=1`; IDE
  diagnostics; `git diff --check`.
- **Result/verification:** P12-T08 is complete. The full quality gate passes 65 Vitest files / 447
  tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds
  production and passes all bundle budgets. The final browser suite passes 19 tests across desktop
  and touch-phone Chromium, with the intentionally desktop-only route audit skipped once on touch.
  An initial browser run exposed stale wording in a golden-path locator and an ambiguous loading
  selector; both tests were corrected. A later serial run had the documented transient touch
  projected-lobe miss, and the immediate complete rerun passed. No commit was created, and
  `docs/reference docs/` was not touched.
- **Follow-ups:** Start P12-T09 general offline Case Lab packages. Clinical/client sign-off and
  Phase 9 physical-device gates remain external blockers.

### [2026-10-04 00:10] P12-T09 - Add offline Case Lab packages

- **Agent/session:** Cursor implementation session
- **Action:** Generalized the existing verified offline package manager, persisted library and
  reconciliation flow from course-only records to kind-aware course/case records. Added pure case
  package derivation across the anatomy model, patient image, clue primitives and stage primitives,
  with hash-versioned model URLs, exact asset fingerprints, byte totals and deduplication. Enabled
  the lung GLB for optional offline use while retaining `offlineRequired: false` and its existing
  verified size/hash. Added shared Case Lab download controls, Learn ready status, accurate offline
  route gating and verified-cache precedence over the bounded model cache. Added update, eviction,
  shared-model and real service-worker offline playback coverage. Exported schemas, recorded
  ADR-092 and closed P12-T09; ADR-091 was already assigned to P12-T08.
- **Files changed:** Asset schema, manifest and hash pipeline; offline package, manager, store,
  readiness, reconciliation and controls; Case Lab Learn/intro/player surfaces; service-worker
  policy; unit/route/service-worker browser tests; refreshed browser evidence captures; generated
  asset schema; architecture, content schema, Phase 12 checklist, decisions and handoff.
- **Commands run:** Targeted Prettier; focused Vitest (5 files / 83 tests); repeated typecheck and
  lint; content validation; schema export; focused desktop Playwright service-worker suite; full
  `npm run check`; complete serial Playwright suite; IDE diagnostics; model byte/hash verification;
  `git diff --check`.
- **Result/verification:** Focused tests and both service-worker checks pass, including retained
  P11 prefetch coverage and downloaded-case playback with the model deliberately removed from the
  presentation cache before simulated-offline reload. Full `npm run check` passes 65 files / 453
  tests, validates 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds
  production and passes all budgets. The complete serial browser suite passes 20 tests with the two
  intentionally desktop-only checks skipped on touch-phone. The model remains 514,852 bytes with SHA-256
  `8884cefbb5be256af5dfd46b8d8071af677d4cf4ade8477e3311e2c09086766a`. No commit was created,
  and `docs/reference docs/` was not touched.
- **Follow-ups:** Start P12-T10 catalogue-wide accessibility, text-scaling, performance and
  resilience evidence. Clinical/client sign-off and Phase 9 physical-device gates remain external
  blockers.

### [2026-10-04 01:47] P12-T10 - Validate accessibility and resilience

- **Agent/session:** Cursor implementation session
- **Action:** Added shared Playwright axe-core, 200% root-text and keyboard-focus helpers; scanned
  all stable learner routes and every configured state of all four cases on desktop and touch-phone
  projects; and added keyboard-only quick-case completion. Added rolling median anatomy frame/FPS
  and renderer diagnostics under the development-only authoring readout. Added deterministic WebGL
  context loss/recovery, failed-model retry and mid-case stage/evidence resume checks. Fixed
  semantic list markup, loading landmarks, neutral text contrast, scaled-text wrapping and a real
  viewport pointer-capture defect that blocked Retry. Made Home eager to remove its initial layout
  shift, captured eight Lighthouse reports and recorded ADR-093.
- **Files changed:** Anatomy controller/viewer and tests; router, shared UI and affected learner
  surfaces; Playwright accessibility, text-scaling, keyboard and resilience coverage plus helpers;
  Lighthouse JSON evidence; Phase 12 QA report, architecture, decisions, checklist and handoff.
- **Commands run:** Focused Vitest and repeated focused resilience Playwright checks;
  `npm run check`; serial `npm run test:e2e -- --workers=1`; eight Lighthouse 13.5 mobile/desktop
  audits against production preview; IDE diagnostics; `git diff --check`.
- **Result/verification:** `npm run check` passes 65 files / 454 tests, validates 5 courses /
  13 lessons / 4 cases / 1 anatomy map with zero warnings, builds production and passes all bundle
  budgets. Full Playwright passes 40 tests with two intentional touch duplicate skips; all 20
  P12-T10 project-level tests pass. Axe-core completes 236 WCAG A/AA scans with zero violations.
  Lighthouse accessibility is 100 throughout; performance is Home 78/99, Learn 75/75, case intro
  76/95 and lesson 75/99 (mobile/desktop). No commit was created, and `docs/reference docs/` was
  not touched.
- **Follow-ups:** Home's simulated-mobile Lighthouse score remains below the 85 target because
  hydrated shared-runtime startup still drives 3.0 s FCP, 3.6 s LCP and 310 ms blocking time.
  Continue with P12-T11; clinical/client review and Phase 9 physical-device gates remain external.

### [2026-10-04 02:10] P12-T10 - Meet Home mobile performance target

- **Agent/session:** Cursor implementation continuation
- **Action:** Investigated the retained Lighthouse bootup and main-thread diagnostics, which
  attributed roughly 700 ms of simulated CPU time to initial script evaluation. Moved the unchanged
  runtime content fetch and full Zod/cross-reference/semantic validation pipeline into a module
  worker while preserving the blocking provider boundary, structured registry maps, typed eager
  error display, direct no-Worker fallback and service-worker precache/offline path. Deferred the
  celebration dialog/effects chunk until persisted state contains a pending celebration and made
  the browser celebration dismissal helper wait for that lazy boundary. Recorded ADR-094.
- **Files changed:** Runtime content worker, loader errors/runtime boundary and focused tests;
  ContentProvider and content error screen; deferred celebration host and both layouts; golden-path
  browser helper; Home Lighthouse JSON evidence; architecture, decisions, QA report and handoff.
- **Commands run:** Focused typecheck/Vitest and production builds; three unchanged-profile isolated
  Home mobile Lighthouse audits after the optimization; `npm run check`; focused desktop golden
  path; complete serial Playwright rerun; formatting, IDE diagnostics and `git diff --check`.
- **Result/verification:** Isolated Home mobile verification scored 85 and 86; retained evidence is
  a third 86 run with accessibility 100, 2.8 s FCP, 3.1 s LCP, 2.8 s Speed Index, 180 ms total
  blocking time and zero layout shift. `npm run check` passes 66 files / 456 tests, validates
  5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings, builds the worker and
  production app, and passes all bundle budgets.
- **Follow-ups:** Continue P12-T11. Physical-device and clinical/client approval gates remain
  external; no Lighthouse profile or threshold was changed.

### [2026-10-04 03:50] P12-T11 - Rehearse complete product demo

- **Agent/session:** Cursor implementation continuation
- **Action:** Added explicit production-preview breadth completion for the foundation, intermediate
  and quick cases while retaining the advanced golden path, with tier-specific assertions and
  separate Phase 12 state/results/comparison captures on desktop and touch-phone projects. Added
  split PRD section 80 product-tour coverage for Home, pathway, lesson knowledge/visual/DICOM,
  Imaging Lab slice/preset/region/calibrated measurement, completion rewards and badge, Daily
  Challenge, all Leaderboard periods and Profile. Added optional 30-second presenter pauses to the
  tour and golden path, rehearsed both viewports, wrote the unified superseding runbook and browser
  QA draft, and restored tracked Phase 11 images after verification.
- **Files changed:** `e2e/helpers/evidence.ts`, `e2e/helpers/case-driver.ts`,
  `e2e/case-breadth.spec.ts`, `e2e/product-tour.spec.ts`, `e2e/golden-path.spec.ts`;
  `docs/qa/evidence/phase-12/{desktop,375px}/` (42 PNGs);
  `docs/qa/phase-12-demo-runbook.md`, `docs/qa/phase-12-browser-qa-draft.md`, the Phase 12
  checklist, handoff and activity log.
- **Commands run:** Focused desktop and touch-phone Playwright debugging; focused cross-project
  breadth/tour run; 30-second-paced product and Case Lab rehearsals; targeted Prettier; full
  `npm run check`; complete `npx playwright test --workers=1`; IDE diagnostics and
  `git diff --check`.
- **Result/verification:** P12-T11 is complete. Focused breadth/tour coverage passed 10/10 in
  121.010 seconds. Scripted product rehearsal passed 4/4 in 541.245 seconds and measured 4:21.103
  desktop / 4:19.406 phone; scripted Case Lab passed 2/2 in 549.369 seconds and measured 4:33.565
  desktop / 4:18.624 phone. `npm run check` passed in 84.296 seconds with 66 files / 456 Vitest
  tests, zero content warnings, production build and all budgets. The complete serial browser suite
  passed 50 tests with two intentional project skips and zero failures in 424.094 seconds. No
  commit was created, `docs/reference docs/` was not touched and Phase 11 evidence was restored.
- **Follow-ups:** Finalize the browser QA and audience-specific readiness verdict in P12-T12.
  Clinical/client approvals and Phase 9 physical-device gates remain external blockers.

### [2026-10-04 04:15] P12-T12 - Close Phase 12

- **Agent/session:** Cursor implementation continuation
- **Action:** Finalized the Phase 12 browser QA and removed its draft; published audience-specific
  internal, supervised-client and unsupervised/external verdicts; reconciled all 12 assigned audit
  findings plus timeout and W01/W02; marked the phase and roadmap complete; updated PRD,
  architecture, content-schema and handoff snapshots; and audited ADR-083 through ADR-094 without
  renumbering accepted decisions. The final learner-copy sweep exposed `reversible-flow` as an
  authored phrase matching an internal option ID, so the foundation summary and expert note now
  use learner-facing bronchodilator-response/reversible-airflow wording.
- **Files changed:** Phase 12 browser QA/verdict and removed draft; Phase 10 audit and Phase 12
  baseline; Phase 12 checklist, roadmap, PRD, architecture, content schema, handoff and activity
  log; `public/content/cases/asthma-foundation.json`.
- **Commands run:** Final `npm run check`; attempted `npm run check:demo -- --workers=1`; focused
  serial learner-copy Playwright; final
  `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`;
  IDE diagnostics; ADR/stale-status searches; `git diff --check`; repository status/diff review.
  Schema export and asset hashing were not required because schema and asset metadata did not
  change.
- **Result/verification:** Final `npm run check` passed in 47.420 seconds: 66 Vitest files /
  456 tests in 19.10 seconds, 5 courses / 13 lessons / 4 cases / 1 anatomy map with zero warnings,
  successful production app/worker build and all budgets. Final serial Playwright ran 52 tests:
  50 passed, 2 intentional project skips and 0 failures in 6.9 minutes (415.861-second command wall
  time). The non-final nested-npm attempt did not forward `--workers`, ran two workers and exposed
  the copy leak; the focused correction passed 1 test with 1 intentional skip in 29.8 seconds
  before the complete serial pass. IDE diagnostics and `git diff --check` are clean. No commit was
  created; base remains `73d845f`, and `docs/reference docs/` was not touched.
- **Follow-ups:** Record clinical, anatomy/pathology and client/legal approvals; complete or waive
  P9-M01 through P9-M03; then commit and deploy one exact candidate through the runbook preflight.
  Unsupervised/external use remains No-go until those gates close.

### [2026-10-04 04:25] P12-T12 - Record committed candidate

- **Agent/session:** Cursor implementation session
- **Action:** Committed the Phase 12 closeout as `98d0d51` and refreshed final QA and handoff
  metadata to identify the committed candidate rather than the pre-commit worktree.
- **Files changed:** Final browser QA, handoff and activity log.
- **Commands run:** Phase 12 closeout commit; repository status and history review.
- **Result/verification:** All implementation and closeout changes are committed. The only
  remaining untracked path is the user's untouched `docs/reference docs/`.
- **Follow-ups:** External approvals, Phase 9 physical-device evidence and deployment preflight.

### [2026-10-04 12:23] P12-AUD - Reframe audit around trainee Case Lab UX

- **Agent/session:** Cursor product-audit session
- **Action:** Re-ran the advanced Case Lab from briefing through expert comparison and inspected
  the foundation flow on desktop and at 375 × 812 from a trainee-doctor perspective. Removed
  clinical-accuracy, medical-review, regulatory and visual-polish-only findings from the durable
  audit; added a phase-by-phase trainee journey and 21 UX-flow findings focused on purpose,
  interaction contracts, evidence use, differential reasoning, timing and debrief logic.
- **Files changed:** Cursor Canvas
  `client-demo-readiness-audit.canvas.tsx`; `docs/ACTIVITY_LOG.md`; `docs/HANDOFF.md`.
- **Commands run:** Production preview on `127.0.0.1:4192`; browser walkthroughs of Home, Learn,
  Challenge, foundation and advanced Case Lab; desktop and phone emulation; Canvas TypeScript
  diagnostics; IDE lint diagnostics; stale clinical-scope search.
- **Result/verification:** The advanced case completed at 86/100 with 100% Anatomy, 100% Diagnosis
  and only 1/5 clues reviewed, then reported all differential hypotheses as `Not rated`. The
  revised Canvas has no TypeScript or lint errors and no retained clinical/legal audit category.
- **Follow-ups:** Redesign the case around one explicit mission, keep task/evidence/action in one
  workspace, make evidence and differential behavior causally relevant, and repeat a
  bridge-disabled human walkthrough before a self-guided trainee demonstration.

### [2026-10-04 21:28] P13-T00 - Baseline and rescope Phase 13

- **Agent/session:** Cursor implementation session
- **Action:** Committed the post-Phase-12 trainee UX audit baseline, opened Phase 13, recorded the
  guided Case Lab principles in ADR-095 and mapped every active audit finding to a Phase 13 task.
  Corrected the durable audit by removing false H13 (42 screenshots do exist) and narrowing H08 to
  the single 95/85-minute Scientific Imaging mismatch.
- **Files changed:** `docs/phases/phase-13-client-demo-readiness.md`, `docs/ROADMAP.md`,
  `docs/DECISIONS.md`, `docs/qa/phase-13-ux-findings.md`, `docs/ACTIVITY_LOG.md`,
  `docs/HANDOFF.md`, and the external client-demo readiness Canvas.
- **Commands run:** Repository baseline/diff review; Canvas diagnostics; IDE diagnostics;
  `git diff --check`.
- **Result/verification:** Phase 13 is active with 17 tasks, an explicit human-usability exit gate
  and no clinical-accuracy scope. Audit baseline committed as `ec8f8ae`.
- **Follow-ups:** Execute P13-T01 immediate functional fixes.

### [2026-10-04 21:37] P13-T01 - Close immediate functional demo defects

- **Agent/session:** Cursor implementation session
- **Action:** Re-encoded the broken lesson SVGs and added fatal UTF-8 plus namespace-aware XML
  validation; made the DICOM tool/preset groups wrap; removed unavailable and contradictory reward
  rows; replaced internal comparison copy; environment-gated `/dev*`; converted the weekly sprint
  to three Case Lab completions; made pathway case nodes resolve to real cases; and corrected the
  Scientific Imaging duration.
- **Files changed:** SVG assets and manifest; content/app configuration; validation scripts;
  DICOM, reward, compare, router, gamification, challenge-destination and pathway runtime files;
  focused unit/E2E tests.
- **Commands run:** `npm run assets:hash`; `npm run validate:content`; `npm run typecheck`;
  focused Vitest run (9 files / 110 tests); IDE diagnostics.
- **Result/verification:** Content validation reports 5 courses, 13 lessons, 4 cases and zero
  warnings. TypeScript and all 110 focused tests pass. Invalid UTF-8 and malformed SVG fixtures are
  rejected.
- **Follow-ups:** Implement and export the Case 0.2 contract in P13-T02.

### [2026-10-04 21:40] P13-T02 - Add the Case 0.2 mission and narrative contract

- **Agent/session:** Cursor implementation session
- **Action:** Upgraded the strict case schema to 0.2 with mission, stage purpose/update and finding
  significance; added duration, scored-evidence and numeric answer-leak semantic rules; migrated
  all four cases and fixtures; removed advanced-task numeric leakage; exported JSON Schema and
  recorded ADR-096.
- **Files changed:** Case schema/loader/tests; four case documents and three fixtures;
  `schemas/case.schema.json`; `docs/CONTENT_SCHEMA.md`; `docs/DECISIONS.md`; phase QA/governance
  docs.
- **Commands run:** `npm run schema:export`; `npm run typecheck`; `npm run validate:content`;
  focused Vitest (2 files / 68 tests); IDE diagnostics.
- **Result/verification:** TypeScript passes. Content validates 5 courses, 13 lessons, 4 Case 0.2
  documents and one anatomy map with zero warnings. The duration, decisive-clue and numeric-leak
  tests pass.
- **Follow-ups:** Render the mission and patient updates through the continuous-stage experience in
  P13-T03.

### [2026-10-04 21:55] P13-T03 - Guide the learner through a continuous case

- **Agent/session:** Cursor implementation session
- **Action:** Rendered mission and operating-rule briefings; added the learner-scoped four-step
  coach walkthrough and replay affordance; migrated learner state to v8; replaced blocking stage
  dialogs with focus-managed inline banners; simplified stage progress; and paused timing behind
  instructional overlays.
- **Files changed:** Case intro/player/chrome/walkthrough components and tests; learner store,
  fixtures and E2E helpers; app configuration/schema; Case 0.2 documents; content/governance docs.
- **Commands run:** `npm run test` (71 files / 481 tests); `npm run lint`; IDE diagnostics.
- **Result/verification:** Full unit suite and lint pass. Stage changes no longer require a
  learner acknowledgement, and the walkthrough appears once for fresh learner state and can be
  replayed from the case header.
- **Follow-ups:** Build the unified task/evidence/notes workspace and shared primary-action slot in
  P13-T04.

### [2026-10-04 22:06] P13-T04 - Unify the active case workspace

- **Agent/session:** Cursor implementation session
- **Action:** Replaced the fixed clue rail and mobile sheets in active cases with an in-flow
  two-column desktop workspace and controlled Task/Evidence/Notes mobile segments. Added the
  shared sticky `StepActionSlot`, applied it to case assessment actions, reset the mobile segment
  on task boundaries and directed opened evidence to the evidence segment.
- **Files changed:** `CaseWorkspace`, `StepFrame`, `ActivityPlayer`, `CasePlayer`, `ClueBoard`,
  assessment/anatomy/DICOM/scenario primitives and focused tests; Phase 13 tracking docs.
- **Commands run:** `npm run typecheck`; focused Vitest (7 files / 83 tests, then workspace/player
  integration 2 files / 13 tests); full Vitest (72 files / 483 tests); `npm run lint`; IDE
  diagnostics.
- **Result/verification:** TypeScript, lint and all unit tests pass. Desktop evidence remains
  scrollable in document flow, while mobile task, evidence and notes share one non-modal workspace.
- **Follow-ups:** Complete current/earlier-stage evidence scoping and clue decision semantics in
  P13-T05.

### [2026-10-04 22:11] P13-T05 - Make clue decisions explicit

- **Agent/session:** Cursor implementation session
- **Action:** Added pre-open clue status, exact cost and current-question relevance; made the
  optional-clue confirmation occur once per case run; collapsed clue progress into one clear
  reviewed/available count; and limited notes to clues unlocked in the current or prior stages and
  findings the learner inspected. Hypothesis explanations remain hidden until completion.
- **Files changed:** `CasePlayer`, `ClueBoard`, `CaseNotes` and focused tests; Phase 13 tracking
  docs.
- **Commands run:** `npm run typecheck`; focused Vitest (3 files / 17 tests); `npm run lint`.
- **Result/verification:** TypeScript and lint pass. Focused tests pass after aligning the
  progressive evidence expectation with current-and-earlier-stage visibility.
- **Follow-ups:** Make evidence selection and differential revision required scored checkpoints in
  P13-T06.

### [2026-10-04 22:34] P13-T06 - Require differential revision and evidence citation

- **Agent/session:** Cursor implementation session
- **Action:** Added context-aware differential and evidence-citation primitives; required
  differential checkpoints at the end of Observe and Interpret and a scored evidence citation
  before full-case conclusions; persisted checkpoint history in session v6 and case result v8;
  migrated all case content and the experienced seed; and recorded ADR-098.
- **Files changed:** Primitive schemas, definitions, components and registries; case player,
  session/result state, events and tests; four case documents and the experienced seed; Phase 13
  governance docs.
- **Commands run:** `npm run validate:content`; `npm run typecheck`; focused Vitest for content,
  primitive, player, showcase and end-to-end case-flow suites.
- **Result/verification:** Content validates 5 courses, 13 lessons, 4 cases and one anatomy map
  with zero warnings. TypeScript passes and the affected content/case-flow suites pass. The
  foundation benchmark now inspects every finding it cites.
- **Follow-ups:** Improve the anatomy interaction contract in P13-T07.

### [2026-10-04 22:44] P13-T07 - Clarify anatomy interaction and commitment

- **Agent/session:** Cursor implementation session
- **Action:** Reworked the anatomy viewer into a desktop viewport/control split and capped mobile
  viewport; added a learner-persisted dismissible interaction hint, visible waypoint-arrival
  feedback and finding cards that separate observation from significance; rewrote case exploration
  prompts as objectives; and renamed the scored action to “Commit your localisation.”
- **Files changed:** Anatomy viewer and tests; localisation primitive and route/E2E drivers;
  learner schema, store, seeds and exported schema; four case documents and content docs.
- **Commands run:** `npm run schema:export`; `npm run typecheck`; `npm run validate:content`;
  focused Vitest (5 files / 52 tests); `npm run lint`.
- **Result/verification:** TypeScript, lint, content validation and all focused anatomy, state and
  case-flow tests pass. Desktop controls are adjacent to the viewport and the mobile viewport is
  capped at 45svh.
- **Follow-ups:** Spike and implement seeded unknown-waypoint reconstruction in P13-T08.

### [2026-10-04 23:02] P13-T08 - Reconstruct an unknown anatomy entry

- **Agent/session:** Cursor implementation session
- **Action:** Added seeded unknown-waypoint case entry, persisted the attempt seed in session v6,
  resolved localisation answers from waypoint-authored mappings, concealed anatomical location
  labels until commitment and supplied neutral branch navigation. Migrated the advanced case,
  added semantic validation and recorded ADR-099.
- **Files changed:** Case, anatomy-map and localisation schemas; case planning/player/session
  engines; anatomy viewer and primitive adapters; lung map and advanced case content; generated
  schemas, tests, E2E driver and Phase 13 governance docs.
- **Commands run:** `npm run schema:export`; `npm run typecheck`; `npm run validate:content`;
  focused Vitest (3 files / 28 tests); `git diff --check`.
- **Result/verification:** TypeScript and patch checks pass. Content validates 5 courses, 13
  lessons, 4 cases and one anatomy map with zero warnings. Focused plan, viewer and complete
  case-flow tests pass, including deterministic selection and seed persistence.
- **Follow-ups:** Add the patient timeline, tier-specific timing semantics and first-attempt
  commitment notice in P13-T09.

### [2026-10-04 23:06] P13-T09 - Connect narrative, timing and commitment

- **Agent/session:** Cursor implementation session
- **Action:** Added a collapsible patient strip that progressively reveals authored timeline
  updates; changed Foundation to a static “Untimed practice” indicator; explained stopwatch and
  countdown scoring, including clue-review time; and placed a one-time first-answer scoring notice
  immediately above the first scored task.
- **Files changed:** `PatientTimeline`, `CasePlayer`, `CaseWorkspace`, `StepFrame`,
  `ActivityPlayer`, case intro timing copy and focused tests; Phase 13 tracking docs.
- **Commands run:** `npm run typecheck`; focused Vitest (4 files / 25 tests); IDE diagnostics.
- **Result/verification:** TypeScript and focused tests pass with no diagnostics. Foundation has no
  ticking timer, later tiers explain their clock, future patient updates remain concealed, and the
  commitment notice disappears after the first scored submission.
- **Follow-ups:** Redesign the result and model-answer debrief in P13-T10.

### [2026-10-04 23:15] P13-T10 - Prioritize the Case Lab debrief

- **Agent/session:** Cursor implementation session
- **Action:** Rebuilt results around one outcome, one deterministic takeaway and one recommended
  action; collapsed supporting score detail; renamed and explicitly framed the authored benchmark
  as a Model answer; and added checkpoint-by-checkpoint differential evolution. Added the
  first-incomplete-tier selector used by result recommendations.
- **Files changed:** Case benchmark schema and all case/fixture documents; results, comparison and
  saved-attempt route; selectors and focused tests; generated case schema and Phase 13 docs.
- **Commands run:** `npm run schema:export`; `npm run typecheck`; focused Vitest (5 files / 33
  tests); IDE diagnostics.
- **Result/verification:** Schema export and TypeScript pass. Focused result, comparison, route,
  selector and player tests pass. Takeaway priority is unreviewed decisive evidence, then the first
  missed scored task, then the first Model answer path highlight.
- **Follow-ups:** Use the recommendation selector on Home and build the Case Lab hub in P13-T11.

### [2026-10-04 23:25] P13-T11 - Make Case Lab navigation self-explanatory

- **Agent/session:** Cursor implementation session
- **Action:** Switched Home to the first incomplete non-daily case, added the `/learn/cases` tier
  ladder with Start here and Recommended next cues, routed all-case navigation to it, and added
  configured definitions for Pathway, Course, Case Lab and Daily challenge. Standardized Case Lab
  labels to Clues, Spatial findings, Case notes and Conclude; recorded ADR-100.
- **Files changed:** App-config and schema; Home, Learn, Challenge, Case Lab hub and learning-surface
  guide; case workspace, walkthrough, notes and anatomy viewer copy; selectors, route/E2E tests,
  generated schema and Phase 13 governance docs.
- **Commands run:** `npm run schema:export`; `npm run typecheck`; `npm run validate:content`;
  focused Vitest (5 files / 90 tests); `npm run lint`; IDE diagnostics.
- **Result/verification:** Configuration, TypeScript, lint and focused tests pass. Home defaults to
  Foundation for a fresh learner, all cases have a dedicated tiered route and deprecated
  standalone Case Lab labels are covered by the learner-copy sweep.
- **Follow-ups:** Add client-safe fresh and experienced demo profiles in P13-T12.

### [2026-10-04 23:34] P13-T12 - Add deterministic client demo profiles

- **Agent/session:** Cursor implementation session
- **Action:** Made the zero-history Alex Morgan trainee seed the client-build default; retained
  Maya Chen as an experienced respiratory medicine trainee; added validated demo-profile
  configuration and Profile presenter controls for switching and resetting local state; and
  relabelled the seeded leaderboard as “Sample cohort.” Recorded ADR-101.
- **Files changed:** App config, manifest and learner seeds; content schema, semantic loader and
  generated app-config schema; Profile route, route/content fixtures and tests; Phase 13
  governance docs.
- **Commands run:** Focused Vitest (18 tests); `npm run typecheck`; `npm run lint`;
  `npm run validate:content`; IDE diagnostics.
- **Result/verification:** All focused tests, TypeScript and lint pass. Content validates 5
  courses, 13 lessons, 4 cases and one anatomy map with zero warnings. Enabled demo configuration
  now guarantees a real manifest seed and the default first-use experience starts at Foundation.
- **Follow-ups:** Add or explicitly defer the simulated challenge and segmented leaderboard
  previews in P13-T13.

### [2026-10-04 23:45] P13-T13 - Add explicitly simulated concept previews

- **Agent/session:** Cursor implementation session
- **Action:** Added a configured recorded-opponent case challenge that enters the normal Case Lab
  and reuses its comparison view as a head-to-head result. Added country, specialty and
  institution filters over seeded ranking rows. Both surfaces now carry a visible “Simulated
  data” label and the challenge states that no live learner or multiplayer service is connected.
- **Files changed:** Challenge and leaderboard configuration/schema; content validation and
  generated schema; challenge, player, comparison and leaderboard routes; content, route,
  comparison and complete case-flow tests; content schema and Phase 13 tracking docs.
- **Commands run:** `npm run schema:export`; `npm run typecheck`; `npm run lint`;
  `npm run validate:content`; focused Vitest including 7 complete Case Lab flows.
- **Result/verification:** The recorded attempt is bounds-checked against its case clue catalogue,
  completion opens the head-to-head comparison, all three ranking filters operate over configured
  fields, and the focused suites pass.
- **Follow-ups:** Expand browser, viewport and visual-regression coverage in P13-T14.

### [2026-10-05 02:22] P13-T14 - Prove the guided Case Lab regression boundary

- **Agent/session:** Cursor implementation session
- **Action:** Updated unit and browser coverage for the continuous Case Lab flow; added direct
  ClueBoard, CaseNotes and StageBanner tests; added a visible-control Advanced-case path that does
  not use the anatomy bridge or known coordinates; asserted prompt/action co-visibility at both
  target viewports; and committed eight desktop visual baselines. Fixed mobile text overflow and
  anchored the case action above bottom navigation after the viewport checks exposed a tall-step
  failure. Recorded ADR-102.
- **Files changed:** Case/player/route tests; Playwright case driver and affected suites; Phase 13
  browser spec and snapshots; responsive shell, PWA host and action-slot styles; architecture,
  findings and decision docs.
- **Commands run:** Focused touch-phone golden path; `npm run check`; serial
  `npx playwright test --workers=1`; `git diff --check`; IDE diagnostics.
- **Result/verification:** `npm run check` passes: TypeScript, lint, 73 Vitest files / 500 tests,
  content validation, production build and bundle budgets. Serial Playwright passes with 53
  passed, three intentional project skips and zero failures in 9.8 minutes. Both Phase 13
  acceptance paths and all eight desktop image assertions pass.
- **Follow-ups:** Run the five human sessions in P13-T15 against a frozen candidate.

### [2026-10-05 02:24] P13-T15 - Prepare moderated usability validation

- **Agent/session:** Cursor implementation session
- **Action:** Published the moderator protocol, role mix, observation fields, standard SUS
  questionnaire, thresholds, severity model and participant-safe results record. Ran one internal
  moderator dry run only; it is explicitly excluded from participant outcomes.
- **Files changed:** `docs/qa/phase-13-usability-protocol.md`;
  `docs/qa/phase-13-usability-results.md`.
- **Commands run:** Documentation review against the Phase 13 acceptance criteria.
- **Result/verification:** The protocol and results template are ready. P13-T15 remains blocked:
  zero of five qualifying human sessions have run, so no usability threshold can be claimed.
- **Follow-ups:** Schedule at least three clinicians/trainees and two IT proxies, record P01–P05,
  then fix and retest any failed threshold.

### [2026-10-05 02:25] P13-T16 - Prepare delivery package and record external blockers

- **Agent/session:** Cursor implementation session
- **Action:** Rewrote the client-demo runbook with a freeze/preflight sequence, ten-minute
  presenter script, attendee handout, recovery steps and device boundary. Published a no-go
  external-readiness verdict and updated product, architecture, schema, roadmap and handoff
  records without representing emulation as physical-device evidence.
- **Files changed:** Phase 13 runbook and readiness verdict; `PRD.md`; `docs/ARCHITECTURE.md`;
  `docs/CONTENT_SCHEMA.md`; `docs/ROADMAP.md`; Phase 13 tracking and handoff docs.
- **Commands run:** Documentation and evidence review.
- **Result/verification:** The local engineering candidate passes, but P13-T16 remains blocked.
  No HTTPS application/DICOM origins, Android device, iPhone or approved desktop-only waiver were
  provided. The external client-demo verdict remains No-go.
- **Follow-ups:** Deploy one frozen build and run hosted preflight; then run both physical-device
  scripts or obtain an authorized desktop-only-demo waiver.

### [2026-10-05 10:12] P13-T15/P13-T16 - Confirm external gates remain blocked

- **Agent/session:** Cursor implementation session
- **Action:** Presented the three outstanding evidence decisions. The user chose to leave the five
  human sessions, hosted HTTPS/DICOM preflight and physical-device validation blocked and did not
  authorize a desktop-only-demo waiver. Recorded ADR-103 and retained the No-go verdict.
- **Files changed:** Phase 13 phase, usability results, readiness verdict, decisions, handoff and
  activity log.
- **Commands run:** User questionnaire; documentation consistency review.
- **Result/verification:** P13-T00 through P13-T14 remain complete. P13-T15 and P13-T16 remain open
  by explicit user decision; no external readiness claim or fabricated evidence was added.
- **Follow-ups:** Reopen the applicable gate only when participants, hosting details, device
  evidence or a future waiver decision are available.

### [2026-10-05 11:18] P13-DOC - Reconcile product documentation and add human starting guide

- **Agent/session:** Cursor documentation session
- **Action:** Added a root human-first guide explaining the implemented product, local setup,
  representative manual walkthrough, automated checks, readiness boundary and route into deeper
  documentation. Added a dated current-state addendum to the original PRD and reconciled roadmap,
  architecture, content-schema, Phase 13, QA, handoff and agent read-order details with the shipped
  guided Case Lab.
- **Files changed:** `README.md`; `AGENTS.md`; `PRD.md`; `docs/PRD-ANALYSIS.md`;
  `docs/ROADMAP.md`; `docs/ARCHITECTURE.md`; `docs/CONTENT_SCHEMA.md`; `docs/DECISIONS.md`;
  `docs/HANDOFF.md`; `docs/phases/phase-13-client-demo-readiness.md`;
  `docs/qa/phase-13-demo-runbook.md`; `docs/qa/phase-13-demo-readiness-verdict.md`;
  `docs/qa/phase-13-ux-findings.md`.
- **Commands run:** Documentation searches; targeted Prettier check; `npx prettier --write
README.md`; `git diff --check`.
- **Result/verification:** The original PRD and historical records remain intact, while current
  implementation counts, learner-state/session/result versions, primitive coverage, mobile
  workspace terminology and external No-go boundary are now explicit. No runtime source or content
  changed, so application tests were not rerun.
- **Follow-ups:** Update `README.md` whenever the primary learner flow, setup commands, verification
  baseline or approval boundary changes.

### [2026-10-07 03:00] P14-PLAN - Plan the Medical Challenge programme (Phases 14–20)

- **Agent/session:** Cursor planning session
- **Action:** Read the documentation set and the relevant runtime code, then planned the revised
  demo in `newDemoPRD.md` as seven phases. The plan adds a build-time `sanofi` experience beside the
  unchanged default (selected by `VITE_EXPERIENCE`, launched by `dev:default` / `dev:sanofi`, with
  no duplicated shared code) and a reusable game engine of timed, scored, shareable rounds built on
  existing primitives, the anatomy viewer and the event pipeline. Documentation only; no Cursor plan
  files were written.
- **Files changed:** `docs/MEDICAL_CHALLENGE_PLAN.md`;
  `docs/phases/phase-14-multi-experience-foundation.md`;
  `docs/phases/phase-15-game-contract-and-engine.md`;
  `docs/phases/phase-16-game-player-and-clinical-round.md`;
  `docs/phases/phase-17-spatial-rounds.md`;
  `docs/phases/phase-18-spot-the-finding-and-full-challenge.md`;
  `docs/phases/phase-19-game-hub-results-and-social.md`;
  `docs/phases/phase-20-demo-polish-and-readiness.md`; `docs/ROADMAP.md`; `docs/DECISIONS.md`
  (ADR-105 and ADR-106, both Proposed); `docs/HANDOFF.md`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Documentation and source searches; `git status --short`.
- **Result/verification:** No runtime source, content, schema or configuration changed, so
  application checks were not run. Phase 13 remains Active with its external gates unchanged.
  Nothing was committed.
- **Follow-ups:** User review of the plan and the seven open questions in
  `docs/MEDICAL_CHALLENGE_PLAN.md` §11; then start Phase 14 at P14-T00 (capture the default
  baseline and confirm ADR-105).

### [2026-10-07 04:07] P14-T00 - Freeze the default-experience baseline

- **Agent/session:** Cursor implementation session
- **Action:** Committed the Phase 14–20 programme documentation, recorded all seven user decisions,
  accepted ADR-105, split regression/documentation/cleanup into P14-T10 through P14-T12, captured
  the pre-refactor default build and browser baseline, and added route, shell, persistence and
  built-metadata characterization gates.
- **Files changed:** `docs/MEDICAL_CHALLENGE_PLAN.md`; `docs/DECISIONS.md`;
  `docs/phases/phase-14-multi-experience-foundation.md`;
  `docs/qa/phase-14-default-baseline.md`; `src/app/router.characterization.test.tsx`;
  `src/app/__snapshots__/router.characterization.test.tsx.snap`;
  `src/state/persistence/defaultStorageContract.ts`;
  `src/state/persistence/storageKeys.characterization.test.ts`;
  `scripts/experiences/default-build-baseline.json`;
  `scripts/experiences/verify-default-build.ts`; `package.json`.
- **Commands run:** `npm run check`; serial Playwright with one worker; focused Vitest with snapshot
  update; `npm run verify:default-build`; `npm run typecheck`; `npm run lint`; `git diff --check`.
- **Result/verification:** Baseline passed: 73 Vitest files / 500 tests, 5 courses / 13 lessons /
  4 cases / 1 anatomy map / zero warnings, 53 Playwright passes / 3 intentional skips, eight
  unchanged golden images, 171 precache entries and all bundle budgets. Evidence screenshot churn
  was restored. ADR-105 is Accepted.
- **Follow-ups:** Implement P14-T01 experience IDs, resolution and build metadata.

### [2026-10-07 04:10] P14-T01 - Add experience contracts and resolution

- **Agent/session:** Cursor implementation session
- **Action:** Added the closed experience ID set, fail-fast resolver, active experience and
  namespace helpers, shared shell contract/default copy, typed runtime/build contracts and pure
  build metadata for `default` and `sanofi`.
- **Files changed:** `src/lib/experienceIds.ts`; `src/lib/experience.ts`;
  `src/lib/experience.test.ts`; `src/experiences/types.ts`; `src/experiences/builds.ts`;
  `src/experiences/default/build.ts`; `src/experiences/sanofi/build.ts`;
  `src/app/experienceShell.ts`; `src/components/navigation/primaryNavigation.ts`;
  `src/vite-env.d.ts`; `tsconfig.sw.json`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`; `npm run lint`; focused Vitest for experience,
  router-characterization and persistence-characterization tests.
- **Result/verification:** TypeScript and ESLint pass; 3 files / 12 tests pass. Unknown IDs and
  experience-mode conflicts fail with actionable messages; default namespace helpers preserve
  every legacy name.
- **Follow-ups:** Wire build metadata into Vite, TypeScript, scripts and committed mode files.

### [2026-10-07 04:15] P14-T02 - Wire experience-aware builds and commands

- **Agent/session:** Cursor implementation session
- **Action:** Connected the experience resolver to Vite, HTML/PWA metadata, ports, output/temp
  directories and static `@experience` alias; added committed mode files, cross-platform npm
  commands, TypeScript/Vitest aliases, experience-aware build hashing and output ignores.
- **Files changed:** `vite.config.ts`; `vitest.config.ts`; `tsconfig.app.json`; `tsconfig.json`;
  `scripts/build/build-id.ts`; `src/experiences/builds.ts`; `.env.default`; `.env.sanofi`;
  `.env.example`; `.gitignore`; `.prettierignore`; `eslint.config.js`; `package.json`;
  `public/experiences/sanofi/content/.gitkeep`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run typecheck`; `npm run lint`; focused resolver/build-id Vitest;
  `npm run dev`; `npm run dev:default`; `npm run dev:sanofi`; concurrent HTTP metadata checks;
  deliberate conflicting-mode and unknown-ID starts.
- **Result/verification:** Legacy `dev` and `dev:default` serve default on 5173; sanofi serves
  transformed HTML on 5174 concurrently. Unknown IDs and a process-env/mode conflict fail before
  startup with actionable messages. All temporary servers were stopped.
- **Follow-ups:** Move the default route table behind the static alias and make the composition
  root experience-aware.

### [2026-10-07 04:18] P14-T03 - Add the experience composition root

- **Agent/session:** Cursor implementation session
- **Action:** Moved the default route table verbatim into the default experience, retained the
  `createAppRoutes` compatibility export, added an experience router factory and shared lazy-page
  boundary, and made `App` provide the active shell, content root and neutral copy contracts.
- **Files changed:** `src/app/App.tsx`; `src/app/ContentProvider.tsx`;
  `src/app/lazyPage.tsx`; `src/app/router.tsx`; `src/app/experienceShell.ts`;
  `src/experiences/default/index.ts`; `src/experiences/default/routes.tsx`;
  `src/components/feedback/ErrorBoundary.tsx`; `src/components/feedback/ContentErrorScreen.tsx`;
  `src/state/LearnerStateProvider.tsx`; `eslint.config.js`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier on touched sources; `npm run typecheck`; `npm run lint`; focused
  router and router-characterization Vitest.
- **Result/verification:** TypeScript and ESLint pass; 2 files / 14 tests pass. The frozen
  production/development route tree and exact default shell snapshot are unchanged.
- **Follow-ups:** Parameterize shared navigation, status, PWA prompts, not-found copy and build
  stamp through the shell context.

### [2026-10-07 04:20] P14-T04 - Parameterize the shared application shell

- **Agent/session:** Cursor implementation session
- **Action:** Routed navigation, learner-status mode, install-prompt policy, update/not-found copy
  and the non-default build label through the shared shell context. Bottom navigation now derives
  its grid from configured item count and is omitted for a one-item shell.
- **Files changed:** `src/layouts/AppShell.tsx`;
  `src/components/navigation/PageHeader.tsx`; `src/components/navigation/BuildStamp.tsx`;
  `src/components/pwa/PwaPromptHost.tsx`; `src/routes/NotFoundPage.tsx`;
  `src/app/experienceShell.test.tsx`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; `npm run typecheck`; `npm run lint`; focused shell/router Vitest.
- **Result/verification:** TypeScript and ESLint pass; 3 files / 15 tests pass. The default shell
  snapshot remains unchanged. A one-item game shell renders one desktop navigation, no bottom
  navigation and no learner XP/streak status.
- **Follow-ups:** Relax content contracts only where the non-LMS experience requires it and retain
  semantic LMS validation.

### [2026-10-07 04:24] P14-T05 - Support non-LMS experience content

- **Agent/session:** Cursor implementation session
- **Action:** Passed the configured content base URL through runtime loading; defaulted empty
  non-LMS collections; allowed only the selected seed path; added strict optional `games.hub`
  copy; replaced former structural minimums with semantic requirements when courses exist; and
  guarded default-only advanced-seed consumers.
- **Files changed:** `src/content/schema/index.ts`; `src/content/loader.ts`;
  `src/content/content.test.ts`; `src/routes/profile/ProfilePage.tsx`;
  `scripts/validate-content.ts`; `e2e/learner-copy.spec.ts`;
  `schemas/app-config.schema.json`; `schemas/content-manifest.schema.json`;
  `docs/CONTENT_SCHEMA.md`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; focused content/router Vitest; `npm run schema:export`;
  `npm run check`; `npm run verify:default-build`.
- **Result/verification:** Full gate passed in 60.323 seconds: TypeScript/ESLint, 77 files /
  516 tests, unchanged default content counts and zero warnings, production build and budgets.
  Default manifest, normalized HTML and precache isolation still match the baseline.
- **Follow-ups:** Scope persistence, browser keys, runtime caches and service-worker settings for
  non-default experiences without changing default names.

### [2026-10-07 04:27] P14-T06 - Namespace non-default persistence and caches

- **Agent/session:** Cursor implementation session
- **Action:** Applied the active experience to IndexedDB prefixes, preferences, simulated-offline
  and pathway browser keys, runtime cache names, Workbox cache details and the service-worker
  settings database. Default helpers still return every legacy literal.
- **Files changed:** `src/state/persistence/idbStorage.ts`; `src/state/preferences.ts`;
  `src/pwa/cachePolicy.ts`; `src/routes/learn/PathwayPage.tsx`; `src/sw.ts`;
  `src/lib/experience.ts`; `tsconfig.sw.json`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; `npm run typecheck`; `npm run lint`; focused experience,
  persistence, learner migration and model-cache Vitest; `npm run build`;
  `npm run verify:default-build`.
- **Result/verification:** TypeScript and ESLint pass; 4 files / 22 tests pass. Default production
  metadata and precache isolation match the frozen baseline. Pure helper tests prove sanofi keys
  use `axiom-runtime:sanofi:`, sanofi runtime caches use a `sanofi-` prefix and its settings
  database is `axiom-runtime-sanofi-service-worker`.
- **Follow-ups:** Add the scoped sanofi token override and enforce experience import boundaries.

### [2026-10-07 04:29] P14-T07 - Add scoped theme and import boundaries

- **Agent/session:** Cursor implementation session
- **Action:** Added a sanofi-scoped teal brand-token override and ESLint boundaries that prevent
  shared modules from importing experience composition and prevent either experience importing
  the other, while retaining the existing Three.js restriction.
- **Files changed:** `src/experiences/sanofi/theme.css`; `eslint.config.js`;
  `scripts/lint/experienceBoundaries.test.ts`; `src/lib/experience.test.ts`;
  `src/experiences/builds.test.ts`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; `npm run typecheck`; `npm run lint`; focused boundary, build-metadata
  and route-characterization Vitest.
- **Result/verification:** TypeScript and ESLint pass; 3 files / 7 tests pass. Programmatic ESLint
  tests exercise both forbidden directions and allowed composition/shared imports.
- **Follow-ups:** Author the minimal sanofi content root, stub hub, routes and definition.

### [2026-10-07 04:33] P14-T08 - Add the sanofi stub experience

- **Agent/session:** Cursor implementation session
- **Action:** Added a complete minimal sanofi content root and anonymous "You" seed, an eager
  one-route game hub, neutral shell copy, the configured Autovrse LevelUp / Respiratory Challenge
  names and the static sanofi experience definition with its scoped theme.
- **Files changed:** `public/experiences/sanofi/content/manifest.json`;
  `public/experiences/sanofi/content/app-config.json`;
  `public/experiences/sanofi/content/assets.json`;
  `public/experiences/sanofi/content/seeds/fresh.json`;
  `src/experiences/sanofi/HomePage.tsx`; `src/experiences/sanofi/routes.tsx`;
  `src/experiences/sanofi/shell.ts`; `src/experiences/sanofi/index.ts`;
  `src/experiences/sanofi/sanofi.test.tsx`; `src/experiences/sanofi/build.ts`;
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; `npm run typecheck`; `npm run lint`; focused sanofi/shell Vitest;
  `npm run build:sanofi`; built manifest, HTML and service-worker inspection.
- **Result/verification:** Sanofi content validates in unit coverage; its 3 stub tests and shared
  shell test pass. The production artifact has its own HTML metadata, PWA manifest, teal token
  override and namespaced service-worker/cache strings. The content and shell copy contain no
  client name or prohibited LMS vocabulary.
- **Follow-ups:** Make validation, bundle budgets and Playwright run both experiences, then add
  browser smoke coverage.

### [2026-10-07 04:39] P14-T09 - Add dual-experience tooling and browser smoke

- **Agent/session:** Cursor implementation session
- **Action:** Made content validation iterate both experience roots; parameterized the bundle
  budget checker and added a measured sanofi entry budget; expanded `check` to build and budget
  both artifacts; pinned the default Playwright server to default mode; and added a sanofi
  desktop/phone smoke suite on port 4182.
- **Files changed:** `scripts/validate-content.ts`; `scripts/budget/check-bundle.ts`;
  `scripts/budget/bundle-budget.sanofi.json`; `package.json`; `playwright.config.ts`;
  `playwright.sanofi.config.ts`; `tsconfig.e2e.json`; `e2e/sanofi/smoke.spec.ts`;
  `src/components/navigation/BuildStamp.tsx`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; `npm run typecheck`; `npm run lint`; `npm run validate:content`;
  focused Vitest; `npm run budget:sanofi`; `npm run check`; serial sanofi Playwright.
- **Result/verification:** The dual gate passes with 80 Vitest files / 522 tests, both content roots
  at zero warnings, both builds and budgets passing. Sanofi entry is 268,431 raw / 84,055 gzip
  bytes against 300,000 / 95,000 limits. Sanofi Playwright passes 2/2 projects with metadata,
  storage isolation, vocabulary, overflow, axe and not-found checks. Service workers are allowed in
  this suite so registration is exercised instead of producing Playwright's blocked-worker error.
- **Follow-ups:** Run the final full default and sanofi regression proof and publish the comparison
  against P14-T00.

### [2026-10-07 04:59] P14-T10 - Prove the default regression contract

- **Agent/session:** Cursor implementation session
- **Action:** Ran the final dual gate, serial default browser suite and sanofi smoke suite; compared
  every frozen default condition; performed desktop/phone sanofi browser QA and a default Home
  spot-check; removed an internal experience ID from player-visible development copy; and
  published the regression record.
- **Files changed:** `docs/qa/phase-14-default-regression.md`;
  `src/components/navigation/BuildStamp.tsx`; `src/lib/experience.ts`;
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** `npm run check`; serial default Playwright; serial sanofi Playwright;
  `npm run typecheck`; `npm run lint`; concurrent default/sanofi dev servers; IDE browser desktop
  1440 × 900 and touch-phone 375 × 812 inspection.
- **Result/verification:** Final gate passed in 100.848 seconds with 80 files / 522 tests, both
  content roots at zero warnings and both budgets passing. Default Playwright passed 53 / skipped
  3 intentionally in 10.0 minutes; all eight golden images passed without update. Sanofi passed
  both projects. Browser QA found no horizontal overflow or console/resource errors, and default
  Home retained the original five-item shell and configured content.
- **Follow-ups:** Close Phase 14 documentation, then stop processes and restore browser/evidence
  churn.

### [2026-10-07 05:23] P14-T11 - Close Phase 14 documentation

- **Agent/session:** Cursor implementation session
- **Action:** Marked Phase 14 and its roadmap row complete; documented experience commands,
  architecture, content-root/schema semantics, accepted ADR-105 and the player-copy deviation;
  and replaced the handoff with the Phase 15 starting state while preserving Phase 13 blockers.
- **Files changed:** `docs/phases/phase-14-multi-experience-foundation.md`;
  `docs/ROADMAP.md`; `README.md`; `AGENTS.md`; `docs/ARCHITECTURE.md`;
  `docs/CONTENT_SCHEMA.md`; `docs/HANDOFF.md`; `docs/qa/phase-14-default-regression.md`;
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier/document formatting; `git diff --check`; documentation searches for
  stale status, command and decision references.
- **Result/verification:** Phase 14 is recorded complete with 80 Vitest files / 522 tests, default
  Playwright 53 passes / 3 intentional skips, sanofi 2 passes, both budgets and zero content
  warnings. The approved T10/T11/T12 split and BuildStamp copy-rule deviation are explicit.
- **Follow-ups:** P14-T12 process/browser/evidence cleanup and the closing commit; then P15-T00.

### [2026-10-07 05:25] P14-T12 - Clean the Phase 14 environment

- **Agent/session:** Cursor implementation session
- **Action:** Stopped both dev servers, observed all completed Playwright/build jobs, cleared IDE
  browser device emulation and locks, restored generated Phase 11/12 evidence churn, checked the
  six reserved ports and reviewed the final intended workspace diff.
- **Files changed:** `docs/phases/phase-14-multi-experience-foundation.md`;
  `docs/HANDOFF.md`; `docs/ACTIVITY_LOG.md`.
- **Commands run:** `taskkill` for the two tracked dev process trees; background-shell completion
  checks; `git restore docs/qa/evidence`; filtered `Get-CimInstance Win32_Process`;
  `Get-NetTCPConnection`; `git status --short`; `git diff --check`.
- **Result/verification:** No `AxiomLevelUp` Node process remains. Ports 5173, 5174, 4173, 4174,
  4181 and 4182 are free. Browser tabs are unlocked with device emulation cleared. Generated
  evidence churn is restored and only intended closeout documentation remains.
- **Follow-ups:** Begin Phase 15 at P15-T00.

### [2026-10-07 09:25] P15-T00 - Confirm the game-domain decisions

- **Agent/session:** Cursor implementation session
- **Action:** Accepted ADR-106, confirmed that all three difficulties are playable, recorded the
  approved contract refinements and marked Phase 15 active.
- **Files changed:** `docs/DECISIONS.md`;
  `docs/phases/phase-15-game-contract-and-engine.md`; `docs/ROADMAP.md`;
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** `git status --short`; `git log -5 --oneline`.
- **Result/verification:** The working tree was clean before Phase 15; there were no pending Phase
  14 edits to commit. The new game domain is accepted as a first-class content type.
- **Follow-ups:** Add strict round/game schemas and registry loading in P15-T01.

### [2026-10-07 09:35] P15-T01 - Add round and game documents

- **Agent/session:** Cursor implementation session
- **Action:** Added strict round/game schemas, manifest path arrays, loader fetching and registry
  maps, dual-root validation input and exported JSON Schemas.
- **Files changed:** `src/content/schema/game.ts`; `src/content/schema/game.test.ts`;
  `src/content/schema/index.ts`; `src/content/loader.ts`; `src/test/contentFixtures.ts`;
  `src/experiences/sanofi/sanofi.test.tsx`; `scripts/validate-content.ts`;
  `scripts/export-json-schema.ts`; `schemas/*.schema.json`; `docs/CONTENT_SCHEMA.md`;
  `docs/ACTIVITY_LOG.md`.
- **Commands run:** Prettier; `npm run typecheck`; `npm run schema:export`;
  focused Vitest for game schemas and content validation.
- **Result/verification:** TypeScript passes; 63 focused tests pass; ten JSON Schema documents are
  generated, including `round.schema.json` and `game.schema.json`.
- **Follow-ups:** Add the four declarative and runtime mechanic templates.

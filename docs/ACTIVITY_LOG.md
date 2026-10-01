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

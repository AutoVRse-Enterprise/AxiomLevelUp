# Autovrse LevelUp

Autovrse LevelUp is a configuration-driven learning application for scientific and medical
training. It is a responsive, installable Progressive Web App (PWA) that combines structured
courses, interactive scientific artifacts, assessments, case-based reasoning, mastery and
gamification.

Start here if you want to understand the product or test it. The documents under `docs/` provide
the deeper product, architecture, content-authoring and QA history.

## What the application demonstrates

The learner can:

- follow a pathway through configured courses and lessons;
- complete rich text, media, data, assessment and branching-scenario activities;
- manipulate a real DICOM stack using educational scroll, window, zoom, pan, identification and
  measurement tasks;
- inspect a configured 3D anatomy model and authored spatial findings;
- load validated, seeded game and round documents through a pure scoring engine (player UI begins
  in Phase 16);
- complete Foundation, Intermediate and Advanced Case Lab scenarios;
- gather clues, revise a differential, cite reviewed evidence and commit a conclusion;
- review a prioritized takeaway and compare reasoning with an authored Model answer;
- earn locally persisted XP, levels, stars, streaks, mastery and badges;
- download supported courses or cases for offline use; and
- explore explicitly simulated challenge and leaderboard concepts.

The application is a reusable runtime. Courses, cases, thresholds, rewards, labels and scientific
artifacts come from validated content under `public/content/`; they are not hard-coded as
course-specific React screens.

## What it does not provide

This repository has no production backend, authentication, organization accounts, live
multiplayer, real leaderboard service, trainer analytics, LMS integration, PACS integration or AI
content generation.

All patient cases are synthetic training simulations. The anatomy and findings are illustrative.
Nothing here is clinical guidance, diagnostic software or evidence of clinical validation.

## Product surfaces

- **Home:** learner summary, progress, recommendation and recent achievements.
- **Learn:** definitions and entry points for pathways, courses and Case Lab.
- **Pathway and Course:** configured learning sequences and lesson progress.
- **Lesson player:** reusable content, assessment, scenario, DICOM and anatomy primitives.
- **Case Lab:** a tiered case catalogue and guided evidence-based reasoning workflow.
- **Challenge:** daily/weekly activities and a clearly labeled recorded-opponent simulation.
- **Leaderboard:** locally configured sample-cohort rankings and segment filters.
- **Profile:** learner progress, preferences and deterministic Fresh/Experienced demo resets.

Development-only routes such as `/dev` are omitted from normal production builds.

## Run it locally

The most recently verified environment used Node 24 and npm 11.

Install dependencies:

```powershell
npm ci
```

For development:

```powershell
npm run dev
```

For a production-like manual test:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://127.0.0.1:4173`. Stop the server with `Ctrl+C`.

## Experiences

The repository builds two statically selected experiences from the same shared runtime:

- `default` is the complete learning application documented below. It keeps the legacy routes,
  content root, persisted keys, manifest and port 5173/4173.
- `sanofi` is the neutral Respiratory Challenge shell. It uses its own routes, copy, content root,
  theme, storage namespace and port 5174/4174.

Use the committed Vite modes:

```powershell
npm run dev:default     # http://127.0.0.1:5173
npm run dev:sanofi      # http://127.0.0.1:5174
npm run build           # dist/
npm run build:sanofi    # dist-sanofi/
npm run preview         # http://127.0.0.1:4173
npm run preview:sanofi  # http://127.0.0.1:4174
```

`VITE_EXPERIENCE` accepts only `default` or `sanofi`. Prefer the scripts above; a process-level
value that conflicts with `--mode default` or `--mode sanofi` fails immediately. `npm run check`
validates, builds and budgets both artifacts. The dedicated sanofi browser suite is
`npm run test:e2e:sanofi`.

## Recommended human test

Use Chrome at 1440 × 900 first. A complete smoke test takes roughly 15–25 minutes.

### 1. Establish a clean learner

1. Open **Profile**.
2. Select **Fresh trainee**.
3. Choose **Reset demo**.
4. Confirm the learner is Alex Morgan, Level 1, with no completed activity.
5. Return to Home and confirm the recommended Case Lab entry is Foundation rather than Advanced.

### 2. Complete the guided Foundation case

1. Open **View all cases**, then **Variable Airflow Review**.
2. Confirm the briefing explains the learner role, objective, deliverables, first-attempt rule,
   clue cost and untimed mode.
3. Start the case and complete the four walkthrough cards.
4. Confirm stage changes appear inline without a blocking “Begin stage” dialog.
5. In the 3D task, use the visible controls or accessible list and inspect the required spatial
   finding. Confirm **Why it matters** appears and Continue remains visible but unavailable until
   the task requirements are met.
6. Commit the localisation after the first-attempt notice.
7. At both differential checkpoints, rate every hypothesis.
8. Open Clues deliberately. Confirm optional clues disclose their cost before opening.
9. At the evidence step, confirm unreviewed clues cannot be cited. Review the required clues, cite
   the evidence and complete the conclusion.
10. On results, confirm there is one outcome, one **Key takeaway**, one **Recommended next** action
    and collapsed score detail.
11. Open **Compare with model answer** and confirm the differential evolution is meaningful.

### 3. Exercise the Advanced case

1. Return to Profile, select **Experienced learner**, and reset that demo profile.
2. Open **Respiratory Case Review**.
3. Confirm the initial airway point is unknown and branch controls use neutral labels before the
   localisation commitment.
4. Navigate, inspect the dominant spatial finding and commit the location.
5. Confirm anatomical names are revealed only after commitment.
6. Complete both differential checkpoints, review decisive clues, cite evidence and finish the
   case.
7. Confirm countdown expiry, if allowed to occur, does not prevent completion.

### 4. Exercise lessons and DICOM

1. Open **Learn** → **Scientific Imaging Foundations**.
2. Complete the short prerequisite lessons if required.
3. Open **Interpreting Thoracic CT** or **Imaging Lab**.
4. Verify the DICOM stack loads and that scroll, presets, windowing, zoom/pan and the configured
   graded interaction work.
5. At narrow width, confirm the DICOM tools wrap and activity instructions remain reachable.

### 5. Check responsive and accessible behavior

Repeat representative Case Lab and DICOM steps in browser device emulation at 375 × 812:

- Task, Clues and Case notes switch within one workspace.
- The primary action remains above bottom navigation.
- There is no horizontal document scrolling, including at 200% text scaling.
- Controls remain usable with keyboard only.
- Reduced-motion preference removes non-essential movement without blocking progress.

Browser emulation is useful regression evidence, but it is not a substitute for physical Android
Chrome or iPhone Safari testing.

### 6. Check simulated product extensions

- Challenge labels the recorded opponent as **Simulated data** and does not imply a live learner.
- Leaderboard labels its scope **Sample cohort**.
- Country, specialty and institution filters update the configured sample rows.

## Automated verification

Run the complete non-browser gate:

```powershell
npm run check
```

This runs TypeScript, ESLint, unit/component tests, content validation, a production build and
bundle budgets.

Run browser coverage serially:

```powershell
npx playwright test --workers=1
```

Install Chromium first with `npx playwright install chromium` if Playwright reports that its
browser is missing.

The last recorded Phase 15 run passed:

- 95 Vitest files and 593 tests;
- default content validation for 5 courses, 13 lessons, 4 cases and 1 anatomy map, plus sanofi
  validation for 2 rounds and 1 game, all with zero warnings;
- both production builds and bundle budgets; and
- 53 Playwright tests, with 3 intentional project skips and no failures, across desktop Chromium
  and 375 × 812 touch-phone Chromium, plus both sanofi smoke projects.

## Current readiness

Implementation and local automated coverage are complete through Phase 15. External client-demo
approval remains **No-go** because the following evidence has not been supplied:

- five qualifying unaided usability sessions;
- one frozen HTTPS candidate with hosted service-worker and DICOM/CORS preflight; and
- physical Android and iPhone results or an explicitly approved desktop-only waiver.

These are external evidence gaps, not hidden automated passes.

## Where to go next

- `PRD.md` — original product intent plus the current implementation addendum.
- `docs/ROADMAP.md` — phase history and current delivery gates.
- `docs/ARCHITECTURE.md` — runtime boundaries, persistence, players and scientific viewers.
- `docs/CONTENT_SCHEMA.md` — content contracts and authoring constraints.
- `docs/phases/phase-13-client-demo-readiness.md` — current implementation checklist.
- `docs/qa/phase-13-demo-runbook.md` — presenter-led ten-minute demonstration.
- `docs/qa/phase-13-demo-readiness-verdict.md` — what is and is not approved.
- `docs/HANDOFF.md` — current engineering state and operational gotchas.

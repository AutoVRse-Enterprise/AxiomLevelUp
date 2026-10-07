# Medical Challenge programme plan (Phases 14–20)

**Status:** Active — Phases 14 and 15 complete; Phase 16 is next.

This document is the programme-level plan for turning the existing Learning Runtime into a
multi-experience codebase and delivering the mobile-first medical challenge game described in
`newDemoPRD.md`. Each phase has its own detailed checklist under `docs/phases/`:

| Phase | Document                                                      |
| ----- | ------------------------------------------------------------- |
| 14    | `docs/phases/phase-14-multi-experience-foundation.md`         |
| 15    | `docs/phases/phase-15-game-contract-and-engine.md`            |
| 16    | `docs/phases/phase-16-game-player-and-clinical-round.md`      |
| 17    | `docs/phases/phase-17-spatial-rounds.md`                      |
| 18    | `docs/phases/phase-18-spot-the-finding-and-full-challenge.md` |
| 19    | `docs/phases/phase-19-game-hub-results-and-social.md`         |
| 20    | `docs/phases/phase-20-demo-polish-and-readiness.md`           |

## 1. Sources

1. `newDemoPRD.md` — the target experience requirement (authoritative for product intent).
2. `docs/reference docs/Sanofi artifact requirement.pdf` — the forwarded client brief: unknown
   point in the respiratory tree, orientation → interpretation → diagnosis, clue families
   (visual, anatomical, histological, biomarker, audio), scoring on anatomical precision +
   diagnostic precision + speed, levels, duels and expert challenges, modular "same engine, new
   organs" architecture.
3. The 2026-10-07 user directive: refactor so one codebase serves multiple demo experiences;
   preserve the existing homepage unchanged as the default experience; create a new `sanofi`
   experience with its own homepage; keep shared functionality, components, game logic and APIs
   shared; select the experience with `VITE_EXPERIENCE`; add `dev:default` and `dev:sanofi`
   scripts; never duplicate shared application code.
4. The existing codebase and records: `README.md`, `docs/ARCHITECTURE.md`,
   `docs/CONTENT_SCHEMA.md`, `docs/DECISIONS.md` (through ADR-104) and Phase 13.

## 2. Target in one paragraph

Running `npm run dev:sanofi` serves a mobile-first medical challenge game from the same runtime
that `npm run dev:default` serves unchanged as the Learning Runtime. A doctor opens a link and
lands on a game hub whose dominant action is **Start a quick challenge**. A four-round respiratory
session takes two to four minutes. Round 1 drops the player inside the airway with look-only
controls; Round 2 allows a few moves through a small branch network; Round 3 asks them to tap an
abnormality on a medical image; Round 4 combines compact clues into a clinical call. Each answer
gets a one-line reveal and visible points with a speed bonus. The session ends with a large score,
a short performance message, a leaderboard and a **Challenge a colleague** flow whose link replays
the same rounds. Everything is configured content running on reusable primitives, so the
experience implies a broader engine rather than a one-off lung game.

## 3. Non-negotiable constraints

1. **Default experience preserved.** "Unchanged" means: the same route table, navigation, Home
   page, content files, persisted storage keys, PWA manifest and HTML metadata, and the eight
   committed Phase 13 desktop golden images pass without re-baselining. Default behaviour is
   verified at the end of every phase, not only at Phase 14.
2. **Experience selection.** `VITE_EXPERIENCE` selects the active experience. `npm run dev`
   continues to work and resolves to `default` when the variable is unset. `npm run dev:default`
   and `npm run dev:sanofi` launch each configuration explicitly.
3. **No duplicated shared code.** `src/experiences/<id>/` contains composition only: route
   registration, navigation items, shell options, theme token overrides, build metadata and the
   experience homepage that composes shared components. Engines, players, primitives, stores,
   selectors, reusable components and content APIs stay in their existing shared locations.
   Lint rules enforce the boundary.
4. **Repository architectural rules still apply** (`AGENTS.md`): games and rounds are validated
   content, never React-coded rounds; scientific artifacts stay first-class primitives; game
   scoring, history and rewards flow through typed events into the central pipeline; points,
   thresholds, labels and messages live in configuration.
5. **PRD non-goals hold.** No Sanofi branding (the experience ID is internal and must never be
   learner-visible), no backend, no real multiplayer or leaderboard service, no LMS features, no
   clinical validation, no native app, no full free-roaming 3D.
6. **Medical content is plausible, synthetic and internally consistent**, not SME-validated. The
   game carries an unobtrusive "Synthetic cases for demonstration" notice and credits for
   licensed media.

## 4. What exists versus what the target needs

| PRD need                                         | Existing capability                                                                                            | Gap                                                                                                            | Phase         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- |
| Several demo experiences from one codebase       | One static route table, nav constant, PWA manifest and storage namespace                                       | Experience contract, build-time selection, shell parameters, scoped storage, per-experience content and builds | 14            |
| Mobile-link web experience, no install           | Responsive PWA, service worker, install prompt                                                                 | Install prompt must be disabled per experience; per-experience manifest/title                                  | 14, 20        |
| Game hub home                                    | LMS Home (XP, streak, Continue learning, pathway)                                                              | New hub composed from shared game components                                                                   | 14 (stub), 19 |
| Four-round session, Start → Play → Reveal → Next | Case player (stages, clue workspace, differential, debrief) and lesson ActivityPlayer (intro, retries, review) | Lean game run engine and player; round reveal; cumulative score                                                | 15, 16        |
| Round 1 — look but don't travel                  | Endoscopic view with bounded look-around; seeded `unknown_waypoint` entry; neutral labels                      | No zoom inside the airway, travel controls always offered, fixed Left/Right overlay, case-only entry context   | 17            |
| Round 2 — limited movement                       | Branch fly-through, parent/child travel, neutral branch labels, breadcrumbs                                    | Movement budget and allowed sub-network; moves-left UI                                                         | 17            |
| Location answer with precision                   | `anatomy_locate` model/choice/image levels; waypoint `answerIds`; hierarchy levels                             | Hierarchy-proximity scoring; pin-versus-actual reveal; answer dimensions for many drop points                  | 15, 17        |
| Round 3 — spot the finding                       | `image_hotspot` assess mode, `PanZoomImage`, `image_compare`, 3D finding picking; histology images             | Hotspot zoom/pan, tap-precision scoring, compare toggle; CT fixture is normal anatomy so not usable            | 18            |
| Round 4 — multimodal clinical call               | `multiple_choice`, `audio` (wheeze, crackles), `image`, `data_table`, `chart`; case clue economy               | Compact clue tray with free/paid clues inside a game round                                                     | 16            |
| Brief feedback after every round                 | Lesson `FeedbackPanel`; extensive case debrief                                                                 | One-line reveal card with correct answer, key clue and points breakdown                                        | 16            |
| Points, speed bonus, cumulative score            | Case score 0–100 with weighted speed; XP and stars                                                             | Game points model (+850, "Fast answer bonus +100") from configuration                                          | 15            |
| Game difficulty (Warm-up / Challenge / Expert)   | Case tiers named Foundation / Intermediate / Advanced (curriculum language)                                    | Difficulty presets that change time, moves, clues, drop pools and option similarity                            | 15, 17, 18    |
| Strong end-of-session result                     | Case results and Model answer comparison                                                                       | Game result: big score, four stats, personality message, round strip                                           | 16, 19        |
| Challenge a colleague / Score to beat            | Recorded-opponent simulation (ADR from P13-T13)                                                                | Seeded share link that replays identical rounds and compares scores; share sheet                               | 15, 19        |
| Leaderboard                                      | XP "Sample cohort" with country/specialty/institution filters                                                  | Per-game score leaderboard with periods and difficulty                                                         | 19            |
| Expert challenge                                 | None                                                                                                           | Configured expert runs with fixed seed and target score                                                        | 19            |
| Replayability                                    | Seeded unknown-waypoint entry per case attempt                                                                 | Seeded round pools and drop pools per run; daily seed                                                          | 15, 17, 18    |
| Game vocabulary                                  | LMS copy throughout primitives and surfaces                                                                    | Presentation-context labels, game copy configuration, automated vocabulary sweep                               | 16, 20        |
| Visible reusable-engine story                    | 29 primitives, content validation, event pipeline                                                              | Round library, mechanic templates and multiple playable formats from the same rounds                           | 15, 18, 19    |

## 5. Target architecture

### 5.1 Layers

```text
                 build time: VITE_EXPERIENCE (+ npm run dev:<id> / build:<id>)
                                     |
                       vite.config.ts resolves one experience
              (alias @experience, HTML/PWA metadata, port, outDir, precache)
                                     |
   +---------------------------------+----------------------------------+
   | src/experiences/default          | src/experiences/sanofi           |
   | routes = existing table          | routes = shared game routes      |
   | nav = existing primaryNavigation | nav = Play / Leaderboard / You   |
   | storage namespace = legacy keys  | storage namespace = "sanofi"     |
   | content = /content               | content = /experiences/sanofi/.. |
   | Home = src/routes/home/HomePage  | Home = game hub composition      |
   +---------------------------------+----------------------------------+
                                     |  composition only
   ---------------------------- shared runtime ----------------------------
   app (providers, router factory) · content loader/validation/registry
   events bus + pipeline · engines (learning, cases, gamification, mastery, games)
   players (activity, case, game) · primitives · anatomy3d · imaging · offline/pwa
   state stores (namespaced) · selectors · shared components (ui, learning, game)
```

### 5.2 Directory layout after the programme

```text
src/
  app/                       composition root: App, providers, router factory
  experiences/
    types.ts                 ExperienceDefinition, ExperienceBuildMetadata
    ids.ts                   known IDs and resolver shared by vite.config and runtime
    default/                 build.ts, index.ts, routes.tsx (existing table, behaviour-identical)
    sanofi/                  build.ts, index.ts, routes.tsx, HomePage.tsx, theme.css
  engines/games/             pure run planning, scoring, proximity, seeds, links, results
  player/game/               GamePlayer, round lifecycle, reveal, clue tray, timer
  routes/games/              shared game routes: play, result, leaderboard, challenge landing, you
  components/game/           shared hub, score, share, leaderboard and history components
public/
  content/                   default experience content (paths unchanged)
  experiences/sanofi/content manifest, app-config, seeds, games, rounds, anatomy map, assets
  assets/                    shared binary assets (GLB, images, audio, DICOM)
```

### 5.3 Build and run matrix

| Command                   | Experience | Dev port | Output         | Notes                                  |
| ------------------------- | ---------- | -------- | -------------- | -------------------------------------- |
| `npm run dev`             | resolved   | 5173     | n/a            | `default` unless `VITE_EXPERIENCE` set |
| `npm run dev:default`     | default    | 5173     | n/a            | explicit                               |
| `npm run dev:sanofi`      | sanofi     | 5174     | n/a            | separate origin from default dev       |
| `npm run build`           | resolved   | n/a      | `dist/`        | unchanged default artifact             |
| `npm run build:sanofi`    | sanofi     | n/a      | `dist-sanofi/` | separate deployable                    |
| `npm run preview:sanofi`  | sanofi     | 4174     | `dist-sanofi/` | production-like manual test            |
| `npm run test:e2e:sanofi` | sanofi     | 4182     | `dist-sanofi/` | `playwright.sanofi.config.ts`          |

### 5.4 Game domain model

```text
app-config.games            difficulties, scoring, copy, formats, leaderboard, expert runs, messages
round document (library)    one reusable round: mechanic + primitive(s) + clues + feedback
                            + drop/answer pools + per-difficulty overrides
game document               ordered round slots; each slot picks from a pool of round IDs
mechanic template           spatial_look | spatial_explore | spot_finding | clinical_call
run (session)               seed + difficulty + resolved rounds + responses + timings + points
events                      game_started, game_round_answered, game_completed, game_shared …
learner state v9            per-game best, history, plays, daily streak, player display name
```

## 6. The Respiratory Challenge (target content)

One synthetic patient connects the rounds, so they feel related while each demonstrates a
different primitive. Copy below is illustrative; final copy is authored in Phase 18.

| Round | Player-facing title | Mechanic          | Shared primitive(s)                        | Interaction                                       | Answer                                          | Precision source                |
| ----- | ------------------- | ----------------- | ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------- | ------------------------------- |
| 1     | Where are you?      | `spatial_look`    | `anatomy_locate` (look navigation)         | Look around and zoom from a seeded drop point     | Side, region and airway level                   | Per-dimension weights           |
| 2     | Find your way       | `spatial_explore` | `anatomy_explore` + `anatomy_locate` (pin) | Up to N moves in a small branch network, then pin | Tap the lobe on the 3D lung, choose the segment | Hierarchy proximity             |
| 3     | Spot the finding    | `spot_finding`    | `image_hotspot` (zoomable assess)          | Pinch/zoom/pan a histology image and tap          | The mucus-obstructed lumen                      | Region hit or distance fall-off |
| 4     | Make the call       | `clinical_call`   | `multiple_choice` + clue primitives        | Review free clues, optionally buy more            | Most plausible interpretation from four options | Correctness and clue cost       |

Example reveal after Round 2: **Not quite** · "Correct answer: Right lower lobe, posterior basal
segment." · "The branch count after the junction was the strongest clue." · **+420** ·
**Next round**.

## 7. Phase map

| Phase | Title                                     | Goal                                                                                      | Depends on                | Size | Exit signal                                                                                |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| 14    | Multi-experience foundation               | Same codebase serves `default` (unchanged) and `sanofi` (stub hub)                        | —                         | M    | Both dev scripts boot; default regression gate passes with zero re-baselined images        |
| 15    | Game contract and engine                  | Validated round/game content and a pure, tested run/scoring/link engine                   | 14                        | L    | Fixture game validates; engine, events and learner-state v9 are unit-tested; no UI         |
| 16    | Game player and clinical-call round       | Playable run loop with reveal, points, timer and a real multimodal Round 4                | 15                        | L    | A one-round and a two-round fixture game complete on desktop and phone                     |
| 17    | Spatial rounds                            | Look-only and limited-movement location rounds with proximity scoring and pin reveal      | 15, 16                    | XL   | Rounds 1 and 2 complete through visible controls on both viewports; spike verdict recorded |
| 18    | Spot the finding and the full challenge   | Round 3, the complete four-round Respiratory Challenge, difficulties and extra formats    | 16, 17                    | L    | The four-round challenge completes in 2–4 minutes on each playable difficulty              |
| 19    | Game hub, results, social and competition | Sanofi homepage, result page, share/challenge links, leaderboard, expert runs, You page   | 16 (18 for final content) | L    | Hub → play → result → share link → rival replay → comparison works end to end              |
| 20    | Demo polish and readiness                 | Visual/motion polish, vocabulary sweep, accessibility, performance, E2E, docs and runbook | 14–19                     | M    | All automated gates pass for both experiences; runbook and readiness verdict published     |

### 7.1 Dependency graph

```text
14 ──► 15 ──► 16 ──┬──► 17 ──► 18 ──► 20
                   │           ▲
                   └──► 19 ────┘ (19 can start after 16; final hub content waits for 18)

P17-T01 spatial-legibility spike may run any time after 14 to de-risk 17 early.
```

## 8. Cross-cutting definition of done (every task)

1. Behaviour change has unit or component tests; routes and flows have route tests; player-visible
   flows gain Playwright coverage by the end of their phase.
2. `npm run check` passes. From Phase 14 onward it validates content and builds **both**
   experiences.
3. **Default regression gate:** the default Playwright suite (serial) passes and the eight Phase 13
   golden images pass without `--update-snapshots`. A task that needs a default re-baseline stops
   and asks the user.
4. No new product constants in components: points, timers, labels, messages, difficulty values and
   copy come from validated configuration.
5. Primitives stay callback-only. Game state changes only through typed events and the game
   session reducer.
6. No `src/experiences/<a>` imports `src/experiences/<b>`; no shared module imports an experience.
7. Documentation protocol from `AGENTS.md`: activity log entry, phase checklist ticks, ADRs for
   non-trivial choices, handoff snapshot at session end, Conventional Commits with task IDs.
8. Learner-visible text in the sanofi experience never contains "Sanofi" or the LMS vocabulary
   listed in PRD §17 (enforced automatically from Phase 20, checked manually before then).

## 9. Verification strategy

- **Unit/component (Vitest):** engines are pure and exhaustively tested (scoring, proximity, seeds,
  link codec, message rules, migrations). Experience resolution and route tables are tested for both
  experiences.
- **Content:** `npm run validate:content` validates every experience's content root, including
  semantic rules for rounds, drop pools, answer dimensions, difficulty completeness and timing.
- **Browser (Playwright):** the existing default suite is unchanged and remains the regression
  proof. A separate `playwright.sanofi.config.ts` runs sanofi specs on desktop 1440 × 900 and
  touch-phone 375 × 812 with SwiftShader, bridge-free where the player would use visible controls.
- **Visual:** default keeps its eight desktop baselines. Sanofi adds hub, reveal and result baselines
  on both viewports in Phase 20 because the experience is mobile-first.
- **Human/physical:** physical Android/iPhone checks and hosted HTTPS delivery remain external
  gates, exactly as in Phases 9 and 13; emulation is never reported as device evidence.

## 10. PRD traceability

| PRD section                         | Delivered by                                    |
| ----------------------------------- | ----------------------------------------------- |
| §2–4 positioning and demo jobs      | 18 (content), 19 (hub), 20 (tone, sweep)        |
| §5 mobile-first, 2–4 min, 4 rounds  | 14 (no-install shell), 16, 18 (timing), 20      |
| §6 game hub and formats             | 19 (14 stub, 18 format content)                 |
| §7 four-round respiratory challenge | 15, 16, 17, 18                                  |
| §8 Round 1 restricted movement      | 17                                              |
| §9 Round 2 limited movement         | 17                                              |
| §10 Round 3 spot the finding        | 18                                              |
| §11 Round 4 clinical interpretation | 16                                              |
| §12 feedback after every round      | 15 (feedback contract), 16 (reveal UI)          |
| §13 scoring                         | 15 (model), 16 (presentation)                   |
| §14 difficulty                      | 15 (presets), 17, 18 (content), 19 (picker)     |
| §15 end-of-session result           | 16 (basic), 19 (full)                           |
| §16 social and competitive          | 15 (link codec), 19                             |
| §17 vocabulary                      | 16 (labels), 18 (copy), 20 (automated sweep)    |
| §18 visual and interaction tone     | 14 (theme), 19, 20                              |
| §19 medical content expectations    | 18 (plausibility checklist)                     |
| §20 implied platform primitives     | 15 (round library, mechanics), 18, 19 (formats) |
| §21 do not reproduce the deck       | 18 (authoring rules), 20 (review)               |
| §22 non-goals                       | Section 3 of this plan; every phase scope       |
| §23 success criteria                | 20 (evidence matrix)                            |

## 11. Resolved product decisions

The user confirmed these decisions on 2026-10-07:

1. **Player-facing names:** app name **"Autovrse LevelUp"** and game title
   **"Respiratory Challenge"**, with the AutoVRse logo. (P14-T08, P19)
2. **Leaderboard disclosure:** show **"Demo leaderboard"**. (P19-T05)
3. **Difficulty playability:** all three difficulties are playable. (P15-T03, P18-T05)
4. **Additional formats:** Quick Challenge and Anatomy Hunt are playable; Spot the Finding is
   playable if three quality rounds exist; Clinical Mystery is shown as "New soon". (P18-T06)
5. **Player name:** play anonymously as **"You"**; ask for an optional name only when sharing or
   joining the leaderboard. (P19-T04, P19-T05)
6. **Hosting:** treat HTTPS hosting of `dist-sanofi/` as an external gate like P13-T16. (P20-T09)
7. **Default experience scope:** the default experience does not register game routes. (P14-T00)

## 12. Programme risks

| Risk                                                                                 | Mitigation                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Inside-airway views are not legible enough to infer location from visual evidence    | P17-T01 spike with explicit go/no-go; visual cue upgrades; documented outside-in fallback            |
| The refactor perturbs the default experience (layout shift, storage, bundle, images) | Build-time static selection; legacy storage keys; per-phase default regression gate; budgets         |
| Sharing primitives leaks LMS copy into the game                                      | Presentation-context label overrides with defaults equal to current strings; vocabulary sweep        |
| Mobile WebGL performance or context loss on mid-range phones                         | Existing pixel-ratio cap and recovery; model prefetch at hub; per-round fallback policy; device gate |
| Same-origin hosting of both builds collides service workers and caches               | Separate origins recommended; namespaced storage and cache names for non-default experiences         |
| Medical implausibility undermines credibility with specialists                       | Plausibility checklist, consistent single-patient thread, avoidance of over-specific claims          |
| Scope creep toward real multiplayer or analytics                                     | Non-goals restated per phase; share links are client-only and documented as such                     |

## 13. Explicitly out of scope

Real multiplayer, server-side challenge tracking, real leaderboards, authentication, analytics
dashboards, LMS functions, certification, authoring tools, native apps, Sanofi brand assets,
clinical validation, full free-roaming 3D navigation, and changes to the default experience's
learner-visible behaviour.

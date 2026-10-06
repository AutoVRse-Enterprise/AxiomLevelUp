# Phase 17: Spatial rounds

**Status:** Planned

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`. Depends on Phases 15 and 16. P17-T01 may run
any time after Phase 14.

## Goal

Deliver the two GeoGuessr-style location rounds on the shared anatomy runtime:

- **Round 1 — restricted movement (`spatial_look`):** the player is dropped at a seeded point
  inside the airway, can look around and zoom, cannot travel, and answers "Where are you?" along a
  few dimensions (side, region, airway level).
- **Round 2 — limited movement (`spatial_explore`):** the player can make a small number of moves
  through a bounded branch network, inspect nearby viewpoints, then drops a pin on the 3D lung and
  chooses the segment. Score uses hierarchy proximity, and the reveal shows the pin against the
  actual location.

All capability additions are generic, configuration-driven and default-off, so existing lessons and
cases behave exactly as today.

## Existing capability to build on

- Endoscopic mode with bounded yaw/pitch look-around (`lumen.lookAround` configuration).
- Branch travel with `availableBranches()`, `parentWaypoint()`, breadcrumbs and reversible moves.
- Neutral branch labels and hidden location labels for unknown-point attempts (ADR-099).
- Seeded `unknown_waypoint` entry and `answerFrom: 'entry'` answers resolved from waypoint
  `answerIds`.
- Model picking by hierarchy level with an accessible structure list, and finding picking.
- Lazy Three.js boundary, reference-counted model cache, pixel-ratio cap, context-loss recovery.

## Gaps

| Gap                                                                                       | Resolution in this phase                                   |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| No zoom inside the airway                                                                 | Field-of-view zoom with clamps, pinch, wheel and buttons    |
| Travel controls always offered in endoscopic mode                                         | `navigation: 'look'` hides travel and breadcrumbs           |
| Fixed Left/Right overlay is a strong give-away for a side question                        | Configurable orientation overlay (`patient` / `hidden`)     |
| No movement budget                                                                        | `movement: { maxMoves, maxHopsFromEntry, allowBacktrack }`  |
| `answerFrom: 'entry'` depends on the case reasoning context                               | Neutral `AnatomyEntryContext` provided by case and game     |
| Few waypoints carry `answerIds`; no side/region/airway-level dimensions                   | Game anatomy map with full answer dimensions                |
| No pin-versus-actual reveal                                                               | Two-style highlight and camera framing of both structures   |
| Inside views may not be legible enough to infer location                                  | P17-T01 spike and visual cue upgrades                       |

## Design

### Spike first (P17-T01)

Question: can a clinician infer side, region and airway level from the current procedural lumen at
375 × 812? Build a throwaway page under `src/spikes/` (never imported by production code) that drops
into six representative waypoints with look and zoom only.

Evaluate legibility cues: cartilage rings (exist), carina ridge, number and arrangement of branch
openings ahead, lumen radius, wall colour and fog distance. Record findings and a **go/no-go** in
`docs/spikes/spatial-rounds-spike.md`:

- **Go:** proceed with the inside view plus agreed cue upgrades.
- **No-go fallback:** an outside-in variant for Round 1 where the camera orbits a semi-transparent
  lung with a glowing drop marker and the player answers the same dimensions. Round 2 keeps branch
  travel.

### Viewer capabilities (shared, default-off)

1. **Look navigation.** Extend `anatomyNavigationSchema` with `'look'`. The viewer enters
   endoscopic mode at the entry waypoint, enables look-around, disables branch travel, parent
   travel, exit-to-outside and breadcrumbs, and hides the landmark panel.
2. **Endoscopic zoom.** Add `lumen.zoom: { minFovDegrees, maxFovDegrees, step }` to the anatomy
   product configuration and `setZoom` / `zoomBy` to the controller. Inputs: pinch, wheel,
   on-screen +/− buttons and keyboard +/−. Look-around also gains arrow-key control so the round is
   keyboard-completable.
3. **Orientation overlay.** Add `orientationLabels: 'patient' | 'hidden'` (default `'patient'`,
   current behaviour). Rounds that ask for side use `'hidden'` or rely on configured difficulty.
4. **Movement budget.** Add optional `movement` to `anatomy_explore`: the viewer filters
   `availableBranches()` to waypoints within `maxHopsFromEntry` of the entry, counts moves, shows
   "Moves left: N" and disables travel at zero. Backtracking costs a move unless
   `allowBacktrack` is free. The difficulty's `maxMoves` overrides the round default.
5. **Pin drop and reveal.** Round 2 commits through `anatomy_locate` with a `model` level at the
   lobe level and a `choice` level for segment. In reveal mode the viewer highlights the guessed
   structure and the actual structure with two configured styles, places markers and frames both
   (`frameStructures`), producing the "your pin versus actual" moment.
6. **Neutral entry context.** Replace the direct `useCaseReasoningContext` dependency in
   `AnatomyLocatePrimitive` with an `AnatomyEntryContext` (entry waypoint, neutral labels,
   concealed labels). The case player provides it exactly as today; the game player provides the
   seeded drop point.

### Answer dimensions and the game anatomy map

- Add `respiratory-game-map.json` to the sanofi content root. It references the shared
  `lung-model` GLB and reuses the hierarchy, but extends waypoints with full `answerIds`:
  `side`, `region`, `airwayLevel`, `lobe`, `segment`, and game-appropriate `neutralLabel`s.
- Keeping a separate map document keeps default content byte-identical. It is content, not code;
  validation ties both maps to the same model meshes.
- Round 1 levels (choices): **Side** (Left / Right), **Region** (Upper / Middle / Lower, with
  Middle only valid on the right and validated as such), **Airway level** (Trachea / Main bronchus /
  Lobar bronchus / Segmental bronchus). Correct values come from the drop waypoint's `answerIds`.
- Round 2 levels: **Lobe** (model pick on the 3D lung), **Segment** (choice). Accuracy uses the
  Phase 15 proximity table.

### Drop pools and difficulty

| Difficulty | Round 1 pool                          | Round 2 pool and movement                         | Other changes                                   |
| ---------- | ------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| Warm-up    | Trachea, carina, main bronchi         | Lobar entries, 5 moves, 2 hops                    | Longer time; orientation overlay shown           |
| Challenge  | Lobar airways                         | Lobar/segmental entries, 3 moves, 2 hops          | Default timing                                   |
| Expert     | Segmental airways                     | Segmental entries, 2 moves, 1 hop                 | Shorter time; similar options; overlay hidden    |

Every candidate is validated: it exists, it has every required answer dimension, it is reachable
under the movement rule and its correct options exist in the round's level choices.

### Mobile interaction

- The viewport fills the round area. A bottom answer drawer opens with **I know where I am**,
  leaving the scene visible above it. Lock in sits in the game action outlet.
- Hints shown once per player: "Drag to look around. Pinch to zoom." (stored in the namespaced
  learner state; reuses the existing anatomy-hint mechanism with game copy).
- Model prefetch begins when the hub's primary action becomes visible (Phase 19 hook) and at run
  start, using the existing model cache.

### Failure policy

If WebGL or the model fails after retry, the round shows a neutral "3D view unavailable on this
device" state with **Skip round**. A skipped round scores zero, is labelled as skipped (not
"incorrect") in the result, and the run continues. Configurable.

## Checklist

- [ ] **P17-T00 — Decisions**
  - Record ADR-108: generic look navigation, movement budget and proximity reveal as default-off
    viewer capabilities.

- [ ] **P17-T01 — Spatial legibility spike**
  - Build the isolated spike, evaluate six waypoints at both viewports, record cue findings and the
    go/no-go decision. Ask the user to confirm the decision before P17-T04.

- [ ] **P17-T02 — Look navigation, zoom and orientation overlay**
  - Schema, controller and viewer changes with unit tests; default lesson/case viewer behaviour
    unchanged (existing anatomy tests and golden images pass).

- [ ] **P17-T03 — Movement budget**
  - Schema, reachable-subgraph filtering, moves-left UI and tests.

- [ ] **P17-T04 — Visual cue upgrades**
  - Implement the cue changes agreed in the spike as configuration-driven lumen styling; verify
    performance at 375 × 812 under SwiftShader.

- [ ] **P17-T05 — Neutral entry context**
  - Introduce `AnatomyEntryContext`; the case player provides it; all case-flow tests pass
    unchanged.

- [ ] **P17-T06 — Game anatomy map and drop validation**
  - Author `respiratory-game-map.json`; add drop-pool and answer-dimension semantic rules.

- [ ] **P17-T07 — Round 1 content and integration**
  - Author `airway-drop-look` for all difficulties; integrate with the game player and scoring.

- [ ] **P17-T08 — Round 2 content, pin drop and reveal**
  - Author at least two `spatial_explore` rounds; implement the pin-versus-actual reveal.

- [ ] **P17-T09 — Failure policy and mobile drawer**
  - Skip-round path, answer drawer and one-time hint.

- [ ] **P17-T10 — Tests and closeout**
  - Viewer and primitive tests; sanofi Playwright specs completing Rounds 1 and 2 through visible
    controls (no anatomy test bridge) on desktop and 375 × 812, plus a bridge-based renderer check
    for picking.
  - `npm run check` passes; default regression gate passes; architecture and schema docs updated.

## Exit criteria

- Round 1 can be answered from look and zoom only; no travel affordance is available.
- Round 2 enforces the configured move budget and sub-network.
- Proximity scoring awards partial points for near misses, and the reveal shows pin versus actual.
- Both rounds complete through visible controls and keyboard on both viewports.
- Existing anatomy, case and golden-image tests pass unchanged.

## Risks

- **Legibility (highest programme risk).** Mitigated by the spike, cue upgrades and the outside-in
  fallback.
- **Performance on phones.** Respect the pixel-ratio cap, avoid extra geometry per frame and keep
  the triangle warning threshold.
- **Anatomical plausibility of neutral cues.** Keep claims at side/region/airway level; avoid
  implying validated segmental anatomy (the model's segment volumes are illustrative).

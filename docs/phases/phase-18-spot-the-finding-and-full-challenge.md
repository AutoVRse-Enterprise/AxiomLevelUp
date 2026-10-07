# Phase 18: Spot the finding and the full Respiratory Challenge

**Status:** Active

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`. Depends on Phases 16 and 17.

## Goal

Deliver Round 3 (**visual investigation**) and assemble the complete four-round Respiratory
Challenge on every playable difficulty, inside the PRD's two-to-four-minute window. Then prove the
"reusable engine" claim by composing additional playable formats from the same round library
rather than new code.

## Round 3 design (`spot_finding`)

### Interaction

The player inspects a medical image, pinches or scrolls to zoom, pans, and taps the suspicious
region; a marker appears and **Lock in** commits it. An optional **Compare with healthy** toggle
shows a reference image side by side (phone: swipe or toggle).

### Shared capability changes (default-off)

1. **Zoomable assessment.** Extend `image_hotspot` assess content with optional
   `zoom: { enabled: boolean, maxScale: number }`. When enabled, the assessment surface uses the
   existing `PanZoomImage` / `usePanZoom` with `screenToNormalized` so taps map to image
   coordinates at any zoom. Without `zoom`, lessons render exactly as today. Keyboard placement
   (arrow keys, Enter) keeps working; add +/− keyboard zoom.
2. **Tap precision.** Add optional `precision: { mode: 'region' | 'distance', falloffRadius }`.
   `region` keeps current binary hit testing. `distance` returns fractional accuracy from the
   distance between the tap and the nearest target region boundary, reaching zero at
   `falloffRadius` (normalized units). The evaluator stays pure in
   `src/primitives/definitions/imageHotspot.ts`.
3. **Comparison reference.** Add optional `compare: { assetId, alt, label }` rendered with the
   shared `image_compare` presentation so the player can see healthy versus altered tissue.
4. **Reveal overlay.** In review mode the round shows the target region outline and the player's
   marker, reusing `ImageRegionOverlay`.

### Content

- Primary round `histology-mucus-spot`: the existing `asthma-histology-image` (inflamed bronchiole
  with mucoid material narrowing the lumen). Prompt: "Tap the feature most likely to obstruct
  airflow." Target: the luminal mucus; distractor-adjacent features (wall, smooth muscle, vessel)
  are not targets. Compare reference: `airway-comparison-image`.
- Alternate round `histology-destruction-spot`: `emphysema-histology-image`, "Tap the area of
  alveolar destruction", used for Expert pools and the Spot the Finding format.
- Optional 3D variant `airway-finding-spot`: inside the airway with configured findings (mucus
  occlusion versus wall thickening), "Tap the finding that explains the obstruction", using the
  existing finding picking. Included only if it reads well after Phase 17.
- Region authoring: add a development-only `?regionDebug=1` overlay on the hotspot primitive that
  reports normalized coordinates (mirrors the existing `?anatomyDebug=1` pattern; excluded from
  production builds).
- The CT fixture is normal anatomy (`docs/reference/dicom-teaching-targets.md`) and is not used
  for abnormality spotting.

### Credits

Histology, illustration and audio assets carry CC BY / CC BY-SA provenance in `assets.json`. Add a
shared **Credits** sheet (reachable from the result page and the You page) generated from asset
provenance for every asset in the active run.

## Assembling the Respiratory Challenge

### Narrative thread

One synthetic adult with a worsening airway presentation connects the rounds, each with a one-line
intro:

1. "You've been dropped inside an airway. Where are you?"
2. "Something is narrowing this airway. Find it."
3. "Here's tissue from that airway. What's blocking it?"
4. "Put it together. What's going on?"

Round answers stay internally consistent: the obstruction found in Round 2 is mucus (Round 3),
which is consistent with the Round 4 interpretation. Round 1's drop is independent so its answer
does not leak into later rounds.

### Time budget

| Round | Warm-up | Challenge | Expert |
| ----- | ------- | --------- | ------ |
| 1     | 60 s    | 40 s      | 30 s   |
| 2     | 90 s    | 60 s      | 45 s   |
| 3     | 45 s    | 30 s      | 25 s   |
| 4     | 70 s    | 45 s      | 35 s   |

Challenge maximum is 175 s of play plus about 20 s of reveals; typical play lands near 2–3
minutes. Values live in round documents and difficulty multipliers; the Phase 15 timing rule
warns outside 120–240 s.

### Difficulty content differences

- Warm-up: proximal drop points, more moves, more free clues, distinct options.
- Challenge: default.
- Expert: segmental drop points, fewer moves, one free clue, the destruction round in the Round 3
  pool, and similar answer options in Rounds 1 and 4.

### Additional formats (round library reuse)

| Format            | Composition                                             | Default status           |
| ----------------- | ------------------------------------------------------- | ------------------------ |
| Quick Challenge   | The four-slot Respiratory Challenge                     | Playable                 |
| Anatomy Hunt      | Three spatial slots drawing from Round 1 and 2 pools    | Playable                 |
| Spot the Finding  | Three `spot_finding` rounds                             | Playable if three rounds meet the quality bar |
| Clinical Mystery  | Two `clinical_call` rounds                              | "New soon" preview card  |

Each playable format is a game document referencing existing rounds; no format-specific code.

## Medical plausibility checklist

Publish `docs/qa/phase-18-content-plausibility.md` covering, per round: terminology, anatomical
level of claim, consistency of the answer with every clue, distractor plausibility, absence of
product or treatment claims, synthetic-case labelling and asset licensing. This is an internal
sense check, not SME validation.

## Authoring rules (PRD §21)

Do not reproduce the source deck's layouts, sequence, taxonomy or copy. Round titles, prompts,
feedback lines and format names are authored independently and reviewed against the deck once.

## Checklist

- [x] **P18-T00 — Decisions**
  - Open question 4 was resolved in the programme plan: Quick Challenge, Anatomy Hunt and Spot
    the Finding are playable; Clinical Mystery is a preview.
  - Recorded ADR-110 for tap-precision scoring and zoomable assessment, and ADR-111 for challenge
    composition. ADR-109 is already the Phase 17 spatial-round decision.
  - Confirmed that Expert keeps the mucus round with a tighter `similar` option-set variant; the
    destruction round remains exclusive to Spot the Finding.
  - Confirmed a newly sourced, openly licensed third histology image rather than a duplicate target
    or 3D variant.
  - Trimmed Warm-up limits to 50 / 70 / 40 / 55 seconds so play plus four reveal allowances fits
    the 120–240-second window. Challenge and Expert retain 40 / 60 / 30 / 45 and
    30 / 45 / 25 / 35 seconds respectively.

- [x] **P18-T01 — Zoomable hotspot assessment**
  - Added default-off assess-only zoom and answer labels, transform-aware tap placement, drag
    suppression, keyboard marker movement plus image zoom, focus-point panning and
    presentation-driven zoom labels.
  - Existing non-zoom hotspot behavior remains unchanged; 14 focused image primitive tests pass.

- [x] **P18-T02 — Tap precision and comparison reference**
  - Added pure circle, rectangle and polygon distance evaluation with linear falloff; region mode
    retains binary scoring.
  - Extracted the shared image comparison presentation, added an optional reference toggle and
    asset reference, and added a game reveal with both the learner marker and target outline.
  - Focused image, scoring and reveal coverage passes.

- [x] **P18-T03 — Region authoring overlay and Round 3 content**
  - Added the development-only normalized-coordinate overlay and authored mucus and destruction
    rounds with neutral, non-answer-leaking alt text.
  - With user approval, added Yale Rosen's CC BY-SA 2.0 usual interstitial pneumonia micrograph and
    an expanded-interstitium round as the third quality image round. The optional 3D variant is not
    needed.

- [ ] **P18-T04 — Credits sheet**
  - Provenance-driven credits for the active run's assets.

- [ ] **P18-T05 — Respiratory Challenge assembly**
  - Author the game document, narrative intros, feedback lines and per-difficulty overrides; all
    three difficulties validate and play.

- [ ] **P18-T06 — Additional formats**
  - Author Anatomy Hunt and Spot the Finding game documents and the Clinical Mystery preview.

- [ ] **P18-T07 — Plausibility review**
  - Publish the checklist and fix any inconsistency it finds.

- [ ] **P18-T08 — Tests and closeout**
  - Sanofi Playwright completes the four-round challenge on each playable difficulty on desktop and
    375 × 812; a scripted run measures total duration; content validates with zero warnings.
  - `npm run check` passes; default regression gate passes; schema and architecture docs updated.

## Exit criteria

- Round 3 works with touch zoom/pan and keyboard, scoring fractional precision.
- The four-round challenge completes on every playable difficulty in 2–4 minutes of scripted play.
- Additional playable formats require only content.
- The plausibility checklist is published with no open blocking items.

## Risks

- **Region authoring accuracy.** Mitigated by the debug overlay and the reveal outline review.
- **Image legibility on phones.** Zoom addresses detail; confirm images at 375 px before locking
  content.
- **Licensing.** CC BY-SA attribution must be visible; the credits sheet is mandatory, not polish.

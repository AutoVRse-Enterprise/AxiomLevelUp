# Phase 11: Case Lab demo hardening

**Status:** Complete — P11-T00 through P11-T13 complete

## Goal

Turn the Phase 10 Case Lab scaffold into one credible, repeatable five-minute demonstration built
around the advanced exacerbation case. Repair shared-engine P0/P1 defects that could invalidate
case timing, clues, scoring, rewards, comparison, 3D interaction or responsive use.

Phase 11 is a focused recovery phase. It first creates trustworthy real-WebGL acceptance coverage,
then repairs the shared primitives and player in dependency order before authoring and rehearsing
the golden case. Broader catalogue semantics, learning depth and offline model packaging remain in
Phase 12.

## Source and framing

- Source audit: `docs/qa/phase-10-demo-readiness-audit.md`, containing F01 through F52 from the
  Case Lab demo-readiness audit.
- Phase 10 remains technically complete as the capability foundation, but its automated completion
  and Chromium no-overflow evidence do not establish client-demo readiness.
- The exacerbation case is the golden path because it is the featured advanced experience and is
  intended to demonstrate endoscopic entry, spatial discovery, clues, scoring and comparison.
- Clinical sample content remains illustrative until a focused SME and client-claims review is
  recorded.
- Phase 9 remains active for physical Android and iOS gates P9-M01 through P9-M03. Phase 11 may
  refine their Case Lab addendum but cannot close or waive those gates.

## Agreed scope

### In scope

- One rehearsed five-minute exacerbation path covering briefing, meaningful 3D exploration,
  localisation, evidence, diagnosis, feedback, transparent scoring and comparison.
- A real `anatomy_explore` step with at least one authored airway branch and a visible,
  patient-specific finding that supports the scored location.
- A Playwright production-preview harness that exercises real WebGL, pointer input and screenshots
  instead of replacing the core demo with the unavailable-viewer test double.
- Unscored exploration excluded from question timing and scored denominators while preserving its
  configured completion and events.
- Reliable most-specific canvas picking, marker retention, endoscopic branch navigation and
  configured patient-specific findings.
- Shared case lifecycle fixes for stage transitions, clocks and atomic clue presentation.
- Attempt v6 with truthful result, history, comparison and reward data.
- Phone and desktop player hardening for unobstructed controls, a single start action and a usable
  artifact-first layout.
- Deployment, asset-preload, service-worker and cache rehearsal.
- Focused clinical/content review of the golden case and explicit client-facing claim boundaries.

### Out of scope

- Re-authoring every tier to the golden case's depth.
- A general evidence notebook, evolving differential workspace or adaptive reasoning model.
- Full debrief and expert-rationale expansion across all cases.
- A general clue-consumption model, tier-level clue-total semantics or quick-case history repair.
- Deeper reusable anatomy beyond the authored golden-case route and decoy waypoints.
- General multi-level timeout partial-credit redesign.
- Broad schema semantics, offline model packaging and polish not required by the golden path.
- Backend services, multiplayer, segmented leaderboards or offline course-wide 3D support.
- Closing or waiving the Phase 9 physical-device gate without its required evidence and approval.

## Workstreams

### Acceptance harness

- Run the production build under Playwright with real WebGL and deterministic seeded state.
- Assert actual canvas pointer selection, marker visibility, endoscopic traversal, finding
  presentation, clue behavior and responsive hit targets.
- Keep unavailable-WebGL unit coverage as fallback evidence, never as the core acceptance path.

### Anatomy primitives

- Separate unscored exploration from timed/scored assessment behavior.
- Resolve overlapping raycast hits to the most-specific eligible structure.
- Preserve configured overview markers through asynchronous model readiness, reset and resume.
- Expose authored endoscopic branches with forward, back and current-location context.
- Render configured patient-specific findings without hard-coding respiratory disease in the
  controller.

### Player and attempt truthfulness

- Pause question timing before transitions or blocking clues and keep actual elapsed duration after
  countdown expiry.
- Use one CasePlayer-owned clue presenter for entry, trigger, feedback and reopen actions.
- Make the artifact primary, keep equivalent access available and collapse redundant player chrome.
- Migrate attempts to v6 so saved results and comparison retain the complete breakdown, authored
  labels, normalized responses and actual rewards.

### Golden path and delivery

- Integrate the repaired capabilities into one clinically coherent, deterministic exacerbation
  route with visible evidence, plausible reasoning and seeded comparison history.
- Preflight the exact versioned model and build, verify service-worker freshness and retain a
  clean-origin recovery route.
- Restrict approval to tested contexts; physical phone approval remains recorded through Phase 9.

## Checklist

- [x] P11-T00 — Record the 52-finding audit, phase split, roadmap, ADR, QA corrections and handoff.
- [x] P11-T01 — Playwright real-WebGL harness: add production-preview deterministic seed
      setup, pointer-level canvas assertions, screenshot evidence and CI-safe browser diagnostics
      (F18). The desktop and touch-phone real-WebGL smoke and P11-T03 canvas picking are active;
      marker retention, branch traversal and finding activation are now active; only the complete
      golden-path assertion remains explicitly skipped until P11-T11 lands.
- [x] P11-T02 — Exclude unscored: plan-step scoring metadata now gates question timing, component
      and per-step speed means, persisted scored-step results and comparison rows. Focused coverage
      completes an unscored `anatomy_explore` step, preserves its completion event and resume state,
      and proves that scored retries retain first-attempt score, response and timing authority.
- [x] P11-T03 — Most-specific picking: ordered raycast mesh hits now resolve only against
      currently selectable levels, preferring deeper ancestry, narrower mesh bindings and a
      deterministic ID tie-break. Same-level mesh collisions fail content validation while
      aggregate-parent overlap across levels remains valid. A real-WebGL Playwright test selects
      the foundation case's right upper lobe directly on desktop and touch-phone canvases (F01).
- [x] P11-T04 — Marker: preserve configured overview markers after model readiness and through
      reset, remount and resume paths (F41). The authored marker is now the fallback whenever a
      runtime override is absent; component coverage and both real-WebGL projects verify it through
      reset.
- [x] P11-T05 — Endoscopy: authored waypoint branches now remain inside the procedural lumen,
      preserve a reversible parent/path history and provide breadcrumb, current-landmark,
      Back-to-parent, Outside/Airway and orientation controls. Reduced motion cuts between
      waypoints; configured bounded pointer look, headlight, fog, tapered curves and authored ring
      counts remain organ-agnostic. External model levels frame their selectable structures, the
      equivalent structure list is collapsed unless opened or WebGL fails, localisation forwards
      authored navigation/markers, and the branch round trip passes both real-WebGL projects (F02).
- [x] P11-T06 — Findings: case-scoped finding contracts now resolve into typed per-step plans,
      validate clue/map/anchor references and render four organ-agnostic overlays with configured
      styles, deterministic occlusion geometry, picking/projection, labelled status and equivalent
      controls. Exploration emits typed inspection events and supports required finding completion;
      the golden case's focal narrowing is framed from its authored carina view and passes desktop
      and touch-phone real-WebGL activation (F04, F08).
- [x] P11-T07 — Timing: `ActivityPlayer.pauseTiming` now freezes both attempt elapsed and
      countdown state without resetting either. Fresh attempts show the first stage in a
      focus-trapped Radix dialog; stage transitions and the blocking mobile clue presenter pause
      both question and case clocks. Case elapsed time remains unbounded after countdown expiry,
      remaining time clamps to zero, actual elapsed persists, and untimed cases display elapsed
      time while labelling speed as not scored. Unscored steps remain ineligible for attempt timing;
      P11-T11 retains the content-only removal of unwanted exploration/evidence countdowns (F07,
      F13, F40, F44).
- [x] P11-T08 — Clue presenter: CasePlayer now owns selected clue and presenter state, with one
      atomic context-aware action for clue-first entry, clue cards and feedback remediation. The
      controlled mobile trigger opens an unselected list without recording evidence; clue-first
      and feedback reopen visibly open the phone sheet, stage changes clear stale presentation,
      first-open context survives session resume and only optional entry/browse openings made
      before a response incur a penalty (F11, F27, F42, F49).
- [x] P11-T09 — Player/layout: the case-intro CTA now explicitly auto-starts or resumes the case
      player without changing lesson or challenge entry. Case mode removes generic activity
      progress in favor of stage plus current-stage task context, uses authored task prompts in
      focus headings, gives viewer steps the full desktop workspace, and moves clues into a
      controlled collapsible desktop rail or safe-area-aware mobile bottom action/sheet. The
      equivalent anatomy list remains secondary, the mobile canvas is approximately 60dvh, global
      scroll offsets protect controls from sticky/fixed chrome, and production-preview
      `elementFromPoint` checks pass in desktop and touch-phone Chromium (F06, F09, F17, F22–F25).
- [x] P11-T10 — Attempt v6/results/compare: result-v6 records persist both speed components,
      effective weights, clue cost, timing semantics, normalized first responses, actual duration
      and central activity-result XP. Legacy v5 records remain available without fabricated detail.
      Results show `/100`, component percentage/weight/points, clue cost, `mm:ss`, accessible stars,
      truthful XP and first-attempt disclosure. Comparison uses authored labels, excludes unscored
      steps, normalizes arrays/object keys, supports validated expert rationale and de-duplicates
      the current attempt from history, including challenge-hosted cases (F14–F16, F35–F38, F43,
      F45, F48).
- [x] P11-T11 — Golden case: the neutral six-task respiratory review now starts in the mid
      trachea, requires right-lower-lobe posterior basal traversal and canvas inspection of a
      dominant mucus occlusion, then removes finding overlays for scored lobe/segment/structure
      localisation. One severity selection, one CO₂ interpretation, diagnosis and urgent
      consequence complete the four-stage 300/480-second case without per-step timers. Authored
      benchmark rationales, debrief, prior result-v6 history, generic segmental waypoints,
      development-only `?anatomyDebug=1` camera data and desktop/touch-phone full-path coverage are
      included. The focused claim ledger remains explicitly pending SME/client approval (F03, F05,
      F21, F30, F50, F52).
- [x] P11-T12 — Resilience: the featured-case intro and anatomy viewer now share the exact
      SHA-256-versioned GLB URL; a dedicated CacheFirst route retains at most four versioned models
      for 14 days without claiming general offline 3D. Accessible preload state remains
      non-blocking, deterministic/configured build metadata is visible in the shell, blocked
      registration clears stale update state, and waiting-worker reload plus real cache behavior
      are tested. The clean-origin/update/model/build/seed/desktop/375 preflight, recovery steps and
      actual six-task presenter script are recorded in `docs/qa/phase-11-demo-runbook.md` (F20,
      F34).
- [x] P11-T13 — Closeout: the complete demo gate and real-WebGL golden path pass on desktop and
      375 px touch emulation, with tracked screenshots for finding discovery, localisation, results
      and comparison. Architecture, schema, audit, QA, roadmap and handoff documentation reflect
      the final contracts. All 40 Phase 11 findings are closed with evidence; the 12 approved
      Phase 12 deferrals remain mapped, clinical claims remain unapproved and P9-M01 through
      P9-M03 remain active pending hardware evidence or waiver (F19).

## Sequencing

1. P11-T01 establishes the real-WebGL acceptance harness before behavior changes.
2. P11-T02 removes unscored exploration from assessment semantics.
3. P11-T03 through P11-T06 repair picking, marker, endoscopy and finding primitives independently.
4. P11-T07 and P11-T08 establish timing and clue-state invariants before shell integration.
5. P11-T09 and P11-T10 harden the player and persisted attempt/results contract.
6. P11-T11 composes only proven capabilities into the golden exacerbation case.
7. P11-T12 rehearses the exact deployment; P11-T13 closes with complete evidence.

## Rules

- Preserve the configuration-driven runtime. No disease, case or organ behavior is hard-coded in
  React or the Three.js controller.
- Keep `three` imports inside `src/anatomy3d/three` and preserve explicit controller disposal.
- Keep equivalent keyboard/list access, but do not use it as evidence that canvas interaction
  works.
- Do not time free exploration or hidden questions. Blocking clue and transition states cannot
  consume answer time.
- Use one atomic presenter action for clue selection, recording and visible presentation.
- Phase 11 distinguishes pre-answer hints from post-answer remediation only as needed for correct
  golden-case mechanics; a general clue-consumption contract remains in Phase 12.
- Scores, labels, paths, rewards and pathology parameters remain validated configuration.
- Clinical and regulatory approval is not implied by technical completion.
- Phase 9 physical-device failures remain open until retested on hardware or explicitly waived.

## Exit criteria

- A Playwright production-preview test uses real WebGL to select the intended mesh, retain the
  marker, navigate an authored branch and verify a configured finding.
- Unscored exploration does not consume question time or alter scored/speed denominators.
- The golden exacerbation case completes in five minutes on the exact presentation build and
  demonstrates the same real interactions covered by the harness.
- The finding supports the scored location and diagnosis; no precise localisation is arbitrary or
  exposed before the learner reasons from evidence.
- Stage dialogs and visible clues cannot silently consume question time; post-answer remediation
  cannot add a penalty.
- Mobile controls receive intended touch input, the case starts once and the primary artifact
  remains usable with one coherent progress hierarchy.
- Attempt v6 retains complete score and duration data. Results explain weighted points and
  penalties out of 100; comparison labels/responses and awarded XP are truthful.
- The model and build version are preflighted, stale-cache recovery is rehearsed and the clinical
  review status is visible.
- `npm run check`, the relevant browser suite and `git diff --check` pass.
- Client/mobile approval remains conditional on P9-M01 through P9-M03 unless an authorized waiver
  is recorded.

## Risks

- A credible patient-specific airway finding may require new authored geometry, overlays or
  licensed media rather than camera and content changes alone.
- Focused SME review may change the golden path's diagnosis, localisation or claims.
- Real mobile GPU, touch, safe-area and installed-app behavior remains unknown until Phase 9
  physical testing.
- Browser WebGL availability and screenshot stability can vary in CI; the harness must fail with
  actionable renderer diagnostics rather than silently substitute the fallback.
- Pulling general clue semantics, deep anatomy, timeout partial credit or catalogue breadth into
  this phase would delay the approved golden path.

## Approved implementation defaults

1. The golden path is `exacerbation-advanced`.
2. Five minutes includes briefing through comparison, not only scored questions.
3. One real airway branch and one visible patient-specific finding are the minimum spatial proof.
4. P11-T01 precedes behavior fixes so every 3D correction gains real-browser evidence.
5. Unscored exploration and blocking overlays are not question-timed.
6. Only optional hints opened before submission may be penalized in the golden path.
7. The 3D asset is preloaded and version-verified for the presentation; this does not create a
   general offline-3D commitment.
8. Phase 9 remains the sole physical-device release gate.

# Phase 12: Case Lab depth and polish

**Status:** Active — P12-T00 in progress

## Goal

Extend the proven Phase 11 golden path into broader learning depth and a consistently polished Case
Lab. Differentiate tiers through spatial and diagnostic reasoning, support evidence synthesis and
turn debrief and expert comparison into teaching experiences rather than score summaries.

Close the whole learner-facing application as one client-demo-ready product. The Phase 12 gate
therefore also covers the PRD section 80 tour through Home, pathway, lesson, DICOM, completion,
daily challenge, leaderboard and profile. Technical completion remains distinct from clinical and
physical-device approval.

## Source and framing

- Source audit: `docs/qa/phase-10-demo-readiness-audit.md`.
- Phase 12 owns the findings intentionally deferred from the focused Phase 11 recovery:
  F10, F12, F26, F28, F29, F31–F33, F39, F46, F47 and F51, plus the general timeout
  partial-credit work left after the Phase 11 golden-path timing fix.
- Phase 11 establishes the trusted shared-engine behavior and one golden exacerbation path. Phase
  12 generalizes that quality without weakening the golden path or duplicating its fixes.
- Phase 9 remains the physical-device gate until P9-M01 through P9-M03 pass or are explicitly
  waived.

## Agreed scope

### In scope

- Re-author foundation, intermediate and quick-case breadth so tiers differ by spatial complexity,
  ambiguity, competing hypotheses and decision consequences.
- Extend anatomy beyond the golden case's authored route and decoy waypoints.
- Remove or implement inert quick-case 3D entry configuration.
- Define general clue-consumption, tier-level clue-total, scoring-label and cross-case schema
  semantics.
- Add general multi-level timeout partial-credit behavior after Phase 11 prevents hidden/blocked
  timing failures.
- Add a compact evidence workspace with pinned findings, current location and evolving
  differential confidence.
- Make missed evidence actionable from debrief and add authored expert rationale to comparison.
- Standardize remaining metadata and catalogue terminology.
- Complete remaining accessibility, presentation polish and general offline model packaging.
- Extend automated and browser coverage across the broadened catalogue.
- Remove the remaining whole-app demo dead ends, unify the demo story and produce one presenter
  runbook and readiness verdict.

### Out of scope

- Reopening Phase 11's golden-path acceptance unless a regression is found.
- Reworking Phase 11's real-WebGL harness, picking, marker, endoscopy, findings, clue presenter,
  player shell or attempt v6 without a demonstrated regression.
- Backend-synchronized evidence boards, real expert challenges or multiplayer.
- AI-generated differential reasoning or adaptive sequencing.
- Clinical approval beyond separately recorded content-review scope.
- Replacing the Phase 9 physical-device gate.

## Depth plan

### Tier differentiation

- Foundation emphasizes orientation and clearly supported gross anatomy without leaking the answer.
- Intermediate adds ambiguous evidence and plausible competing diagnoses.
- Advanced preserves the branch-based finding discovery and introduces consequential synthesis,
  not merely shorter timers.
- The quick case either gains a compact real anatomy interaction or removes its inert marker entry.

### General contracts

- Define consumption separately from clue opening across every clue primitive, not only the golden
  presenter's pre-answer/post-answer distinction.
- Separate stable case-level evidence totals from stage availability.
- Decide and validate the cross-case semantics of accuracy-adjusted speed.
- Preserve completed localisation levels under timeout through a general partial-credit contract.
- Package model assets for broader offline use only with explicit versioning, quota and eviction
  behavior.

### Evidence and reflection

- Let learners pin observations from clues and spatial interactions into one compact case evidence
  view.
- Track the current location and a small authored differential set without introducing a backend.
- Link every missed clue in debrief to the affected decision and corrected reasoning.
- Add authored expert rationale for path, evidence weighting and diagnosis.

### Presentation consistency

- Resolve remaining organ-system, tier and catalogue terminology through shared configured labels.
- Extend accessibility and presentation QA beyond the Phase 11 golden path.

## Checklist

- [ ] P12-T00 — Commit the complete Phase 11 baseline, run both quality gates, rebaseline residual
      audit findings and whole-app demo gaps, rescope this phase and record ADR-083.
- [ ] P12-T01 — Define time-only speed eligibility, committed-progress timeout credit and the
      session-v5/learner-state-v7/result-v7 migration (F47 and general timeout credit).
- [ ] P12-T02 — Separate clue review from opening and show stable case/stage totals (F12, F26).
- [ ] P12-T03 — Add configured procedural segment volumes and segmental waypoints without
      replacing the licensed lung GLB (F10).
- [ ] P12-T04 — Add local case notes with pinned evidence, current location and an authored
      evolving differential (F31).
- [ ] P12-T05 — Add actionable key-evidence debrief and expert path/evidence/diagnosis teaching
      (F32, F33).
- [ ] P12-T06 — Re-author the foundation, intermediate and quick cases, enrich the golden teaching
      fields and validate entry, stage and benchmark semantics (F28, F29, F51).
- [ ] P12-T07 — Standardize configured metadata and verify quick-case attempt de-duplication
      (F39, F46).
- [ ] P12-T08 — Close the whole-app W-series demo gaps and enforce learner-facing terminology.
- [ ] P12-T09 — Add integrity-verified, quota-aware offline Case Lab packages including the
      versioned model.
- [ ] P12-T10 — Complete catalogue-wide accessibility, text-scaling, performance and resilience
      evidence.
- [ ] P12-T11 — Add breadth and product-tour browser coverage, durable screenshots and one unified
      presenter runbook.
- [ ] P12-T12 — Publish the browser QA and audience-specific readiness verdict; update architecture,
      schemas, decisions, roadmap and handoff.

## Sequencing

1. P12-T00 confirms and commits Phase 11 before any new behavior changes.
2. P12-T01 and P12-T02 establish scoring, timeout and clue contracts before content is re-authored.
3. P12-T03, P12-T04 and P12-T05 build anatomy, evidence and teaching depth.
4. P12-T06 composes those contracts into the differentiated catalogue.
5. P12-T07 through P12-T09 close metadata, whole-app and offline delivery.
6. P12-T10 through P12-T12 validate, rehearse and close.

## Rules

- Tier differences must come from configured anatomy, evidence and decisions rather than
  hard-coded case branches.
- The evidence workspace consumes typed case and primitive events; primitives do not mutate case
  progression, mastery or rewards directly.
- Expert rationale and learner-facing labels are authored content and validated before rendering.
- Accessibility alternatives remain equivalent in outcome and do not become the only reliable way
  to complete a spatial task.
- General offline model support must define version, integrity, quota, eviction and update behavior;
  Phase 11's presentation preload is not that contract.
- Procedural segment volumes are configured illustrative learning regions. They must not be
  presented as patient-derived or validated segment meshes.
- The golden-path browser test passes at the end of every task.
- No P2/P3 finding is silently dropped; close it, move it with rationale or record an explicit
  deferral.
- Phase 9 physical results remain authoritative for mobile approval.

## Exit criteria

- Foundation, intermediate, advanced and quick cases have intentionally different learning
  demands, and every configured entry mode is consumed by an appropriate primitive.
- Reusable anatomy extends beyond the golden route, and multi-level timeout preserves completed
  credit.
- Clue consumption, case/stage totals and speed semantics are explicit and validated across cases.
- Learners can retain and synthesize evidence without repeatedly reopening transient clues.
- Debrief links missed evidence to decisions, and comparison explains expert reasoning with
  learner-facing labels.
- Remaining catalogue metadata and quick-case history are consistent.
- General model offline behavior and catalogue-wide accessibility/polish have recorded evidence.
- Leaderboard period controls and weekly challenge cards are functional; no learner route exposes
  raw IDs, primitive names, placeholders or dead actions.
- Catalogue-wide tests, the whole-product tour and browser QA cover the broadened behavior;
  `npm run check` and `npm run check:demo` pass.
- One runbook contains five-minute Case Lab and product-tour scripts plus a combined presentation,
  and the readiness verdict distinguishes internal, supervised-client and unsupervised use.
- Every Phase 12 audit finding has evidence of closure or a documented, approved deferral.

## Risks

- Evidence-workspace scope can expand into a full clinical decision-support product; keep it
  authored, local and educational.
- More realistic distractors and rationale require additional SME time.
- Segment-volume authoring is coordinate-sensitive and remains illustrative; use the existing
  debug readout and fail overlapping same-level volumes during validation.
- Presentation consistency changes can invalidate existing screenshots and device scripts, which
  must be refreshed without treating emulation as physical evidence.
- Session/state migrations and general offline model packages widen durable contracts; keep legacy
  records readable and exercise quota, update and eviction behavior.

## Approved implementation defaults

1. Phase 12 generalizes the Phase 11 engine; it does not fork a second case player.
2. Evidence pinning and differential confidence remain local to the active case session.
3. General clue consumption is separate from Phase 11's minimal golden presenter semantics.
4. Expert rationale is authored and deterministic.
5. Quick-case 3D configuration must either render a real interaction or be removed.
6. Physical-device sign-off remains under Phase 9.
7. Phase 12 covers the whole PRD product demo as well as Case Lab.
8. Segment depth uses configured procedural volumes and authored waypoints; no new GLB is sourced.

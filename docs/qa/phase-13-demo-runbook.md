# Phase 13 client-demo runbook

This runbook supersedes the Phase 12 runbook for the guided Case Lab demonstration. All cases are
synthetic training simulations. The demonstration is about product flow and technical capability,
not clinical guidance or validated anatomy.

First-time readers should begin with `README.md` for the product overview, local setup and
human-readable smoke test. This runbook is the stricter presenter and deployment procedure.

## Freeze one exact candidate

1. Record the commit, UTC build time, application URL, DICOM URL and visible build ID.
2. Run `npm ci`, `npm run check`, and `npx playwright test --workers=1`.
3. Build once with the production DICOM base URL, then deploy that unchanged `dist/` over HTTPS.
4. Complete `docs/qa/phase-09-hosting-prerequisites.md` against the deployed origins.
5. In a private browser window, verify that a reload is service-worker controlled and that no old
   worker is waiting. If **Update available** appears, reload and recheck the build ID.
6. From Profile, choose **Fresh trainee**, then **Reset demo**. Confirm Alex Morgan, Trainee doctor,
   Level 1 and 0 XP.
7. At 1440 × 900, open Home, Case Lab, Foundation, Advanced, Challenge, Leaderboard and Profile.
   Confirm no horizontal overflow, broken media, blocking overlay or console error.

Stop if the deployed build ID differs from the recorded candidate, the worker is stale, WebGL
cannot initialize, DICOM fails its HTTPS/CORS check, or demo state cannot be reset.

## Presenter-led ten-minute script

- **0:00–0:45 — Product frame.** On Home, state: “This is a configuration-driven learning runtime.
  Case Lab is one reusable learning format, not a hard-coded course.” Point out the fresh trainee
  identity and Foundation recommendation.
- **0:45–1:30 — Case Lab ladder.** Choose **View all cases**. Explain Foundation, Intermediate and
  Advanced progression, then open **Variable Airflow Review**.
- **1:30–2:15 — Mission briefing.** Read the mission in one sentence. Show the deliverables,
  first-attempt rule, evidence cost, untimed Foundation mode and synthetic-training disclaimer.
- **2:15–3:30 — Guided first use.** Start the case. Move through the four coach cards. Show that
  Task, Clues, Case notes and the primary action remain in one workspace.
- **3:30–4:30 — Spatial evidence.** Use the visible 3D controls or accessible list, inspect a
  spatial finding and explain **Why it matters**. Show that Continue is present but unavailable
  until the exploration requirements are met.
- **4:30–5:15 — Evidence and reasoning.** Open a relevant clue, update the differential and show
  that the patient timeline changes between stages.
- **5:15–5:45 — Presenter switch.** Exit, open Profile, choose **Experienced learner**, and confirm
  Maya Chen is a respiratory medicine trainee. Open the Advanced case.
- **5:45–7:15 — Unknown-point reconstruction.** Explain that the starting airway point is seeded
  per attempt. Use neutral branch controls, inspect the dominant finding and commit the
  localisation; do not narrate the hidden answer before commitment.
- **7:15–8:30 — Evidence-backed conclusion.** Rate the differential, review decisive clues, cite
  the evidence and commit the conclusion. Emphasize that evidence citation affects diagnosis
  credit.
- **8:30–9:30 — Debrief.** Show the outcome, one prioritized takeaway, Recommended next and the
  collapsed score detail. Open **Compare with model answer** and show differential evolution.
- **9:30–10:00 — Product extensions.** Briefly show the explicitly labeled recorded-opponent
  challenge and segmented **Sample cohort** leaderboard. State that both are simulated previews.

If time is lost, omit the product-extension tour. Do not skip mission, unknown-point
reconstruction, evidence citation or the prioritized debrief.

## Attendee hands-on handout

1. Use a private browser window and open the supplied HTTPS URL.
2. On Profile, select **Fresh trainee** and reset the demo.
3. On Home, open the recommended Foundation Case Lab case.
4. Read the mission and deliverables before starting.
5. Follow the coach walkthrough without presenter help.
6. In each task, use the prompt to decide what to inspect. Use Clues deliberately; optional clues
   may reduce the score.
7. Update every differential item, cite reviewed evidence before the conclusion, and finish the
   case.
8. On results, identify the Key takeaway and Recommended next action. Then compare with the Model
   answer.
9. Do not enter real patient or personal data. Stop and tell the presenter if the build ID differs,
   a page will not progress, or a scientific viewer fails.

## Recovery

- **Wrong learner state:** Profile → desired profile → Reset demo.
- **Stale build:** close other origin tabs, activate/reload the waiting worker, clear site data if
  needed, and verify the build ID again.
- **3D failure:** reconnect, reload the case intro and retry. The list is an accessibility path, but
  list-only success does not prove WebGL interaction.
- **Blocked progression:** verify every required spatial finding or structure is selected; the
  disabled Continue action communicates incomplete exploration.
- **DICOM/CORS failure:** restore network, verify the configured host and all 125 instances, then
  retry. Never substitute screenshots for the interactive claim.
- **Unexpected dialog:** complete or dismiss the visible coach/reward dialog before continuing.

## Device and approval boundary

Desktop Chromium and 375 × 812 touch emulation are automated evidence, not physical-device
approval. If Android Chrome and iPhone Safari cannot be tested, record a desktop-only-demo waiver
in the readiness verdict. A waiver prohibits claims about physical touch, GPU performance,
installation, mobile safe areas or offline lifecycle.

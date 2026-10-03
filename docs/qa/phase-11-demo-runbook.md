# Phase 11 five-minute demo runbook

This runbook is for the configured `exacerbation-advanced` browser demonstration. It verifies one
hash-versioned GLB for that case; it does not claim general or offline 3D availability. Chromium
desktop and 375 px emulation are rehearsal targets only. They do not satisfy the Phase 9 physical
Android or iOS gates.

## Exact preflight

1. Build and serve the candidate with `npm run build` and
   `npm run preview -- --host 127.0.0.1 --port 4181 --strictPort`. Record the deployed URL and the
   visible `Build <id>` at the bottom of the app. The ID is `VITE_BUILD_ID`/CI commit metadata when
   configured; otherwise it is the reproducible `0.1.0+<12-hex-source-digest>`.
   The unoverridden P11-T12 workspace snapshot is `Build 0.1.0+765186c09b76`.
2. In browser developer tools, clear storage for this origin, unregister every service worker and
   close all tabs for the origin. Reopen the deployed URL. Wait for the service worker to be
   activated, reload once so the page is controlled, and confirm no older worker is waiting.
3. Compare the visible build ID with the candidate ID recorded in the deployment/rehearsal notes.
   Stop if they differ.
4. Open `/learn/cases/exacerbation-advanced`. Wait for
   `3D model preloaded for this session.` Do not proceed on a preload warning until Retry succeeds.
5. In Cache Storage, open `versioned-case-models-v1`. Confirm it contains exactly the requested
   featured model URL:
   `/assets/models/lung-map/model.glb?v=8884cefbb5be256af5dfd46b8d8071af677d4cf4ade8477e3311e2c09086766a`.
   Confirm the response is successful. This bounded runtime cache retains at most four versioned
   GLBs for 14 days and is not an offline-3D package.
6. Open `/dev`, choose **Reset demo**, and wait for `Advanced seed applied.` This resets the
   advanced learner state, attempt history and event log to the configured demo seed. Return to the
   featured case.
7. Rehearse once at 1440 × 900 and once at 375 × 812 with touch emulation. Confirm Start case,
   Begin stage, the 3D canvas, branch controls, Clues, result actions and comparison are reachable.
8. Confirm the clinical review ledger has the approvals required for the intended audience. A
   technically green run does not supply clinical, legal or physical-device approval.

## Update and stale-cache recovery

- If **Update available** appears, choose **Reload**. Confirm the waiting worker activates, the page
  reloads, and the visible build ID matches the candidate before opening the case.
- If the build ID is stale or a worker remains waiting, close other tabs for the origin, use
  **skipWaiting** in developer tools if necessary, then reload. Recheck the build ID and model URL.
- If the model preload fails or Cache Storage has a different hash, delete
  `versioned-case-models-v1`, reload the case intro online and wait for the ready status. Do not
  present from an unversioned or mismatched GLB response.
- If freshness still cannot be established, clear all site data and repeat Exact preflight from
  step 2. Reset the advanced seed again after clearing. Do not describe a stale or failed preload
  as offline readiness.

## Five-minute presenter script

**0:00–0:30 — Briefing.** Show `Respiratory Case Review`, the synthetic-patient disclaimer, the
advanced tier and the visible build ID. Point out that the exact 3D model is preloaded for this
session, then start the case.

**0:30–1:35 — Task 1, explore.** Begin **Orient** in the mid trachea. Follow Carina → Right main
bronchus → Right lower lobe bronchus → Posterior basal segment. Inspect the dominant posterior
basal obstruction on the canvas, then continue.

**1:35–2:10 — Task 2, localise.** On the overlay-free model choose the right lower lobe, then
`Posterior basal segment`, then `Segmental bronchus`. Submit and briefly connect the route to the
location.

**2:10–2:50 — Task 3, severity.** In **Observe**, use the history, serial flow and physiology
clues. Select difficulty completing sentences, flow falling to 170 L/min, oxygen saturation 91%
and falling, and PaCO₂ rising from 4.1 to 5.8 kPa.

**2:50–3:30 — Task 4, physiology.** In **Interpret**, choose that ventilation may be failing to
keep pace with the work of breathing. Use the feedback to distinguish the CO₂ trend from a
reference-range reading in isolation.

**3:30–4:20 — Tasks 5 and 6, synthesis.** In **Diagnose**, choose severe asthma exacerbation with
deteriorating ventilatory reserve. Then choose urgent escalation under the local emergency
pathway. State that the conclusion uses the combined pattern, not the focal model finding alone.

**4:20–5:00 — Results.** Show the score out of 100, weighted components, clue cost, elapsed time
and actual awarded XP. Open comparison, contrast the first responses with the authored
respiratory-educator benchmark, and close by reiterating that the case is a training simulation
pending the recorded review approvals.

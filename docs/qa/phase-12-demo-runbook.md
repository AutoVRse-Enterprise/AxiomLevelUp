# Phase 12 unified demo runbook

This runbook supersedes the Phase 11 runbook for the whole-product demonstration. It covers the
PRD section 80 product tour and the configured `exacerbation-advanced` Case Lab path. The content is
educational and uses synthetic/illustrative data. A technically green rehearsal is not clinical,
legal, production-hosting or physical-device approval.

## Exact candidate setup

1. From the candidate workspace, run:

   ```powershell
   npm install
   npm run check
   $env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'
   npx playwright test --workers=1
   npm run build
   npm run preview -- --host 127.0.0.1 --port 4181 --strictPort
   ```

2. For a hosted rehearsal, deploy that exact `dist/` over HTTPS. If DICOM is hosted separately,
   build with `VITE_DICOM_BASE_URL` set to its HTTPS parent URL and complete
   `phase-09-hosting-prerequisites.md`. Do not use a PHI-bearing or unstable study.
3. Record the commit/worktree state, deployment timestamp, app URL, DICOM URL and visible
   `Build <id>`. Stop if the visible ID differs from the candidate.
4. Close every other tab on the app origin. In browser storage tools clear the origin and unregister
   old workers. Reopen the candidate, wait for the new worker to activate, reload once, and confirm
   `navigator.serviceWorker.controller` is present with no older worker waiting.
5. If **Update available** appears, choose **Reload**, then recheck the build ID before continuing.

## Service-worker and offline preflight

1. While online, open `/learn/cases/asthma-foundation`, choose **Download for offline**, keep the
   page open, and wait for **Available offline**.
2. Confirm the verified package cache contains the exact hash-versioned lung model and case assets.
   This is the offline package; the bounded `versioned-case-models-v1` presentation cache alone is
   not offline readiness.
3. Open `/dev`, choose **Simulate offline**, return to the foundation case, start it and begin the
   first stage. Confirm the real WebGL canvas renders and the Conducting-airway reference clue image
   opens.
4. Return to `/dev` and choose **Restore network**. Reload and verify normal navigation. Do not leave
   simulated offline mode enabled for the demonstration.
5. Open the Interpreting Thoracic CT lesson and Imaging Lab online. Confirm the local 125-slice
   `thoracic-ct-series` reaches an enabled slice control and renders a real Cornerstone canvas.

## Seed and presentation preflight

1. Open `/dev`, choose **Reset demo**, and wait for **Advanced seed applied.**
2. Check Home shows Maya Chen at Level 7 with 4,820 XP and the seeded daily streak.
3. At 1440 × 900, verify Home, pathway, lesson, DICOM, Challenge, all Leaderboard periods, Profile,
   all four Case Lab intros, results and comparison have no blocking overlay or horizontal overflow.
4. Repeat the reachability check at 375 × 812 with touch emulation. Open the DICOM instructions
   sheet and verify its controls and focus return.
5. Open `exacerbation-advanced`; wait for **3D model preloaded for this session.** Start only after
   the canvas, branch controls and Clues action are available.
6. Keep the candidate online unless deliberately demonstrating the downloaded foundation package.

## Five-minute product tour

- **0:00–0:25 — Home.** Show seeded level, XP, streak, daily challenge and the visible build ID.
- **0:25–0:55 — Pathway.** Open **View pathway** and show the Translational Science journey.
- **0:55–1:55 — Lesson.** Open **Interpreting Thoracic CT**. Complete the knowledge check, show the
  visual comparison step, switch real DICOM presets and move to slice 82.
- **1:55–3:05 — Imaging Lab.** Open the configured lab. Use Mediastinal, navigate to slice 81,
  identify the trachea, place the region marker, then use Measure to submit a calibrated
  millimetre line. Show awarded XP, mastery, stars and the Imaging Explorer badge.
- **3:05–3:55 — Daily Challenge.** Complete the configured exploration, conducting-airway question,
  diagnosis and rationale, then show truthful completion outcomes.
- **3:55–4:30 — Leaderboard.** Visit Weekly, Monthly and All time and explain that each is a real
  configured cohort view.
- **4:30–5:00 — Profile.** Show mastery, achievements, activity and unlocked Imaging Fundamentals.

The 30-second-per-showcase scripted rehearsal completed this route in **4:21.103 at 1440 × 900** and
**4:19.406 at 375 × 812**. These are automated presenter-paced timings, not observed human timings;
leave the remaining buffer for narration and questions.

## Five-minute Case Lab

- **0:00–0:30 — Briefing.** Open **Respiratory Case Review**, state the synthetic-case boundary,
  show the advanced tier and start.
- **0:30–1:30 — Branch and finding.** Follow Carina → Right main airway → Right lower lobar airway
  → Posterior basal segmental airway. Activate the projected dominant mucus plug on the real WebGL
  canvas.
- **1:30–2:05 — Localisation.** Choose Right lower lobe → Posterior basal segment → Segmental
  bronchus and submit.
- **2:05–2:45 — Severity.** Select speech difficulty, falling peak flow, falling oxygen saturation
  and rising PaCO₂.
- **2:45–3:25 — Physiology.** Explain why rising CO₂ during distress can indicate failing
  ventilation.
- **3:25–4:15 — Synthesis.** Choose severe asthma exacerbation with deteriorating ventilatory
  reserve, then urgent escalation under the local emergency pathway.
- **4:15–5:00 — Debrief.** Show `/100` results, evidence and clue effects, then open comparison for
  authored path, evidence weighting, diagnosis reasoning and step rationales.

The same 30-second-per-showcase rehearsal completed in **4:33.565 desktop** and **4:18.624 phone**.
It used real branch controls and projected canvas activation. It was scripted automation with
deliberate pauses, not a human usability observation.

## Ten-minute combined route

Run the product tour first, reset the advanced seed at `/dev`, then run Case Lab. Measured combined
scripted durations were **8:54.668 desktop** and **8:38.030 phone**, leaving 1:05 and 1:22
respectively for the reset, transitions and concise questions. For a hard ten-minute slot, omit
extra discussion until comparison. If delayed by more than 30 seconds, skip spoken detail—not the
configured interactions, completion outcomes or approval disclaimer.

## Recovery

- **Stale build or waiting worker:** close other origin tabs, activate/reload the waiting worker,
  and recheck the visible build ID. If still stale, clear site data and repeat setup.
- **Incomplete/evicted package:** reconnect, choose **Repair download**, wait for **Available
  offline**, then repeat the offline preflight. Keep the page open during download.
- **3D preload/model failure:** reconnect, clear the stale presentation model cache if needed,
  reload the case intro and use **Retry**. The structure list remains the accessibility fallback,
  but list-only success is not proof of canvas picking.
- **WebGL loss:** use **Retry** after context recovery. If the canvas remains unavailable, stop the
  3D claim and continue only as an explicitly degraded walkthrough.
- **DICOM load/CORS failure:** restore network, verify all 125 instances and host CORS, then Retry.
  Do not substitute screenshots for the real Cornerstone interaction.
- **Blocked result action:** dismiss each earned badge/level dialog with **Continue**, then open
  Compare.
- **Lost time:** return to `/dev`, reset the seed and use the five-minute route independently. Do
  not present a partially restored learner state as the seeded demo.

## Approval boundaries

- Chromium at 1440 × 900 and 375 × 812 touch emulation is a technical rehearsal only. It does not
  approve Android Chrome, iOS Safari/PWA, physical GPU/touch behavior, safe areas, memory pressure,
  installation or offline lifecycle. P9-M01 through P9-M03 remain open.
- Playwright uses ANGLE SwiftShader. It proves real WebGL API and interaction paths, not
  presentation-device performance.
- Segment volumes, airway branches and findings are configured illustrative geometry, not
  patient-derived segmentation or validated anatomy.
- The four-case claims remain unapproved in `phase-12-catalogue-content-review.md`. External client
  use requires recorded respiratory SME, anatomy/pathology and client/legal approvals.
- The bundled DICOM is de-identified educational content and not for diagnosis. Hosted DICOM needs
  the Phase 9 HTTPS/CORS/PHI checks.
- Internal supervised rehearsal may proceed with these boundaries stated. Unsupervised external
  distribution remains blocked until the claim and physical-device gates are recorded or formally
  waived.

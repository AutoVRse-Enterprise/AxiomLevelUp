# Phase 20 Medical Challenge demo runbook

## Readiness boundary

Use the exact verified `dist-sanofi/` artifact recorded in the Phase 20 verdict. Local automation
proves the packaged shell, representative offline challenge and deterministic browser flows. It
does not prove an HTTPS deployment, physical Android/iPhone behavior, clinical correctness with
reviewers, audience enjoyment or production performance.

## Before the session

1. Serve the verified artifact with HTTPS, SPA fallback to `index.html`, correct MIME types and no
   HTML/service-worker caching beyond revalidation.
2. Open `/`, wait for the hub and reload once so the active service worker controls the page.
3. Confirm the header shows the expected build identifier and no update notice.
4. Open the representative Respiratory Challenge online once. Return to the hub.
5. If offline demonstration is planned, disable the network and reload the hub before the audience
   arrives. Confirm the hub and all four Warm-up rounds complete.
6. Restore the network unless offline behavior is part of the script.
7. Keep one clean browser profile/window available for a shared challenge replay.

Do not advertise installation: the Sanofi demo intentionally sets `installPrompt: false`.

## Reset profiles

- Fresh: open `/you?presenter=1`, select **Reset progress**, wait for **Progress reset.**, then
  return to **Play**.
- Returning: open `/you?presenter=1`, select **Seed returning player**, wait for
  **Returning-player history ready.**, then return to **Play**.
- Presenter controls are intentionally absent from `/you` without `?presenter=1`.

## Two-to-four-minute participant run

1. On **Play**, select Warm-up, Challenge or Expert.
2. Select **Start a quick challenge** and hand the phone to the participant.
3. Round 1: orient to the glowing marker in the accepted outside-in lung view and lock side,
   region and airway level.
4. Round 2: move through the airway, choose the lobe/segment and review the comparison.
5. Round 3: zoom the histology image, place the marker and compare with the target.
6. Round 4: review evidence, optionally buy a clue and make the clinical call.
7. Review Score, round details and Credits; select **Challenge a colleague** if time allows.

The evidence-only rehearsal records 3:12 Warm-up, 2:40 Challenge and 2:08 Expert wall-clock
targets. These include 20 seconds of reveal dwell and remain inside the 2–4 minute contract.

## Five-to-ten-minute presenter tour

1. Show fresh Play: difficulty choices, daily run and three playable formats.
2. Open Anatomy Hunt and Spot the Finding briefly; identify Clinical Mystery as **New soon**.
3. Seed the returning profile and show best scores, recent results and Credits on **You**.
4. Show Leaderboard period/game/difficulty filters and the visible **Demo leaderboard** disclosure.
5. Open a saved result, share a challenge, then open its link in the clean browser profile.
6. Explain that names, rankings and challenge links are local fictional demo data, not trusted
   identity or live competition.
7. If requested, disable the network and run the prepared offline challenge.

## Recovery

### WebGL

- If **3D view unavailable** appears, select **Retry** once.
- If retry fails, select **Skip round**; the round scores zero and the run can continue.
- Do not describe SwiftShader automation as physical GPU proof.

### Network

- Return online, reload the current route and use **Continue game** if offered.
- If an image/audio request failed, return to Play and restart only after connectivity is stable.
- For the prepared offline path, do not clear browser storage: that removes the activated worker
  and precache.

### Stale service worker

1. Restore the network and close every tab for the demo origin.
2. Reopen the origin and reload once.
3. If the build stamp is still stale, clear site data for this demo origin only, reopen `/`, wait
   for worker activation and reload.
4. Repeat offline preparation before disconnecting.

### Presenter reset

Use `/you?presenter=1`. Never edit IndexedDB/local storage manually during a live session.

## Hosted preflight

Complete `docs/qa/evidence/phase-20/hosted-preflight-template.md` against the exact deployed
artifact. Create a QR code only after the final HTTPS URL is known. Confirm the QR opens that URL;
do not place a placeholder QR in evidence.

## Physical devices

Complete `docs/qa/evidence/phase-20/physical-device-template.md` on at least one Android phone and
one iPhone. Until both records exist, hosted handoff, safe-area, touch/WebGL and physical offline
readiness remain blocked external gates.

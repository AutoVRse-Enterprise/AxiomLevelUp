# Phase 20 Medical Challenge readiness verdict

## Verdict

**Phase 20 revised local demo scope: Go. External audience release: Blocked pending hosted HTTPS
and physical-device evidence. Human/clinical enjoyment: Not assessed. Performance approval: Not
assessed by product direction.**

The Go applies only to the locally verified, selective `dist-sanofi/` artifact and the scripted
presenter flow. It is not a production approval, clinical validation or inference about doctors'
enjoyment. Phase 17's outside-in marker view is the accepted final Round 1 fallback; this verdict
does not claim the original inside-airway presentation.

## Evidence classes

- Automated proof: deterministic unit/component/browser checks and artifact verification.
- Scripted evidence: a repeatable presenter/rehearsal procedure with measured simulated pacing.
- Accepted deviation: explicitly approved product behavior that differs from the original PRD.
- Blocked external evidence: requires people, hosting or physical hardware unavailable locally.
- Deferred evidence: deliberately not used as a Phase 20 blocker.

## PRD §23 criteria

1. **Feels like a game, not training software — Supported by automated/scripted evidence; human
   conclusion open.** The vocabulary scanner covers static routes and every representative run
   state. Hub, timers, score/reveals, retry, challenge and leaderboard flows pass in both viewports.
   Only a participant can confirm the subjective conclusion.
2. **A doctor could plausibly enjoy it casually — Blocked human evidence.** A 2–4 minute flow is
   demonstrated, but no clinician enjoyment/usability session has occurred. Automation cannot
   satisfy this statement.
3. **Respiratory GeoGuessr-style challenge works naturally — Supported with accepted deviation.**
   Deterministic spatial runs pass using look/locate and branch-navigation mechanics. Rounds 1 and
   2 now use a legible outside-in airway map with a depth-independent beacon; this is not an
   inside-airway reconstruction.
4. **More than one interaction mechanic — Proven.** The four-round run executes spatial look,
   spatial exploration, precision image finding and a clinical call through shared primitives.
5. **Exploration degree creates different game modes — Proven.** Quick Challenge, Anatomy Hunt and
   Spot the Finding compose shared pools differently; Warm-up, Challenge and Expert alter movement,
   assistance, options and time without component forks.
6. **Combines medical visuals and clinical information — Proven locally.** The run combines the
   configured lung GLB, licensed histology, audio/table/chart clues and clinical interpretation.
   Scientific/clinical reviewer approval remains outside this automated proof.
7. **Scoring/social competition supports repeatability — Proven as a local simulation.** Results,
   personal bests, retry/rematch, deterministic challenge links and disclosed fictional leaderboard
   filters pass. No backend, trusted identity or live competition is claimed.
8. **Technical ingredients for the larger concept — Supported by implementation evidence.** A
   validated content graph, reusable primitive renderer, deterministic engine, event pipeline,
   service worker, responsive shell, Three.js boundary and selective verifier are integrated.
9. **Not a one-off PowerPoint recreation — Proven structurally.** UI consumes validated
   configuration; production content contains no browser fixtures; shared React/engine code has no
   respiratory-specific screen fork.
10. **Engine can support additional medical challenges — Supported structurally.** Organ-agnostic
    anatomy maps, shared primitives, configured formats and strict semantic validation make new
    content possible without changing the player. This is extensibility evidence, not proof of a
    future authored challenge.

## Automated and scripted proof

- Content: default and Sanofi roots validate with zero warnings; Sanofi production content has 7
  rounds and 3 games.
- Browser: Warm-up, Challenge and Expert complete on desktop and phone; Anatomy Hunt and Spot the
  Finding complete on both; timeout, paid clue, resume, WebGL retry/skip, share replay, filters, You,
  presenter reset, offline and vocabulary paths are covered.
- Accessibility: route/state axe, keyboard-only four-round completion, concise presentation
  announcements and 200% text/no-horizontal-overflow checks pass at 1440×900 and 375×812.
- Visuals: 20 reviewed Sanofi baselines cover every active round, introductions, reveals and
  result/entry surfaces on both viewports. Seven default Phase 13 images remain unchanged; the
  finding-feedback golden intentionally records the corrected shared lumen wall.
- Participant audit: `docs/qa/phase-20-quick-challenge-ux-overhaul.md` records eleven diagnosed UX
  and lifecycle failures, their runtime causes, corrections and remaining limitations.
- Rehearsal: `docs/qa/evidence/phase-20/rehearsal-timing.json` records 192 s Warm-up, 160 s
  Challenge and 128 s Expert paced wall time.
- Offline: after service-worker activation/control, the hub reloads and a complete representative
  challenge runs with the browser context network disabled.
- Artifact: 211 files / 9,174,317 bytes; SHA-256
  `539cb54894e0250d93be095e1aba6b06d586da639f0ee5c821878954b7349349`.

## Open gates

- Hosted HTTPS preflight against the exact artifact: **Blocked**. Use the committed hosted template.
- Physical Android Chrome and iPhone Safari: **Blocked**. Use one device record per platform.
- QR phone handoff: **Blocked** until the final HTTPS URL exists; no placeholder evidence.
- Clinician enjoyment/usability and scientific review: **Not assessed**.
- Lighthouse, first-round CTA latency and anatomy frame-rate targets: **Deferred/non-blocking for
  this demo**. Existing bundle budgets remain regression gates; no performance approval is implied.
- PWA install prompt: intentionally disabled. Offline-capable does not mean install-promoted.

## Release requirements

Serve `dist-sanofi/` over HTTPS with SPA fallback to `index.html`, correct MIME types, immutable
cache headers for hashed assets, revalidation/no-cache for `index.html` and `sw.js`, and no response
rewrites for content/media paths. Re-run `npm run verify:sanofi-build` on the deployed candidate and
record the exact checksum in the hosted preflight. Follow
`docs/qa/phase-20-medical-challenge-runbook.md`.

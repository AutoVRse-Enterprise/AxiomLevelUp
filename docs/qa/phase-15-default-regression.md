# Phase 15 regression record

Recorded 2026-10-07 after implementing the game contract and pure engine.

## Automated gate

- `npm run check`: passed.
- Vitest: 95 files / 593 tests.
- Default content: 5 courses / 13 lessons / 4 cases / 1 anatomy map / 0 rounds / 0 games /
  0 warnings.
- Sanofi content: 0 courses / 0 lessons / 0 cases / 0 anatomy maps / 2 rounds / 1 game /
  0 warnings.
- Default entry: 415,403 raw / 130,133 gzip bytes against 770,000 / 230,000.
- Sanofi entry: 269,469 raw / 84,327 gzip bytes against 300,000 / 95,000.
- Default manifest, HTML metadata and precache isolation match the Phase 14 baseline.
- Default Playwright: 53 passed / 3 intentional skips. All eight desktop golden images passed
  without update.
- Sanofi Playwright: 2 passed.

The first default browser run had one touch-phone DICOM tour timeout while waiting for its
Continue button. The exact test passed on immediate retry, including DICOM completion, and the
complete serial suite then passed 53 / skipped 3 with no failures. This was treated as transient
browser timing, not a Phase 15 product change.

## Default-experience comparison

- No file under `public/content/` changed in the Phase 15 commit range.
- The default route and persisted-key characterization tests pass unchanged.
- `game-session` does not occur in `dist/`; the dedicated store stays outside the default route
  graph.
- The default entry changed from Phase 14's 414,316 raw / 129,861 gzip bytes to 415,403 /
  130,133: +1,087 raw and +272 gzip. This is the expected shared pipeline/schema cost of game
  event progress and learner state v9, within the unchanged budget.
- No snapshot was re-baselined.

## Verdict

Pass. Phase 15 changes shared content, event and learner-state infrastructure without changing
default learner-visible behavior. Phase 16 may build the game player on this contract.

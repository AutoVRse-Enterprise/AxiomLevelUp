# Phase 8 performance report

Date: 2026-10-02

## Bundle results

- Entry: 420,014 raw / 130,031 gzip bytes (budget: 770,000 / 230,000).
- Imaging controller: 3,703,170 raw / 1,006,572 gzip bytes (budget: 3,708,000 /
  1,010,000).
- Confetti: 10,666 raw / 4,244 gzip bytes (budget: 14,000 / 8,000).
- Main CSS: 54.45 kB raw / 10.71 kB gzip.

All learner, developer and player screens are route chunks. The initial entry is 84,552 gzip bytes
smaller than the Phase 8 baseline despite adding Motion and product-polish infrastructure.
Cornerstone remains behind the existing DICOM lazy boundary and is unchanged within build variance.

## Runtime profile

- Normal interface motion uses opacity and transform. Progress bars use compositor-friendly
  `scaleX` rather than layout-changing width animation.
- Route and player transitions are under 300 ms. The celebration sequence is the only longer
  transition and has immediate reduced-motion parity.
- Home's route module is 3.08 kB gzip; lesson routing is 1.29 kB gzip plus a shared 7.78 kB player
  module; completion is part of that shared lazy player module.
- The DICOM viewer is 4.45 kB gzip before the separately loaded imaging controller. No application
  route statically imports Cornerstone.
- Dynamic confetti does not enter the initial or player route chunks.

The mobile Lighthouse baseline already uses simulated mobile CPU throttling. Final Lighthouse and
interactive route checks are recorded in the Phase 8 browser QA report.

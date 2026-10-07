# Phase 18 content plausibility review

**Date:** 2026-10-07  
**Scope:** Production respiratory game rounds and licensed media introduced or reused by Phase 18.  
**Status:** Internal sense check passed. This is not clinical or SME validation.

## Review standard

Each round was checked for terminology, level of anatomical or pathological claim, consistency
between the prompt, answer and feedback, distractor plausibility, absence of product or treatment
claims, synthetic-case disclosure and media provenance. Claims stay at demonstration level and do
not imply diagnostic or treatment guidance.

## Connected Respiratory Challenge

### `airway-drop-look`

- The answer is limited to side, broad region and airway level. It does not claim patient-grade
  segmental anatomy.
- The outside-in marker and copy agree; no text implies that the player is seeing an endoscopic
  view.
- Warm-up exposes orientation labels while Challenge and Expert conceal them. All configured
  answer dimensions exist at every candidate drop.
- No patient identity, diagnosis, product or treatment claim appears.

### `airway-explore-lower` and `airway-explore-upper`

- The player identifies the seeded airway's lobe and child segment after bounded exploration.
  Proximity scoring is scoped to those authored hierarchy levels.
- Copy describes tracing and localising the marked airway; it does not claim that the procedural
  lumen depicts stenosis, disease or a clinically exact segmental reconstruction.
- Lower and upper pools resolve to reachable segmental waypoints under every movement budget.
- No answer label is exposed before commitment.

### `histology-mucus-spot`

- The source image is documented by its author as an asthma bronchiole with mucoid material,
  goblet-cell change, basement-membrane thickening and inflammation.
- The prompt asks only for the feature most likely to obstruct airflow. The target is the pale
  intraluminal material; airway wall and vessel regions are non-target context.
- The answer label and feedback use **luminal mucus**, a claim supported by the source description.
  The neutral alt text describes morphology without revealing that answer.
- The healthy comparison is an educational bronchiole/alveolar illustration, not a matched control
  specimen; the UI labels it as a reference rather than a patient control.
- This finding is consistent with the subsequent type 2 asthma interpretation, but the Round 3
  intro and prompt do not reveal that diagnosis.

### `clinical-call-t2`

- Variable wheeze, nocturnal fluctuation, eosinophils of 620 cells/µL, FeNO of 58 ppb and variable
  peak flow form a plausible synthetic pattern for asthma with type 2 inflammation.
- Wheeze is supportive but non-specific; eosinophilia can occur in COPD, which keeps the Expert
  distractor plausible. Vocal cord dysfunction is a reasonable symptom-pattern distractor but is
  less consistent with the biomarker and histology combination.
- The answer is presented as the **most plausible interpretation**, not a diagnosis from a single
  test. No therapy, product, dosing or treatment claim appears.
- The patient snapshot explicitly says synthetic. A persistent experience-level synthetic notice
  remains a Phase 19 hub requirement.

## Standalone Spot the Finding rounds

### `histology-destruction-spot`

- The image shows enlarged confluent air spaces with attenuation and loss of intervening septa,
  consistent with the source description of emphysema histopathology.
- The prompt asks for loss of normal alveolar architecture; the target covers a representative
  confluent air space rather than implying that one isolated pixel proves a diagnosis.
- The answer label **alveolar septal loss** and feedback stay at morphology level. They do not make
  a treatment or patient-level diagnosis claim.

### `histology-fibrosis-spot`

- The source describes marked alveolar-wall expansion by fibroblastic proliferation and immature
  connective tissue in usual interstitial pneumonia.
- The authored lower-left target covers conspicuously broadened cellular interstitium and avoids
  the round vascular profiles at lower centre. The answer is therefore **expanded fibrotic
  interstitium**, not a claim that a vessel is a fibroblastic focus.
- The neutral alt text does not name fibrosis or the diagnosis. The prompt asks for a visible
  tissue pattern rather than a complete diagnosis.

## Licensing

- **Asthma bronchiole histology:** Yale Rosen, CC BY-SA 2.0.
- **Emphysema histopathology:** Mikael Häggström, M.D., CC0 1.0.
- **Usual interstitial pneumonia histology:** Yale Rosen, CC BY-SA 2.0.
- **Lung tissue illustration:** OpenStax College, CC BY 3.0.
- **Wheeze recording:** James Heilman, MD, CC BY-SA 3.0.
- **Respiratory model:** BodyParts3D / Database Center for Life Science, CC BY 4.0.

The sanofi asset manifest records source and licence URLs. The result-page Credits sheet derives
its entries from assets referenced by rounds in the completed run.

## Source-deck independence

The authored round titles, prompts, feedback, ordering language and format descriptions were
compared once with `newDemoPRD.md` §7–21. They implement the broad interaction requirements but do
not reproduce the deck's layouts, exact sequence, taxonomy or sample copy.

## Verdict and follow-up

No blocking internal plausibility or licensing issue remains. External clinical SME review is
outside this phase. Phase 19 must display the configured synthetic-case notice on the game hub and
mount the shared Credits sheet on the You page.

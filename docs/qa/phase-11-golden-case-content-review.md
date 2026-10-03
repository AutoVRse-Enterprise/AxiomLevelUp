# Phase 11 golden-case content review

## Review status

**Status: authored draft; not clinically reviewed or approved.**

This ledger covers `public/content/cases/exacerbation-advanced.json` version 2.0. Every clinical
claim below requires respiratory-clinician SME sign-off before an external demonstration. Source
candidates are recorded for review planning only; they have not been checked against the final
copy, edition, jurisdiction or intended learner audience. Client/legal review must separately
approve the single disclaimer and all client-facing claims.

## Intended boundary

- The case is a synthetic advanced learning scenario, not a patient record.
- The 3D airway and findings are configured illustrative geometry, not patient-derived
  reconstruction or validated diagnostic imaging.
- The absolute peak-flow value is not assigned a percentage-of-best severity category because no
  personal best or predicted value is authored.
- The management item stops at urgent escalation under a local pathway; it does not prescribe
  drugs, doses or patient-specific treatment.
- The sole in-product disclaimer is: “Training simulation—not clinical guidance.”

## Claim ledger

1. **Previous variable wheeze and nocturnal cough support an asthma pattern.**
   - Copy locations: patient history, `exac-history`, diagnosis explanation and debrief.
   - Candidate evidence: current GINA Strategy Report sections on symptom patterns used in asthma
     diagnosis.
   - Evidence status: candidate source identified; wording and edition not verified.
   - Required sign-off: respiratory physician or advanced asthma clinician.

2. **Coryzal/viral symptoms and missed preventer doses can occur before worsening asthma
   symptoms.**
   - Copy locations: presenting history and symptom-trajectory clue.
   - Candidate evidence: current GINA Strategy Report sections on exacerbation triggers, adherence
     and modifiable risk factors.
   - Evidence status: candidate source identified; causality is not asserted, but relevance is
     unverified.
   - Required sign-off: respiratory physician or asthma nurse specialist.

3. **Brief, incomplete reliever benefit over six hours represents a worsening trajectory.**
   - Copy locations: patient history and symptom-trajectory clue.
   - Candidate evidence: current GINA acute-exacerbation assessment guidance.
   - Evidence status: source candidate identified; no claim-level review completed.
   - Required sign-off: respiratory clinician.

4. **Diffuse airway-wall thickening with mild luminal narrowing is a plausible asthma-related
   airway finding.**
   - Copy locations: `exac-diffuse-wall-change` and pathology-reference caption.
   - Candidate evidence: standard respiratory pathology text plus current GINA background on
     airway inflammation/remodelling.
   - Evidence status: not source-verified; the visual severity and wording are illustrative.
   - Required sign-off: respiratory pathologist or respiratory physician, plus 3D-content reviewer.

5. **Mucoid material can obstruct a bronchial lumen in severe asthma.**
   - Copy locations: `exac-posterior-basal-plug`, pathology-reference alt/caption and debrief.
   - Candidate evidence: peer-reviewed severe/fatal-asthma pathology literature and a standard
     respiratory pathology reference.
   - Evidence status: source search and claim-level verification outstanding.
   - Required sign-off: respiratory pathologist and respiratory physician.

6. **The authored route and location correspond to the right lower lobe posterior basal segmental
   bronchus.**
   - Copy locations: endoscopic route, localisation options/explanation, benchmark rationale and
     debrief.
   - Candidate evidence: Terminologia Anatomica and a standard thoracic anatomy reference.
   - Evidence status: nomenclature candidate identified; waypoint coordinates are illustrative and
     have not been anatomically validated.
   - Required sign-off: thoracic anatomist, radiologist or respiratory clinician.

7. **The superior, lateral basal and posterior basal branches are credible right-lower-lobe
   segmental alternatives.**
   - Copy locations: lung-map waypoint labels and localisation distractors.
   - Candidate evidence: standard bronchopulmonary segment anatomy reference.
   - Evidence status: labels not independently verified; the branch geometry is not a validated
     reconstruction.
   - Required sign-off: thoracic anatomist or thoracic radiologist.

8. **Difficulty completing sentences contributes severity information during acute respiratory
   distress.**
   - Copy locations: presenting complaint, `exac-history` and `exac-severity-signals`.
   - Candidate evidence: current GINA acute-asthma severity assessment and the current applicable
     national acute-asthma guideline.
   - Evidence status: candidate sources identified; threshold language not verified.
   - Required sign-off: acute-care respiratory clinician.

9. **A falling peak expiratory-flow trajectory indicates worsening airflow limitation.**
   - Copy locations: `exac-flow`, severity task, diagnosis explanation and debrief.
   - Candidate evidence: current GINA sections on objective airflow measurement during
     exacerbations.
   - Evidence status: directional claim not source-verified. The synthetic values have not been
     mapped to predicted or personal-best percentages.
   - Required sign-off: respiratory physician.

10. **Oxygen saturation of 91% on room air and falling is a concerning deterioration signal in
    this context.**
    - Copy locations: `exac-gas`, severity task, diagnosis explanation and debrief.
    - Candidate evidence: current GINA and applicable national acute-asthma severity guidance.
    - Evidence status: candidate sources identified; jurisdiction-specific thresholds and wording
      not checked.
    - Required sign-off: emergency or respiratory physician.

11. **A respiratory rate of 31/min and rising contributes evidence of physiological distress.**
    - Copy locations: `exac-gas`; it is contextual support rather than a scored option.
    - Candidate evidence: current acute-asthma severity guidance.
    - Evidence status: not source-verified.
    - Required sign-off: emergency or respiratory physician.

12. **During substantial asthma-related distress, PaCO₂ may initially be low because of
    hyperventilation.**
    - Copy locations: `exac-co2-reasoning` explanation.
    - Candidate evidence: respiratory physiology text and current acute severe-asthma guidance.
    - Evidence status: source candidate identified; final wording not reviewed.
    - Required sign-off: respiratory physician.

13. **A rise in PaCO₂ from 4.1 to 5.8 kPa during ongoing distress can indicate that ventilation is
    failing to keep pace with work of breathing and that ventilatory reserve is diminishing.**
    - Copy locations: physiology clue, severity task, CO₂ task, diagnosis and debrief.
    - Candidate evidence: current GINA and applicable national guidance on normal/rising PaCO₂ in
      acute severe asthma, supported by a respiratory physiology reference.
    - Evidence status: high-risk claim; source wording, unit interpretation and clinical framing
      are not yet verified.
    - Required sign-off: emergency respiratory physician.

14. **A near-reference PaCO₂ must not be treated as reassurance when the trajectory and other
    observations are worsening.**
    - Copy locations: CO₂ distractor/explanation and final-consequence distractor/explanation.
    - Candidate evidence: same sources as claim 13.
    - Evidence status: high-risk claim; not clinically reviewed.
    - Required sign-off: emergency respiratory physician.

15. **The combined pattern is most consistent with a severe asthma exacerbation with deteriorating
    ventilatory reserve.**
    - Copy locations: diagnosis answer/explanation and debrief.
    - Candidate evidence: current GINA diagnostic and exacerbation-severity guidance.
    - Evidence status: integrated case conclusion has not received SME review; “severe” terminology
      may need alignment to the chosen guideline and jurisdiction.
    - Required sign-off: respiratory physician.

16. **COPD exacerbation, lobar pneumonia and pulmonary embolism are plausible alternatives but are
    less coherent as sole explanations for the authored evidence.**
    - Copy locations: diagnosis distractors.
    - Candidate evidence: current differential-diagnosis guidance for acute breathlessness and
      asthma mimics.
    - Evidence status: distractor plausibility and fairness not reviewed.
    - Required sign-off: respiratory or emergency physician and assessment-design reviewer.

17. **The combined pattern warrants urgent escalation under the applicable local emergency
    pathway.**
    - Copy locations: final consequence answer/explanation and benchmark rationale.
    - Candidate evidence: current GINA and applicable national/local acute-asthma escalation
      guidance.
    - Evidence status: highest-risk management claim; no guideline, jurisdiction or local pathway
      has been selected or verified.
    - Required sign-off: emergency respiratory physician, local governance owner and client/legal
      reviewer.

18. **Neither one focal 3D finding nor one laboratory value should determine the response in
    isolation.**
    - Copy locations: severity, CO₂ and final-consequence explanations.
    - Candidate evidence: assessment-design principle plus integrated acute-asthma evaluation in
      current guideline guidance.
    - Evidence status: clinically reasonable framing but not formally reviewed.
    - Required sign-off: respiratory clinician and learning-design reviewer.

## Required review record

Before external use, record reviewer names, roles, dates, source editions/URLs, requested changes
and final disposition for every numbered claim. Until that record exists, retain the status
**not clinically reviewed or approved**.

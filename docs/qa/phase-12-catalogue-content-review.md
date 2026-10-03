# Phase 12 catalogue content review

## Review status

**All four cases are authored synthetic drafts. None is clinically, anatomically, legally or
client approved.**

This ledger records claims for review; it does not validate them. Every item below has status
**unreviewed** until a named reviewer, role, date, source edition/URL, requested changes and final
disposition are recorded. The only in-product disclaimer in each case is:
“Training simulation—not clinical guidance.”

The configured regions, airway-wall changes, segment volumes and waypoints are illustrative
authoring geometry. They are not patient-derived imaging, validated segmentations or diagnostic
findings.

## Foundation — `asthma-foundation` version 2.0

1. **Trigger-linked symptoms that vary over time and improve after a reliever support an asthma
   pattern.**
   - Locations: patient history, symptom clue, observation task, diagnosis and debrief.
   - Review needed: respiratory clinician; current asthma diagnostic guidance.
   - Status: **unreviewed**.
2. **The synthetic FEV1 increase from 2.45 L to 2.82 L supports reversible airflow limitation.**
   - Locations: spirometry clue, reversibility task and teaching.
   - Review needed: respiratory physiologist/clinician; confirm interpretation and units.
   - Status: **unreviewed**.
3. **Expiratory musical wheeze supports conducting-airway narrowing but is not diagnostic alone.**
   - Locations: audio clue, observation distractor and evidence weighting.
   - Review needed: respiratory clinician and audio provenance reviewer.
   - Status: **unreviewed**.
4. **Blood eosinophils of 480 cells/µL and FeNO of 46 ppb can support inflammatory phenotype
   context without establishing diagnosis.**
   - Locations: biomarker clue, classification and rationale.
   - Review needed: respiratory clinician; jurisdiction- and population-appropriate references.
   - Status: **unreviewed**.
5. **Diffuse airway-wall thickening is a plausible illustrative airway finding.**
   - Locations: configured finding, exploration and teaching.
   - Review needed: respiratory pathologist plus 3D/anatomy reviewer.
   - Status: **unreviewed**.
6. **The right-upper-lobe apical procedural volume and bronchiole choice form a fair foundation
   localisation sequence.**
   - Locations: anatomy exploration/localisation.
   - Review needed: thoracic anatomist and assessment-design reviewer.
   - Status: **unreviewed**.
7. **COPD, inducible laryngeal obstruction and bronchiectasis are fair competing hypotheses for
   the authored presentation.**
   - Locations: differential and diagnosis options.
   - Review needed: respiratory clinician and assessment-design reviewer.
   - Status: **unreviewed**.

## Intermediate — `copd-intermediate` version 2.0

1. **Long tobacco exposure and progressive low-variability symptoms support chronic obstructive
   disease.**
   - Locations: history, observation, diagnosis and debrief.
   - Review needed: respiratory clinician; current COPD diagnostic guidance.
   - Status: **unreviewed**.
2. **FEV1/FVC remaining 0.55 after bronchodilator supports persistent airflow obstruction.**
   - Locations: spirometry, observation, classification and diagnosis.
   - Review needed: respiratory physiologist/clinician; confirm required interpretive caveats.
   - Status: **unreviewed**.
3. **Enlarged distal air spaces with reduced alveolar walls support emphysematous change.**
   - Locations: opening image, anatomy sequence and diagnosis.
   - Review needed: pulmonary pathologist and image-provenance reviewer.
   - Status: **unreviewed**.
4. **Upper-zone structural emphasis and airway-wall change are plausible illustrative findings.**
   - Locations: configured region/wall finding and exploration.
   - Review needed: thoracic radiologist/pathologist and 3D-content reviewer.
   - Status: **unreviewed**.
5. **Loss of distal air-space walls is relevant to reduced elastic recoil and airflow limitation.**
   - Locations: structural interpretation and teaching rationale.
   - Review needed: respiratory physiologist.
   - Status: **unreviewed**.
6. **Wheeze is non-specific across obstructive airway disorders.**
   - Locations: audio clue, observation distractor and differential.
   - Review needed: respiratory clinician.
   - Status: **unreviewed**.
7. **Absent orthopnoea and ankle swelling make heart failure less coherent here but do not exclude
   it.**
   - Locations: cardiac-context clue, differential and debrief.
   - Review needed: cardiology/acute-medicine clinician.
   - Status: **unreviewed**.
8. **Asthma, bronchiectasis and heart failure are fair competitors, while COPD with emphysematous
   change best integrates the authored evidence.**
   - Locations: differential task, diagnosis and teaching.
   - Review needed: respiratory clinician and assessment-design reviewer.
   - Status: **unreviewed**.

## Daily quick case — `wheeze-quick` version 2.0

1. **Cold-air/exercise-linked episodes that settle between triggers support a variable airflow
   pattern.**
   - Locations: patient history, history clue and scenario.
   - Review needed: respiratory clinician.
   - Status: **unreviewed**.
2. **Peak flow increasing from 330 to 410 L/min after a reliever supports a reversible component.**
   - Locations: flow clue, scenario and teaching.
   - Review needed: respiratory clinician; confirm limits of peak-flow interpretation.
   - Status: **unreviewed**.
3. **A diffuse airway-wall finding can support conducting-airway orientation but cannot establish
   diagnosis.**
   - Locations: configured finding, required exploration, structure task and rationale.
   - Review needed: respiratory pathologist and 3D-content reviewer.
   - Status: **unreviewed**.
4. **Asthma is the best-supported authored hypothesis over inducible laryngeal obstruction, acute
   bronchitis and physiologic exertional breathlessness.**
   - Locations: differential, scenario and debrief.
   - Review needed: respiratory clinician and assessment-design reviewer.
   - Status: **unreviewed**.

## Advanced golden case — `exacerbation-advanced` version 2.0

The detailed 18-item ledger remains in
`docs/qa/phase-11-golden-case-content-review.md`. Its status remains **unreviewed and not
approved**. The claim groups carried into this catalogue review are:

1. Variable prior symptoms, coryzal context, missed preventer doses and incomplete reliever benefit
   form a plausible worsening asthma trajectory — **unreviewed**.
2. Diffuse wall thickening and a posterior-basal mucus plug are plausible illustrative airway
   findings — **unreviewed**.
3. The route and labels identify a right-lower-lobe posterior basal segmental bronchus —
   **unreviewed**.
4. Speech limitation, falling peak flow, hypoxaemia and rising respiratory rate contribute
   deterioration evidence — **unreviewed**.
5. Rising PaCO₂ during ongoing distress can indicate diminishing ventilatory reserve and should not
   be treated as reassurance in isolation — **unreviewed; high-risk claim**.
6. The complete pattern best supports severe asthma exacerbation over COPD exacerbation, lobar
   pneumonia and pulmonary embolism — **unreviewed**.
7. The complete deterioration pattern warrants urgent escalation under the applicable local
   emergency pathway — **unreviewed; highest-risk management claim**.

## Approval gate

No case may be represented as clinically approved until every claim has a recorded disposition.
Clinical review must be accompanied by anatomy/pathology review for spatial content and
client/legal review of learner-facing wording and the single-disclaimer approach.

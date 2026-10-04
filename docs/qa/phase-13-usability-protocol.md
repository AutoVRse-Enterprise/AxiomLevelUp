# Phase 13 moderated usability protocol

**Status:** Ready to run after the P13-T14 candidate is frozen  
**Target:** Five unaided sessions: at least three trainee doctors/clinicians and two IT proxies

## Research question

Can a first-time learner understand the Case Lab mission, use the 3D and evidence tools, form a
differential and reach a meaningful debrief without coaching?

This is a product-comprehension study. It does not assess clinical knowledge, medical accuracy or
participant competence.

## Candidate controls

- Record commit, build timestamp, browser, viewport and demo profile before each session.
- Start from the Fresh trainee profile and reset local data before each participant.
- Use the hosted HTTPS candidate when available; otherwise mark the session as a local dry run.
- Do not use `VITE_E2E`, anatomy debug controls, test bridges or authored-answer data.
- Do not enter real patient information. All case content is synthetic.

## Participant mix

- Participants P01–P03: trainee doctors, doctors, nurses, pharmacists or other clinicians familiar
  with evidence-based case review.
- Participants P04–P05: IT, learning-technology or digital-product proxies without prior product
  exposure.
- Exclude project contributors and anyone who has seen the current Case Lab flow.

Record only participant code, broad role group and prior 3D-learning experience. Do not record
names, employers, patients or health information.

## Moderator script

1. “This is a product prototype, not clinical guidance. We are testing the product, not you.”
2. “Please think aloud. I will not explain controls or tell you what answer to choose.”
3. “Start on this page and complete the Foundation case.”
4. After the Foundation debrief: “Now complete the Advanced case.”
5. If the participant is blocked for 60 seconds, ask: “What are you looking for?” Do not provide
   navigation instructions. Record any assistance as a task failure.
6. End with comprehension questions and the standard SUS questionnaire.

## Observations

For each case, capture:

- whether the participant can state the mission after reading the briefing;
- the first action after the first 3D task appears and seconds to that action;
- whether the participant finds Evidence and Case notes without prompting;
- clues reviewed before each scored decision;
- whether decisive evidence is reviewed before final diagnosis;
- differential completion at Observe and Interpret checkpoints;
- localisation completion and whether neutral branch labels are understood;
- wrong turns, backtracking, hesitation longer than 10 seconds and moderator assistance;
- completion outcome and total elapsed time;
- the participant's explanation of the Key takeaway and Recommended next action.

Screen/audio recording is optional and requires explicit consent. The structured observation sheet
is the required evidence.

## Post-task questions

Ask without leading:

1. “What was your mission?”
2. “What did the Case Lab expect you to do with clues?”
3. “What changed your differential?”
4. “What did the 3D task contribute?”
5. “What would you do next?”

Then administer the ten standard System Usability Scale statements on a 1–5
Strongly-disagree-to-Strongly-agree scale:

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need support to use this system.
5. I found the functions in this system well integrated.
6. I thought there was too much inconsistency in this system.
7. I imagine most people would learn to use this system quickly.
8. I found the system cumbersome to use.
9. I felt confident using the system.
10. I needed to learn a lot before I could get going.

Score odd items as response minus 1, even items as 5 minus response, sum and multiply by 2.5.

## Exit thresholds

- At least 4/5 participants accurately state the mission after the briefing.
- At least 4/5 complete both Foundation and Advanced without moderator help.
- The first meaningful action on the initial 3D task occurs within 20 seconds in at least 4/5
  sessions.
- Decisive evidence is reviewed before diagnosis in at least 80% of case runs.
- Mean SUS is at least 70.

All five thresholds must pass. A threshold failure requires a linked issue, a product/content
change and a focused retest with the affected participant type.

## Severity

- **Blocker:** cannot start, progress or recover without moderator intervention.
- **High:** completes only after a misleading path, misses the evidence/3D purpose or cannot explain
  the result.
- **Medium:** hesitation or terminology problem that does not change the outcome.
- **Low:** preference or polish issue outside the learning flow.

## Results record

`docs/qa/phase-13-usability-results.md` must identify the exact candidate and contain:

- participant mix and environment;
- one observation record per participant;
- aggregate mission, completion, first-action, decisive-evidence and SUS results;
- issue IDs linked to fixes and focused retests;
- pass/fail for every threshold;
- explicit limitations and final usability verdict.


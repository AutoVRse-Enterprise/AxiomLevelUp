# Phase 13 finding register

**Status:** Active

## Scope

This register converts the 2026-10-04 conceptual-demo audit into executable Phase 13 ownership.
Clinical accuracy, medical approval, anatomy validation and regulatory review are intentionally
excluded. The durable audit is the Cursor Canvas `client-demo-readiness-audit.canvas.tsx`.

Two audit corrections were applied at baseline:

- **H13 removed:** the Phase 12 evidence tree does contain 21 desktop and 21 phone PNGs.
- **H08 narrowed:** only Scientific Imaging is inconsistent: 95 course minutes vs 85 lesson
  minutes.

## Blockers

| ID | Summary | Owner | Disposition |
| --- | --- | --- | --- |
| B02 | Unknown-point mechanic missing | P13-T08 | Open |
| B04 | Physical Android/iOS gates open | P13-T16 | Open; pass or record desktop-only waiver |
| B05 | Production delivery preflight incomplete | P13-T16 | Open |
| B06 | Two SVG lesson images fail to decode | P13-T01 | Closed: UTF-8 assets plus XML validator |

## High findings

| ID | Summary | Owner | Disposition |
| --- | --- | --- | --- |
| H01 | Multiplayer, duels and KOL challenges absent | P13-T13 | Open; simulated preview only |
| H02 | Segmented rankings absent | P13-T13 | Open; simulated preview only |
| H03 | 3D discovery bypassable and not scored | P13-T06, P13-T08, P13-T14 | Open |
| H04 | Navigation prompts leak the answer | P13-T02, P13-T06, P13-T07, P13-T08 | Partial: numeric answer-leak lint active |
| H05 | Case artifacts do not behave as one patient record | P13-T02, P13-T06, P13-T09 | Partial: mission and patient-update contract landed |
| H06 | Benchmark purpose is unclear | P13-T10 | Open |
| H07 | Seeded leaderboard can appear live | P13-T12, P13-T13 | Open |
| H08 | Scientific Imaging duration is 95 vs 85 minutes | P13-T01 | Closed: catalogue now reports 85 minutes |
| H09 | Cross-organ reuse is not demonstrated | P13-T16 | Approved scope deferral; position honestly |
| H11 | DICOM toolbar is hard to operate at 375 px | P13-T01 | Closed: tool and preset groups wrap |
| H12 | Reward outcome messaging is contradictory | P13-T01 | Closed: unavailable rows are omitted |
| H14 | Automation knows target coordinates/answers | P13-T14 | Open |
| H15 | Offline evidence is narrower than the claim | P13-T16 | Open |
| H17 | Development controls ship on public routes | P13-T01 | Closed: `/dev*` is environment-gated |
| H18 | Rehearsal is automation rather than human evidence | P13-T14, P13-T15 | Open |

## Medium findings

| ID | Summary | Owner | Disposition |
| --- | --- | --- | --- |
| M01 | Repeated stage gates interrupt the narrative | P13-T03 | Closed: inline StageBanner replaces modal gates |
| M02 | Internal implementation wording leaks | P13-T01 | Closed: first-attempt comparison uses learner copy |
| M04 | Results and comparisons are dense | P13-T10 | Open |
| M05 | 3D scene gives weak spatial decision cues | P13-T07, P13-T08 | Open |
| M06 | No case demonstrates the full evidence mix | P13-T02, P13-T06 | Partial: findings now explain significance |
| M07 | Weekly challenge copy and rule disagree | P13-T01 | Closed: three-case rule is event-driven |
| M08 | Pathway case node opens a lesson | P13-T01 | Closed: case node resolves to Case Lab |
| M09 | Core mobile routes underperform Home | P13-T14, P13-T16 | Open |
| M10 | Screenshots lack regression assertions | P13-T14 | Open |
| M11 | Lesson DICOM gate rewards controls rather than interpretation | P13-T16 | Approved deferral unless added to the hero route |
| M12 | Device scripts and evidence wording drift | P13-T14, P13-T16 | Open |

## Trainee UX findings

| ID | Summary | Owner | Disposition |
| --- | --- | --- | --- |
| U01 | No coherent learner mental model | P13-T03, P13-T04, P13-T06 | Partial: mission, walkthrough and workspace landed |
| U02 | Default entry assumes prior experience | P13-T11, P13-T12 | Open |
| U03 | Briefing describes content, not mission | P13-T02, P13-T03 | Closed: mission and operating rules render before launch |
| U04 | Stage/task/level progress models compete | P13-T03, P13-T04 | Closed: one stage-progress model |
| U05 | Anatomy controls are separated from task | P13-T04, P13-T07 | Partial: task and evidence now share one workspace |
| U06 | 3D interaction contract is not taught | P13-T03, P13-T07 | Partial: replayable walkthrough establishes workspace |
| U07 | Clues are hidden from dependent questions | P13-T04, P13-T05 | Partial: evidence is in-flow beside each task |
| U08 | Clue economy is not an informed choice | P13-T05 | Open |
| U09 | Scored questions bypass evidence gathering | P13-T02, P13-T06 | Partial: every scored step declares decisive clues |
| U10 | Notes and differential have no clear payoff | P13-T05, P13-T06 | Open |
| U11 | Correct diagnosis can still be `Not rated` | P13-T06, P13-T10 | Open |
| U12 | Notes reveal information prematurely | P13-T05 | Open |
| U13 | Answer construction removes ambiguity | P13-T02, P13-T06 | Partial: exact numeric clue leakage is rejected |
| U14 | The case does not evolve as a patient narrative | P13-T03, P13-T09 | Partial: stage updates are announced inline |
| U15 | Time expectations conflict | P13-T02, P13-T09 | Partial: estimated duration is validated against targets |
| U16 | First-attempt consequences arrive late | P13-T03, P13-T09 | Partial: briefing explains the first-attempt rule |
| U17 | Mobile evidence review loses context | P13-T04, P13-T05 | Closed: Task/Evidence/Notes segments preserve one workspace |
| U18 | Debrief is comprehensive but not directive | P13-T10 | Open |
| U19 | Seeded identity/history obscures first use | P13-T12 | Open |
| U20 | Pathway, Course, Case Lab and Challenge overlap | P13-T01, P13-T11 | Partial: pathway case destination fixed; IA copy remains |
| U21 | Product terminology changes too often | P13-T11 | Open |

## Closure protocol

Each task must update its rows to `Closed` with a test, browser capture, usability observation or
approved deferral reference. No finding is closed solely because code exists.


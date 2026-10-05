# Phase 13 usability results

**Status:** Blocked — moderated participant sessions have not been run; the user confirmed on
2026-10-05 that this gate should remain blocked  
**Protocol:** `docs/qa/phase-13-usability-protocol.md`  
**Required sample:** Three clinicians or trainee doctors and two IT proxies

## Candidate

- Commit/build: to be frozen after P13-T14 passes
- Hosted HTTPS URL: not supplied
- DICOM URL: not supplied
- Human test window: not scheduled

The automated browser suite and internal evaluator dry run are preflight evidence only. They do not
count as participants and cannot be used to calculate mission comprehension, unaided completion,
first-action time or SUS.

## Internal moderator dry run

One local desktop dry run began from a reset Fresh trainee profile and covered Home, the Foundation
briefing, first-run walkthrough and the opening anatomy task. It confirmed that the home
recommendation, mission, deliverables, timing rules and walkthrough are exposed to assistive
technology.

The dry run found two implementation defects before participant testing:

- **D01 — High:** anatomy-exploration steps did not render their primary Continue action until all
  exploration requirements were met. The action now remains visible and disabled until completion,
  preserving the prompt/action layout contract.
- **D02 — Medium:** locked case-achievement descriptions appended `undefined` because the profile
  criterion formatter did not cover the three Case Lab criterion types. The formatter and profile
  rendering now cover all case criteria, with regression assertions.

Neither observation is a usability outcome. Both require confirmation in the normal automated gate
and then in the relevant human sessions.

## Participant records

| Participant | Required role | Environment | Mission | Foundation | Advanced | Evidence runs | First 3D action | SUS | Issues |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | Clinician/trainee | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P02 | Clinician/trainee | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P03 | Clinician/trainee | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P04 | IT proxy | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P05 | IT proxy | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

Use participant codes only. Do not add names, employers, patient information or other personal
data.

For each participant, append a dated record containing the exact candidate/build ID, broad role
group, browser/device, prior 3D-learning experience, mission response, first 3D action and elapsed
seconds, Foundation and Advanced outcomes, reviewed evidence before each conclusion, differential
completion, wrong turns or assistance, takeaway/next-action response, ten SUS responses and linked
issue IDs. A moderator intervention after the 60-second probe records that case as not unaided.

## Threshold result

- Mission stated after briefing by at least 4/5: **Not measured**
- Foundation and Advanced completed unaided by at least 4/5: **Not measured**
- First meaningful 3D action within 20 seconds by at least 4/5: **Not measured**
- Decisive evidence reviewed before diagnosis in at least 80% of case runs: **Not measured**
- Mean SUS at least 70: **Not measured**

**Verdict:** No-go for claiming unaided usability readiness. Five qualifying human sessions and any
resulting focused retests remain mandatory.

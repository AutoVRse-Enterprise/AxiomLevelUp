Yes. With the new direction, I would stop thinking of this as an "e-learning viewer" in the conventional LMS sense.

The runtime should be a **mobile-first, installable learning application for scientific and medical training**, capable of rendering ordinary learning content, game mechanics, and domain-native interactive artifacts such as DICOM studies. The flagship demo should make it obvious that an R&D learner can do something inside the lesson, inspect an image, manipulate a scan, identify a region, measure something, interpret data, and answer questions, rather than merely read slides and click MCQs.

The attached DICOM note reinforces this direction strongly. It recommends using Cornerstone3D directly as an embedded educational component rather than adopting an entire radiology workstation UI through OHIF. Cornerstone already gives us stack rendering, zoom, pan, windowing and volume concepts, while letting us build our own learning UX around it. :chatgpt-content-reference{index="0"} :chatgpt-content-reference{index="1"}

Below is the PRD I would hand to the team.

# Product requirements document

## Gamified medical and scientific learning runtime

**Working name:** Learning Runtime  
**Product area:** Axiom / Brain downstream learning experiences  
**Version:** Demo Runtime v0.1  
**Status:** Build-ready draft  
**Primary audience for this version:** Pharmaceutical and medical R&D learners  
**Initial prospect context:** Sanofi  
**Platform:** Mobile-first responsive Progressive Web App  
**Architecture:** Static React application, driven entirely by local structured course data  
**Backend:** None for this phase  
**Authentication:** None for this phase  
**Axiom integration:** Explicitly out of scope for this phase

---

# 1. Product summary

Build a polished, installable Progressive Web App that demonstrates what a future AI-generated medical and scientific learning experience could look like.

The application must support:

1. A persistent learner identity with realistic progress.
2. Courses and learning pathways.
3. Highly interactive lessons.
4. Rich media and scientific artifacts.
5. A learning-specific DICOM viewer.
6. Assessments and scenario interactions.
7. Points, XP, streaks, levels, badges and rewards.
8. Daily and weekly challenges.
9. Leaderboards.
10. Topic mastery and weak-area tracking.
11. Offline use.
12. Local persistent state.
13. A configuration-driven lesson engine rather than hard-coded course screens.

The application should feel like a credible modern consumer product adapted for enterprise scientific learning.

The visual reference is **premium professional learning product with selected consumer-game patterns**, not a literal Duolingo clone.

---

# 2. Core product thesis

Most enterprise e-learning reduces rich subject matter into:

```text
Read content
→ watch video
→ answer MCQ
→ complete module
```

That is particularly weak for medical, scientific and R&D training because the work itself involves interpretation and manipulation of complex information.

The runtime should instead support:

```text
Learn concept
→ inspect evidence
→ manipulate artifact
→ make decision
→ receive immediate feedback
→ practice weak areas
→ demonstrate mastery
```

Examples:

```text
Radiology
→ manipulate CT/MRI/DICOM study

Medical imaging
→ identify abnormal region

R&D
→ interpret assay or experimental data

Clinical
→ reason through patient scenario

Anatomy
→ inspect visual structure

Drug development
→ classify observations or results

Procedure
→ arrange actions in correct sequence

Pharmacovigilance
→ classify events and make escalation decision
```

This is the core differentiator.

The attached DICOM analysis makes the same broader point: the opportunity is to build **domain-native interactions**, where radiology uses DICOM, manufacturing may use machine-state analysis, anatomy may use 3D models and procedures may use sequencing, rather than forcing every subject through "content → MCQ → points." :chatgpt-content-reference{index="2"}

---

# 3. Goals

## 3.1 Primary demo goal

A prospect should be able to use the application for five minutes and conclude:

> "This could be the interface through which our employees repeatedly learn and practise scientific material."

The demo must communicate four things without explanation:

**Depth:** This can handle serious scientific material, not only compliance trivia.

**Interactivity:** Learners interact with subject matter rather than consume slides.

**Engagement:** The system has enough progression and reward systems to support repeated use.

**Extensibility:** Different courses can reuse the same runtime without rebuilding the application.

---

# 4. What this version is not

This version is not:

* An LMS.
* An authoring product.
* An Axiom integration.
* An AI-generation workflow.
* A trainer dashboard.
* An administrator portal.
* A production user-management platform.
* An enterprise analytics platform.
* A SCORM implementation.
* A PACS integration.
* A diagnostic radiology workstation.
* A full adaptive-learning platform.
* A multi-user backend.
* A real leaderboard service.
* A real rewards redemption service.

The demo should **simulate the finished learner experience properly**, rather than building half of twelve adjacent systems.

---

# 5. Target learner

The product should be designed primarily around a technically educated pharmaceutical or medical learner.

Representative users include:

* Pharmaceutical R&D employees.
* Medical affairs personnel.
* Clinical research staff.
* Scientists.
* Medical or scientific trainees.
* Imaging-focused learners.
* Specialists undergoing continuing training.
* Employees learning internal scientific processes or concepts.

Do not visually design the application as if the user is a school child.

Terminology, typography, scientific assets and information density should signal:

> adult professional + serious subject matter + modern interaction design.

---

# 6. Product principles

## 6.1 Mobile first, not mobile only

The canonical interaction design should be built for approximately 390 to 430 pixel wide mobile screens.

The application must still behave correctly on:

* phone portrait
* phone landscape
* tablet
* desktop browser

Desktop should not simply stretch mobile cards across the screen.

On large screens, use a constrained content column or an expanded layout when an artifact benefits from more room.

DICOM, large images and certain data visualizations should be allowed to expand significantly on desktop.

---

## 6.2 Everything important is real

The demo may use fake learner data and dummy courses, but the interactions themselves should work.

Examples:

* XP actually increments.
* Streak state actually changes.
* Questions actually score.
* Badges can actually unlock.
* Lesson completion affects the pathway.
* Challenge completion affects XP.
* Mastery changes after answering questions.
* Local progress survives reload.
* PWA installation works.
* Offline lessons actually open offline.
* DICOM manipulation actually works.

Avoid a beautiful Figma prototype disguised as software.

---

## 6.3 Everything is configuration-driven

No lesson should be implemented as:

```tsx
if (lesson === "sanofiLesson") {
   return <SpecialSanofiScreen />
}
```

The runtime consumes structured data.

Conceptually:

```text
Course specification
        ↓
Learning runtime
        ↓
UI
```

For this phase, the specification is manually created.

Later:

```text
Axiom
  ↓
same course specification
  ↓
same runtime
```

This separation is non-negotiable.

---

## 6.4 Scientific interactions are first-class primitives

DICOM is not an iframe bolted onto an LMS page.

It is a lesson primitive alongside:

```text
text
image
video
question
scenario
matching
DICOM
interactive image
data table
etc.
```

That architectural choice matters enormously later.

---

# 7. High-level information architecture

The learner-facing application has six primary areas:

```text
Home
│
├── Learning
│   ├── Learning pathway
│   ├── Course
│   └── Lesson
│
├── Daily Challenge
│
├── Leaderboard
│
└── Profile
    ├── Stats
    ├── Mastery
    └── Achievements
```

On mobile, navigation should use a persistent bottom navigation bar.

Recommended tabs:

```text
Home
Learn
Challenge
Leaderboard
Profile
```

Five is the upper sensible limit.

---

# 8. Application shell

## Header

Depending on screen:

* Back navigation.
* Page/course title.
* Current XP or streak where useful.
* Optional overflow menu.
* Offline indicator when relevant.

## Bottom navigation

Visible on top-level screens.

Hidden during immersive lesson interactions where vertical space matters.

## Global feedback layer

Application-level overlay system for:

* XP gained.
* Badge unlocked.
* Level increased.
* Daily streak extended.
* Lesson completed.
* Challenge completed.
* Achievement earned.

These should feel polished rather than intrusive.

---

# 9. Home screen

The home screen must immediately make the application look inhabited.

It should not look like a newly created account.

## Required sections

### Learner status

Display:

```text
Learner name
Current level
Total XP
Daily streak
Weekly goal status
```

Example:

```text
Good morning, Maya

Level 7 · 4,820 XP

🔥 8 day streak
Weekly goal 4 / 5
```

### Continue learning

One prominent course card:

* course title
* category
* percentage completion
* current lesson
* estimated remaining time
* CTA

### Daily challenge

Prominent, compact card.

Example:

```text
Today's Challenge

Imaging Interpretation
5 questions · ~3 min
+75 XP

[Start Challenge]
```

### Recommended revision

Driven by seeded weak-topic data.

Example:

```text
Strengthen your knowledge

Thoracic Imaging
Mastery: 64%

[Practice]
```

### Learning pathway preview

One currently active pathway.

### Recent achievement

One or two unlocked badges.

### Leaderboard teaser

Example:

```text
You're #8 this week
↑ 3 positions
```

### Weekly progress

Graphical five-day or seven-day activity representation.

---

# 10. Learn screen

Displays courses and learning pathways.

For the demo, populate enough content that the product feels mature.

Recommended seed structure:

```text
1 active pathway
3 to 5 visible courses
10 to 15 visible lessons
1 fully implemented lesson
2 to 4 partly implemented but navigable lessons
remaining lessons represented with realistic metadata
```

Some should be:

* completed
* in progress
* available
* locked
* newly added

This allows us to demonstrate progression.

---

# 11. Learning pathway

A pathway represents structured progression through learning activities.

Do not merely use a grid of course cards.

Use a visible journey.

Example:

```text
Introduction               ✓
      │
Core Concepts              ✓
      │
Scientific Foundations     ●
     / \
    /   \
Case Practice 🔒    Imaging Lab 🔒
    \   /
     \ /
Final Challenge 🔒
```

It does not need to literally resemble the Duolingo snake.

It should communicate:

* sequence
* achievement
* locked content
* optional branches
* progression
* current position

Different node types may visually represent:

* lesson
* assessment
* case
* challenge
* practice activity
* checkpoint

---

# 12. Lesson player

The lesson player is the heart of the application.

## Basic lesson flow

```text
Lesson intro
→ learning primitive
→ primitive
→ question
→ feedback
→ primitive
→ domain interaction
→ scenario
→ review
→ completion
```

A detailed lesson should contain approximately 10 to 20 learner actions, not 40 slides.

The experience should remain brisk.

---

# 13. Lesson navigation philosophy

Avoid conventional:

```text
Slide 8 of 43
Next
Next
Next
Next
```

Each step should ask the learner to:

* read something short
* inspect something
* manipulate something
* answer something
* make a decision

Lesson steps should generally fit on one mobile viewport or require modest vertical scrolling.

---

# 14. Primitive model

Every lesson consists of ordered primitives.

Each primitive should conform to a common runtime interface:

```text
id
type
content
assets
interaction rules
completion rule
scoring rule
concept mapping
feedback
optional reward
```

The renderer chooses the correct component based on `type`.

Example:

```text
type: "dicom_identify_region"

→ <DicomIdentifyRegion />
```

This is the future Axiom contract.

---

# 15. Content primitives

## 15.1 Rich text card

Supports:

* heading
* short body text
* emphasis
* lists
* inline terminology definition
* optional image
* key takeaway

Do not build a miniature Microsoft Word renderer.

---

## 15.2 Image

Supports:

* caption
* pinch zoom
* fullscreen
* alt text
* optional annotations

Suitable for:

* anatomy
* microscopy
* diagrams
* pathology
* charts
* experimental imagery

---

## 15.3 Zoomable scientific image

Separate from ordinary image.

Allows:

* pinch zoom
* pan
* reset
* fullscreen
* optional labelled regions

Useful for:

* X-rays
* microscopy
* histology
* diagrams
* pathology imagery

---

## 15.4 Image hotspot

Learner taps specified area.

Modes:

**Explore mode**

Tap hotspots to reveal information.

**Assessment mode**

Prompt asks learner to locate something.

Runtime grades based on target region.

---

## 15.5 Image compare

Support either:

* side-by-side
* swipe slider

Potential use:

```text
normal vs abnormal
before vs after
treated vs untreated
control vs experimental
```

---

## 15.6 Video

Supports:

* poster image
* playback controls
* subtitles
* timestamp markers
* optional pause-and-question points

Offline cacheable when lesson is downloaded.

---

## 15.7 Audio

Supports:

* playback
* waveform or simple progress
* transcript
* optional question following playback

---

## 15.8 Carousel

Used for related:

* figures
* process steps
* cases
* images

Avoid using carousel as the default content container.

---

## 15.9 Data table

Scientific data presentation.

Features:

* responsive horizontal scroll
* column emphasis
* optional highlighted cells
* units
* caption
* expandable fullscreen

---

## 15.10 Chart or graph

For v0, support standard chart components generated from structured values:

* line
* bar
* scatter
* dose-response style curve

Do not require arbitrary chart-building functionality.

The purpose is to let later courses render experimental or clinical data natively.

---

## 15.11 Formula / scientific notation

Support properly rendered mathematical and scientific expressions rather than using screenshots.

This can be implemented using a lightweight math renderer if required.

---

## 15.12 PDF/reference viewer

Low priority, but useful as a reference artifact.

It should not become the primary lesson format.

---

# 16. Assessment primitives

## Multiple choice

Single correct answer.

Must support:

* immediate feedback
* explanation
* retry rules
* concept tags
* difficulty
* XP

---

## Multiple select

One or several correct answers.

Support partial-credit logic later.

For v0, configurable all-or-nothing or partial scoring is sufficient.

---

## True/false

Supported but should not dominate lessons.

---

## Classification

Items are assigned to categories.

Example:

```text
Observed finding

Benign
Potential concern
Requires investigation
```

Strong fit for scientific training.

---

## Match pairs

Useful for:

* molecule ↔ mechanism
* finding ↔ interpretation
* concept ↔ definition
* image ↔ diagnosis
* technique ↔ use

---

## Ordering / sequencing

Drag or tap to reorder.

Useful for:

* procedures
* research workflows
* escalation processes
* experimental steps
* diagnostic reasoning

---

## Fill in the blank

Support one or more accepted responses.

Use sparingly.

---

## Numeric answer

Learner enters numeric response.

Optional:

* unit
* tolerance
* min/max range

Useful for measurements.

---

## Timed response

Wrapper around compatible question types.

Timer should only exist when speed has instructional value.

Not every lesson should become a neurological stress test.

---

# 17. Scenario primitive

Scenario should be treated as a major interaction type, not simply a long MCQ.

Structure:

```text
Scenario context
↓
Decision
↓
Feedback or consequence
↓
Next information
↓
Second decision
↓
Outcome
```

Support 2 to 4 decision points in the demo.

The configuration should permit branching.

Example:

```text
Node A
  choice 1 → Node B
  choice 2 → Node C
  choice 3 → Node D
```

For v0, branching may converge later to reduce content complexity.

---

# 18. DICOM primitive

This should be a flagship capability.

The attached analysis recommends **Cornerstone3D directly**, rather than OHIF, because OHIF brings the full radiology workstation UX, which is excessive for a mobile learning product. Cornerstone gives the imaging engine while we retain control over the learner-facing interface. :chatgpt-content-reference{index="3"}

## 18.1 DICOM component architecture

```text
Lesson Runtime
      │
      ├── ordinary primitives
      │
      └── DicomLearningViewer
                │
                ▼
           Cornerstone3D
                │
                ▼
       curated local DICOM assets
```

No PACS.

No DICOMweb in v0.

No OHIF.

The attached recommendation specifically suggests curated course studies initially rather than PACS integration. :chatgpt-content-reference{index="4"}

---

# 19. Base DICOM viewer capabilities

The demo component should support:

### Required

* load series
* move through slices
* touch swipe through slices
* mouse wheel through slices on desktop
* pinch zoom
* pan
* reset view
* fit to screen
* window/level
* selectable window presets
* fullscreen/expanded mode
* current slice indicator
* loading progress

These core interactions are already in the range described as straightforward in the attached technical note. :chatgpt-content-reference{index="5"}

---

# 20. DICOM presets

Support configurable named presets.

Examples only:

```text
Lung
Bone
Brain
Soft Tissue
Mediastinal
```

The runtime should not assume any particular presets globally.

They belong in the course specification.

---

# 21. Learning-specific DICOM modes

This is where the component becomes significantly more interesting than simply displaying a scan.

The attached document explicitly recommends building a learning-specific DICOM component, including guided inspection, region identification and measurements. :chatgpt-content-reference{index="6"}

## 21.1 Explore mode

Learner freely manipulates the study.

Optional instructional prompt:

```text
Explore the scan before continuing.
```

Completion can require:

* minimum interaction
* viewing specified slice range
* selecting required window
* explicit "Continue"

---

## 21.2 Guided inspection

Example:

```text
1. Scroll through the series.
2. Navigate to the indicated anatomical region.
3. Switch to the required window.
4. Inspect the area.
5. Answer the question.
```

Runtime should be able to detect at least:

* current slice
* selected preset
* whether user interacted

---

## 21.3 Find the region

Prompt:

```text
Tap the region showing the abnormality.
```

Learner selects location.

Course spec defines target region.

Simplest v0 grading:

```text
distance(userPoint, expectedPoint) <= tolerance
```

Better implementation:

```text
userPoint ∈ targetPolygon
```

Immediate feedback:

```text
Correct
```

or:

```text
Not quite.
Look again at the posterior region.
```

---

## 21.4 Identify region on selected slice

A more advanced version evaluates:

```text
correct slice range
+
correct spatial location
```

This is much stronger than giving the learner the correct slice automatically.

---

## 21.5 Measurement task

Prompt:

```text
Measure the maximum diameter of the lesion.
```

Learner uses measurement tool.

Course spec supplies:

```text
reference value
allowed tolerance
```

Example:

```text
expected: 18 mm
tolerance: ±10%
```

The attached note explicitly identifies this as a feasible educational interaction using Cornerstone's annotation/tooling system. :chatgpt-content-reference{index="7"}

---

## 21.6 Annotation reveal

After learner answers:

* reveal expected region
* reveal teacher annotation
* show explanation

Useful for learning rather than merely testing.

---

# 22. DICOM features intentionally excluded from v0

Do not build:

* PACS integration
* QIDO
* WADO
* STOW
* diagnostic reporting
* complex study browser
* PET/CT fusion
* full radiology workstation
* DICOM structured reports
* sophisticated multiple-series management
* advanced 3D volume rendering
* production de-identification pipeline
* massive-study offline support

The product is an **educational viewer**, not a diagnostic system.

---

# 23. DICOM mobile performance

This needs to be treated as a first-week engineering risk.

A 512×512, 300-slice, 16-bit study can represent roughly 157 MB of raw pixel data, and real studies can be considerably larger. The attached note specifically recommends using curated educational subsets rather than shipping giant diagnostic datasets to a phone. :chatgpt-content-reference{index="8"}

For the demo:

```text
Original clinical study
        ↓
select relevant series
        ↓
select useful region/range
        ↓
compress appropriately
        ↓
100 to 200 useful slices
        ↓
course asset
```

Targets should prioritize:

* good Android performance
* acceptable iPhone Safari performance
* controlled memory usage
* progressive loading

Do not optimize for arbitrary 2,000-image studies.

---

# 24. Privacy requirement for medical assets

Any real DICOM files used for the demo must be de-identified before becoming course assets.

DICOM metadata can contain names, IDs, dates, institutions, physicians and other identifying information. Hiding those fields in the UI is not sufficient. The attached recommendation is to strip or replace identifying metadata upstream. :chatgpt-content-reference{index="9"}

For this static demo:

**Preferred:** public de-identified educational dataset.

If internally sourced:

**Required:** explicitly de-identified files before they enter the repository.

---

# 25. Gamification architecture

Gamification should operate across lessons.

It is a global system rather than a set of visual decorations added individually to screens.

Core systems:

```text
XP
↓
Levels

Performance
↓
Stars

Knowledge performance
↓
Mastery

Consistency
↓
Streaks

Milestones
↓
Badges

Recurring behaviour
↓
Challenges

Social comparison
↓
Leaderboard
```

Each serves a separate purpose.

---

# 26. XP

XP represents participation and achievement.

Example configuration:

| Action | XP |
|---|---:|
| Correct standard answer | 10 |
| Correct difficult answer | 20 |
| Complete lesson | 75 |
| Perfect lesson | +30 |
| Complete daily challenge | 50 |
| Perfect challenge | +25 |
| Complete revision activity | 30 |
| First successful DICOM task | configurable |
| Weekly target | 100 |

All amounts must come from configuration.

No magic constants scattered across components.

---

# 27. Levels

Levels derive from lifetime XP.

Example:

```text
Level 1     0 XP
Level 2   250 XP
Level 3   600 XP
...
```

For the demo seed user, start at a reasonably advanced level.

Do not make the prospect watch the user advance from Level 1 "Tiny Science Baby".

Labels, if any, should be professionally configurable.

---

# 28. Stars

Individual lessons can award 1 to 3 stars.

Suggested logic:

```text
1 star: completed
2 stars: >= 75%
3 stars: >= 90%
```

Configurable.

Stars visually communicate course performance without being confused with lifetime XP.

---

# 29. Mastery

Mastery must be distinct from XP.

Mastery represents demonstrated understanding of a concept.

Example:

```text
Imaging Interpretation     84%
Study Design               91%
Biostatistics              68%
Safety Assessment          76%
```

Questions and interactions include one or more concept IDs.

Results update concept mastery.

---

# 30. v0 mastery algorithm

Do not build Bayesian Knowledge Tracing for a sales demo.

Use a deterministic weighted model.

For example:

```text
correct:
mastery += difficultyWeight × gain

incorrect:
mastery -= difficultyWeight × loss
```

Clamp between 0 and 100.

Seed each concept with an initial mastery score.

Later this engine can be replaced without changing the UI.

---

# 31. Daily streak

A streak is maintained by completing one qualifying learning action within the day.

Qualifying activities:

* lesson completion
* daily challenge
* revision session

Simply opening the application does not count.

Display:

```text
🔥 8 day streak
```

---

# 32. Weekly goal

Enterprise schedules differ from consumer language-learning schedules.

Support:

```text
targetDaysPerWeek
```

Example:

```text
Weekly goal
4 / 5 days
```

This prevents weekend behaviour from being mandatory.

---

# 33. Daily challenge

Daily Challenge is a separate playable experience.

It should contain approximately 5 questions or interactions and take 2 to 4 minutes.

For the demo it can be fully static but should simulate intelligent composition.

Challenge summary:

```text
4 / 5 correct

Accuracy       80%
XP earned      +75
Mastery gain   +3%
Streak         8 days
```

One challenge must be genuinely playable.

---

# 34. Weekly challenge

Could be visible as a product capability without requiring a full bespoke implementation.

Example:

```text
Weekly Challenge

Scientific Imaging Sprint
Complete 3 advanced cases

2 / 3 complete
```

This can reuse normal lesson/challenge engine logic.

---

# 35. Leaderboard

The leaderboard should feel contextual rather than absurdly global.

Seed scope:

```text
R&D Learning Cohort
This Week
```

Display approximately 10 learners around current user.

Example:

```text
1   Ananya R.       1,480 XP
2   Claire M.       1,360 XP
3   Vikram S.       1,310 XP
...
8   Maya            940 XP
```

Support UI toggles conceptually for:

```text
Weekly
Monthly
All time
```

Only weekly needs actual behaviour for the demo.

---

# 36. Badge system

Three categories.

## Learning achievements

Examples:

```text
Imaging Fundamentals
Clinical Research Basics
Scientific Data Explorer
```

## Performance achievements

```text
Perfect Lesson
Precision Observer
Case Master
```

## Consistency achievements

```text
7 Day Streak
Four Week Goal
Daily Challenge × 10
```

Badge definitions come from configuration.

---

# 37. Badge unlock experience

When newly earned:

1. Slight background dim.
2. Badge animates in.
3. Short title.
4. One-line reason.
5. XP bonus, if applicable.
6. Continue button.

Should feel satisfying.

Do not make it look like the learner just won a Fortnite skin.

---

# 38. Rewards

Runtime should have an abstract reward model.

Possible future rewards:

* certificate
* digital recognition
* badge
* internal points
* real company reward

For this phase:

**Only digital reward state.**

Example configuration:

```text
reward:
  type: "badge"
  id: "precision-observer"
```

No marketplace or redemption service.

---

# 39. Profile

Profile should make accumulated progress legible.

Required:

### User summary

* avatar
* name
* role
* level
* XP
* current streak

### Stats

* courses completed
* lessons completed
* challenges completed
* questions answered
* accuracy

### Mastery

Topic mastery visualisation.

### Achievements

Unlocked and locked badges.

### Activity

Small weekly activity visualization.

---

# 40. Completion screen

Lesson completion should provide a rewarding summary.

Example:

```text
Lesson complete

Accuracy             88%
XP earned            +135
Mastery              +4%
Stars                ★★★

New personal best

[Continue]
```

Potential badge animation follows if unlocked.

---

# 41. Answer feedback

Feedback should appear immediately in most learning modes.

Correct:

```text
Correct

The finding is consistent with...
+10 XP
```

Incorrect:

```text
Not quite

Notice the opacity in...
```

Then:

```text
Try again
```

or:

```text
Continue
```

depending on configuration.

Mistakes should generally create learning opportunities rather than blocking progress.

---

# 42. Scientific explanation pattern

Every meaningful assessment primitive should support:

```text
answer
explanation
optional evidence/reference
```

For future Axiom integration:

```text
source:
  title
  section
  page
  URL or artifact reference
```

The demo does not require live citations.

The component model should allow them.

---

# 43. Interaction history

Each completed interaction should create an event internally.

Example:

```json
{
  "event": "question_answered",
  "questionId": "q_018",
  "conceptIds": ["thoracic-imaging"],
  "correct": true,
  "attempt": 1,
  "xp": 10
}
```

Events should update state.

No analytics server is required.

---

# 44. Local persistence

Use browser persistence for the demo.

Persist:

* XP
* level
* streak
* weekly goal
* completed lessons
* lesson progress
* challenge results
* badge unlocks
* mastery values
* leaderboard user score
* viewed onboarding state
* downloaded/offline content metadata

Likely approach:

```text
app state
↓
IndexedDB / local storage
```

I would use **IndexedDB for substantive course/progress state** and `localStorage` only for tiny preferences if convenient.

---

# 45. Reset demo state

This is essential for sales demos.

Hidden developer/demo menu:

```text
Reset demo
Seed fresh account
Seed advanced account
Unlock all
Simulate badge
Simulate level-up
Toggle offline mode
```

Do not expose prominently in learner UI.

A demo that worked beautifully five minutes earlier and now refuses to unlock the achievement because Sahil already completed it is an avoidable form of suffering.

---

# 46. Course configuration model

Although Axiom integration is out of scope, the runtime requires a stable data contract from day one.

Conceptually:

```text
App configuration
│
├── learner
├── courses
├── concepts
├── rewards
├── badges
├── leaderboard
└── challenges

Course
│
├── metadata
├── concepts
├── lessons
│   └── primitives
└── progression
```

---

# 47. Course metadata

Future course spec must be able to define:

```text
course ID
title
description
image
category
estimated duration
difficulty
authors
version
concept IDs
lessons
prerequisites
completion requirement
```

---

# 48. Lesson metadata

```text
lesson ID
title
description
estimated duration
difficulty
concept IDs
XP reward
stars configuration
prerequisites
primitive sequence
```

---

# 49. Primitive contract

Every primitive should inherit a base interface conceptually similar to:

```json
{
  "id": "step_12",
  "type": "multiple_choice",
  "conceptIds": ["concept_a"],
  "content": {},
  "completion": {},
  "scoring": {},
  "feedback": {}
}
```

Specific primitive types extend `content`.

Later, once the runtime stabilizes, we should formalize this as:

* TypeScript discriminated union.
* JSON Schema.
* Runtime validation with Zod or equivalent.

That becomes the input specification Axiom eventually generates.

---

# 50. Unknown primitive handling

If course data contains an unsupported primitive:

The application must not crash.

Render:

```text
This activity type is not supported
```

in development.

In production demo mode, skip gracefully or surface fallback content.

Schema validation should ideally catch this before runtime.

---

# 51. Asset manifest

Course specification should reference assets rather than contain binary content.

Example:

```text
assets/
  images/
  video/
  audio/
  dicom/
  thumbnails/
```

Each course manifest can refer to:

```text
assetId
path
type
offlineRequired
```

This will matter for offline download behaviour.

---

# 52. PWA requirements

This is now explicitly in scope.

The application must:

* expose valid web app manifest
* have installable app icons
* open standalone when installed
* support Add to Home Screen
* use service worker
* cache application shell
* cache selected course content
* show offline status
* work without network after required assets have been downloaded

React itself does not magically make something a PWA, so explicitly include a PWA/service-worker layer in the stack.

---

# 53. Offline behaviour

There are two types of content.

## Always available offline

* application shell
* navigation
* learner state
* home
* profile
* leaderboard seed data
* normal lesson metadata
* lightweight images/icons

## Course-download content

Potentially large:

* videos
* audio
* DICOM studies
* high-resolution imagery

Course UI should support:

```text
Download for offline
```

With:

```text
estimated size
download state
progress
remove download
```

This is particularly important because DICOM datasets can be large.

---

# 54. Offline UX

When disconnected:

```text
Offline
```

should be visible but not alarming.

Unavailable content:

```text
This lesson has not been downloaded.

Connect to the internet or choose an offline lesson.
```

Downloaded content should behave normally.

---

# 55. DICOM offline strategy

Do not automatically cache every study.

DICOM series should explicitly declare:

```text
offlineAvailable: true/false
```

If learner downloads course:

```text
download manifest
→ retrieve required series
→ save to cache/IndexedDB
→ verify
→ mark available
```

Because large DICOM studies make offline support "annoying", as the attachment accurately puts it, the demo should use intentionally small educational datasets. :chatgpt-content-reference{index="10"}

---

# 56. Installation experience

Browser usage remains completely supported.

When install eligibility is detected:

Subtle prompt after meaningful engagement, not immediately on page load.

Example:

```text
Install Learning App

Access your courses offline and launch
directly from your home screen.

[Install] [Not now]
```

---

# 57. Technology direction

Recommended stack:

```text
React
TypeScript
Vite
React Router
Zod
IndexedDB wrapper
PWA plugin / Workbox
Cornerstone3D
```

State management can be:

```text
Zustand
```

or comparable lightweight approach.

Do not bring Redux into this unless someone actively enjoys paperwork.

---

# 58. DICOM technology

Use:

**Cornerstone3D**

and required Cornerstone tooling/image-loader packages.

Do not manually implement DICOM parsing/rendering.

Do not initially introduce OHIF.

This is consistent with the supplied DICOM analysis, which explicitly recommends Cornerstone3D as the appropriate browser imaging layer for the learning PWA. :chatgpt-content-reference{index="11"}

---

# 59. Component architecture

Conceptually:

```text
App
│
├── AppShell
│
├── Navigation
│
├── Home
│
├── Learn
│   ├── Pathway
│   ├── Course
│   └── LessonPlayer
│       ├── PrimitiveRenderer
│       │   ├── TextPrimitive
│       │   ├── ImagePrimitive
│       │   ├── VideoPrimitive
│       │   ├── MCQPrimitive
│       │   ├── MatchPrimitive
│       │   ├── SequencePrimitive
│       │   ├── ScenarioPrimitive
│       │   ├── DicomPrimitive
│       │   └── ...
│       │
│       └── FeedbackLayer
│
├── Challenge
├── Leaderboard
├── Profile
├── RewardOverlay
│
├── LearningEngine
├── GamificationEngine
├── MasteryEngine
├── PersistenceLayer
└── OfflineManager
```

The important separation is between the UI components and engines.

---

# 60. Learning engine responsibilities

Own:

* current course
* current lesson
* current primitive
* progression
* prerequisite checking
* completion
* attempts
* assessment responses

It should not own:

* XP calculations
* streaks
* badge logic

Those belong elsewhere.

---

# 61. Gamification engine

Own:

* XP
* levels
* stars
* streaks
* weekly goals
* badges
* challenge rewards
* leaderboard score

Input:

```text
learner event
```

Output:

```text
updated gamification state
+
optional reward events
```

---

# 62. Mastery engine

Own:

* concept scores
* concept history
* weak-topic identification

Input:

```text
assessment result
concept IDs
difficulty
attempt
```

Output:

```text
updated mastery
```

---

# 63. Visual direction

Target:

> premium scientific learning product with consumer-grade interaction design.

Not:

> corporate LMS with blue rectangular buttons.

And not:

> children's mobile game with pharmaceutical vocabulary pasted onto it.

Characteristics:

* generous spacing
* clear typography
* strong visual hierarchy
* rounded components, but not cartoonishly rounded
* restrained gradients
* good scientific imagery
* confident full-screen interactions
* polished motion
* obvious feedback
* strong progress visualization

---

# 64. Game visual language

Allow some visual fun in:

* XP animation
* streak
* badges
* completion
* challenge
* level-up

Keep scientific content itself visually serious.

The distinction matters.

Example:

A CT interpretation exercise should look like a high-quality medical tool.

The completion screen can celebrate like a consumer app.

---

# 65. Animation requirements

Use meaningful motion for:

### Question answering

* selected state
* success/failure state
* feedback reveal

### XP gain

Value visually travels or increments.

### Progress

Progress bar advances.

### Badge

Unlock animation.

### Level-up

Short celebratory moment.

### Challenge completion

Confetti or equivalent may be used sparingly.

### Pathway

Node transitions/update states.

Animations should normally be 150 to 500 ms.

Celebration sequences may be longer.

---

# 66. Haptics

Where supported by mobile browser APIs, subtle haptic feedback can optionally accompany:

* correct answer
* badge
* challenge completion

The experience must not depend on haptics.

---

# 67. Sound

Optional.

For demo v0, I would either:

1. omit it entirely, or
2. include only tasteful success/error cues with sound disabled by default.

Nothing kills an enterprise demo quite like your laptop loudly going "DING DING!" in a conference room.

---

# 68. Responsive behaviour

## Mobile portrait

Canonical design.

## Mobile landscape

Useful especially for:

* DICOM
* video
* large images

Artifacts should support landscape immersion.

## Tablet

Content width can expand.

DICOM viewer gains more vertical room.

## Desktop

Top-level screens should use centered constrained layouts.

Large interactive artifacts can use:

```text
content/instruction pane
+
artifact pane
```

where suitable.

---

# 69. DICOM full-screen behaviour

On mobile, provide dedicated immersive viewer mode.

Example:

```text
[Back]                    [Reset]

         DICOM VIEWER

[Window] [Zoom] [Pan] [Measure]

Slice 81 / 146
```

Question/instructions can appear in:

* collapsible bottom sheet
* pre-view screen
* post-view screen

Avoid squeezing DICOM into a tiny 280-pixel box with six toolbars around it.

---

# 70. Accessibility

Even though this is a demo, basic accessibility should be designed properly.

Support:

* semantic buttons
* keyboard operation where applicable
* visible focus states
* sufficient contrast
* reduced-motion preference
* text scaling
* descriptive labels
* image alt text

Some scientific interactions like DICOM inherently require visual use, but the general app should remain accessible.

---

# 71. Performance targets

For normal screens:

* initial shell should feel immediate after first cache
* transitions should remain 60fps where practical
* no visible jank on mainstream mid-tier Android
* lazy-load large primitives

For DICOM:

* show loading state immediately
* progressively initialize
* do not freeze the entire app
* release unused imaging resources
* aggressively test memory behaviour

---

# 72. Loading states

Every substantial artifact needs a designed state.

DICOM example:

```text
Preparing imaging study

Loading 42 / 126 slices
██████████░░░
```

Image/video also require proper placeholders.

No raw spinners floating randomly in white space.

---

# 73. Error states

Required errors:

* asset missing
* unsupported primitive
* corrupted course spec
* DICOM load failure
* offline asset unavailable
* storage quota issue

Every error should provide:

* understandable explanation
* recovery action

---

# 74. Demo seed data

We need enough data to demonstrate product depth before a real course exists.

Seed:

### Learner

One realistic R&D learner.

### Courses

Approximately 4.

Titles can remain generic scientific placeholders until course creation.

### Lessons

Approximately 12.

States distributed among:

* completed
* current
* available
* locked

### Mastery concepts

Approximately 6 to 8.

### Leaderboard

Approximately 15 fake users.

### Badges

Approximately 10.

### Daily challenge

One fully functional challenge.

### Detailed lesson

One "runtime showcase" lesson whose only purpose initially is to exercise every important primitive.

This can later be replaced by the real demo course.

---

# 75. Primitive showcase lesson

Before course content is finalized, build an internal showcase lesson.

This lesson should demonstrate:

1. Rich text.
2. Scientific image.
3. Zoomable image.
4. Hotspot.
5. Video.
6. Data table.
7. Chart.
8. MCQ.
9. Multi-select.
10. Matching.
11. Classification.
12. Ordering.
13. Numeric answer.
14. Scenario.
15. DICOM exploration.
16. DICOM target identification.
17. DICOM measurement.
18. Completion/reward.

This becomes the runtime QA fixture.

Very useful even after the Sanofi demo.

---

# 76. Content validation

At application startup or course load:

```text
course JSON
↓
schema validation
↓
valid → load
invalid → descriptive developer error
```

Do not discover malformed course JSON three components deep when React throws an existential crisis.

---

# 77. Versioning

Course manifest should contain:

```text
schemaVersion
courseVersion
```

Example:

```json
{
  "schemaVersion": "0.1",
  "courseVersion": "1.0"
}
```

This will matter once Axiom starts producing specs.

---

# 78. Security

Since the runtime is static and demo-only:

No meaningful authentication/security model is required.

However:

* do not bundle identifiable patient data
* do not embed secrets/API keys
* do not assume static files are private
* do not put sensitive Sanofi content in a public build without approval

---

# 79. Analytics readiness

No analytics backend is needed.

But centralize learner events so future analytics can subscribe to them.

Example event taxonomy:

```text
app_opened
course_opened
lesson_started
primitive_viewed
artifact_interacted
question_answered
dicom_slice_changed
dicom_window_changed
dicom_region_selected
measurement_created
lesson_completed
challenge_completed
badge_unlocked
level_up
course_downloaded
```

Do **not** litter direct analytics calls inside UI components.

Use an event bus/service.

---

# 80. Demo sequences we should ultimately be able to run

A good 5-minute general product demo could be:

### 1. Open installed app

Home shows:

* streak
* level
* XP
* course progress
* daily challenge

### 2. Open learning pathway

Show clear progression.

### 3. Enter detailed lesson

Perform:

* quick knowledge interaction
* visual scientific interaction
* matching/classification

### 4. Enter DICOM activity

* move through CT slices
* change window
* locate area
* measure target

### 5. Complete lesson

Show:

* XP
* mastery
* stars
* badge

### 6. Open Daily Challenge

Answer several rapid questions.

### 7. Show leaderboard

Learner ranking moves.

### 8. Open profile

Show:

* accumulated badges
* mastery
* activity
* level

At that point the prospect has seen both the **learning depth** and the **engagement wrapper**.

Case Lab has a separate five-minute golden-path gate. The Phase 11 exacerbation path must show a
meaningful 3D finding and airway branch, evidence use, diagnosis, explainable scoring, feedback and
comparison in one rehearsed run. The Phase 10 capability scaffold does not yet satisfy that gate;
see `docs/qa/phase-10-demo-readiness-audit.md`.

---

# 81. Acceptance criteria by feature

## Runtime

A new valid course can be loaded without editing React components.

## Lesson engine

At least one lesson containing all required primitives can execute start to finish.

## Persistence

Refreshing browser preserves state.

## Reset

Demo can be reset to known seed state.

## Gamification

XP, stars, level, streak, badge and mastery update from real events.

## Challenge

Daily Challenge is independently playable.

## Leaderboard

Current user's rank responds to seeded XP changes.

## Pathway

Progress and locked/unlocked state visibly update.

## DICOM

Learner can:

* load study
* navigate slices
* zoom
* pan
* window
* choose preset
* reset
* identify ROI
* perform one measurement

## PWA

Application is installable.

## Offline

Installed/downloaded demo course can run without network.

## Responsive

Core flows work on phone and desktop.

---

# 82. Browser test matrix

Minimum:

### Android

Chrome, recent version.

### iPhone

Safari, recent iOS.

### Desktop

Chrome.

Optional:

* Edge
* Safari macOS

DICOM and offline behaviour deserve particular attention on iOS Safari because mobile memory and browser behaviour are more constrained, which the attached technical analysis specifically flags as something to test early. :chatgpt-content-reference{index="12"}

---

# 83. Suggested implementation sequence

I would build this in this exact order.

## Phase 1: Foundation

* React project
* routing
* design tokens
* navigation
* seed data
* state management
* persistence
* schema

## Phase 2: Application surfaces

* Home
* Learn
* Pathway
* Leaderboard
* Profile
* Challenge shell

## Phase 3: Core lesson engine

* primitive renderer
* progression
* completion
* feedback

## Phase 4: Standard primitives

Build ordinary content and assessment primitives.

## Phase 5: Gamification engine

* XP
* stars
* level
* streak
* badges
* weekly goal

## Phase 6: DICOM

Start early enough that it does not become a nasty surprise.

At minimum, run a Cornerstone spike in parallel with phases 1 to 3.

## Phase 7: Offline/PWA

* service worker
* manifest
* course download
* asset caching
* DICOM caching

## Phase 8: Polish

* animations
* responsive
* loading
* empty/error states
* visual refinement

## Phase 9: Showcase and device QA

Keep the primitive showcase in registry parity and complete the automated, browser and physical
Android/iOS matrix. The physical-device gate remains active.

## Phase 10: Case Lab capability foundation

Add first-class case documents, staged play, clues, composite scoring and reusable 3D anatomy.
Phase 10 proves the configuration-driven capability; it does not by itself approve a client demo.

## Phase 11: Case Lab demo hardening

Build one five-minute golden exacerbation path and repair shared-engine P0/P1 demo defects.

## Phase 12: Case Lab depth and polish

Extend the golden path into differentiated tiers, evidence synthesis, teaching-oriented debrief and
remaining learner-facing polish.

---

# 84. One change I would make to the implementation sequence

Even though DICOM is listed later structurally, **do the DICOM technical spike on day one**.

Not because I think it will fail. The attachment suggests the basic viewer itself is relatively straightforward. :chatgpt-content-reference{index="13"}

The risks are elsewhere:

* mobile layout
* touch behaviour
* bundle size
* WebGL
* memory
* PWA caching
* iOS Safari

Prove:

```text
React
+
Cornerstone
+
mobile
+
one real CT series
+
PWA shell
```

immediately.

Then forget about it until the actual component sprint.

---

# 85. What can wait until after Sanofi demo

Explicit backlog:

* backend accounts
* real organizations
* actual social leaderboard
* trainer analytics
* manager dashboards
* notifications
* AI tutor
* adaptive course sequencing
* sophisticated spaced repetition
* certification engine
* LMS integrations
* SCORM
* xAPI
* SSO
* Axiom generation
* automatic source citation
* PACS
* DICOMweb
* 3D volume rendering
* full authoring
* multilingual support
* reward redemption
* team competitions

---

# 86. The key architectural rule

If there is one sentence Sahil and the implementation team should take from this PRD, it is this:

> **Build a learning runtime that renders structured experiences, not a Sanofi course implemented in React.**

The second rule is:

> **Treat scientific artifacts as interactive learning primitives, not attachments.**

And the third:

> **The gamification system lives above individual courses and gives the learner a persistent reason to return.**

If those three things are preserved, building Axiom integration later is relatively clean.

The eventual flow becomes:

```text
                AXIOM
                  │
                  ▼
          Course Specification
                  │
                  ▼
        ┌─────────────────────┐
        │   LEARNING RUNTIME  │
        └──────────┬──────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
    Lessons     Artifacts    Assessment
       │           │           │
       └───────────┼───────────┘
                   ▼
              Learner events
                   │
          ┌────────┼─────────┐
          ▼        ▼         ▼
         XP     Mastery    Streak
          │        │         │
          └────────┼─────────┘
                   ▼
           Persistent learner
              experience
```

The next artifact I would create from this is **the engineering specification for the runtime**, including the exact TypeScript primitive interfaces, JSON Schema, state model, component tree, route structure, IndexedDB structure and definition of every primitive's input/output contract. That is the document I would hand directly to Sahil or dump into Cursor before implementation.
# Medical challenge demo: target experience requirement

## 1. Purpose of this document

This document defines the target experience for the next version of the medical gamification demo.

It is intentionally written as a **product requirement**, not as a list of changes to the current implementation. The downstream coding agent should inspect the existing codebase, understand what already exists, determine the delta, and implement the smallest coherent set of changes required to reach this target experience.

The objective is to demonstrate that AutoVRse already has the underlying capability, tooling and interaction systems required to create sophisticated medical gamification experiences quickly. The demo should feel like an extension of an existing platform capability, not like something custom-built after receiving a detailed client specification.

---

## 2. Business context

The end user is Sanofi. The immediate audience for the product is expected to be specialist doctors who already possess domain knowledge.

This is **not primarily a training product**.

The likely usage scenario is closer to sales enablement and scientific engagement:

A Sanofi medical representative visits a doctor and introduces a lightweight interactive experience along the lines of:

> “We have this new medical challenge. Want to try it?”

The doctor receives a mobile link, opens the experience and plays a short game involving respiratory anatomy, visual clues and clinical reasoning. Ganesh explicitly described this as a game rather than training, likely accessed initially through a mobile link and introduced by a medical representative to an existing doctor. Ganesh x AutoVRse

The underlying business goal is to make the interaction memorable and help Sanofi appear technologically advanced and differentiated. Ganesh described the motive as essentially demonstrating that the company “knows its stuff” and can do more interesting, advanced things than competitors. Ganesh x AutoVRse

Therefore, the product should optimise primarily for:

- curiosity
- entertainment
- professional challenge
- visual appeal
- short-session engagement
- replayability
- social comparison

Educational value can exist naturally within the experience, but the application should **not present itself as an LMS, course platform or formal training tool**.

---

# 3. Core product positioning

The experience should feel like:

**A casual skill-based medical game for doctors.**

A useful mental model is:

**GeoGuessr + medical visual investigation + short clinical puzzles**

The participant is expected to already know medicine. The application gives them an unfamiliar situation and asks them to figure something out.

The experience should test recognition, orientation and interpretation rather than teach from first principles.

The player's mindset should be:

> “Let's see if I can get this right.”

Not:

> “I need to complete my learning module.”

That distinction should drive the entire interface, vocabulary and session structure.

---

# 4. Demo philosophy

The demo has two jobs.

### Job 1: Show the end-user concept

The experience should make it immediately obvious how this could become an engaging product that doctors would voluntarily open and play.

### Job 2: Show AutoVRse's capability

The demo should implicitly demonstrate that AutoVRse possesses reusable systems for:

- interactive medical visuals
- spatial exploration
- game mechanics
- structured challenges
- rich media
- scoring
- feedback
- reusable content formats
- social and competitive experiences

It should **not** look as though AutoVRse saw a specification and manually recreated those exact screens.

The supplied end-user concept explores unknown respiratory locations, different degrees of movement, clinical clues, scoring and competitive play. Gamification Gamification

Our demo should occupy the same broad product territory while using our own interaction language, information architecture and presentation.

---

# 5. Target platform and session length

For the demo, assume a **mobile-first web experience**.

It should work cleanly from a link without requiring installation. Desktop compatibility is useful, but the primary mental model should be something a doctor can open quickly on their phone.

The ideal complete game session is approximately:

**2 to 4 minutes**

The game should contain:

**4 rounds**

A doctor should be able to understand what to do with minimal onboarding.

The sequence should feel fast:

**Start → Play → Answer → Reveal → Next round → Final score**

Avoid unnecessary setup screens.

---

# 6. Overall application structure

The product should no longer be organised primarily around courses, learning paths or formal lessons.

The top-level experience should resemble a **game hub**.

## Home / game hub

The home screen should immediately communicate that this is something the user can play.

A possible structure:

### Primary CTA

**Start a quick challenge**

This should be the dominant action.

### Available game formats

The interface may expose several challenge types, even if only the main respiratory challenge is fully demonstrated.

For example:

- Quick Challenge
- Anatomy Hunt
- Spot the Finding
- Clinical Mystery

These names are illustrative. The exact copy can evolve.

The important idea is that the product visibly supports **multiple gameplay structures**, not one fixed course format.

### Game-related information

The home experience can also contain lightweight elements such as:

- recent score
- best score
- difficulty
- current streak
- challenge history
- leaderboard preview
- challenge a colleague

These should reinforce the game identity.

---

# 7. Core demo game

The primary demo should be a **four-round respiratory challenge**.

Each round should feel related, but should demonstrate a different interaction primitive.

The four-round structure is deliberately broader than a pure location guessing game. This shows that the underlying platform can support multiple kinds of medical challenges.

---

# 8. Round 1: spatial challenge, restricted movement

### Concept

The player is placed at an unfamiliar location inside a respiratory visualisation.

They need to identify where they are.

### Interaction

The player should be able to inspect the scene but **not travel through it**.

Suitable controls include:

- rotate / look around
- zoom
- inspect visual features

No free movement through the respiratory tree is required.

### Challenge

The player answers something such as:

> “Where are you?”

Possible answer dimensions could include:

- left vs right
- upper/lower region
- anatomical structure
- broad airway type

The demo does not need to be anatomically exhaustive.

### Why this round exists

This creates the strongest GeoGuessr analogy:

> You have been dropped somewhere. Work out where you are from visual evidence.

---

# 9. Round 2: spatial challenge, limited movement

The second round should use the same broad location-finding idea but with **greater movement freedom**.

This variation is important because it demonstrates that the game system can create different difficulty and interaction modes without requiring completely different underlying content.

### Interaction

Instead of unrestricted free navigation, allow movement through a **small predefined network of positions or branches**.

For example, the player might:

- move forward
- move backward
- choose between branches
- inspect two or three nearby viewpoints
- zoom / rotate from each position

The goal is to make exploration meaningful without building a full simulation of free movement through the complete respiratory system.

### Challenge

Again, the player ultimately decides where they are.

The difference is that the user can actively search for clues before committing.

This broadly demonstrates the type of variable movement freedom contemplated in the source concept without duplicating its exact mode structure. Gamification

---

# 10. Round 3: spot the finding

The third round should move away from location guessing.

### Concept

Show the player a medical visual containing an abnormality or notable feature.

Ask them to identify it.

Examples could include:

- identify the abnormal region
- select the affected airway
- spot inflammation
- identify mucus obstruction
- distinguish healthy vs altered tissue
- tap the region that looks suspicious

The user should interact directly with the image or visual whenever possible rather than simply choosing from text options.

### Interaction

Suitable mechanics include:

- tap / hotspot selection
- zoom
- pan
- compare views
- select one region from several possibilities

Ganesh specifically described a flow where the doctor inspects a visual, spots an abnormality and selects the relevant area. Ganesh x AutoVRse

### Goal

This round shows that the system supports **visual investigation**, rather than only quizzes.

---

# 11. Round 4: clinical interpretation

The final round should add a light layer of medical reasoning.

### Concept

Give the player a compact set of clues and ask them to make a clinical call.

Possible clues could include:

- visual finding
- brief patient context
- biomarker
- breath sound
- pathology image
- simple measurement

The player then selects the most plausible interpretation or diagnosis.

The concept deck combines visual, anatomical, histological, biomarker and audio information as possible clue types. Gamification

We do not need to demonstrate every clue type.

The point is to show that a game round can combine different media into a single challenge.

### Interaction

The answer can be:

- multiple choice
- selection from a short list
- structured category selection

Free-text diagnosis is unnecessary for this demo.

---

# 12. Feedback after every round

Every answer should receive **brief game feedback**.

Do not turn the result screen into a teaching page.

For a correct answer:

**Correct**

Follow with one short explanation:

> “The branching pattern and airway diameter were the main clues.”

For an incorrect answer:

**Not quite**

Then reveal:

> “Correct answer: Left lower lobe.”

And one sentence:

> “The orientation of the branching pattern was the strongest clue.”

Then immediately provide:

**Next Round**

The end-user deck contains much more detailed educational explanations for errors. Gamification

For this product, those explanations should be compressed into short contextual feedback. The objective is to maintain momentum while still making the answer feel medically grounded.

---

# 13. Scoring

Scoring should reinforce the game feel.

The player should receive points throughout the session.

The exact formula is not important for the demo, but it may consider:

- correctness
- speed
- precision
- number of attempts

The end-user concept similarly proposes performance based on anatomical accuracy, diagnostic accuracy and speed. Gamification

Our presentation need not expose a complicated formula.

A simple experience is enough:

**+850**

**Fast answer bonus +100**

or:

**Round Score: 920**

There should be a visible cumulative score across the four rounds.

---

# 14. Difficulty

Use game-oriented difficulty rather than educational stages.

Recommended structure:

- Easy
- Hard
- Expert

Alternatively:

- Warm-up
- Challenge
- Expert

Avoid labels that imply a curriculum such as:

- beginner course
- intermediate module
- advanced learning path

Difficulty can change things such as:

- amount of movement allowed
- number of clues
- clue obviousness
- response time
- similarity between answer choices

For the current demo, only one difficulty needs to be genuinely playable if required. The UI should nevertheless make the system appear capable of supporting multiple challenge levels.

---

# 15. End-of-session result

After four rounds, show a strong game-style result page.

This should contain:

### Final score

Large and visually prominent.

Example:

**3,420 points**

### Performance summary

Keep it lightweight:

- 3 / 4 correct
- 72 sec total
- best round: 940
- difficulty: Expert

### A small personality / performance message

Examples:

**Sharp eye. Strong finish.**

**You know your airways.**

**Almost perfect. One clue got you.**

Avoid school-like language such as:

- pass
- fail
- grade
- learning outcome achieved
- course completed

---

# 16. Social and competitive features

Competitive and social functionality should be visible because it makes the product more appropriate for engagement and gives users a reason to share it.

Ganesh specifically proposed allowing one doctor to send a challenge to another doctor after completing it. Ganesh x AutoVRse

The supplied concept also includes timed competition, asynchronous duels and expert challenges. Gamification

For the demo, **these only need convincing UI flows**.

They do not need backend multiplayer functionality.

Useful visible features include:

### Challenge a colleague

At the end of a game:

**Challenge a colleague**

Tapping it can open a mock share flow:

> “I scored 3,420 on the Respiratory Challenge. Think you can beat me?”

No real challenge tracking is required.

### Leaderboard

A small leaderboard can show sample users and scores.

This can be clearly demo data internally.

### Beat this score

Allow the product to imply asynchronous competition:

> **Score to beat: 3,180**

### Expert challenge

Optional.

The UI could suggest special challenges created by a known expert, without implementing the underlying system.

The important thing is to demonstrate that the platform supports **social competition as a primitive**.

---

# 17. Vocabulary and copy direction

The application language must shift decisively away from LMS terminology.

## Prefer

- Play
- Challenge
- Game
- Round
- Score
- Quick Play
- Try Again
- Beat Your Score
- Difficulty
- Challenge a Colleague
- Leaderboard
- Your Best
- Continue Game
- New Challenge
- Result
- Clue
- Time

## Avoid as dominant product language

- Course
- Lesson
- Learning Path
- Training Module
- Curriculum
- Learning Objective
- Complete Lesson
- Certification
- Course Progress
- Continue Learning
- Assessment

Some underlying components may still technically function like lessons or assessments. The user should not perceive them that way.

---

# 18. Visual and interaction tone

The product should feel polished, modern and slightly playful while remaining credible for a specialist medical audience.

It should **not** feel like:

- children's gamification
- a corporate LMS
- a mandatory compliance portal
- a generic quiz app

It should feel closer to:

- a premium interactive scientific tool
- a casual expert challenge
- a visually impressive medical game

The audience consists of qualified doctors. The product can assume intelligence and domain familiarity.

Avoid excessive tutorials and instructional text.

Use visuals as the primary interaction surface wherever possible.

---

# 19. Medical content expectations

The demo must be medically sensible, but it does **not** need full SME validation at this stage.

The current material is representative.

The objective is to demonstrate the experience and technical capability before detailed requirement gathering with the actual end user.

Ganesh explicitly noted that the real requirement may change substantially after the direct end-user conversation and NDA-based discovery. Ganesh x AutoVRse

Therefore:

- avoid obviously incorrect anatomy or terminology
- make clues plausible
- make answers internally consistent
- do not spend disproportionate effort creating publication-grade clinical content

Clinical validation belongs to the actual engagement.

---

# 20. What the demo should imply about the platform

Without explicitly explaining implementation details, the user should come away with the impression that the underlying system supports reusable primitives such as:

- image challenges
- 3D / spatial challenges
- location guessing
- hotspot selection
- zoom / rotate / inspect
- restricted movement
- branching movement
- multiple choice
- timed rounds
- multimodal clues
- scoring
- feedback
- difficulty
- social challenges
- leaderboards
- reusable game templates

This is important.

The demo should not look like:

> “AutoVRse built a lung game.”

It should look like:

> “AutoVRse has a system that can rapidly produce this class of interactive medical game.”

---

# 21. What we should deliberately not reproduce

The end-user presentation should be treated as **directional evidence**, not a design specification.

Do not closely reproduce:

- its screen layouts
- exact visual composition
- exact flow sequence
- exact naming conventions
- exact taxonomy
- exact copy
- all its proposed features

The supplied presentation is useful because it confirms the broad territory the client is considering: respiratory exploration, visual clues, location, diagnosis, different exploration constraints, scoring and competitive play. Gamification Gamification

Our demo should independently demonstrate competence in that space.

---

# 22. Explicit non-goals for this demo

The following are **not required**:

- full free-roaming 3D navigation
- anatomically complete respiratory simulation
- real multiplayer
- real asynchronous challenge infrastructure
- real leaderboard backend
- clinical SME validation
- detailed learner analytics
- LMS functionality
- certification
- course authoring workflows
- native mobile app
- Sanofi-specific branding
- exact implementation of the supplied concept deck
- production-ready medical content
- a complete respiratory curriculum

This is a capability demonstration, not the final product.

---

# 23. Demo success criteria

The demo is successful if someone from the end-user side can use it for a few minutes and reach the following conclusions:

1. **This feels like a game, not training software.**

2. **A doctor could plausibly enjoy trying this casually.**

3. **The respiratory setting works naturally as a GeoGuessr-style challenge.**

4. **The platform supports more than one interaction mechanic.**

5. **Different degrees of exploration can create different game modes.**

6. **The application can combine medical visuals and clinical information.**

7. **Scoring and social competition could make this shareable and repeatable.**

8. **AutoVRse clearly already possesses the technical ingredients required to build the larger concept.**

9. **This does not look like a one-off demo manually recreated from a client's PowerPoint.**

10. **It is obvious how the same engine could support many additional medical challenges later.**

---

## Final target experience in one paragraph

The finished demo should be a **mobile-first medical challenge game** where a doctor enters from a game-oriented home screen and completes a short four-round respiratory session. Two rounds involve GeoGuessr-style location deduction with different levels of movement freedom, one asks the user to visually identify a finding, and one asks for a compact clinical interpretation. Each answer receives brief contextual feedback, points accumulate throughout the session, and the experience finishes with a score and visible social options such as challenging a colleague or viewing a leaderboard. The product should feel polished, clever, fast and professionally competitive, while avoiding the language and structure of traditional training software. Underneath that experience, it should visibly suggest a much broader reusable system for producing different interactive medical games.
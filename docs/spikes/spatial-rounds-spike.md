# Spatial rounds legibility spike

**Date:** 2026-10-07  
**Verdict:** No-go for inside-view Round 1; use the documented outside-in fallback.

## Question

Can a clinician infer side, region and airway level from the current procedural lumen at
375 × 812 using look and field-of-view zoom only?

## Method

The isolated spike at `src/spikes/spatial-rounds/` renders the current waypoint geometry without
importing production code. It exercises six representative drops at 375 × 812 and 1440 × 900:

- trachea-mid;
- carina;
- right-main-airway;
- left-main-airway;
- right-lower-airway; and
- left-upper-airway.

The page exposes carina ridge, cartilage-ring, radius-scaled fog and depth-tint toggles, plus drag,
arrow-key, wheel, pinch and button zoom. Browser evidence was collected under Chromium with a
1.5 pixel-ratio cap.

## Findings

| Cue | Finding |
| --- | --- |
| Cartilage rings | Useful for depth and scale, but do not establish side. |
| Carina ridge | Recognisable at the carina after tuning, but it occludes too much of the small viewport if made prominent. |
| Branch-opening count | Potentially useful, but procedural tubes overlap at junctions and the openings are not consistently separable at phone size. |
| Lumen radius | Distinguishes proximal from distal airway when paired with zoom, but perspective makes it unreliable alone. |
| Wall colour and fog | Improve depth separation; they are authored cues rather than anatomical evidence and must remain subtle. |
| Left/right asymmetry | The source map is effectively mirrored at the main bronchi. Angle and radius changes strong enough to make side obvious would overstate anatomical fidelity. |

The spike sustained well above 60 fps in local SwiftShader at both target viewports, so rendering
cost is not the blocker. The blocker is spatial evidence quality and ambiguity.

## Decision

Use the Phase 17 outside-in fallback for Round 1: orbit a semi-transparent lung with a glowing
seeded drop marker, then answer Side, Region and Airway level. Movement remains disabled. This
preserves the GeoGuessr-style unknown location while avoiding a question whose answer is not
supported by visible evidence.

Round 2 keeps bounded endoscopic branch travel because movement and branch choices themselves
provide evidence. Retain the generic look, zoom, orientation, ring, fog and depth-cue additions;
they improve Round 2 and remain default-off.

## Acceptance boundary

This is an engineering legibility decision, not anatomical or clinical validation. Segment
volumes and procedural airway geometry remain illustrative.

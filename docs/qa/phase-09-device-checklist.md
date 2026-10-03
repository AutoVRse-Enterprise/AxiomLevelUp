# Phase 9 physical-device checklist

Use a production build over HTTPS with the DICOM study served from its production cross-origin
host. Record device model, OS/browser version, network, cold/warm state and observed timings for
each run.

Before testing, complete `phase-09-hosting-prerequisites.md`. Execute
`phase-09-android-script.md` and `phase-09-ios-script.md`, and duplicate
`phase-09-device-results-template.md` for each browser/install context.

## Android Chrome

- [ ] Install or launch the PWA and open every DICOM mode.
- [ ] Verify portrait and landscape layouts, safe areas and orientation changes.
- [ ] Verify one-finger slice scroll, window/level, pan and measurement modes.
- [ ] Verify two-finger pinch zoom does not trigger page zoom or browser navigation.
- [ ] Verify slice slider, preset buttons, Fit, Reset and instructions sheet.
- [ ] Verify immersive entry/exit, Back behavior and focus restoration.
- [ ] Complete guided inspection and its embedded checkpoint.
- [ ] Select and submit the configured identify-region target.
- [ ] Create, replace and submit a calibrated millimetre measurement.
- [ ] Background and resume the app without losing the current slice or draft.
- [ ] Reload a fully visited series offline, navigate distant slices and complete the step.
- [ ] Exercise memory pressure by leaving/re-entering the study and confirm resources are released.
- [ ] Record cold/warm first-image time, full-prefetch time and browser memory where available.

## iOS Safari and installed web app

- [ ] Run the four modes in Safari and from the installed home-screen app.
- [ ] Verify portrait and landscape layouts, notch/home-indicator safe areas and rotation recovery.
- [ ] Verify the fixed immersive fallback when element fullscreen is unavailable.
- [ ] Verify one-finger active tools and two-finger pinch zoom without page scrolling.
- [ ] Verify toolbar horizontal scrolling and that system gestures do not trap the learner.
- [ ] Verify instructions bottom sheet, focus order, dismissal and return focus.
- [ ] Complete guided, identify-region and calibrated-measurement submissions.
- [ ] Background/foreground and lock/unlock the device during a loaded study.
- [ ] Reload the visited series in airplane mode and navigate cached near and distant slices.
- [ ] Test low-memory recovery after Safari evicts the tab or WebGL context.
- [ ] Record cold/warm first-image time and any reload, canvas or cache failures.

## Shared acceptance and evidence

- [ ] Use the externally hosted 125-slice `thoracic-ct` series and verify CORS before testing.
- [ ] Confirm all DICOM labels remain educational-only and no diagnostic claim is introduced.
- [ ] Confirm tap selection is not emitted after a pan, zoom or measurement drag.
- [ ] Confirm physical measurement remains unavailable if the unit is not `mm`.
- [ ] Confirm missing/blocked study recovery offers Retry and the configured Skip behavior.
- [ ] Confirm reduced-motion mode avoids non-essential transitions.
- [ ] Confirm screen-reader names for viewport, tools, presets, slice slider and sheet controls.
- [ ] Capture screenshots for both orientations and a short recording of touch gestures.
- [ ] Attach console errors, device logs and exact reproduction steps for every failure.
- [ ] Add the completed matrix and deviations to the Phase 9 closeout before release approval.

## Phase 10 addendum: Case Lab 3D anatomy

- [ ] Open the foundation, intermediate, advanced and daily quick cases.
- [ ] Verify overview-marker, clue-first and endoscopic entry views.
- [ ] Verify one-finger orbit, two-finger pinch/pan and page-gesture isolation.
- [ ] Select the same structure by model tap and by the keyboard/list alternative.
- [ ] Verify portrait, landscape, safe areas and expanded-view focus restoration.
- [ ] Confirm reduced motion replaces camera flights with immediate cuts.
- [ ] Confirm a blocked model or lost WebGL context offers Retry and leaves the structure list usable.
- [ ] Enter and exit 3D five times without a blank canvas, crash or severe progressive delay.
- [ ] Record frame stability, memory and WebGL/context warnings where the platform exposes them.
- [ ] Complete a case through clues, localisation, results and expert comparison.
- [ ] Capture portrait/landscape screenshots and a recording of 3D touch gestures.

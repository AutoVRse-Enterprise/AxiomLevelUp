# Phase 9 iOS Safari and installed-app script

**Target duration:** 60–75 minutes  
**Required:** physical iPhone, current supported iOS/Safari, HTTPS test environment, screen recording

Run the core matrix once in Safari and repeat the marked lifecycle/immersive/offline checks from the
home-screen app. Record results in `phase-09-device-results-template.md`.

## 1. Baseline and installation

1. Record iPhone model, iOS version, Safari version, viewport, connection and build commit.
2. Clear website data for the host, force-close Safari and load the app URL.
3. Confirm the app shell loads without a certificate, mixed-content or CORS warning.
4. Use Add to Home Screen, launch the installed app and record standalone display and splash/icon
   behavior.
5. In portrait and landscape, confirm content avoids the notch, Dynamic Island and home indicator.

## 2. Standard primitives and system behavior

1. Open the internal showcase and confirm it reports 28 activities covering 27 primitive types.
2. Start in Safari and rotate during image, carousel, data-table and ordering steps.
3. Confirm no content clipping or unexpected document-level horizontal scroll.
4. Pan the zoomable image with one finger and pinch with two; page scroll/zoom must not steal the
   gesture while the viewer is active.
5. Complete wrong, partial, retry and correct assessment paths. iOS vibration is not required
   because Safari does not expose the Vibration API.
6. Enable Reduce Motion in iOS settings, relaunch and confirm non-essential transitions are absent.

## 3. DICOM and immersive fallback

Repeat in Safari and the installed app:

1. Open DICOM explore and record cold/warm first-image times.
2. Verify Scroll, Window, Zoom and Pan; Fit and Reset; Lung and Mediastinal presets.
3. Scroll the toolbar horizontally without triggering browser back/forward navigation.
4. Pinch to zoom and verify the page does not scroll or scale unexpectedly.
5. Enter immersive mode. Confirm the fixed full-viewport fallback fills the safe area when element
   fullscreen is unavailable.
6. Rotate in immersive mode, open/close the instructions sheet, press Exit and confirm focus returns
   to the Expand control.
7. Complete guided inspection, identify the trachea and submit a measurement within 10% of 17.6 mm.
8. Confirm Pan, Zoom and Measure drags do not create identify-region taps.

## 4. Lifecycle, eviction and offline

Repeat the marked steps in Safari and the installed app:

1. Background for 60 seconds with a DICOM draft; return and confirm slice, tool and draft.
2. Lock/unlock during a loaded study and confirm rendering resumes.
3. Visit near and distant slices, enable airplane mode, force-close, relaunch and reload.
4. Confirm the app shell and visited series load, then navigate both near and distant cached slices.
5. Open other memory-heavy tabs/apps until Safari evicts the test tab if practical. Return and
   confirm either clean restoration or an actionable recovery state—never a permanent blank canvas.
6. Restore network, exercise a blocked study, confirm Retry and Continue/Skip, then retry after the
   host is restored.
7. Enter and exit all DICOM modes repeatedly and record reload, canvas, WebGL or memory warnings.

## 5. Phase 10 addendum: Case Lab 3D anatomy

Repeat in Safari and the installed app:

1. Open all three Case Lab tiers and the daily quick case. Confirm the overview-marker, clue-first
   and endoscopic entry views load.
2. In portrait and landscape, orbit with one finger, pinch to zoom and pan with two fingers.
   Confirm Safari navigation and page scrolling do not steal active viewer gestures.
3. Select a lobe on the model, then complete the same localisation using the equivalent structure
   list and an external keyboard if available.
4. Enter the fixed immersive anatomy view, rotate twice and exit. Confirm safe areas, controls,
   focus return and current selection survive.
5. Enable Reduce Motion and confirm waypoint and endoscopic transitions use immediate camera cuts.
6. Exercise a blocked model or WebGL context loss. Confirm the error, Retry action and structure
   list remain usable, then retry after restoring the model.
7. Enter and exit a 3D case five times. Record frame stability, Safari memory warnings, context
   loss, blank canvases and progressive delay.
8. Complete one case through results and expert comparison in both contexts.

## 6. Accessibility and evidence

1. With VoiceOver, verify names for the DICOM viewport, tools, presets, slice slider, instructions
   sheet, 3D anatomy viewport, structure list, clue sheet and immersive exits.
2. Confirm the instructions sheet traps focus while open, dismisses predictably and restores focus.
3. With an external keyboard if available, verify focus order, visible focus, pan/zoom keys and
   structure selection and Escape behavior.
4. Attach Safari and installed-app screenshots in both orientations, DICOM and anatomy
   gesture/immersive recordings, an offline-reload recording and available Web Inspector logs.
5. Record pass/fail/block for every shared checklist item and link each defect.

# Phase 9 Android Chrome script

**Target duration:** 45–60 minutes  
**Required:** physical Android phone, current Chrome, HTTPS test environment, screen recording

Record every result in `phase-09-device-results-template.md`. Stop and file a defect if progress,
input or recovery is blocked; do not mark later dependent steps as passed.

## 1. Baseline and installation

1. Record device model, Android/Chrome versions, viewport, connection and build commit.
2. Clear the site's storage, close Chrome, reopen it and load the app URL.
3. Confirm the app shell loads without a certificate, mixed-content or CORS warning.
4. Use Chrome's install action, launch from the home-screen icon and record whether standalone
   display is used.
5. Open Profile. Confirm Haptic feedback is present and enabled, then return to the showcase.

Pass when installation succeeds, the app launches without browser chrome where supported, and no
blocking console/network error appears.

## 2. Responsive shell and standard primitives

1. Open the internal showcase and confirm it reports 26 activities.
2. Start in portrait. Capture the opening screen and first activity.
3. Rotate to landscape and back during image, carousel, data-table and ordering steps.
4. Confirm no content is clipped, document-level horizontal scrolling appears only inside intended
   controls/tables, and the focused/active step remains stable.
5. On the zoomable image, pan with one finger and pinch with two. Confirm page zoom/navigation is
   not triggered.
6. Complete one correct assessment and confirm one subtle vibration occurs.
7. Disable Haptic feedback in Profile, complete another correct assessment and confirm no
   vibration occurs.
8. Confirm wrong, partial and retry feedback remains readable in portrait and landscape.

## 3. DICOM explore

1. Open `showcase-dicom-explore` from the gallery or progress to it in the lesson.
2. Record cold first-image time from navigation until slice 81 is visible.
3. Verify Scroll, Window, Zoom and Pan tools; Fit and Reset; Lung and Mediastinal presets.
4. Drag through near and distant slices with one finger and the slice slider.
5. Pinch with two fingers while Zoom is active. Confirm the image zooms without page zoom.
6. Enter immersive mode, rotate twice, open/close instructions, then exit. Confirm focus and scroll
   position recover.
7. Satisfy the two-interaction and Mediastinal requirements.

## 4. Guided, identify and measure

1. Guided: select Mediastinal, navigate to slices 78–86, acknowledge continuity and answer Trachea.
2. Identify: on slice 81, place the point in the central dark tracheal air column, submit and
   inspect the revealed reference.
3. Measure: choose Measure, drag across the inner transverse diameter, replace the line once, then
   submit a value within 10% of 17.6 mm.
4. Confirm a drag in Pan, Zoom or Measure mode does not also place an identify-region point.
5. Confirm all labels say educational use only and make no diagnostic claim.

## 5. Lifecycle, cache and recovery

1. Background the installed app for 60 seconds with a DICOM draft in progress; return and confirm
   slice, tool and draft are preserved.
2. Lock/unlock the device during a loaded study and repeat the check.
3. Visit near and distant slices, enable airplane mode, fully close the app, relaunch and reload.
4. Confirm the app shell and visited 125-slice series load; navigate both near and distant slices
   and complete the current step.
5. Restore the network, block or temporarily invalidate the DICOM URL, and confirm Retry plus the
   configured Continue/Skip path is usable. Restore the URL and retry successfully.
6. Enter and exit imaging five times. Confirm no blank canvas, crash or severe progressive delay;
   capture Chrome memory information if available.

## 6. Accessibility and evidence

1. Enable Android's reduced-motion preference and confirm non-essential movement stops.
2. With TalkBack, verify names for the viewport, active tool, presets, slice slider, instructions
   sheet and immersive exit.
3. With a hardware/Bluetooth keyboard if available, verify focus order, visible focus, pan/zoom
   keys and Escape from sheets/immersive mode.
4. Attach portrait/landscape screenshots, a gesture recording, offline-reload recording and logs.
5. Record pass/fail/block for every shared checklist item and link each defect.

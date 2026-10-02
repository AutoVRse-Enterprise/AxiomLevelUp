# Phase 9 showcase browser QA

**Date:** 2026-10-02  
**Environment:** Chrome 140 on Windows 10  
**Build:** production preview at `http://127.0.0.1:4176/`

## Result

The expanded 26-step showcase passes the agent-executable Chromium gate. The real lesson route
started and resumed correctly, the gallery rendered every configured step in interactive and
review modes, missing assets produced recoverable fallbacks, and no tested viewport introduced
document-level horizontal overflow.

Physical Android Chrome and iOS Safari remain separate Phase 9 release gates.

## Responsive matrix

- **375 × 812, touch phone:** lesson opening, rich text and resumed image had no document overflow;
  header actions and Continue remained visible; loaded image exposed useful alt text.
- **812 × 375, touch landscape:** no document overflow; the Continue action remained available with
  vertical scrolling.
- **768 × 900, touch tablet:** no document overflow; the player and shell filled the viewport
  without clipping.
- **1280 × 900, desktop:** no document overflow; the player retained its constrained content
  layout.
- The full gallery also rendered all 26 top-level cards at 375 × 812 with no document overflow,
  including four live DICOM viewports.

## Runtime, semantics and recovery

- The production lesson route advanced from `showcase-rich-text` to `showcase-image`, persisted the
  active session, exposed Resume and Restart after a route reload, and resumed at the image step.
- The resumed image exposed the configured synthetic microscopy alt text and annotation controls.
- The accessibility tree exposed the showcase heading, step heading, progress context, navigation,
  lesson controls and semantic form roles.
- Keyboard `+` on the focused pan/zoom canvas changed its live status from 100% to 125%.
- Review mode populated correct radio/checkbox answers, ordering labels, numeric/fill responses,
  scenario decision history and the DICOM 17.6 mm reference while disabling assessment inputs.
- System reduced-motion emulation resolved `prefers-reduced-motion: reduce`; after settling, the
  page reported zero running and zero retained Web Animations.

## Missing-asset exercise

The gallery's missing-asset simulation was enabled at 375 × 812:

- image, video, audio and PDF-reference fallbacks were present;
- all four DICOM cards showed `Imaging study unavailable`;
- five Continue recovery actions remained available;
- the document retained zero horizontal overflow.

Returning assets and using Reset local state restored normal rendering. A real player unavailable
DICOM path is also covered by the showcase completion integration test.

## Deferred to physical devices

- Real pinch-to-zoom, rotation, safe-area and virtual-keyboard behavior.
- Android vibration and installed-PWA launch.
- iOS standalone/fixed-immersive fallback and tab-eviction recovery.
- Thermal and memory behavior after repeated imaging sessions.

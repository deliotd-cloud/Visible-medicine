# Keyboard shortcuts between imaging panes

The shared CT, MRI, ultrasound and X-ray layout offers three keyboard-focus
shortcuts before its heading: image viewer, information/learning panel and anatomy
index. They appear only while focused, without adding a permanent toolbar.

Each native button focuses a named pane within its own imaging workspace.
Pane containers are programmatically focusable, not extra ordinary Tab stops.
The next Tab enters that pane's controls. No anatomy selection, tour position,
question, answer, score, folder session or URL is changed. No global shortcuts,
authentication changes or new dependencies are introduced.

Visible desktop panes are focused with `preventScroll`. On stacked layouts,
only an entirely off-screen pane is intentionally revealed using nearest-edge
scrolling; independently scrolled pane contents are not reset. Missing targets
fail safely without a document-wide fallback. Focus outlines remain visible.

Tests cover target scoping, missing/foreign targets, desktop versus stacked
scroll behavior, real button handlers and shared layout navigation. Synthetic
focus tests are not a screen-reader certification. Browser checks and exact
source recovery are recorded locally under:
`E:/VisibleMedicine-LocalStaging/20261009-imaging-pane-navigation/`.

All clinical content, masks, 3D models, revision-bound review packets, independent
entitlements and the separate Didanix desktop application are unchanged. This
local-only Sites change does not constitute public deployment or approval.

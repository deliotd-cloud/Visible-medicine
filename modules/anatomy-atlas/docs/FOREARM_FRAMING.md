# Forearm camera framing

The existing View menu now offers **Fit all sources / Frame forearm**. The
default remains both sides; Left and Right are unchanged. No new toolbar.

The frame uses complete primary forearm sources, including brachioradialis's
proximal extent, supplied distal tendons and smaller peripheral vessels. Only
the supplied whole cephalic/basilic veins (FMA13325/13326/22909/22910) are omitted
from the camera-fit set because of their upper-arm extent. They are not hidden.
Membership is independent of system toggles, so vessels-only remains usable.
This is a camera preference, not segmentation or an anatomical cutting plane.
No source surface, identity, position, visibility, label or attachment is changed.

Long cephalic/basilic veins and shared humeri remain loaded. Selecting a source
outside the frame, a hidden/stale/contralateral selection, an empty selection
set, or context-only visibility returns to full-source framing. Full extent
is available in the existing View menu; selecting Frame forearm clears the
selection as in other regions. Camera changes remain part of Undo/Redo.

Explode, Tray, Extract, Focus, isolation, ghost/origin display, cutaway and
Practice retain their existing camera ownership. Source-bound elbow studies
take precedence. If an elbow study's validated ROI becomes unavailable, the
viewer returns to full sources, not a misleading generic forearm frame.

Run `npm run forearm-framing:test` for source-envelope, sided/selection/system,
camera projection and real-component guard checks. The generated report is
`forearm-framing-validation.json`; actual desktop/mobile evidence is separate.
No patient images, dependencies, fonts, models, licensing changes, scan
registration or new clinical acceptance are introduced.

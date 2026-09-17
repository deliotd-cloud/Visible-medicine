# Laterality and isolated selection

Changing the regional Laterality filter clears selection, camera focus and
isolation together. Previously, selecting a structure, enabling Fade others and
changing sides could leave isolation active with no selection: every surface
was faint and excluded from picking. The fix resets that stale isolation state
without adding controls or changing source anatomy.

The side transition retains hidden structures, dissection undo/redo history,
zoom and explode values. Existing inspection reset and practice dismissal remain.
The filter is disabled during an exam. No models, teaching, entitlements,
patient data or clinical approvals change.

`npm run side-isolation:test` extracts and executes the actual JSX callback across
216 combinations of side, value, selection, focus and isolation. It checks empty
events are no-ops, coupled state clearing, and preservation of unrelated state.
Renderer, selection-visibility, dissection-history and workbench checks cover the
adjacent behavior. These source checks do not replace browser/device review.

The coordinating workspace retains before/after browser evidence for desktop
and mobile Explore/Dissect journeys, including direct canvas picking after a
side transition. See its dated side-isolation checkpoint for actual outcomes.
Physical-device and revision-bound radiologist acceptance remain separate gates.

# Whole-body and regional arrangement

## Two distinct study modes

**Spatial anatomy** retains the existing source-aligned 3D body. Rotate, pan, select, fade and frame structures. At zero separation, all original positions are unchanged. The existing centroid expansion, optional anchored skeleton and original-position references keep their previous behaviour.

**Arrange structures** opens a same-scale orthographic tray at 100%. Available catalogue entries are arranged in spaced rows, grouped by system. Shapes, orientations, relative scale, IDs and mesh data remain unchanged; only temporary display translations differ. A compound source entry remains one selectable group, not a newly segmented set of parts. This is explicitly a non-anatomical arrangement.

The arrangement slider has two ranges:

- 0–40%: move from the assembled pose to the existing full spatial expansion.
- 40–100%: interpolate from that expanded pose into the packed tray.

Only the **100% endpoint** has a projected bounding-box clearance guarantee. Intermediate positions can overlap, cross or approach each other; this is not a collision solver, physical tissue movement or anatomical depth sequence. At 0%, display translations are exactly zero.

## Controls and workflow

Use the prominent quick-view row to select all anatomy, bones with muscles, individual systems, or the available nerves with vessels. Presets restore their available source entries, clear dissection overrides/cutaways, and reset framing. Existing individual system switches remain available. The selected side is respected; unpaired/midline context follows the existing regional rules. Nerves, vessels and other incomplete systems retain their coverage disclosures.

The whole-body overview starts with **Dissection, inspection & study tools** folded, keeping the model and quick controls prominent. Open that section for guided windows, cutaway/opacity, saved views and imaging linkage. Regional pages start with their dissection tools expanded; the section can be folded whenever more viewing space is useful.

In the tray:

- Choose anterior/posterior/lateral/superior/inferior (plantar for the foot) to repack the same shapes for that projection. Rotation is locked so projected separation stays meaningful; use **Spatial anatomy** for free rotation.
- Pan using right-drag (or the existing pan gesture), pinch/wheel to zoom, select a structure and use **Frame selected structure** for a close-up. A focus change recentres the view without forcing a different spatial orbit direction.
- Narrow a system or region for fine anatomy. Viewing all 924 entries simultaneously cannot make every small structure readable at an overview scale. No structure is silently resized to fill its slot.
- Selection/fading/focusing do not repack the entries. Changing systems, region/side or removed/ghosted membership can repack them deterministically. Download completion does not change the reserved layout.
- Labels and clipped surfaces follow their own display translations. Cutaways remain tied to original source-space planes, not to a single plane through the arranged row. The tray has no anatomical relationship or imaging-registration meaning.
- Anchored-bone and original-position controls are suspended in the tray; their settings remain available after returning to spatial mode. All entries need to move to provide separate slots.
- Spatial mode and reset return to assembled positions. A guided dissection stage, focused study or practice session also leaves the tray. Practice uses the existing source-position rules and does not disclose the tray's label layout.

## Camera and saved views

The same fitting helper uses the translated geometry bounds. Orthographic pan/zoom is enabled in the tray while normal illustration plates retain their established locked controls. Orthographic zoom now changes projection scale without moving the camera into thick surfaces, and relative pinch/wheel zoom survives a refit. Framing an entry resets accumulated pan while preserving the current spatial direction.

Device-local saved views accept an optional `layout: "spatial" | "tray"` field. Older v1 bookmarks without the field remain spatial and round-trip without an injected field. A tray bookmark requires a body view and orthographic projection; malformed layouts and shoulder-tray combinations are rejected. Saved pan and scale restore against the current tray frame, with direction/up aligned to the named projection. The dedicated shoulder does not gain a tray, but benefits from the shared orthographic depth/scale correction. Shared display review fingerprints were regenerated; no approvals were created.

## Source, rights and tests

`lib/body-arrangement.ts` is an original deterministic shelf-packing implementation over conservative projected bounds. It returns translations only; it never edits geometry. `lib/body-system-presets.ts` defines the preset-to-system mapping. No code, model, diagram, texture or content was copied from the user's Human Atlas reference. No dependencies, fonts, paid APIs or external assets were added, and existing source notices remain intact.

`npm run arrangement:test` verifies 1,926 populated layouts, 9,898,922 pair-clearance cases and 5,778 camera fits across all regions, side filters, presets and authored stages. Its 12,074,267 assertions also cover deterministic input-order independence, exact spatial-mode compatibility, assembled zero, source dimensions, finite transition offsets, local clipping, translated label endpoints, camera depth/zoom and old/new bookmark validation. See `docs/body-arrangement-validation.json`. These are numerical/helper tests—not proof of pixel legibility, mobile interaction, rendering performance or anatomical correctness.

All 924 catalogue entries, 73 body GLBs, source hashes/coordinates, 102 recipes and 84 focuses are preserved. Known compound-source/ownership issues, including the ileocecal component shared by the two inherited intestinal aggregates, are not fixed by arranging their catalogue entries. Clinical validation, actual-device/keyboard/touch QA, true imaging adapters and patient registration remain outstanding.

Next: resume the source queue with the documented intestinal component-ownership issue and unused same-version mesenteric/organ candidates. Do not infer missing tissues or clear existing source holds from a better presentation.

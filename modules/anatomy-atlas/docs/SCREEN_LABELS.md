# Screen-side anatomical labels

Regional, whole-body and dedicated shoulder viewers share `app/scene-label-layer.tsx` and `lib/screen-label-layout.ts`.

The former regional layout alternated left/right by list index. The shoulder used fixed endpoints for each preset. Both are removed. Each eligible label now has an empty anchor group parented beneath the structure's display transform. The existing regional anchor and shoulder's nearest-source-vertex anchor are preserved. The live camera projects that world point every demand frame, after OrbitControls updates; camera rotation, pan, zoom, plate mode and explosion all use the same calculation.

Screen-left anchors receive a box entirely in the left half of the canvas; screen-right anchors receive one in the right half. A point exactly on the centre line goes right deterministically. This is screen position, **not anatomical laterality**: a structure named "right" can correctly appear screen-left in an anterior view. Anatomical IDs, names, source coordinates and imaging-link coordinates are unchanged.

The two columns are spaced independently in anchor-height order using the rendered button dimensions. Boxes wrap instead of overflowing; their font remains readable, with 44px minimum height for coarse pointers. ResizeObserver accounts for responsive resizing and text changes, including late-mounted Drei HTML roots. When a column cannot fit all labels, selection takes priority over landmarks. A crowded column never sends a label across the model to balance counts. No page scrolling, new control or permanent panel is added.

Leader lines and anchor dots are screen overlays and never intercept model picking. Buttons keep native keyboard selection and stop propagation to orbit/underlying selection. Hidden, ghosted, isolated-away, clipped, exam and unloaded structures retain their existing eligibility guards. Offscreen/behind-camera anchors have hidden, disabled labels. No depth-occlusion or surgical-retraction accuracy is claimed.

A selected label is marked `aria-current="true"`, not `aria-pressed`: activating a label selects that structure and does not toggle it off. Unselected labels expose neither state. This corrects the control announcement in the shared regional and whole-body scene without changing selection, visibility, geometry or layout. The component fixture checks both states and the exact-ID click; actual screen-reader behavior still needs device review.

The shoulder retains its preset landmark choices but also labels the selected visible structure. The whole-body/regional landmark limit remains eight total. Labels still disappear in exam mode. Display fingerprints include the new layer, CSS and projection helper, expiring previous shoulder display reviews without changing teaching content or introducing imaging data.

## Verification

Run `npm run labels:test`. The suite checks all 1,022 catalog entries against perspective and orthographic cameras, six presets and oblique directions, zoom/pan, inherited offsets, left-heavy/right-heavy columns, variable text heights, narrow screens and selection priority. It also executes the exact component's frame callback, native label handlers and late-mount resize-observer paths with injected hooks and DOM elements. Other dissection, arrangement, loading, recovery and review suites remain applicable.

This is automated logic/wiring evidence, **not browser visual acceptance**. Still check the actual browser at narrow/desktop widths and 200% text enlargement: free rotation through the midline, text wrapping, dense head/neck landmarks, full explosion, tray, cuts, focus, hide/restore, exam mode, keyboard/touch and graphics recovery. Validate anchor meaning/mesh surface correspondence independently before clinical release.

No dependency, font, source mesh, texture, anatomy record, licence or paid service was added by this change.

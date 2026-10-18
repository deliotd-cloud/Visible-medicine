# Direct native CT/MRI mask selection

In Explore, with overlays visible and Pan off, clicking a displayed saved-mask region selects its exact structure using the existing anatomy-index selection flow. The information panel and mapped concept navigation follow that selection. The existing selection flow may recenter on the structure's saved focus.

If more than one shown mask includes the exact native voxel, a temporary **Masks at this point** panel offers every matching structure in paint order. Nothing is inferred from label similarity, proximity or the topmost paint. The first option receives focus without scrolling the page; native buttons support keyboard activation. Dismiss or Escape returns focus to the image. The anatomy index remains the keyboard alternative for selecting any structure.

The chooser sits outside the image-wheel target, so scrolling its bounded list does not move slices. It is discarded when its study, selection, layer list, opacity, plane, cursor or view-reset context changes, or when Pan, hidden overlays or a quiz makes selection unavailable. No permanent toolbar is added.

## Source and assessment safeguards

- Use only exact entry objects from the current imported study and the currently displayed loaded layers.
- Require finite positive visible alpha and binary masks with valid native shape, crop, buffer length and affine binding. Reject points, unloaded masks, foreign entries and malformed inputs.
- Test the exact native voxel through the existing geometry conversion and `maskContainsVoxel`; no nearest-structure fallback, dilation or guessed projection.
- Outlined regions are selectable by their contained voxels, not only their edge pixels. Mask membership is not a claim that anatomy is clinically visible at every voxel.
- All active quiz modes, including answered questions, omit the selection callback. Existing locate answers are handled separately; the chooser never supplies an answer hint.
- Original images, masks, accepted boundaries, source revisions, authentication and entitlements are unchanged. This is selection within a native study, not registration to the generic 3D Atlas.

## Verification

Focused helper tests cover crop/affine identity, overlaps, duplicates, malformed buffers and visibility. Actual component event tests cover selection, chooser dismissal, source/context invalidation and quiz isolation with synthetic volumes. Existing image-history, slice navigation, zoom, wheel and practice suites remain release checks. TypeScript and the isolated E website build are required before checkpointing.

Local-package browser/GPU testing and radiologist acceptance remain separate; synthetic tests and an unloaded route preview do not establish those approvals. No clinical data is uploaded for these checks.

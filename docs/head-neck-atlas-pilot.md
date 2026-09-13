# Head and neck website pilot

The existing source-based BodyExplorer is now delivered at `/atlas/head-neck-3d`.
Its generated module comes from Atlas commit
`879b5a85ed7da19eb3dc379d1f46c04695ea611b`; do not hand-edit the runtime copy.
The contained module manifest records every delivered file and model hash.

## What is retained

290 regional selections, plus 75 nested selections in seven source-bound study
families, use 37 unchanged GLB bundles. Eye, brain, ventricular, visual pathway,
cricothyroid and cranial-artery studies retain their existing context and teaching.
Dissection, system filters, separation styles, search, labels, saved views and
identification practice reuse the actual Atlas components. Website chrome stays
compact; detailed controls and information use existing panels/drawers.

This source delivery includes no patient images, segmentation masks, clinical
review records or paid lecture assets. No Education adapter is registered.
Conceptual imaging hooks do not imply real case access, patient registration or
entitlements. All clinical content and anatomical fidelity remain review-pending.
The source has known incomplete nerves, vessels and other anatomy; counts are
not completeness claims. The homepage splash and the three existing modules are
unchanged.

## Verification evidence

- Source checks: 365 root/nested study URL round trips, 730 stale/duplicate
  rejections, exact model hashes and strict contained paths. Runtime dependencies
  have full commercial-compatible notices; existing BodyParts3D CC BY 4.0
  attribution and approved branding are preserved.
- Browser testing found and fixed a real wrapper failure: `next/dynamic` accepts
  both a component promise and a default-exported module. The contained wrapper
  now supports both, with actual asynchronous React render regressions.
- Actual desktop embedded rendering and full-screen brainstem, ventricular
  context, eye-layer remove/Undo and right-MCA source-component views were
  sampled. Root dissection changes 290 → 288 after removing platysma; Undo restores
  290. Extract-selected is selectable and visibly separates the chosen source.
- At 390×844 the full-screen information drawer retains Imaging/MRI; document
  width and scroll width both remain 390. Active five-question practice hides
  information tabs; exiting returns to exploration. No answers or review
  decisions were submitted, and no saved view was created.

This is not broad physical-device, full keyboard, clinical or real-DICOM
acceptance. The initial short embedded view frames the head relatively small;
later reset/stage navigation is larger. Investigate initial fit timing and
available viewport space without removing long source structures or changing
canonical positions. Nested panels also merit further small-screen/overflow
polish. Do not substitute an arbitrary skull crop for complete regional data.

Website tests verify exact exported file inventory, hashes, licences, credit
links and host navigation. GitHub/D recovery and actual private publication are
recorded in the main task's dated checkpoint; this file alone does not prove a
successful deployment or public/paid release.

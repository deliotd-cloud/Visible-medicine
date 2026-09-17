# Anterior elbow relationship studies

In **Whole body → Dissect → Study windows & focuses**, search `Elbow`.
Choose **Elbow: muscles & arteries** or **Elbow: superficial veins**; select Left
or Right for a larger single-elbow view. Existing hide, restore, isolate,
extract-selected and dissection Undo/Redo controls apply. These are independent
views, not consecutive surgical layers. Undo retains the separate camera/display
settings, as before.
Focused studies now retain their actual title in the collapsed Dissection and
Study guide headings instead of being mislabelled as Custom view.

The studies combine 32 already-admitted BodyParts3D selections from nine original
bundles. Each view contains 26 bilateral or 13 unilateral selections. They are
whole-body studies because the canonical catalogue splits their muscles and
vessels between arm and forearm. Regional identity is not changed to hide that
boundary; existing arm/forearm and elbow bone studies remain intact. No new
anatomy or surface count is claimed. Source identity, side, frame and complete
bundle metadata must match before the study can open.

The anterior view combines brachialis, supinator, brachioradialis and both
pronator-teres heads with supplied brachial/radial/ulnar arteries. Biceps heads
and humerus/radius/ulna provide context. The venous view instead targets median
cubital, cephalic and basilic veins against the muscle/bone context. Nerves,
skin, fascia and bicipital aponeurosis are not supplied. The biceps tendon is not
a separate selection. No verified vessel continuity, complete fossa, flow,
surgical or venepuncture safety, patient registration or clinical acceptance is
inferred.

## Camera and geometry

The existing source-derived elbow camera band's vertical extent is reused.
Actual vertices from all selected surfaces within that band determine horizontal
and depth extent, with display margins. Every one of the 32 sources has vertices
in the band. This is camera framing, not mesh clipping, an anatomical boundary,
segmentation, landmarks for patient registration or a measurement scale.
Whole surfaces still extend outside the close-up. Rotation, selection and
inspection remain available; separation, isolation, cutaway or origin guides
disable the close-up to frame the transformed display. Extra restored tissues
also disable it. Source coordinates, ordered triangles and model bytes are
unchanged. Captured views continue using the original full-frame basis.

## References and rights

- [TTUHSC dissector teaching](https://anatomy.ttuhscep.edu/schemes/axilla_ans.html),
  cubital-fossa section: brachialis/supinator floor and superficial/deep
  relationships. Original concise descriptive guidance only.
- [Mikuni, Chiba & Tonosaki, 2013](https://pubmed.ncbi.nlm.nih.gov/23131916/):
  superficial venous configurations vary; the named median-cubital connection
  is not universal. No cohort frequency is asserted as a population estimate.

Only original short factual wording and external citations were added. No
publisher images, diagrams, tables, abstracts or copied text are incorporated;
those sources are not treated as a commercially reusable asset library. Existing
BodyParts3D CC BY 4.0 attribution and source-download duties are unchanged.
No dependency, font, media, patient data or payment requirement was introduced.
The owner radiologist must review the exact new recipe/camera/display revision;
prior acceptance must not silently approve these study contexts.

## Verification

`npm run cubital-studies:test` checks original bundle bytes, all 32 source
identities, vertex-derived bounds, six side/study combinations, current study
picker entries, reversible target removal, malformed/mutated source rejection,
unchanged teaching and an independent replay of all prior recipes from saved Git.
The immutable recipe inverse supports older regression checks only, never runtime
or approval migration. Browser evidence and backup receipts are in the main
coordination checkpoint. Clinical/device acceptance and authenticated website
publication remain separate requirements.

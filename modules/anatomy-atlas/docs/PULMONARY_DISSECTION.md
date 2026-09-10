# Lung branch dissection

Select either lung in Thorax or Whole body, then **Explore lung branches**. The same compact workbench supports rotation, six camera presets, labels, selection, hide/Undo, fade others, framing, reassembly and extraction/spatial/tray separation. Search a branch-group name or FMA ID to open the correct lung with that group selected. Teaching remains collapsed until requested. There is no additional permanent toolbar.

## What is actually represented

These are **partial lobe representations consisting of airway and vessel branches**, not separately modelled lung tissue. All files were already inside the original parent lung compounds. A complete source-table partition is not evidence of complete lobe anatomy.

| Source FMA | Source name | Parent | Airway files | Artery files | Vein files |
| --- | --- | --- | ---: | ---: | ---: |
| FMA7333 | upper lobe of right lung | FMA7309 | 21 | 24 | 17 |
| FMA7383 | middle lobe of lung | FMA7309 | 8 | 8 | 9 |
| FMA7337 | lower lobe of right lung | FMA7309 | 24 | 22 | 23 |
| FMA7370 | upper lobe of left lung | FMA7310 | 23 | 21 | 24 |
| FMA7371 | lower lobe of left lung | FMA7310 | 22 | 22 | 12 |

The middle-lobe source name is generic; its right side follows exact parent membership, not a renamed FMA definition. Display names end in “lobe branches” and original names remain in `sourceName`. The source files' smallest explicit labels all describe airways or vessels; no independent parenchymal envelope or fissure surface was found. Labels describe table membership, not a validated perfusion territory.

The two new display bundles retain all 280 original files and 114,750 triangles. The left upper group retains the original single duplicate face in FJ2928. No source surface is mirrored, fabricated, repaired, moved in its anatomical state, or reclassified as a complete tissue volume. Separation is labelled as a teaching arrangement. Colours distinguish groups, not blood oxygenation, vessel class, pathology or scan signal.

## Evidence and ingestion

`npm run pulmonary:audit` verifies the pinned source tables, inventory, parent membership, raw SHA-256, smallest explicit labels and diagnostic topology. Its complete evidence is [pulmonary-source-audit.json](pulmonary-source-audit.json); add `-- --check` to verify freshness without writing. Role classification is a transparent summary of source names, not AI segmentation or clinical adjudication.

`npm run pulmonary:export` uses that evidence and independently rechecks raw hashes and exact table membership. It retains the existing source-to-scene transform, vertex welding tolerance and normal smoothing. The renderer uses a **parent-scoped catalogue and separate left/right bundles**: no contralateral geometry is loaded as invisible or unlabelled context, and no parent aggregate is superimposed.

`npm run pulmonary:test` verifies every transformed triangle with winding and multiplicity, actual bounds/surface anchors, finite attributes, source identity, invalid-parent rejection, bundle scoping and the real workbench callbacks using a GPU-only fixture. It covers presets, three separation mechanisms, hide/Undo, all-hidden recovery, initial selection, cross-side rejection and static markup. [Validation results](pulmonary-validation.json) are automated checks, not browser/device acceptance or clinical review.

The explicit teaching-pin extension preserves all previous 41 child bindings and four parent snapshots byte-for-byte in their canonical arrays. New totals: 46 selectable nested representations / 29 concepts / 27 primary references. CT, MRI and US topics remain pending; Clinical and Pathology are also pending for these five groups. Three new conceptual self-checks are unscored drafts.

Future learning links use the existing source-pinned parent/child contract and `pulmonary` study family. They do not claim CT segmentation or registration. The production resource manifest is still empty. Independently paid lectures remain separately gated; an Atlas grant never grants a lecture or its protected section.

## Rights and teaching references

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. The official [archive licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), rechecked 10 September 2026, governs these cached archive files. Preserve credit, licence link and modification notices. No new dependency, font, texture, paid API or purchased asset is introduced. No perpetual hosting-price guarantee is made.

Brief original teaching uses factual references from [NCI SEER lung anatomy](https://training.seer.cancer.gov/lung/anatomy/) and [NCI SEER bronchi and lungs](https://training.seer.cancer.gov/anatomy/respiratory/passages/bronchi.html), checked 10 September 2026. Reference images, scans, tables and chapter text are not redistributed; these links are not licences for their illustrations or institutional endorsements.

## Remaining acceptance and anatomy gaps

- Specialist review of lobe assignment, source fidelity, laterality, branch relationships and source artefacts; none is clinically approved.
- Independently licensed and validated lung/parenchymal surfaces, fissures, pleura, bronchopulmonary segment boundaries and finer airway/vascular anatomy. Do not create these from convex hulls, bounding boxes or generated images and imply anatomical validity.
- Author/review clinical and pathology lessons, XR/CT/MRI/US material, and scan-specific correspondence. Separate subjects remain separate; no patient registration or quantitative volume is supplied.
- Explicitly requested browser/device checks for labels during rotation, actual picking, camera framing, touch, keyboard focus and smaller displays. Automated callback/markup checks are not a substitute.
- Source-specific reviewer approvals, licensing provenance and independent lecture entitlement checks before any real external teaching resources are connected.

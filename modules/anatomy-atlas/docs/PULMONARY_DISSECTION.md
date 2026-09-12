# Lung branch dissection

The later [Branch type selector](PULMONARY_BRANCH_TYPES.md) separates the existing airway, arterial and venous source surfaces within each group. It retains the five original selectable identities and default bundles, adds two optional display bundles, and does not claim new lobe tissue. Historical implementation/source evidence below remains unchanged.

Select either lung in Thorax or Whole body, then **Explore lung branches**. The same compact workbench supports rotation, six camera presets, labels, selection, hide/Undo, fade others, framing, reassembly and extraction/spatial/tray separation. Search a branch-group name or FMA ID to open the correct lung with that group selected. Teaching remains collapsed until requested. There is no additional permanent toolbar.

## What is actually represented

**Learn more** now includes [clinical, pathology and CT drafts](PULMONARY_TEACHING.md) for all five branch groups. MRI/US remain pending. This extension changes teaching only; original source counts and the historical implementation evidence below are retained.

**Show airway landmarks** optionally adds the existing trachea and the main bronchus on the selected side, with a compact colour key. The landmarks are nonselectable and their pointer handlers pass through to branches. They are omitted from the scene and from requested bundles during separation; reassembly restores the previous context choice. Context is off by default, so there is no extra initial model download. Main-atlas lung selection now also states the missing tissue/fissure coverage, and nested groups are labelled “Partial branch group”, not “Space representation”.

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

`npm run pulmonary:export` uses that evidence and independently rechecks raw hashes and exact table membership. It retains the existing source-to-scene transform, vertex welding tolerance and normal smoothing. The default renderer uses a **parent-scoped catalogue and separate left/right bundles**. Optional airway context fetches two existing shared atlas bundles but renders only the trachea and the ipsilateral bronchus. Neither contralateral bronchus nor whole parent lung is rendered as context.

`npm run pulmonary-context:audit -- --check` verifies the source-pinned [airway-context manifest](../public/models/bodyparts3d/pulmonary/airway-context.json). It reuses FMA7394/FJ2541 (PART-OF trachea), FMA7395/FJ2539 (PART-OF right main bronchus) and FMA7396/FJ2450 (ISA left main bronchus). Original definitions/tree choices are retained. These three existing surfaces contain 13,600 triangles. The right bronchus has six diagnostic components and two duplicate faces; the left has four components and three duplicate faces. All are retained, not silently cleaned or presented as proof of continuous airway lumens. The context files do not overlap the five selectable branch groups.

`npm run pulmonary-context:test` compares all context triangles against the actual original source files in their established scene coordinates, including winding/multiplicity; tests parent/side binding, actual controls, context-off loading, failed-bundle recovery, all-hidden recovery, separation/reassembly, colours and nonselection. [Context validation](pulmonary-context-validation.json) is automated and does not establish browser acceptance. All 46 teaching bindings, original pulmonary catalogue and 95 model files remain unchanged. No new mesh, nested identity, external resource grant or clinical approval is added.

`npm run pulmonary:test` verifies every transformed triangle with winding and multiplicity, actual bounds/surface anchors, finite attributes, source identity, invalid-parent rejection, bundle scoping and the real workbench callbacks using a GPU-only fixture. It covers presets, three separation mechanisms, hide/Undo, all-hidden recovery, initial selection, cross-side rejection and static markup. [Validation results](pulmonary-validation.json) are automated checks, not browser/device acceptance or clinical review.

The explicit teaching-pin extension preserves all previous 41 child bindings and four parent snapshots byte-for-byte in their canonical arrays. New totals: 46 selectable nested representations / 29 concepts / 27 primary references. CT, MRI and US topics remain pending; Clinical and Pathology are also pending for these five groups. Three new conceptual self-checks are unscored drafts.

Future learning links use the existing source-pinned parent/child contract and `pulmonary` study family. They do not claim CT segmentation or registration. The production resource manifest is still empty. Independently paid lectures remain separately gated; an Atlas grant never grants a lecture or its protected section.

## Rights and teaching references

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. The official [archive licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), rechecked 10 September 2026, governs these cached archive files. Preserve credit, licence link and modification notices. No new dependency, font, texture, paid API or purchased asset is introduced. No perpetual hosting-price guarantee is made.

Brief original teaching uses factual references from [NCI SEER lung anatomy](https://training.seer.cancer.gov/lung/anatomy/) and [NCI SEER bronchi and lungs](https://training.seer.cancer.gov/anatomy/respiratory/passages/bronchi.html), checked 10 September 2026. Reference images, scans, tables and chapter text are not redistributed; these links are not licences for their illustrations or institutional endorsements.

## Remaining acceptance and anatomy gaps

- Specialist review of lobe assignment, source fidelity, laterality, branch relationships and source artefacts; none is clinically approved.
- Independently licensed and validated lung/parenchymal surfaces, fissures, pleura, bronchopulmonary segment boundaries and finer airway/vascular anatomy. Do not create these from convex hulls, bounding boxes or generated images and imply anatomical validity.
- Review the new clinical/pathology/CT drafts; author remaining XR/MRI/US material and separately validate scan-specific correspondence. Separate subjects remain separate; no patient registration or quantitative volume is supplied.
- Explicitly requested browser/device checks for labels during rotation, actual picking, camera framing, touch, keyboard focus and smaller displays. Automated callback/markup checks are not a substitute.
- Source-specific reviewer approvals, licensing provenance and independent lecture entitlement checks before any real external teaching resources are connected.

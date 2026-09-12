# Lung branch-type dissection

Open **Lung → Explore lung branches → Branch type**. Choose All branch types, Airways, Pulmonary arteries or Pulmonary veins. The adjacent existing Study view still selects all groups or one lobe. The controls stay in the current narrow side panel; no new toolbar, route or mandatory initial model download.

## What changes

The default All view is byte-for-byte the previous compound model. The three filtered modes display only the appropriate source-labelled files, preserving the five group identities. Labels explicitly name the current subset and use actual retained vertices as anchors. Original canonical records continue to drive the teaching panel and source-bound links; filtered display records are not new FMA definitions. Each mode is a visual subset, not an independent new anatomical structure or approval.

| Existing group | Airway files | Arterial files | Venous files |
| --- | ---: | ---: | ---: |
| Right upper | 21 | 24 | 17 |
| Right middle | 8 | 8 | 9 |
| Right lower | 24 | 22 | 23 |
| Left upper | 23 | 21 | 24 |
| Left lower | 22 | 22 | 12 |
| Total | 98 | 97 | 85 |

These are 280 existing source files, not 280 validated anatomical structures. Their 15 role/lobe combinations together retain all 114,750 original triangles. This adds zero unique source files, zero canonical selections and zero tissue envelopes. The left-upper source duplicate face is retained, not silently repaired. No fissures, pleura, alveoli, capillary bed, complete lumens or validated bronchopulmonary/perfusion territories are supplied.

## Dissection behaviour

- Selection, lobe visibility, hide/Undo, fade, framing, labels, optional airway landmarks, cutaway and all three separation mechanisms remain available.
- Changing branch type preserves the lobe selection/hidden state but resets separation, cutaway and fade, and frames the displayed subset. Stable original lung bounds remain the cutaway coordinate frame; clipping warnings use the actual displayed subset bounds.
- One role-specific bundle loads only for the chosen side when a filtered mode is requested. Switching among the three filtered modes reuses that bundle. All returns to the original bundle; a failed optional bundle retains Retry and cannot masquerade as a fully loaded view.
- Trachea and ipsilateral main bronchus remain separately labelled, nonselectable context. Separation hides them; reassembly restores the context preference. Reassemble keeps the branch-type choice; use All branch types to restore the complete group.
- Source changes disable unsupported role filters. Unknown filter values are rejected. Study links still reopen the canonical complete lobe group; branch-type filtering is local exploratory state, not a saved study or CT registration parameter.
- One colour per filtered type identifies the selected category, not blood oxygen content, CT/MRI signal or pathology. Learn more still describes the complete original lobe branch group, as the interface states.

## Source fidelity, licensing and reproducibility

`node scripts/export-pulmonary-roles.mjs` verifies the existing audit/evidence, current source definitions and known holds, all 280 raw source hashes, minimum-size explicit source labels and original GLB hashes. Every file must have one unambiguous airway/artery/vein role. It partitions the existing indexed geometry in the established export order, preserving float positions, normals, winding and duplicate multiplicity. Only unused vertices are compacted; no source shape is rescaled, mirrored, repaired or generated. `--check` requires byte-exact agreement with the saved output.

The side-specific optional bundles and `branch-types.json` live beside the original pulmonary models. Original bundles/catalogue remain untouched. The manifest retains exact canonical parents/groups/bundles, source partition and original coordinates; runtime gating rejects stale parent identity, source partition, node binding, bounds or bundle paths. Credits remain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**. The [official archive licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), checked 12 September 2026, allows commercial reuse subject to its attribution conditions. See the asset register and third-party notices for hashes and modification notice.

The [NCI SEER bronchi and lungs page](https://training.seer.cancer.gov/anatomy/respiratory/passages/bronchi.html), checked 12 September 2026, is a factual reference for distinguishing airway branches, lung lobes and unrepresented gas-exchange tissue. Its illustrations and prose are not copied. No font, texture, dependency, dataset purchase, API charge or mandatory service is added.

## Verification and remaining review

`node scripts/validate-pulmonary-roles.mjs` independently compares every subset against its original OBJ files in the established coordinates, then proves exact float-position/normal/winding/multiplicity union equality against the original GLBs. It checks actual subset bounds/anchors and exercises the real workbench callbacks and React markup for both sides, all filters, source rejection, lobe selection, context, separation, cutaway reset, failed-bundle recovery and return to All. The GPU component alone is replaced; no browser/device or clinical acceptance is claimed.

Radiologist review must adjudicate branch-role assignments, source artefacts, spatial relations and whether the partial groups are pedagogically useful. Actual device testing remains necessary for picking, labels during rotation, transparency, touch, keyboard focus and 200% text enlargement. No source agreement or automated check is clinical sign-off. Acquired CT/MRI/X-ray/US, scan-specific registration and separately paid lecture access remain independent requirements.

The separate older pulmonary-context regression still has its pre-existing historical 46-versus-48 binding-scope failure; this change does not repin or weaken that checksum. The new validator covers filtered-mode context directly, but is not a claim that every old suite passes.

This milestone passed 1,251 branch-type assertions, 534 cardiac-context assertions, 173,219 shared nested-history assertions across 11 families/14 parent views, TypeScript and the production build. Lossless delivery verified all 127 GLBs / 1,448 meshes / 4,344 buffer views. Those asset totals include alternate display bundles and must not be reported as unique anatomy counts.

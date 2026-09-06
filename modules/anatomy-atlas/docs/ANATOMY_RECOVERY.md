# Source recovery and reference-constrained reconstruction

**Current follow-on:** the subsequent gap pass added 62 further v4 representations (823 total). See `GAP_FILLING.md` for the current evidence ledger, new disc/hand/connective/organ coverage and held candidates. Figures and gaps below describe the first recovery pass and are superseded where the follow-on explicitly records an addition.

## First delivered recovery — 6 September 2026

159 additional source concepts from the official BodyParts3D 4.0 archives: 3 sternal bone parts, 2 hand lumbrical groups, 12 organ entries, 117 vascular entries and 25 connective-tissue entries. The atlas now contains 761 selectable source representations in 53 GLB bundles (86.2 MB in total), with 79 visibility stages and 53 focused views. These are not counts of unique complete human organs or muscles.

The new skeletal parts are the manubrium, sternal body and xiphoid process. Connective additions are 14 costal cartilages (1–7 on each side), 5 nasal cartilages, 4 laryngeal-cartilage entries and 2 long plantar ligaments. Hand lumbricals remain one source group per side; no individual first–fourth identities are fabricated.

The organ additions are prostate, paired testes, paired seminal vesicles, paired ureters, thymus, pituitary, paired compound eyeballs and rectum. Female anatomy, complete male reproductive anatomy, sphincters, organ-wall layers and pathological variants are not included. The rectum is now independently selectable instead of being an inseparable part of the large-intestine display aggregate.

Selected arteries and veins cover the head/neck, chest, abdomen, pelvis and limbs. Their source endpoints do not necessarily meet other included segments. Do not infer a complete circulation, lumen, branching network or occlusion from this subset. Some source-labelled artery surfaces include branches. No gap-bridging curves, automatic contralateral mirrors or generated nerve trajectories were added. Vessel colours classify arteries/veins, not oxygenation.

## Integrity and identity

`scripts/anatomy-recovery.mjs` is an explicit source-concept selection recipe. Exact names must resolve uniquely. IS-A surfaces are preferred; specific PART-OF compound concepts are used only where explicitly selected or no IS-A concept exists. Overlap is checked by source component identity across both trees. The same source frame, scale and CRC32/SHA-256 checks apply.

Recovered components that were already embedded in heart, liver or large-intestine aggregates are removed from those display aggregates, not drawn twice. The aggregate product IDs remain stable and their coverage notes disclose the separation. Those two existing organ GLB bundles change; all other pre-existing GLB bundles remain unchanged. The original dedicated shoulder viewer is untouched.

Every catalogue entry carries source-derived provenance and an explicit unvalidated review status. `content/recovery-manifest.json` records the exact additions; `docs/recovery-validation.json` records deterministic checks. These checks do not certify anatomy, clinical readiness or browser interaction.

## Remaining reconstruction programme

| Gap | Evidence required before constructing a draft | Current state |
| --- | --- | --- |
| Rectus abdominis, internal oblique, transversus abdominis | Separate boundaries, attachment regions, fibre/aponeurotic transitions, paired geometry and shared-frame landmarks | No independently identified mesh admitted; a compound abdominal-wall label is not sufficient to invent three layers |
| Latissimus dorsi, multifidus | Muscle-specific attachments and volumes; segmental organisation for multifidus | Awaiting suitable spatial references |
| Hand interossei and missing foot intrinsics | Individual identities, metacarpal/metatarsal attachment footprints and tendon trajectories | Missing; lumbrical groups do not substitute for interossei |
| Shoulder labrum/capsule/bursae; other joint tissues | Articular margin landmarks, attachment footprints, thickness and neighbouring tissues | Not generated from guessed rings or blobs |
| Intervertebral discs and spinal ligaments | Endplate boundaries, disc-specific orientation/height and canal relationships | No disc mesh admitted; vertebral bounding boxes alone are insufficient |
| Peripheral nerves, plexuses and spinal cord | Verified branch graph, roots, passage constraints, measured routes and separate cord/canal identity | No guessed routes; existing canal ambiguity remains unresolved |
| Organ interiors, reproductive and lymphatic anatomy | Separately identified components or appropriately licensed/de-identified segmentations | Incomplete; outer organ surfaces are not internal anatomy |

### Reproducible authoring pipeline

1. Define a narrowly scoped structure and intended learning task. Record whether the result is a schematic reconstruction or source-derived segmentation; never mark either clinically reviewed automatically.
2. Keep a reference ledger: exact URL/version, creator, licence, access date, whether the material is a factual reference or an adaptation input, and required credits. Independently verify rights for every figure used as an adaptation input. Search-result thumbnails are not licence evidence.
3. Establish landmarks in the shared source-millimetre frame, using more than one independent anatomical reference. Record attachments, dimensions, uncertainty, forbidden crossings and, for nerves/vessels, explicit branching constraints. A single 2D diagram does not establish hidden depth.
4. Use AI-assisted editable mesh authoring only within those recorded constraints. Save the authoring inputs, algorithm/tool version, meshes and hashes outside `public/`. Do not turn a generated raster illustration into the anatomical source of truth.
5. Check topology, normals, shared registration, laterality, attachments and contact relationships. Retain the unreduced mesh and a separate delivery mesh. Review from multiple directions and compare source-space landmarks, not just attractive renders.
6. Obtain independent anatomical review of identity and geometry. Until then keep any admitted preview explicitly marked reconstructed/unvalidated and out of high-stakes examinations, diagnostic use or patient registration.
7. Render matching diagrammatic illustrations from the reviewed 3D geometry, preserving labels, source IDs and attribution. Stylisation must not alter structural relationships or imply measured fibre directions.

This release completes the source-recovery stage above. It does **not** claim to have generated the remaining anatomical meshes, to have reconstructed missing nerves, or to have completed independent clinical validation. No additional paid AI/API service is introduced.

## Reference and licence decisions

- Official source/data: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Commercial adaptation grant, rechecked 2026-09-06: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Potential diagram source, not imported in this release: https://smart.servier.com/how-to-cite-servier-medical-art/ (CC BY 4.0; credit required).
- Z-Anatomy was **not imported**: its own attribution list names CC BY-NC and CC BY-NC-SA components despite an overall CC BY-SA statement. This is an asset-level provenance concern, not a claim that every individual model is non-commercial. A clean isolated component would need its own rights audit. https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/License.txt
- Fact-check links (copyrighted tables; no figures or textbook prose copied): https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html ; https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html ; https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html ; https://anatomy.elpaso.ttuhsc.edu/schemes/hand_tables.html

Free asset licensing is not a guarantee of free clinical review, compute, bandwidth or hosting. Preserve all existing notices.

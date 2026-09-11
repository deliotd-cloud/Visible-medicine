# Root-body lower-limb muscles by nerve

In **Pelvis & hip, Hip & thigh, Knee & leg or Ankle & foot**, open **Dissect → Muscles by nerve**. Choose a nerve/branch and **Show muscles & bones**. Select any displayed muscle for its existing anatomy, function and clinical notes. This extends the existing collapsed upper-limb control; no second viewer or permanent toolbar is added. Exam mode hides and rejects these study actions.

## Anatomical scope

Fifteen groups provide 120 explicit typical motor relationships across **118 unchanged root-body muscle selections**. Some muscles have bilateral, head-specific or multiple regional representations. These numbers are not unique whole-muscle counts, new nerve meshes or complete nerve territories. The three coccygeus/compound-perineal records are intentionally outside the limb-motor scope, visibly disclosed in the pelvis panel. No inferred pelvic-floor branch is assigned.

Important distinctions include long versus short biceps heads; direct lumbar psoas supply versus femoral iliacus; deep versus superficial fibular targets; the first foot lumbrical versus the other three; and the two conventional adductor magnus contributions. Adductor magnus remains a whole source surface in both groups, not a newly segmented territory. The source's separate adductor-minimus label is retained with a component/boundary caution. Pectineus, lateral flexor hallucis brevis, gemellar and little-toe component variation are qualified, not established as findings in this donor.

Only available source muscles are shown. Extensor hallucis brevis exists here, but no separate extensor digitorum brevis or dorsal interosseous selection is invented. Ordinary unlisted tissues remain available through standard dissection. Missing entries do not mean normal anatomical absence or absent innervation. The independent lower-limb specimen's 42-muscle/15-group explorer remains separate and unchanged; its memberships are not transplanted into this source.

## Interaction and architecture

One `load-view` action shows the selected group's muscles with regional bones, hides other tissues and retains both-sided membership for normal Left/Right switching. Selection respects the current side. The parent handler resets separation, cutaway, plate/ghost/fade/isolation and camera-restoration state for an assembled view. Undo/Redo restores dissection stage/focus/removals, **not** camera or system switches; this is stated in the panel. Repeating the same mask does not consume another history step. No fictional nerve selection or imaging event is emitted.

`content/lower-limb-motor.ts` explicitly assigns source FMA IDs. `lower-limb-motor-pins.json` binds all 186 relevant muscle/bone context records, source frame and canonical bundles, including the three unassigned pelvic records. Source identity, complete regional membership, laterality, geometry hashes and duplicate IDs are checked before offering a group. Changed or foreign source records fail closed rather than inheriting relationships. Pins cannot be silently regenerated over an admitted file.

Upper and lower limbs use the same pure `lib/regional-motor.ts` source/visibility contract, separately authored definitions/pins, and `lib/limb-motor.ts` region dispatch. The existing upper-limb component exports remain for compatibility but now render the shared regional groups. There is no name/prose/adjacency/nerve-tree inference, whole-body fallback, cross-specimen registration or stored private state. The upper-limb definitions and pin file are unchanged and their regression suite still exercises the real parent handler.

Root renderer revisions regenerate during build, so earlier geometry reviews require re-review after this functional change. Existing source catalogue, GLB bytes, 9,198 worksheet topic snapshots, assessment questions and authored teaching revisions are not edited or approved. The new motor notes are explicitly draft relationships, not an extension of any personal approval for the existing topic copy. The body decision store and applied migrations are unchanged.

## References and rights

Checked 11 September 2026. Original brief factual metadata and cautions, not reproduced chapters, tables, images or procedures:

- [Texas Tech Health El Paso muscle reference](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html): conventional regional motor relationships and variations.
- [Texas Tech nerve reference](https://anatomy.ttuhscep.edu/anatomytables/nerves_lowerlimb.html): branch-level distinctions and available distal targets.
- [Primary adductor-magnus cadaveric study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4714133/): conventional adductor/hamstring distinction. Full-text retrieval was intermittently challenged; the indexed primary publication supplied the relevant summary. It does not validate this donor's intramuscular boundaries.
- [Primary deep-hip innervation study](https://pubmed.ncbi.nlm.nih.gov/11331970/): gemellar variations; population findings are not assigned to this reference donor.
- [Elsevier's short little-toe flexor description](https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-lower-limb/flexor-digiti-minimi-of-foot/16610): the variable related opponens component. Its proprietary meshes/illustrations/text are not imported or licensed to the product by citation.

The 2026 adductor-architecture publication and other indexed leads were screened, but inaccessible full text and unrelated anomalous-muscle findings were not treated as donor evidence or new source assets. No file was downloaded from these references. Existing BodyParts3D v4 CC BY 4.0 credits remain with its meshes; original code/prose stays MIT. No new dependency, font, texture, paid service, external runtime call or lecture entitlement is added.

## Verification and remaining gates

Run `npm run lower-limb-motor:test` and `npm run upper-limb-motor:test`. Lower-limb checks cover all 118 official name/source-file identities, 120 explicit relationships, 69 region/side plans through the actual reducer, undo/redo/idempotence, 225 changed-source/frame/membership rejection cases, 81 installed-React renders and eight real parent-handler cases. Upper-limb regression retains 102 selections, 112 relationships, 54 plans and 63 renders. Other dissection, body-review, independent-specimen and type/build checks remain relevant. Tests are not browser/WebGL/device acceptance or clinical validation.

Qualified specialist review of each relationship, variant, anatomical label and intended learner scope remains required. Nerve paths, root maps, sensory fields, motor-entry points, denervation/palsy simulation, acquired-image registration and separately entitled lectures are still absent. Do not repeat this completed introductory lower-limb relationship pass or return to routine oral detail; next develop substantive regional anatomy/teaching or genuinely cleared missing tissues.

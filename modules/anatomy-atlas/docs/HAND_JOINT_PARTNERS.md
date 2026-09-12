# Wrist and hand joint partners

12 September 2026. Draft educational relationships; not donor contact validation or a clinical approval.

Select a carpal, metacarpal, finger phalanx, radius or ulna, then open **Wrist & hand joint partners** in the existing selection panel. The title and content adapt to the selected bone; the same panel still serves ankle/foot bones. No additional permanent controls, tabs or modal. Local partner buttons use the existing restore/select handler. Out-of-region partners open a source-bound whole-body study: radius/ulna remain in Forearm, not silently added to the Hand catalog.

**Show available joint partners** keeps the selected bone concept and listed non-variable partners in one reversible Dissection step. It enables the bone system and resets cutaway, separation and framing. Source coordinates and surfaces remain intact; normal left/right/both filtering continues to work. Undo/Redo restores layer/removal state, not camera or system switches. Exam mode hides the panel and prevents the action. The visibility action emits no new imaging selection; clicking a bone retains the established canonical-identity integration.

## Anatomy boundary

58 existing bone selections: 27 hand bones plus radius/ulna on each side. There are 38 ordinary bone-pair edges and two separately labelled variable edges per side. Graph edges are not counts of distinct joints, cavities or cartilage facets. The distal radioulnar joint is synovial; the forearm interosseous membrane and proximal radioulnar/elbow relationships are outside this wrist/hand map.

The TFCC disc separates the distal ulna from the ulnar carpus. Accordingly, ulna–lunate and ulna–triquetrum are not direct bony-articulation rows. Selecting these bones displays a short TFCC note and an ASSH reference. This map does not create, segment, measure or assert an intact donor TFCC. Pisiform connects to triquetrum; ligament links to hamate/metacarpals are not invented as bony articulations. Thumb has an IP joint, not a middle phalanx.

Lunate–hamate and capitate–fourth metacarpal facets are explicitly variable. Both are excluded from automatic partner isolation, although their source bones remain individually selectable. No lunate type or fourth CMC morphology is assigned to this donor. Other accessory facets/bones and thumb sesamoids are not fully mapped; omissions are not proof of absence. No motion simulation, joint-space measurement, ligament/cartilage reconstruction or CT/MRI registration is implied.

## Evidence and licence audit

All new runtime content is an original brief factual relationship map, exact existing source metadata and reading links. No figure, diagram, article passage, table, scan or PDF is copied, embedded or redistributed. The reference pages are not licensed asset admissions. Existing BodyParts3D v4 / DBCLS CC BY 4.0 attribution remains; no package, font, texture, mesh, paid API or mandatory service was added.

- [TTUHSC El Paso upper-limb bones](https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html): radius–scaphoid/lunate, pisotriquetral and digital relationships. Copyrighted tables are not copied.
- [TTUHSC El Paso joints](https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html): distal radioulnar pivot, thumb CMC, MCP/IP and intermetacarpal terminology. No reproduction of its table or illustrations.
- [Historical Gray text, Carpus and Metacarpus, PDF pp. 213–221](https://resources.saylor.org/wwwresources/archived/site/wp-content/uploads/2011/07/BIO302-ch2with6c6d.pdf): carpal neighbour cross-check. Historical names are not substituted for source labels; its unqualified lunate–hamate/CMC descriptions are qualified using the later anatomical studies below. No file/figure is bundled.
- [Anatomic Structures at Risk, CMC anatomy](https://www.anatomyatrisk.org/cmc-joints-Anatomy): metacarpal-base partners. Link and factual synthesis only, not imported graphics or a complete clinical guide.
- [Viegas et al., Medial (hamate) facet of the lunate, 1990](https://pubmed.ncbi.nlm.nih.gov/2380518/): type-I/type-II distinction; donor pattern unverified.
- [Viegas et al., Wrist anatomical variations, 1993](https://pubmed.ncbi.nlm.nih.gov/8515018/): cadaveric evidence that a separate capitate facet for the fourth metacarpal is not universal. No cohort rate is turned into a donor prediction.
- [ASSH, TFCC](https://assh.my.site.com/handcare/condition/tfcc-tear): disc/ulnocarpal relationship. No image, treatment advice or source prose copied.

## Architecture and verification

`content/hand-joints.ts` explicitly maps the 29 paired concepts to the 58 catalog FMA identifiers and typed reciprocal relations. `scripts/pin-hand-joints.mjs` verifies the original raw catalog SHA256 and exact unique bone/laterality records before generating `content/hand-joint-pins.json`; it refuses implicit overwrite. Full records, bundle identities and coordinate frame are checked at runtime, not guessed from names or mesh proximity.

`lib/regional-bone-joints.ts` now contains the shared source gate, reciprocal same-side neighbour resolver and reversible plan. `lib/foot-joints.ts` retains its public API and unchanged original relationship/pin data. `lib/hand-joints.ts` supplies the new territory; `lib/bone-joints.ts` routes selected IDs to the appropriate checked map. Invalid hand records do not disable valid foot records, or vice versa. The existing `app/bone-joints.tsx` renders territory-specific scope/limits and only relevant references. Future regions require exact admissions and evidence-backed maps; the factory does not infer new anatomy.

Run `npm run foot-joints:test` and `npm run hand-joints:test`. The shared validator runs the actual resolvers, parent handler, Dissection reducer, study links and installed component markup for each territory. It verifies bilateral plans/Undo/Redo, source corruption rejection, cross-region links, exam guards, graph symmetry and independent admission gates. Hand coverage: 232 plans, 160 reciprocal rows, 16 cross-region links, 74 corrupted-source cases, 116 component renders and 116 parent-handler cases. Foot retains its original 224 plans and 156 reciprocal rows.

Human acceptance still needs donor identities/spatial fit, reference-map review, small carpal/phalangeal selection legibility, cross-region framing and mobile controls. No browser/GPU testing is claimed from background continuation. Acquired imaging, validated spatial correspondences, nested joint structures and independently entitled lecture resources remain separate work; canonical IDs are preserved for those integrations.

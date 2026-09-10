# Liver internal branch dissection

The [biliary/gallbladder relationship preset](HEPATIC_BILIARY_RELATIONSHIPS.md) adds three existing nonselectable landmarks to the paired internal biliary groups, with faint tissue context. The default study and original source geometry remain unchanged. Source boundaries and duct junctions require review; this is not a complete biliary or surgical model.

In **Abdomen** or **Whole body**, select **Liver → Explore liver branches**. The existing compact workspace supports rotation, six camera presets, labels, selection, hide/Undo/recovery, fade, group presets and three separation mechanisms. Search atlas and source-bound deep links find the seven children. The parent liver aggregate is not superimposed.

The default view loads only the branch bundle. **Show liver tissue context** adds the separate, nonselectable tissue bundle at low opacity. Context is omitted during separation and restored on reassembly. Four named colours distinguish arterial, portal, biliary and venous-tributary groups, not oxygenation or simulated flow. No permanent main-toolbar control or route is added.

## Exact source scope

All 57 files already belonged to the displayed PART-OF FMA7197 liver. The original 1,022 root records and 95 pre-existing GLBs remain unchanged. Two derivative GLBs separate existing components; they are not new unique whole-body anatomy.

| Source FMA | Display group | Source files |
| --- | --- | ---: |
| FMA14778 | Right hepatic arterial branches | 8 |
| FMA14779 | Left hepatic arterial branches | 7 |
| FMA15414 | Right portal vein branches | 9 |
| FMA15415 | Left portal vein branches | 8 |
| FMA71857 | Right hepatic bile ducts | 6 |
| FMA71858 | Left hepatic bile ducts | 8 |
| FMA15800 | Anterior inferior tributary of middle hepatic vein | 2 |
| FMA7197 source subset | Nonselectable tissue context | 9 |

These seven nonoverlapping branch definitions use 48 files. The remaining nine form one context object, with no invented segment identity. All 186,340 source triangles remain, including eleven duplicate source faces. The source-to-scene transform, source-coordinate vertex welding tolerance (0.000001) and normal smoothing match existing exports. No surface is mirrored, repositioned, extended or reconstructed.

## Segment mapping is deliberately unresolved

FJ2822 is labelled segment VI; FJ2409 is labelled VII. Their bounds almost coincide. Original, unaligned bidirectional vertex sampling gives median surface distances about 0.207 and 0.431 mm (512 and 475 samples); roughly 78.5% and 75.2% are within 1 mm. This is diagnostic evidence of extensive near-contact, not a continuous-surface overlap proof or a replacement segment label.

The source VIII definition combines FJ2823/FJ2824. Neither is reassigned to VII. Source IV FJ2820 has nonmanifold edges/vertices, degenerate faces and internal remnants. All remain in optional context, not asserted to form a clean envelope. No individual source segment is offered as a selectable clinical territory, Couinaud map, segmentation mask or measured volume.

Exact source raw hashes, definitions, topology and sampling are in [the source audit](hepatic-source-audit.json). The already separate right/left hepatic veins and hepatic artery proper are not part of this subset; the middle-hepatic tributary is not complete hepatic venous outflow.

## Teaching and future imaging

Four short teaching concepts cover seven exact-source targets in the existing collapsed Learn more panel. [The clinical extension](HEPATIC_TEACHING.md) adds 15 original paragraphs: Clinical/Pathology/Ultrasound for all four concepts, MRI for biliary and venous-tributary concepts, and CT for the venous tributary. Other imaging topics remain pending; all authored content remains draft. Existing Anatomy, Function and unscored self-check are unchanged. Previous 46 bindings and six parent snapshots are preserved; the current total is 53/7. The opt-in learning registry has 1,084 scope-specific entries, not unique anatomical structures. Production resources remain empty; no CT/MRI/US image or separately paid lecture is exposed.

Primary factual references: [Texas Tech abdominal arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html), [abdominal veins](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html), [NIDDK digestion](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works), and [NCI accessory organs](https://training.seer.cancer.gov/anatomy/digestive/regions/accessory.html). No diagrams, tables, lecture text or scans were copied. References do not license third-party assets or imply endorsement.

## Reproduction and validation

- `npm run hepatic:audit` / `npm run hepatic:audit -- --check`: verified local v4 raw cache and pinned table/parent evidence, exact branch partition, tissue diagnostic findings. No automatic repair.
- `npm run hepatic:export`: emit the two derivatives and manifest. A changed source requires deliberate review; existing teaching pins will reject changes.
- `npm run hepatic:test`: full transformed source-triangle comparison including winding/multiplicity, actual bounds/anchors, finite attributes, source-binding rejection, original46 pin preservation, nine callback/markup cases, all separation styles, context nonselection, loading recovery, presets and hide/Undo.
- `npm run nested-navigation:test`, `npm run nested-teaching:test`, `npm run nested-learning:test`, model-first and production build cover integration.

Automated checks are not browser/mobile/GPU acceptance or clinical approval. Specialist review must establish source identity, segment mapping, branch continuity, junctions, tissue topology, anatomical variants and appropriateness for teaching before clinical release. No paid service, dependency, font, texture or new external dataset was added. Existing BodyParts3D CC BY 4.0 credit and modification notices apply; see [notices](../LICENSES/THIRD_PARTY_NOTICES.md).

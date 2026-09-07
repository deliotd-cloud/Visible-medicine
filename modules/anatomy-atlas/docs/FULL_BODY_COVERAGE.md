# Expanded anatomy coverage and open review items

## Included

1,022 selectable source representations: 203 skeletal, 369 muscular, 80 organ, 54 nervous-system, 227 vascular and 89 connective-tissue entries. 86 body GLB bundles support 11 region routes plus the whole body. The latest [forearm extension](FOREARM_VASCULAR_DETAIL.md) adds four exact artery sources; head & neck retains 275 entries. See the [current requirement/content audit](REQUIREMENT_AUDIT.md), [laryngeal evidence](LARYNGEAL_DETAIL.md), [ocular detail](OCULAR_DETAIL.md) and the [intestinal ownership correction](INTESTINAL_JUNCTION.md). These counts are not complete anatomy; milestone totals below are historical.

Organs: the original 17 entries (heart, paired lungs, liver, pancreas, stomach, small/large intestine, gallbladder, paired kidneys, bladder, esophagus, trachea, spleen and paired adrenals), plus prostate, paired testes, paired seminal vesicles, paired ureters, thymus, pituitary, paired compound eyeballs and rectum. Heart/liver vascular components and the rectum have been separated from their display aggregates without moving geometry; aggregate IDs remain stable and notes disclose their exclusions. This remains an adult-male reference, not comprehensive male/female, developmental or variant anatomy.

Vascular coverage comprises 227 selected source artery/vein concepts. It is not a complete circulation, branching graph, lumen or validated connection model. Connective coverage includes costal/nasal/laryngeal cartilages, 22 whole-disc surfaces, interosseous membranes, Achilles tendons, orbital/laryngeal ligaments and paired long plantar ligaments, plus wrist flexor retinacula, iliotibial tracts and linea alba. No complete joint, fascial, lymphatic, ocular-layer or organ-interior anatomy is supplied. See `ANATOMY_RECOVERY.md` and `SOURCE_INVENTORY.md` for source decisions and remaining gaps.

Nervous entries: 28 selected cranial/orbital nerve representations, two ciliary ganglia, the compound brain, 22 selected deep-brain entries and the central canal of the spinal cord. **This is not a full nervous system.** No limb peripheral nerves or brachial/lumbosacral plexuses are present. Source FMA7647 (spinal cord) and FMA78497 (central canal) both use FJ1737. We conservatively expose only FMA78497 as a space and state its limitations; it is not a cord segmentation.

The six legacy abdominal-wall candidates remain unregistered and unimported; the v4 broad-wall aliases do not supply them. See [abdominal-wall evidence](ABDOMINAL_WALL_AUDIT.md).

## Latest additions

Ten eye-region entries add three close-up windows/focuses for tarsal plates, tear-drainage sources and nasolacrimal/nasal context. Head & neck now has 273 source entries. All 1,006 previous full records and 82 body-bundle hashes are exact. Missing eyelid layers, puncta, valves, lumen and tear flow are not invented. See [ocular detail](OCULAR_DETAIL.md).

The hand arterial pass adds 26 source identities / 30 components and four close windows/focuses, preserving all preceding records and body bundles. Supplied source numbering and unequal right/left proper-branch subsets remain explicit, not standardised by invented geometry. See [hand arterial evidence and gates](HAND_VASCULAR_DETAIL.md).

The thoracic pass adds four arterial identities and three close windows/focuses, preserving all 954 preceding records and 78 body bundles. Bronchial-variant aliases share one geometry owner; grouped oesophageal branches retain their source identity. See [thoracic evidence and review gates](THORACIC_DETAIL.md). Subsequent paragraphs retain historical milestone descriptions.

The connective/deep-spinal pass adds eleven entries / fifteen components in four new bundles: paired wrist flexor retinacula and iliotibial tracts, linea alba, four bilateral deep-spinal muscle sets and paired levatores costarum breves sets. Six new windows and eight focuses use targeted anatomical context. Every prior 881 record and 67 bundle hash is preserved. Longi alternatives are held for further review. See `AXIAL_DETAIL.md`.

The deep-brain pass adds 22 entries / 24 source components in one additional bundle, without modifying any of the previous 859 records or 66 bundles. See `DEEP_BRAIN.md` for source identities, anatomical limitations, three windows, five focused views and the label-layout update. No complete internal brain atlas or neural connection model is asserted.

The inventory pass adds 36 entries detailed in `SOURCE_INVENTORY.md`: 29 shoulder/chest-wall vessel segments, two ciliary ganglia, source-labelled right/left main bronchial segments, cystic/common-hepatic duct surfaces and appendix. The source index is fully reconciled, but its unused records are not automatically admitted. Superior-epigastric vein candidates were held after source-position checks.

The preceding pass added 62 entries detailed in `GAP_FILLING.md`: 22 discs, four hand interosseous sets, four interosseous membranes, two Achilles tendons, two trochlear nerves, ten organs and eighteen additional head/neck connective structures. The organ list also includes tongue, paired lacrimal/submandibular/sublingual glands, paired epididymides and urethra. Pelvic-floor and optic-nerve alternatives remain held pending source adjudication.

The dental/orbital pass adds 28 individually identified secondary teeth and four orbital connective surfaces in two new bundles, preserving all previous anatomy. Five close-up windows expose upper/lower arches and orbital pulley/ring relationships with selected context. Teeth belong to the Organs system, not Bones. No third molars, internal dental tissues, clinical tooth numbering or validated attachments are supplied. See [head detail](HEAD_DETAIL.md).

## Quarantined source entries

The full-body importer withholds four candidates whose labelled laterality conflicts with their registered X position in the source data:

- FMA37388 / FJ1469M — source-labelled right flexor pollicis brevis
- FMA37389 / FJ1469 — source-labelled left flexor pollicis brevis
- FMA46633 / FJ2742 — source-labelled right middle pharyngeal constrictor
- FMA46634 / FJ2754 — source-labelled left middle pharyngeal constrictor

These discrepancies are flags for expert review, not proof of a source error: midline-crossing anatomy can complicate centroid tests. We did not flip, reshape or relabel them. They remain documented with source hashes in `catalog.json` under `excluded`, outside rendered assets.

## Teaching content

The shoulder's existing teaching records are reused when the source identity matches. New entries provide source identity and geometry provenance; 17 organ entries and brain have short original function notes. Detailed new origin/insertion, innervation, imaging, pathology and procedural descriptions are marked pending where they are not authored. Nothing is marked clinically validated.

Identification practice offers 5, 10 or 20 questions (limited by loaded structures), with major-landmark, all-visible or focus-target-only sampling. Find-on-model and keyboard-friendly isolated-name modes, skip/reveal and retry-missed controls are documented in [practice](PRACTICE.md). Other anatomy is removed for the exercise to expose candidate surfaces. Labels, selection highlighting, cutaways and transparency overrides are disabled. Completed sessions show results and re-study links. The find-on-model prompt is intentionally named; naming mode instead offers anatomical-name buttons for one isolated surface. This is formative anatomical identification, not a high-stakes examination or validated assessment. See [deep inspection](DEEP_INSPECTION.md) for the shared cutaway, opacity and orthographic controls and their limits.

## Required before clinical/educational release

1. Review each identity, segmentation, laterality, regional assignment and shared registration, including all bone/muscle components.
2. Resolve the four quarantined entries and spinal-cord/central-canal ambiguity with source-author or qualified anatomical review.
3. Source, licence and validate missing peripheral nerves rather than generate guessed routes.
4. Review merged organ surfaces and reduced-polygon anatomy at the intended learning scale.
5. Author and independently review specialist educational content and citations for every advertised topic; remove or complete pending tabs for a finished curriculum.
6. Validate interaction, accessibility and memory/frame-rate behaviour on target browsers and low-powered mobile devices. Automated bounds/hash checks are not browser or clinical testing.
7. Independently validate any future DICOM registration, image orientation and patient privacy pipeline before patient-specific use.

The machine-readable check report is `docs/full-body-validation.json`. No diagnosis, operative planning or patient-specific claim is supported.

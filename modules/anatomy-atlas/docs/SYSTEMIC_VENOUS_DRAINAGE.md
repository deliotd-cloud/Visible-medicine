# Systemic venous drainage

Latest cubital extension: [four original superficial vein selections](CUBITAL_VEINS.md) bring the map to **51 selections, 28 groups and 57 relationships**. Median cubital and median antebrachial sources have side-specific, explicitly variable connections; possible antebrachial terminations are alternatives, not two proven outlets. The existing compact panel and every earlier source admission remain intact. Counts below are historical milestones.

11 September hepatic extension: [three additional source groups](HEPATIC_VEINS.md) bring this map to 47 selections, 26 groups and 49 directed relationships. The middle hepatic vein points towards the inferior cava; right/left tributary groups point to their respective hepatic vein. Older milestone counts below describe earlier scope. Original pin records are retained and the new source records are appended; no direct portal-to-systemic edge is introduced.

Select a supplied vein, then expand **Venous drainage** in its information panel. **Receives from** and **Drains towards** link the model's existing selections. **Show available veins & bones** isolates available neighbours with skeletal context in one reversible dissection step. Other-region neighbours open a source-bound whole-body study; they are not silently placed in the current region. No persistent toolbar or extra tab is added.

## Coverage and meaning

The map contains **38 selections, 21 concept groups and 40 typical relationships**, including [two newly audited medial brachial vein surfaces](BRACHIAL_VEIN_ADDITION.md). These are not 40 verified donor junctions. Right/left counterparts remain independently identified. Paired veins connect only to same-side paired neighbours; both sides can meet a single caval source. The hemiazygos-to-azygos crossing is explicit, not inferred from source laterality.

- Neck and chest: jugular/subclavian/brachiocephalic routes to the superior cava; hemiazygos and azygos.
- Upper limb: medial brachial, axillary, cephalic and basilic routes with the supplied dorsal hand networks.
- Lower limb: dorsal foot arches, saphenous and popliteal/femoral routes, internal/external/common iliac veins and inferior cava.
- Liver: the two supplied hepatic venous outlets to the inferior cava, distinct from portal inflow.

Kinds distinguish tributaries, continuations, confluences, incompletely modelled routes and variable outlets. Small-saphenous termination is a common example, not a universal donor pattern. Femoral is explicitly a deep vein; common/deep femoral subdivisions are not selectable. The saphenofemoral and proximal femoral routes are therefore qualified rather than presented as a segmented junction. Hand networks remain whole source surfaces, and foot marginal routes are not invented as separate meshes. No measured flow direction, reflux, valve competence, thrombus, vascular-access trajectory or pathological state is supplied.

The caval endpoints have no onward selectable chamber connection in this root map; a message prevents a blind-ending interpretation. Pulmonary veins, cardiac veins and portal inflow are deliberately outside this systemic graph rather than erroneously routed to a cava. Intracranial venous sinuses are absent from the current root catalogue. Other companion brachial veins, deep calf veins, perforating veins, many pelvic/hepatic tributaries and accessory azygos pathways remain missing. An unlisted vessel is not presumed absent in a person.

## Behaviour and architecture

Existing source records, coordinates, meshes, region memberships, labels, teaching tabs, recipes and imaging contracts are unchanged. `content/systemic-venous.ts` holds original factual group/relationship definitions and reading references. `systemic-venous-pins.json` binds all 36 complete vein records, 203 possible skeletal-context records, their bundles, source version, licence and coordinate frame. No source bounds are recomputed or moved.

The later medial brachial addition appends its two separately pinned records/bundle at runtime without rewriting that historical pin set. Current navigation requires all 38 admitted vein records; an incomplete raw ingestion catalogue cannot silently display an incomplete extended graph.

`lib/systemic-venous.ts` reuses only the established source-validation/traversal engine, with a distinct concept for every actual side and explicit venous relationships. It does not reuse arterial anatomy or UI labels. Full-record/bundle/frame mismatches fail closed. Returned directions use venous terminology. The isolation plan retains both counterparts for later side-filter changes and only the selected group's skeletal context; out-of-region anatomy stays outside the view. Existing dissection Undo/Redo restores visibility history. Show veins resets camera/separation/cutaway; Undo does not claim to restore camera or system switches. Exam mode exposes neither panel nor action. Selecting a local neighbour uses the existing restore-if-hidden selection handler. No imaging event or paid-resource entitlement is emitted.

Automated checks cover an independent FMA edge oracle, reciprocal directions, side pairing, source-name/file identities in the official source trees, region/side plans, changed source/frame/bundle rejection, history, cross-region link round trips, actual component output and actual parent actions. Tests do not establish specialist, browser/device, GPU or clinical acceptance. Existing renderer-review fingerprints expire stale approvals; no synthetic approval is created.

## References, rights and clinical validation

Checked 11 September 2026: [UAMS neck veins](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-head-and-neck/), [UAMS upper-limb veins](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/), [Texas Tech lower-limb veins](https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html), [Texas Tech thoracic veins](https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html), [axillary/subclavian anatomical boundary](https://pmc.ncbi.nlm.nih.gov/articles/PMC8142095/) and the [Australasian Sonographers Association lower-limb anatomy guidance](https://www.sonographers.org/publicassets/e6c705f1-b557-f011-913e-0050568796d8/Section-C---Venous-anatomy-of-the-lower-limb.pdf).

These references inform original brief factual notes, not imported tables, wording, diagrams, scans or procedure instructions. Their availability does not grant redistribution rights. No referenced PDF or artwork is bundled. New code/notes are MIT; the retained anatomy's existing commercial-compatible licences and attribution remain unchanged. No dependency, font, texture, model, paid API or mandatory service fee is added.

Independent anatomical review must verify source identities, relationship direction, lateral pairing, junction terminology, missing-tissue disclosures and learner usability before approval. Patient CT/MRI/US resources need their own rights, de-identification, verified structure/slice links and modality-specific review. A generic drainage edge cannot establish scan registration, Doppler flow or a clinical diagnosis. Lecture entitlements remain independently checked. Publication status belongs to the release checkpoint, not this feature document.

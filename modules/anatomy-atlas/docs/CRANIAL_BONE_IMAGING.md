# Skull, facial-bone and hyoid imaging — 13 September 2026

Adds 46 draft CT/MRI placements to 23 existing source selections: 15 anatomical
concepts, with separate right/left selections where already present. All 46
topics were pending at `ae9b0112b9980206b14c4676c941dc13a88834fc`. These are
orientation notes, not 46 independent lessons, acquired scans or approved anatomy.
Existing Anatomy, Function, X-ray, Ultrasound, Pathology, Clinical and Quiz
content is preserved. The 23 ultrasound topics remain pending.

## Teaching scope

| Concepts | CT emphasis | MRI emphasis |
| --- | --- | --- |
| Frontal and parietal | Vault tables, sutures and anterior skull-base relationships | Marrow versus scalp/dural tissue |
| Occipital and sphenoid | Foramen magnum, condyles, clivus, wings and sella | Skull-base marrow versus adjacent neural/soft-tissue compartments |
| Temporal | High-resolution osseous orientation; whole-bone selection limits | Dedicated heavily T2-weighted internal-auditory-canal context |
| Ethmoid | Cribriform region, roof, lamella and medial orbital wall | Intracranial/sinonasal tissues versus thin bone |
| Nasal, vomer and inferior concha | Bridge, separate septal components and concha/meatus | Bone versus cartilage and mucosal tissue |
| Lacrimal | Medial orbital fossa/canal orientation | Drainage apparatus versus tear-producing gland |
| Maxilla, palatine and zygomatic | Orbital floor, hard palate, nasal wall and two-bone arch | Neighbouring marrow, oral and orbital soft tissues |
| Mandible | Osseous temporomandibular articulation | Dedicated disc and open/closed-mouth relationships |
| Hyoid | Body/horns and variable fusion | Soft-tissue context, not swallowing simulation |

The hyoid is a neck bone, not part of the skull proper. The retained FJ2772/FJ3201
grouping still needs review of its union and extent. Neither that grouping nor
any other whole-bone mesh creates individually validated canals, foramina,
cortical thickness, marrow, cartilage, internal-ear structures or soft tissues.
No source mesh, anatomical ID, side, source grouping or dissection recipe changes.

## References and reuse boundary

The existing original cranial Anatomy/Function teaching and its reading links
are reused. New modality-specific facts cite these primary publications:

- [Calvarial imaging review](https://pmc.ncbi.nlm.nih.gov/articles/PMC6206383/)
- [Anterior skull-base imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC5977432/)
- [Skull-base imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC3698894/)
- [Ear and temporal-bone cross-sectional imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC6081284/)
- [Nasal anatomy and imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC7416352/)
- [Orbital imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC3729578/)
- [Lacrimal-system imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC10996330/)
- [Oral-cavity imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC3473765/)
- [Temporomandibular-joint imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC9031630/)
- [Primary hyoid fusion study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4859847/)

Accessible article/indexed passages supplied factual references; some direct
PMC page requests presented an access challenge. No challenge was bypassed.
The short notes are original factual synthesis, not copied article passages,
tables or figures. Reading links do not grant redistribution rights over images
or datasets. No scan, external illustration, model, texture, font, dependency,
paid API or mandatory service is introduced. Original code/text retain project
MIT terms; existing model attribution and change notices remain intact.

The validator counts each distinct new fact once per cited reference (maximum
128 words for any one reference in this increment), not repeatedly for paired
selection placements. Source excerpts are not stored in the product.

## Technical evidence and remaining clinical review

`npm run cranial-bone-imaging:test` checks the unchanged source bundle and exact
identity pins, 46 real viewer-note callback renders, 690 changed-identity/topic
rejections and all 1,101 displayed schema records. It reconstructs the prior
content only in offline tests to verify 9,863 other topics and dissection recipes
remain unchanged. Historical adapters are neither runtime migrations nor
clinical-approval transfers. See `cranial-bone-imaging-validation.json`.

Radiologist sign-off must identify the actual content/source revision and review:

1. Structure identity, side and extent, especially the grouped hyoid.
2. Anatomical relationships, sequence-specific wording and whole-bone limitations.
3. CT versus MRI visibility, variant/fusion cautions and the distinction between
   a reference donor surface and a patient's findings.
4. Useful teaching depth and age-specific applicability; these brief drafts do
   not replace detailed validated cases or a comprehensive radiology curriculum.
5. Any future selected CT/MRI/US examples, their privacy/release clearance,
   clinical labels, source orientation and correspondence.

No scan, measured attenuation, signal map, diagnosis, acquisition protocol,
operative route or registration is supplied. Restore separation to zero for
spatial comparison. Actual imaging belongs in Didanix Education/light with
independent Atlas, case and paid-lecture access. Scans and masks are untouched.
Software checks do not confer clinical or broad-device acceptance.

Rebuild/export the website module from clean committed Atlas source. The main
task's dated checkpoint records actual publication and recovery, not this note.

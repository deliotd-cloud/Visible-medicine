# Clinical validation checklist

## Loading and source-screen acceptance

- Exercise actual download/render failures, throttling, selective retries, naming-question transitions, ghost/hidden context and return navigation. Confirm paused questions retain answers and cannot accept skip/answer/next while required anatomy is unavailable; exit must remain available. Test keyboard, touch and assistive-technology announcements. Helper and static wiring tests are not browser acceptance; Canvas/context-loss handling remains outside this milestone. See `ANATOMY_LOADING.md`.
- Do not interpret zero flags in the extent-pruned artery–vein screen as proof of correct anatomy. Only one rendered pair reached the surface comparison; opposite explicit sides, same-type pairs and extent-dissimilar surfaces are outside it. Existing plantar venous holds and all earlier review requirements remain. See `VESSEL_SHAPE_AUDIT.md`.

## Foot vascular gates

- Review eight admitted source vessel identities, plantar arch/trunk aliases, deep/superficial branch course, depth, endpoints, lumen/calibre, variants and grouped dorsal arch components.
- Withhold FMA44883/FMA44884 and aggregate reimports until the near-translation shape similarity to the arterial arches is adjudicated. This diagnostic neither changes source coordinates nor proves venous anatomy.
- Accept four new plantar/dorsal views, small-vessel controls, labels, side scopes, focus-only practice and colour discrimination on real devices. No plantar nerves, complete digital branches, scans or patient registration are supplied. See `FOOT_VASCULAR_DETAIL.md`.

## Hand venous and colour gates

- Review fourteen admitted venous source identities, grouped metacarpal/digital extent, palmar arch depth, dorsal drainage relationships, tributaries, lumen/valves, endpoints and continuity. Adjudicate held FMA85102/FMA85103 before importing any component or aggregate alias.
- Accept the four new windows on real devices, including small-vein picking, source labels, side scopes, focus-only practice and red/blue/neutral colour discrimination. Colours identify source type, not oxygenation or verified anatomy.
- Keep generic/dorsal-metacarpal aliases, missing thumb/common-digital detail, nerve gaps and all earlier holds explicit. No scans, patient registration or clinical approvals are supplied. See `HAND_VENOUS_DETAIL.md`.

## Hand arterial gates

- Adjudicate all 26 source identities, including first-through-fourth common-branch numbering versus standard teaching conventions and the greater distal extent of the fourth source entries. Grouped surfaces are not independently validated branch names.
- Review the six-right/four-left proper-branch subset, missing counterparts, arch continuity, calibre/lumen, origin/endpoints and tissue relationships. Sampled geometry checks are not proof of clinical accuracy or surgical safety.
- Accept all four hand study windows and tiny-vessel controls on real devices. Existing muscle/nerve/source holds remain; no digital nerves, scan studies or patient registration are added. See `HAND_VASCULAR_DETAIL.md`.

## Thoracic vessel gates

- Review the four exact source identities, grouped oesophageal branches and bronchial variant/arch-branch aliases; a variant-labelled source must not become a normal-pattern template.
- Assess organ/airway relationships, source extent, origins/endpoints, lumen, calibre, continuity and missing branches. Finite sampled-overlap checks are not clinical non-intersection or anastomosis validation.
- Accept the three new study views and fine-vessel controls on real devices. Existing holds remain; no actual imaging or patient registration is added. See `THORACIC_DETAIL.md`.

## Study-library acceptance

- Check the searchable library on real mouse, keyboard, touch and assistive-technology devices: inline expansion/scrolling, announced previews, focus return, mobile and 200% text sizing. Server-rendered markup and helper tests are not this acceptance.
- Confirm educators understand paired window/focus buttons, retained context, target-only practice and reset behaviour. Sorting by group size is not anatomical depth or an operative order; preview counts are source entries, not visible pixels or complete tissue coverage. See `STUDY_LIBRARY.md`.

## Pancreatic and epiglottic gates

- Review all twelve new source labels and fourteen components, pancreatic relationships, vessel origins/endpoints/calibre/continuity and variants. Local near-contact does not prove an anastomosis; the grouped vein is not three independently named branches.
- Review epiglottic tissue extent and ligament attachments; no separate cartilage core/mucosa, swallowing simulation or moving airway is established. Adjudicate the held raphe's boundary-versus-tissue semantics before importing it.
- Preserve middle-constrictor component holds when reviewing the FMA46622 aggregate. Validate five new focus/window captions, real-device controls and close-view presentation. See `PANCREATIC_DETAIL.md`.
- Actual imaging remains absent: source-coordinate hooks are not CT/MRI/US findings, patient registration or a functioning modality adapter.

## Targeted practice gates

- Review both regional response modes, target policies, grouped-source names and distractor ambiguity. A score is not demonstrated clinical competence.
- Test keyboard focus/activation, screen-reader announcements, touch selection, very small structures and feedback on real devices. The naming mode provides keyboard responses to a visual task, not a nonvisual anatomical description.
- Review skip/retry/partial-exit behaviour and the dedicated shoulder's answer-once/reset change. Display fingerprints were refreshed; no clinical approvals were created. See `PRACTICE.md`.
- Six legacy abdominal-wall candidates require asset-specific rights confirmation, homologous landmarks and validated registration before admission. See `ABDOMINAL_WALL_AUDIT.md`.

## Connective and deep-spinal gates

- Review retinacular thickness, carpal attachment footprints and tunnel boundaries; there is no median nerve or validated lumen.
- Review iliotibial boundaries, fascia-lata aliases, distal connections and linea-alba/aponeurotic continuity. No complete abdominal wall or fascia layer is implied.
- Adjudicate bilateral muscle-set grouping, cervical/lumbar level assignments and anterior/posterior relationships. Review the held longi candidates against breves; extent similarity alone does not establish duplication or source error.
- Validate all new close-context windows, captions and side-filter behaviour. See `AXIAL_DETAIL.md` for source records and automated evidence.

## Deep-brain and presentation gates

- Adjudicate all 22 deep-brain entries against a qualified neuroanatomical reference: identity, laterality, extents, contours, registration and relationships to the existing brain. Numerical bounding-box containment is not tissue-containment or clinical proof.
- Review the grouped bilateral mammillary and cerebral choroid-plexus surfaces; do not treat a side-filtered view as a separately segmented unilateral component.
- Review original draft notes and study-group colours. No MRI signal, tractography, network connectivity, individual thalamic nuclei or patient registration is established.
- Validate all six directional label layouts, tiny-surface picking, ghosting, orthographic framing, text overlap, touch and keyboard access on real devices. Automated numerical layout tests cannot certify readable screen typography or occlusion handling.
- Review gates, evidence and reproducible checks are in `DEEP_BRAIN.md`; no clinician approval has been created.

## Current inventory/admission gates

- Review all 36 inventory additions, particularly bronchial extent/relative length, named biliary-duct boundaries, ciliary ganglion position and vessel endpoints/branches/calibre. See `SOURCE_INVENTORY.md`.
- Adjudicate the newly held source-labelled superior epigastric veins; do not relabel or reposition them automatically.
- Review all 102 current stages and 84 focused views, including airway, shoulder vascular and deep-brain windows. Validate touch/keyboard access, framing, occlusion and tiny-structure selection on actual devices.
- The exhaustive source inventory proves record reconciliation, not complete anatomy. Identical source geometry under multiple labels does not validate those labels.
- The future imaging selection contract is tested software, not patient registration. No scans or imaging approvals are present.

## Latest gap-pass gates

- Independently review all 62 new entries and the 22 whole-disc identities and levels. Do not mark the unresolved source disc as a specific radiological level.
- Review interosseous groups, Achilles attachments, interosseous membranes, trochlear trajectories, glands and small head/neck connective structures at the intended teaching scale.
- Resolve the overlapping pelvic-floor and optic-nerve alternatives documented in `GAP_FILLING.md` before admission. V3 meshes need registration to the altered v4 skeleton; matching names are not spatial validation.
- The prior gap milestone contained 86 stages and 60 focused views. Separation/framing corrections have since been implemented and numerically tested; hands-on browser and clinical acceptance remain outstanding.

## Earlier source-recovery release gates

- Independently review the 159 additions and all source component bindings in `content/recovery-manifest.json`.
- Review vessel calibre, completeness, endpoints and branching. No automated test validates continuity or substitutes for vascular-anatomy review.
- Confirm heart/liver/large-intestine aggregate exclusions preserve correct teaching boundaries and that recovered components are not double-rendered.
- Review grouped hand lumbricals, compound eyeballs, sternal parts, cartilage identities, long plantar ligament boundaries and the limited male reproductive subset.
- Review 79 stages and 53 focused views. Keep the original 4 quarantined entries and cord/canal ambiguity unresolved until qualified review.
- Before original reconstruction, complete the evidence and landmark pipeline in `ANATOMY_RECOVERY.md`. Do not promote plausible AI output to validated anatomy.

## Regional dissection release gates

- Review all 63 stage recipes and 30 focused views against the explicit-ID manifest in `content/dissection-manifest.json`.
- Review the 60 added named muscle components and clarify head/part versus whole-muscle identity.
- Review gallbladder/perineal regional corrections and adjacent-region context. Existing IDs are preserved; their embedded regional slug is not the current membership authority.
- Check incomplete abdominal wall, hand muscles, pelvic floor, facial/cranial coverage and connective tissues against each displayed limitation.
- Verify layer order, landmark occlusion, ghost hit-testing, plantar orientation and exploded framing on target devices.
- Do not sign off muscle-fibre direction from the decorative hatching. No clinical validation has been performed by the software checks.
- See `docs/DISSECTION.md` for the detailed review workflow and non-operative scope.

## Anatomy and terminology

- Two-person review of mesh identity, laterality, boundaries and spatial relationships
- Two-person review of BodyParts3D reduced-mesh fidelity, joint surfaces, cuff relationships, normals and label anchors in each view
- Confirm that the default source-aligned pose, arm cropping and exploded display are correctly understood; no source re-registration has been claimed
- Check muscle/tendon boundaries: biceps is currently one long-head complex, not an independently segmented tendon
- Review illustrative hatching so it is not mistaken for validated muscle fascicle direction
- Verified origin, insertion, innervation, blood supply and action where applicable
- Version-pinned mappings to FMA, SNOMED CT and RadLex only where distribution rights are confirmed
- Synonym and search-term review for clinical ambiguity and regional variants

## Imaging

- Modality-specific review by qualified CT, MRI and ultrasound radiologists
- Approved acquisition parameters, planes, windowing/sequences and normal variants
- Rights-cleared, de-identified studies with documented consent/legal basis and provenance
- Registration accuracy validation for future 3D ↔ volume synchronisation
- Clear separation of illustrative teaching images from diagnostic image interpretation

## Educational quality

Dental/orbital additions require independent verification of all 28 tooth identities, crown/root forms, arch positions, occlusion, contacts and bone interfaces, plus ring/trochlea boundaries, thickness, tendon continuity and nerve relationships. No clinical tooth numbering is assigned; no periodontal tissues, internal tooth layers or third molars are supplied. Validate the five close study recipes and tiny-structure readability on actual devices. Source hashing and gross bounds/centres are not clinical evidence; see [head-detail gates](HEAD_DETAIL.md).

- Defined audience, prerequisites and learning objectives
- Peer-reviewed questions, distractors, feedback and pass criteria
- Bias and accessibility review, including non-colour selection cues
- Usability testing across students, clinicians and educators

## Governance and safety

- Named clinical owner, editorial owner and release approver
- Citation ledger, review dates, expiry dates and change history for every record
- Incident, correction, rollback and content-recall processes
- Regulatory and medical-device classification review for intended countries and claims
- Privacy/security assessment before any analytics, accounts, uploads or patient data are introduced
- Prominent intended-use statement and prohibition of diagnostic/patient-specific use for this prototype

## Revision status — September 2026

Eleven BodyParts3D meshes now replace procedural anatomy, with the complete four-muscle cuff. Source licence and identity mappings are recorded; independent clinical reviewers have not signed off. Labels and source geometry are not validated merely because the source is an anatomical database. No patient scans, independently segmented labrum/capsule/bursa, neurovascular structures or true DICOM registration are supplied.

Factual check for the newly added teres minor record: Juneja & Hubbard, *Anatomy, Shoulder and Upper Limb, Teres Minor Muscle*, NCBI Bookshelf, https://www.ncbi.nlm.nih.gov/books/NBK513324/ (accessed 2026-09-05). Used to check anatomical facts only; no source illustrations or licensed prose were imported. All teaching copy still needs editorial/clinical sign-off.

# Head-and-neck vessel Clinical/Pathology teaching

## Scope

Thirty-two original introductory drafts cover 16 primary-head-neck vessels in nine groups. Clinical and Pathology each reach **896 draft / 126 pending** (122 other vessels plus four held identities). These are draft lessons, not exhaustive curricula or independent clinical approval. Geometry, compact navigation, dissection recipes, other tabs and synchronization interfaces are unchanged.

## Source identities

All entries are system vessels / category vessel / primary head-neck. The official BodyParts3D ISA and PART-OF index rows were checked on 9 September 2026: all 33 components match, with none omitted. There are seven right, seven left and two midline selections.

| Selection                            | FMA      | Tree   | Ordered source components                                                       |
| ------------------------------------ | -------- | ------ | ------------------------------------------------------------------------------- |
| Right common carotid artery          | FMA3941  | isa    | FJ3564                                                                          |
| Left common carotid artery           | FMA4058  | isa    | FJ3483                                                                          |
| Right internal carotid artery        | FMA3949  | isa    | FJ1682                                                                          |
| Left internal carotid artery         | FMA4062  | isa    | FJ1682M                                                                         |
| Right vertebral artery               | FMA3958  | isa    | FJ1725                                                                          |
| Left vertebral artery                | FMA4066  | isa    | FJ1725M                                                                         |
| Right internal jugular vein          | FMA4754  | isa    | FJ3585                                                                          |
| Left internal jugular vein           | FMA4762  | isa    | FJ3485                                                                          |
| Basilar artery                       | FMA50542 | isa    | FJ1672, FJ1844                                                                  |
| Anterior communicating artery        | FMA50169 | isa    | FJ1655                                                                          |
| Right anterior cerebral artery       | FMA50029 | isa    | FJ1654                                                                          |
| Left anterior cerebral artery        | FMA50030 | isa    | FJ1654M                                                                         |
| Right posterior cerebral artery      | FMA50584 | partof | FJ1661, FJ1675, FJ1677, FJ1678, FJ1680, FJ1687, FJ1691, FJ1720, FJ1727          |
| Left posterior cerebral artery       | FMA50585 | partof | FJ1661M, FJ1675M, FJ1677M, FJ1678M, FJ1680M, FJ1687M, FJ1691M, FJ1720M, FJ1727M |
| Right posterior communicating artery | FMA50085 | isa    | FJ1713                                                                          |
| Left posterior communicating artery  | FMA50086 | isa    | FJ1713M                                                                         |

The first eight selections retain ordered head-neck/thorax navigation; the other eight retain head-neck only. Basilar is one midline identity with two components, not paired arteries. Each PCA is a nine-file PART-OF aggregate, not nine adjudicated branches. Thirteen filenames end in M and occur explicitly in the official index; they were not guessed or newly mirrored in this pass. No anatomical variant, angiographic segment boundary or complete circle of Willis is inferred.

## Evidence and limits

Sources consulted 9 September 2026. Short original factual teaching, not imported publisher prose or media:

- Common carotids: [NHLBI stroke mechanisms](https://www.nhlbi.nih.gov/health/stroke/causes), [NHLBI carotid ultrasound](https://www.nhlbi.nih.gov/health/heart-tests), [NHS stroke symptoms](https://www.nhs.uk/conditions/stroke/symptoms/) and [TIA](https://www.nhs.uk/conditions/transient-ischaemic-attack-tia/).
- Internal carotid / vertebral arteries: [2024 AHA cervical dissection scientific statement](https://www.ahajournals.org/doi/epdf/10.1161/STR.0000000000000457) and [NHS stroke symptoms](https://www.nhs.uk/conditions/stroke/symptoms/). Clinical context only; no neck-provocation advice or antithrombotic/treatment algorithm.
- Internal jugular veins: [Cleveland Clinic jugular veins](https://my.clevelandclinic.org/health/body/23148-jugular-vein) and [jugular distension](https://my.clevelandclinic.org/health/symptoms/23149-jugular-vein-distention). Thrombosis, infection-related context and pressure-related distension remain distinct; catheter/filter/surgical suggestions from the source are not reproduced.
- Basilar artery: [2024 ESO/ESMINT guideline](https://pubmed.ncbi.nlm.nih.gov/39043395/); no reperfusion eligibility, clinical scoring, time window or procedure is provided.
- Anterior communicating artery: [NINDS cerebral aneurysms](https://www.ninds.nih.gov/health-information/disorders/cerebral-aneurysms) and [2021 observational ACoA morphology cohort](https://pubmed.ncbi.nlm.nih.gov/33637879/). Study associations are not individual rupture probabilities or model measurements.
- ACA: [1998 original clinical series](https://pubmed.ncbi.nlm.nih.gov/17895117/), limited to a possible clinical localisation pattern; no prevalence or patient outcome inferred.
- PCA: [original multicentre PCA clinical series](https://pubmed.ncbi.nlm.nih.gov/10773642/), used for introductory symptom context, not an exhaustive territory map.
- PCom: [2011 retrospective imaging/third-nerve series](https://pubmed.ncbi.nlm.nih.gov/21150642/) and [1992 pupil-sparing case report](https://pubmed.ncbi.nlm.nih.gov/1327612/), with [NINDS aneurysm context](https://www.ninds.nih.gov/health-information/disorders/cerebral-aneurysms). A case demonstrates possibility, not frequency; pupil sparing is not used to rule out aneurysm.

Some NINDS/PubMed opens failed or returned browser-check pages; bounded indexed excerpts and accessible official pages supported the introductory facts. No access control was bypassed. No publisher figures, article tables, scans, vessel diagrams, questionnaires or treatment protocols were imported. Historical clinical series are not current treatment guidelines. Laterality/localisation teaching remains independently reviewable, not automatic diagnosis.

## Architecture and checks

Runtime: `lib/head-neck-vessel-clinical-curriculum.ts`. Match requires exact FMA, side, source tree, ordered components, primary region, ordered regions and category, plus vessels system. Only Clinical/Pathology are eligible. Source warnings persist, returned arrays are detached, and unsupported identities fall through. Body export matches the displayed lesson and retains absent imaging / no approval.

The immutable pre-edit snapshot is pinned to 5f049b701725e0a2873a0448fff1c8ad0df1b114. The before/transition pair records the 32 changes without replacing the original all-copy baseline. Historical projections protect 3,372 topic edits; the pelvic validator now compares unrelated content/counts at its pre-head-neck milestone while current direct/export checks remain.

Run:

- `npm run head-neck-vessel-clinical-curriculum:test -- --source`
- `npm run pelvic-vessel-clinical-curriculum:test -- --source`
- `npm run abdominal-vessel-clinical-curriculum:test -- --source`
- `npm run content:test`
- `npm run requirements:audit -- --check`
- `npm run content:export -- --scope=shoulder --check`

The new validator checks all source rows/components, exact ordering and side, M filenames, PCA PART-OF membership, midline identities, warnings, detached arrays, direct/display/export agreement, every unrelated topic/recipe and 31 negative mutations. Results are in `docs/head-neck-vessel-clinical-curriculum-validation.json`. These checks do not constitute visual, device, spatial or clinical acceptance. Browser testing is not performed in this background pass.

## Commercial rights and clinical review

Only original text/code and links added. Citation or public access is not an asset licence. No publisher illustration, text passage, scan, animation, clinical protocol, quiz bank or device guidance is included or relicensed; NIH-hosted third-party media remain separately copyrighted and are not reused. Existing original MIT, BodyParts3D CC BY 4.0 attribution and dependency-specific obligations remain. No new dependency, font, mesh, texture, paid service or API usage. Hosting pricing is not guaranteed indefinitely.

Before approval, independent neuroradiology, vascular-neurology, neuro-ophthalmology and head/neck reviewers must assess:

- Exact identities, source extent and sidedness, particularly the official M files and grouped PCA components.
- Arterial wall/branch boundaries, venous-versus-arterial distinctions, collateral uncertainty and absent perforators.
- Stroke/aneurysm urgency wording, non-exhaustive symptoms and the limits of pupil-based or territory-based inference.
- Current supporting medical evidence; historical cohort findings must not become treatment instructions or risk predictions.
- Direct CT/MRI/US teaching and licensed/de-identified examples before introducing scan interpretation, Doppler data or spatial registration.

No stenosis grade, aneurysm size/risk, safe nerve clearance, vessel patency, brain perfusion, procedural route, drug regimen or diagnosis is provided. Existing imaging hooks do not supply scans or verified registration. Preserve all four holds (FMA45097/FMA45098, FMA19728, FMA61970). Next: remaining limb vessel content and broader anatomy, reviewed quizzes, editorial and validated imaging/detail work. The broad atlas goal remains active.

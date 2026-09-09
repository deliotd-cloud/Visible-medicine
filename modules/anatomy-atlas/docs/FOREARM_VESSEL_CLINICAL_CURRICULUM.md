# Forearm vessel Clinical / Pathology drafts

Added 9 September 2026: 28 original introductory sections for 14 represented vessels in seven bilateral groups. Existing tabs gain content without new controls, geometry, fonts, dependencies, scans or patient data. The model-first layout, Visible Medicine branding, dissection/explode behaviour and future imaging IDs are unchanged.

## Source and identity scope

All 14 component memberships and source names were checked against the retained official BodyParts3D v4 IS-A index. Seven right and seven left identities; no midline identities, PART-OF groups, M filenames or omitted source components. Each selection has one component. Original primary region and ordered cross-region memberships are preserved.

- radial-arteries: FMA22733 (right, FJ2294); FMA22734 (left, FJ2242).
- ulnar-arteries: FMA22797 (right, FJ2310); FMA22798 (left, FJ2258).
- anterior-interosseous-arteries: FMA22812 (right, FJ2266); FMA22813 (left, FJ2214).
- cephalic-veins: FMA13325 (right, FJ2272); FMA13326 (left, FJ2220).
- basilic-veins: FMA22909 (right, FJ2270); FMA22910 (left, FJ2218).
- common-interosseous-arteries: FMA22807 (right, FJ2275); FMA22808 (left, FJ2223).
- recurrent-interosseous-arteries: FMA268667 (right, FJ2297); FMA268669 (left, FJ2245).

Radial, ulnar and anterior interosseous arteries retain forearm/hand navigation. Cephalic and basilic veins retain forearm/shoulder-arm navigation. Common and recurrent interosseous selections remain primary forearm. Ordered files and memberships, FMA ID, side, tree, category and vessels system all gate runtime delivery. A mismatch returns the existing fallback, never a guessed lesson.

Anatomy, Function, imaging, Quiz, geometry, coverage warnings and all unrelated selections remain unchanged. Existing right shoulder pilot vessels FMA13322/FMA23130/FMA13395 are not overwritten. Fresh lesson arrays and draft status are preserved in the export.

## Teaching and checked evidence

Links checked on 9 September 2026; original bounded synthesis, not copied publisher prose or procedures.

| Group                           | Teaching focus                                                                                     | Primary evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radial arteries                 | Occlusion after transradial access may be asymptomatic; patency differs from apparent hand comfort | [Original trial](https://pubmed.ncbi.nlm.nih.gov/19801029/); [ultrasound/patency trial](https://pubmed.ncbi.nlm.nih.gov/30431581/); [SVS acute ischaemia](https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia)                                                                                                                                                                                                                                                              |
| Ulnar arteries                  | Hypothenar hammer injury and downstream digital ischaemia; no universal predisposing abnormality   | [Original clinical series](https://pubmed.ncbi.nlm.nih.gov/10642713/)                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Anterior interosseous arteries  | Delayed pseudoaneurysm after ulnar fixation with anterior interosseous nerve deficit               | [Original case](https://pubmed.ncbi.nlm.nih.gov/34925612/)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Cephalic veins                  | Superficial inflammation versus deep thrombosis; native vein versus dialysis fistula               | [NHS phlebitis](https://www.nhs.uk/conditions/phlebitis/); [Cleveland Clinic fistula](https://my.clevelandclinic.org/health/procedures/dialysis-fistula); [NIDDK dialysis](https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/hemodialysis)                                                                                                                                                                                                                                           |
| Basilic veins                   | Possible PICC access, distinct thrombosis/infection risks and future dialysis-access preservation  | [NHS anatomical access guidance](https://www.clinicalguidelines.scot.nhs.uk/media/1515/vascular-access-procedure-and-practice-guidelines.pdf); [Plymouth PICC information](https://www.plymouthhospitals.nhs.uk/display-pil/pil-your-picc-line-7825/); [Morecambe Bay PICC information](https://www.uhmb.nhs.uk/our-services/patient-information-leaflets/care-your-peripherally-inserted-central-catheter); [NIDDK](https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/hemodialysis) |
| Common interosseous arteries    | Variant origins are not disease and are not assigned to the source model                           | [Original cadaver report](https://pubmed.ncbi.nlm.nih.gov/27437201/)                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Recurrent interosseous arteries | Parent artery/perforator distinction in reconstructive context; no guaranteed flap territory       | [Original anatomical/clinical series](https://pubmed.ncbi.nlm.nih.gov/26078501/)                                                                                                                                                                                                                                                                                                                                                                                                                              |

The hypothenar hammer series proposed a predisposition hypothesis; this is neither a necessary diagnostic condition nor proof of causation for every patient. The anterior interosseous case does not establish complication frequency. The common-trunk variant is one observed specimen, not a population estimate or a newly confirmed variant in this atlas. The recurrent-interosseous study does not validate all perforators, venous drainage or viable flap dimensions in the source.

The 2017 NHS vascular-access document is used only for a stable possible access-vein identity, not as current treatment policy or a universal vein preference. Newer NHS PICC patient information supports the broad complication/contact advice. No published line-care regimen, anticoagulant/antibiotic dose, device recommendation, puncture technique, catheter sizing, Allen-test protocol, flap harvesting or branch-sacrifice rule is reproduced.

Some PubMed opens returned empty pages and some full-text destinations required a browser check. Available original-source indexed abstracts and accessible official clinical pages support only the bounded claims above. No inaccessible full article is claimed to have been reviewed; access controls were not bypassed.

## Rights and commercial use

Original code and authored teaching use the existing MIT application licence. Existing BodyParts3D CC BY 4.0 attribution and dependency-specific notices remain necessary; the dependency set is not uniformly MIT. Citation, free access and NIH hosting do not grant rights to republish third-party figures. No publisher figure, image, scan, wording, table, procedure, questionnaire or quiz bank is imported or relicensed.

No new mandatory service or paid API is introduced. This does not promise permanently free third-party hosting/storage. Brand rights and clinical approval are separate from software licensing. Retain LICENSES/THIRD_PARTY_NOTICES.md and existing evidence on integration.

## Verification and historical preservation

Run `npm run forearm-vessel-clinical-curriculum:test -- --source` for the retained official index comparison. Without `--source`, committed exact-identity evidence is sufficient. Tests check runtime/export equivalence, mismatch rejection, fresh arrays, source warnings, held identities and unrelated content. They do not certify anatomy or clinical accuracy.

The before snapshot is pinned to source 05781e6c1b60f2b1a35a72baa6339fe84699ea25 and must not be recaptured. The transition records 28 changed topics, taking the cumulative pinned changes to 3,468. The preceding shoulder-arm validator uses a historical projection only for historical unrelated-copy and readiness assertions; its direct current/export checks remain current.

Clinical and Pathology each reach 944 draft / 78 pending body selections. The remaining 78 are 74 vessels plus four held identities, not 78 missing meshes. Existing anatomy/function/imaging/quiz readiness is unchanged. Draft availability is not exhaustive teaching or medical acceptance.

## Independent acceptance still required

- Anatomist/vascular reviewer: source side, extent, branch relations, identity and factual content of every lesson.
- Orthopaedic and reconstructive specialists: injury, nerve/artery distinctions, rare-case framing and perforator terminology.
- Vascular-access/renal team: terminology, warning advice, preservation context and local applicability; no line or dialysis procedure is approved.
- Review of emergency wording and UK-specific 999/111 references before use in other locations.
- Separate spatial, visual, mobile and accessibility inspection. Source/content tests are not these reviews. No browser testing was performed in this background pass.
- Properly licensed, de-identified CT/MRI/US data, radiological annotation and validated registration before real scan synchronization. The current hooks contain no scans or diagnostic thresholds.
- Preserve unresolved FMA45097/FMA45098, FMA19728 and FMA61970 without inferred identity or approval.

Next authoring queue: hand (42 vessels), thigh (8), leg (10), foot (14), followed by reviewed quizzes/editorial coverage and remaining spatial/imaging work. Neither introductory draft completion nor this milestone completes the broader atlas goal.

# Lower-limb vessel Clinical / Pathology drafts

Added 9 September 2026: 64 original introductory sections across 32 represented thigh, leg and foot vessels in 16 paired groups. Existing tabs carry the content, without new controls, geometry, dependencies, fonts, scans or patient data. Compact navigation, official branding, dissection/explode and imaging identifiers are unchanged.

## Exact source scope

All 36 component memberships and source names checked against the retained official BodyParts3D v4 indexes, with zero omissions. Sixteen right and sixteen left identities: 30 IS-A identities (32 components), two PART-OF identities (four components), no midline identities or M filenames.

- femoral-arteries: FMA70249 (isa; FJ2143); FMA70250 (isa; FJ2074).
- deep-femoral-arteries: FMA20796 (partof; FJ2137, FJ2158); FMA20797 (partof; FJ2069, FJ2078).
- femoral-veins: FMA21188 (isa; FJ2144); FMA21189 (isa; FJ2102).
- great-saphenous-veins: FMA21379 (isa; FJ2145); FMA21380 (isa; FJ2103).
- popliteal-arteries: FMA77380 (isa; FJ2170); FMA77381 (isa; FJ2086).
- anterior-tibial-arteries: FMA43896 (isa; FJ2130); FMA43897 (isa; FJ2065).
- posterior-tibial-arteries: FMA43898 (isa; FJ2172); FMA43899 (isa; FJ2087).
- popliteal-veins: FMA44328 (isa; FJ2171); FMA44329 (isa; FJ2117).
- small-saphenous-veins: FMA44334 (isa; FJ2176); FMA44335 (isa; FJ2121).
- dorsalis-pedis-arteries: FMA43916 (isa; FJ2055); FMA43917 (isa; FJ2073).
- medial-plantar-arteries: FMA43929 (isa; FJ2164); FMA43930 (isa; FJ2082).
- lateral-plantar-arteries: FMA43931 (isa; FJ2159); FMA43932 (isa; FJ2079).
- plantar-arterial-arches: FMA43943 (isa; FJ2169); FMA43944 (isa; FJ2085).
- deep-plantar-arteries: FMA69514 (isa; FJ2136); FMA69515 (isa; FJ2068).
- superficial-medial-plantar-arteries: FMA43937 (isa; FJ2179); FMA43938 (isa; FJ2089).
- dorsal-foot-venous-arches: FMA44881 (isa; FJ2061, FJ2062); FMA44882 (isa; FJ2059, FJ2060).

Primary thigh entries retain ordered [thigh, pelvis, leg] membership; primary leg entries retain [leg, foot]; foot entries retain [foot]. Each profunda identity contains two ordered PART-OF components, without invented circumflex/perforator names. Each dorsal foot venous arch contains two ordered components without new tributary labels. This is the admitted source subset, not a complete arterial or venous tree.

The runtime requires exact FMA ID, side, source tree, ordered files, category, primary region, ordered region memberships and vessels system. Arrays are detached and coverage warnings retained. Existing Anatomy/Function/imaging/Quiz, dedicated shoulder and all unrelated teaching remain unchanged.

## Evidence and limits

Checked 9 September 2026. Original bounded factual synthesis; no third-party expression, illustration or protocol is reproduced.

- **femoral-arteries**: [Source 1](https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/); [Source 2](https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia).
- **deep-femoral-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/29419700/).
- **femoral-veins**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/7563535/); [Source 2](https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/).
- **great-saphenous-veins**: [Source 1](https://www.nhs.uk/conditions/varicose-veins/); [Source 2](https://www.nice.org.uk/guidance/cg168/chapter/1-recommendations).
- **popliteal-arteries**: [Source 1](https://vascular.org/your-vascular-health/vascular-conditions/peripheral-aneurysm); [Source 2](https://www.nhs.uk/conditions/bakers-cyst/); [Source 3](https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia); [Source 4](https://pubmed.ncbi.nlm.nih.gov/34023430/).
- **anterior-tibial-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/36212756/).
- **posterior-tibial-arteries**: [Source 1](https://www.nice.org.uk/guidance/cg147/chapter/Recommendations).
- **popliteal-veins**: [Source 1](https://www.nhs.uk/conditions/bakers-cyst/); [Source 2](https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/).
- **small-saphenous-veins**: [Source 1](https://www.nice.org.uk/guidance/cg168/chapter/1-recommendations); [Source 2](https://pubmed.ncbi.nlm.nih.gov/30328148/).
- **dorsalis-pedis-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/16517313/); [Source 2](https://www.nice.org.uk/guidance/cg147/chapter/Recommendations).
- **medial-plantar-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/16432324/).
- **lateral-plantar-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/25192411/).
- **plantar-arterial-arches**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/29353999/).
- **deep-plantar-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/31549862/); [Source 2](https://pubmed.ncbi.nlm.nih.gov/16015643/).
- **superficial-medial-plantar-arteries**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/29575166/).
- **dorsal-foot-venous-arches**: [Source 1](https://pubmed.ncbi.nlm.nih.gov/20237367/); [Source 2](https://pubmed.ncbi.nlm.nih.gov/11266485/).

NHS/NICE references support symptom assessment, deep versus superficial venous disease, duplex reflux assessment, and the caution that normal/raised ABPI does not exclude PAD in diabetes. The NICE CG147 [overview](https://www.nice.org.uk/Guidance/CG147) records an April 2026 update decision because critical-limb-ischaemia management may be outdated: this extension does not import that treatment algorithm. CG168's first attempted URL returned 403; its indexed official 1-recommendations page supplied the narrow assessment fact used.

Original case reports/series illustrate profunda and ankle/plantar arterial injury and dorsal foot venous aneurysm, without incidence estimates or preferred treatments. The 2001 venous-arch report supports a possible nonpulsatile presentation only: its historical venography/excision recommendations are not imported. The 2010 report's local-pressure association is not treated as universal causation.

The pedal-arch cohort is retrospective and post-revascularisation: association is not proof that altering the arch alone causes healing or survival. Cadaver studies of dorsal/plantar contributions, first intermetatarsal relationships and superficial medial plantar perforators do not establish a variant, safe distance or tissue territory in this mesh. The medial plantar clinical series supplies reconstructive context only. The small saphenous healthy-participant ultrasound study does not validate this model's sural-nerve spacing.

Some PubMed full-page opens were empty or browser-checked. Accessible indexed original abstracts support only the stated bounded facts; no inaccessible full article is claimed reviewed and no access controls were bypassed. Independent acceptance requires full evidence appraisal.

## Rights and commercial use

Original code/teaching follow the existing MIT licence. Existing BodyParts3D CC BY 4.0 and dependency-specific obligations remain mandatory. No publisher prose, figure, scan, table, guideline algorithm, questionnaire, quiz bank or procedural instructions are incorporated or relicensed. Public availability, NIH hosting and citation do not grant commercial asset rights. NHS page images credited to Science Photo Library are not imported.

No new paid service, API or mandatory fee is introduced. Third-party hosting/storage terms may change; no forever-free hosting promise. Keep LICENSES/THIRD_PARTY_NOTICES.md and the existing model/dependency/brand notices.

## Engineering and acceptance

Run `npm run lower-limb-vessel-clinical-curriculum:test -- --source`. Checks cover exact source identities/components, ordered grouping, mismatch rejection, detached data, retained warnings, runtime/export equality, held states, and preservation of unrelated sections. These checks do not validate medical accuracy.

Before snapshot pinned to c77800231a528cee535172f143e236ebac9b603a; 64 changes bring cumulative pinned topics to 3,616. The prior hand test projects historical unrelated/readiness assertions only; direct runtime/export checks stay current. The uncommitted after capture was refreshed once before release to add the 2001 venous-arch source; the before snapshot was never changed.

Clinical and Pathology each reach 1,018 draft / four pending. These counts indicate introductory draft availability, not exhaustive teaching or clinical approval. Anatomy remains 1,020 draft / two identity-only; Function 1,018 draft / four pending; CT/MRI/US each 11 draft / 1,011 pending; Quiz 11 draft / 1,011 generated-identification.

Independent acceptance remains:

- Anatomist and vascular specialists: each identity, source grouping, extent, branch continuity, arterial/venous distinction and clinical statement.
- Clinical educators: terminology, rare-case framing, diabetic-foot/perfusion cautions and staged difficulty; no procedural use is validated.
- Emergency wording and UK-specific service localization, plus accessibility.
- Spatial, visual, mobile and screen-reader testing; Sites background rules mean no browser testing in this pass.
- Licensed/de-identified acquired CT/MRI/US, radiology annotations and registration validation remain absent.
- Held FMA45097/FMA45098, FMA19728 and FMA61970 remain unresolved; no invented content or approval.

Next: reconcile the full-objective evidence audit and develop substantive source-cited, educator-reviewable quizzes using existing Practice navigation. Preserve a distinction between generated identification, draft reasoning questions and approved education. Do not add interface clutter or mark the broad goal complete for draft coverage.

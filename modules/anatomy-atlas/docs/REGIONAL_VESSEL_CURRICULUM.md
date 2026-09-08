# Head/neck and lower-limb vessel teaching

8 September 2026: 80 original Anatomy/Function drafts for 40 existing vessel representations. Nineteen bilateral groups and two midline definitions use 59 source components. These are educational drafts, not clinical acceptance. Existing panels, geometry, controls and dependencies are unchanged.

## Scope and source identity

Primary regions: head-neck sixteen, thigh eight, leg ten and foot six. Secondary regional memberships remain exact. Coverage includes carotid/vertebral/basilar/cerebral and communicating arteries, internal jugular veins, femoral/deep femoral and popliteal vessels, tibial and foot arteries, and great/small saphenous veins. Shared region navigation does not create extra structures or vascular territories.

All forty exact names, FMA IDs, sides and file memberships match the cached official BodyParts3D v4 ISA or PART-OF index. The validator pins these observations separately from teaching. Basilar FMA50542 uses two ISA files, FJ1672/FJ1844, as one midline selection. Posterior cerebral FMA50584/FMA50585 each use nine PART-OF files, not nine adjudicated branches or P1/P2 segments. Deep femoral FMA20796 uses FJ2137/FJ2158 and FMA20797 uses FJ2069/FJ2078; each pair is one PART-OF selection, not two named perforators. Remaining entries have one source file each.

The resolver checks vessel system/category, exact FMA/laterality, primary region and every required secondary region. Common-carotid teaching retains side-specific origins rather than forcing symmetry. Midline basilar and anterior communicating entries are not paired. Display and exports receive fresh arrays and preserve coverage warnings. Source component count is not a branch count or evidence of continuity.

## Factual references and rights

Original short notes were checked against the following references on 8 September 2026:

- [Common carotids](https://www.ncbi.nlm.nih.gov/books/NBK545238/), [internal carotids](https://www.ncbi.nlm.nih.gov/books/NBK556061/) and [internal jugular veins](https://www.ncbi.nlm.nih.gov/books/NBK513258/).
- [Vertebrobasilar system](https://www.ncbi.nlm.nih.gov/books/NBK540995/), [posterior cerebral arteries](https://www.ncbi.nlm.nih.gov/books/NBK538474/) and [anterior cerebral vascular anatomy](https://pmc.ncbi.nlm.nih.gov/articles/PMC11161539/).
- [Femoral arteries](https://www.ncbi.nlm.nih.gov/books/NBK538262/), [tibial arteries](https://www.ncbi.nlm.nih.gov/books/NBK532871/) and the anatomical portions of [lower-limb arterial ultrasound review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5381852/).
- [Deep lower-limb venous anatomy](https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/) and [superficial venous anatomy](https://pmc.ncbi.nlm.nih.gov/articles/PMC3036282/).
- [UAMS lower-limb arterial table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/) and [Texas Tech foot dissection answers](https://anatomy.ttuhscep.edu/musculoskeletal_system/leg_ans.html), factual plantar context only.

PMC direct openings returned browser-check content; specific indexed passages supplied the inspected evidence. They are not represented as successful full-text downloads. Other inspected references contained inconsistent or erroneous statements: communicating-artery origins, ophthalmic branch order, inguinal-ligament landmarks and oversimplified tibial branching were not adopted. No fixed variant percentages, exclusive perfusion maps, procedure protocols or scan findings were authored from these sources.

Only brief original factual teaching and citation links are included. No publisher prose, illustrations, tables, scans, dataset, font or texture was imported. NC/NC-ND or publisher copyright terms and university availability are not commercial redistribution grants. Original application code/text retain MIT terms; source-index evidence separately retains DBCLS BodyParts3D CC BY 4.0 obligations. No new dependency, paid API, patient data or private review export.

## Verification and clinical gates

`npm run regional-vessel-curriculum:test -- --source` checks forty memberships, 59 components, dispatch boundaries, mutation isolation, export parity, retained warnings and twelve rejected regressions. Twenty-six offline projections preserve 1,538 pinned topic edits against the original immutable baseline; runtime/export always use current lessons. The upper-limb readiness report is now explicitly historical.

Current body totals: Anatomy 962 draft/60 identity-only; Function 1,018 draft/zero identity-only/four pending. Function holds FMA45097/FMA45098, FMA19728 and FMA61970 remain pending. These counts do not mean completed anatomy, full clinical content or validated teaching. Most specialist/modality and authored quiz topics remain incomplete.

Independent review must adjudicate source identity, boundaries, branches, nerve/vessel relationships, venous junctions, variants and wording. No complete circle of Willis, patent lumen, collateral adequacy, pressure, reflux, infarct prediction, safe puncture site, acquired scan or patient registration is established. No new geometry or actual-device acceptance testing. Next: audit the remaining sixty generic Anatomy entries, then deepen clinical/modality teaching within existing panels. Local commits and mirrors are not GitHub upload or hosted publication.

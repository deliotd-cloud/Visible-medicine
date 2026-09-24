# Liver branch clinical and imaging teaching

## Arterial and portal CT/MRI orientation drafts — 24 September 2026

The right and left hepatic arterial concepts (FMA14778/FMA14779) and right and
left portal concepts (FMA15414/FMA15415) each now render a short CT and MRI
orientation draft: four authored modality paragraphs across eight sided
placements. The [ACR LI-RADS v2018 CT/MRI phase definitions](https://edge.sitecorecloud.io/americancoldf5f-acrorgf92a-productioncb02-3650/media/ACR/Files/RADS/LI-RADS/LI-RADS-CT-MRI-2018-Core.pdf)
provide the distinction between arterial and portal venous enhancement. CT
attenuation and MRI signal are described separately. These notes give no
acquisition protocol or diagnostic interpretation; no scan, registered volume,
contrast data, new model or clinical approval is supplied. Anatomy, Function,
Clinical, Pathology and Ultrasound paragraphs and exact source pins remain
unchanged. The coverage table and totals below record the earlier milestone.

## Biliary CT extension — 10 September 2026

The [duct-imaging extension](DUCT_IMAGING_TEACHING.md) adds one shared CT note for the right and left intrahepatic bile-duct source groups. Their MRI/US notes and all existing teaching remain unchanged. No scan, source geometry, stone, stricture, connection or clinical approval is supplied. Earlier coverage below describes historical milestones; consult [current status](CURRENT_STATUS.md).

## Earlier delivered scope (before the 24 September extension)

In **Abdomen → Liver → Explore liver branches**, select a group and expand **Learn more · anatomy, clinical & quiz**. The existing three information groups contain 15 new short, referenced paragraphs shared by seven exact-source targets. The model-first layout, collapsed disclosure, search, dissection and unscored self-check remain unchanged.

| Concept | Source targets | Earlier drafts | Pending at that earlier milestone |
| --- | --- | --- | --- |
| Hepatic arterial branches | Right FMA14778 / left FMA14779 | Clinical, Pathology, Ultrasound | CT, MRI |
| Portal branches | Right FMA15414 / left FMA15415 | Clinical, Pathology, Ultrasound | CT, MRI |
| Hepatic bile ducts | Right FMA71857 / left FMA71858 | Clinical, Pathology, Ultrasound, MRI | CT |
| Middle-hepatic venous tributary | FMA15800 | Clinical, Pathology, Ultrasound, CT, MRI | None of these five introductory topics |

These are introductory teaching drafts, not comprehensive clinical chapters or approved imaging interpretation. Eight Clinical/Pathology and seven modality paragraphs yield 25 displayed section updates across the seven representations. There is no new pathology geometry, scan, waveform, measurement, procedure plan or complete liver-segment map.

## Sources and limits

The [authored module](../content/hepatic-teaching.ts) binds each paragraph to six additional primary references, consulted 10 September 2026:

- Iida et al., *Hepatic arterial complications in adult living donor liver transplant recipients* (2014), [PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/24974916/). Used as a clearly identified transplantation example; no cohort rates are generalised to other patients.
- NIDDK, [Cirrhosis: definition and complications](https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/definition-facts), [PSC definition](https://www.niddk.nih.gov/health-information/liver-disease/primary-sclerosing-cholangitis/definition-facts), and [PSC diagnosis](https://www.niddk.nih.gov/health-information/liver-disease/primary-sclerosing-cholangitis/diagnosis).
- Northup et al./AASLD, [Vascular liver disorders, 2020 practice guidance](https://aasldpubs.onlinelibrary.wiley.com/doi/10.1002/hep.31646), published in Hepatology 73 (2021). Substantive primary indexed text supported the outflow sections; the direct publisher fetch failed on a redirect. No claim of a successful full-text fetch or newest guideline edition.
- AIUM/ACR/SPR/SRU, [Abdominal ultrasound practice parameter](https://www.aium.org/docs/default-source/resources/guidelines/abdominal.pdf?sfvrsn=2cdd07d_1), 2017, pp. 5–6. The official PDF's liver/biliary text was read. It is cited for basic anatomical examination concepts, not supplied as a current prescribing/acquisition protocol.

No third-party image, scan, table, protocol, chapter, case vignette or question bank is imported. Original short paraphrases and links do not relicense source publications or imply endorsement. Conservative 200-word-per-source checks count each unique concept once, including imaging; repeated sided representations do not inflate the total. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md). No new package, paid API, font, texture or model is added.

## Contract and verification

`content/hepatic-teaching.ts` supplies only Clinical/Pathology and explicitly authored optional imaging. Existing Anatomy/Function/Quiz/model limits and source bindings are preserved. The runtime's identity, side, study and bundle guards are unchanged. Unsupported modalities retain their original pending response rather than borrowing another part's paragraph.

`npm run nested-teaching:test` validates all 53 destinations, the exact per-concept modality matrix, changed source identities, detached partial imaging objects, missing-topic fallbacks, actual section-rendered references and source word budgets. Historical digests protect the entire nonhepatic registry—including cardiac imaging—and the unchanged hepatic core. Teaching pins are checked, not regenerated. `requirements:audit` now fingerprints the separate cardiac/hepatic files and resolved nested concepts/reference data, so same-count prose edits cannot escape freshness checks.

Nested totals: 33 concepts / 53 representations / seven parents / 43 references. Clinical 48 draft / five pending; Pathology 44 / nine; CT five / 48; MRI seven / 46; Ultrasound 11 / 42. Anatomy, Function and Quiz each remain 53 draft / zero pending. These figures measure coverage, not accuracy, completeness or clinical approval.

## Required before clinical publication

1. Hepatology, abdominal radiology/sonography and educator review of each paragraph, source support, intended learner level and current guideline context. No treatment recommendations or diagnostic thresholds are supplied.
2. Anatomical validation of source identities, branching variants, continuity and segment territories. Existing VI/VII near-overlap, VIII grouping and tissue defects remain unresolved; do not infer Couinaud boundaries or surgical planes.
3. Explicit browser/device acceptance of the existing information tabs, references, keyboard, text enlargement and mobile scrolling. Code/SSR checks are not browser, GPU or clinical acceptance.
4. Independent privacy, licensing, normality and registration review of future CT/MRI/US assets. The separate provisional head datasets remain untouched and unlinked. No pixels or invented anchors are imported.
5. Keep Anatomy Atlas and paid-lecture entitlements separate. Production resources remain empty; these notes do not grant access to a paid lecture or external image viewer.

Next: useful pulmonary branch teaching and remaining organ imaging gaps, without presenting missing tissue, fissures or unvalidated territories as completed anatomy. Publishing/recovery evidence is recorded in the dated checkpoint.

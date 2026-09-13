# Chest and abdominal muscle imaging drafts

13 September 2026. Eight concepts, 12 retained selections and 48 original
CT/MRI/ultrasound/X-ray topic placements. These are orientation drafts, not
comprehensive clinical coverage, patient annotations or radiologist approval.
The existing Imaging tabs are reused without another toolbar or control.

## Source scope

| Concept | FMA identities | Retained source pieces |
| --- | --- | --- |
| External intercostal | FMA9756 | FJ1451, FJ1451M |
| Internal intercostal | FMA9757 | FJ1455, FJ1455M |
| Innermost intercostal | FMA9758 | FJ1454, FJ1454M |
| Pectoralis major, right/left | FMA13373 / FMA13374 | FJ1446 + FJ1464 / FJ1446M + FJ1464M |
| Pectoralis minor, right/left | FMA13375 / FMA13376 | FJ1456 / FJ1456M |
| Transversus thoracis, right/left | FMA9761 / FMA9762 | FJ1461 / FJ1461M |
| Diaphragm | FMA13295 | FJ3131 |
| External oblique, right/left | FMA13336 / FMA13337 | FJ1452 / FJ1452M |

The three unchanged bundles are `thorax-muscles`, `thorax-muscles-dissection`
and `abdomen-muscles`. Full display identities, coordinates, source hashes,
bounds and anchors are pinned against `83bb1b6cd8bdb3f6b72ed9f8f6d98ee782e52fde`.
FMA/name similarity alone cannot apply this teaching to a different source.
Each intercostal selection combines bilateral pieces; it is not a numbered
space or neurovascular bundle. Combined pectoralis-major parts are not tendon
laminae. The diaphragm is one static selection, not independently functional
hemidiaphragms. No source hold is lifted and no procedural corridor is supplied.

## Reading evidence and rights

The following references were checked on 13 September 2026. Where PMC's direct
page returned a browser challenge, indexed article text/abstracts supplied the
bounded factual evidence; the diaphragm and abdominal-sonography publisher
pages were also accessible. No challenge was bypassed. This is not a claim of
systematic full-text review of every reference.

- [Thoracic wall anatomy](https://www.ncbi.nlm.nih.gov/books/NBK535414/): layers and membranous continuations.
- [Chest-wall sonography, part I](https://pmc.ncbi.nlm.nih.gov/articles/PMC5647615/): superficial anatomy and rib-related limitations.
- [High-resolution ultrasound of the chest wall](https://pubmed.ncbi.nlm.nih.gov/2171083/): human cadaver/ultrasound/thin-CT correlation and the composite pleural interface.
- [Pectoralis major ultrasound and MRI](https://pmc.ncbi.nlm.nih.gov/articles/PMC10668934/): muscle/head/tendon distinctions and imaging orientation.
- [Pectoralis major MRI guide](https://pmc.ncbi.nlm.nih.gov/articles/PMC12496263/): acquisition coverage versus a routine shoulder field of view.
- [Axillary node localization](https://pmc.ncbi.nlm.nih.gov/articles/PMC11909697/): coracoid, pectoralis minor and surrounding axillary anatomy.
- [Transversus thoracis anatomical study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3037302/): individual variation in inner anterior chest-wall slips.
- [ASRA human parasternal teaching](https://asra.com/docs/default-source/asra-news/may-2020-special-edition.pdf): indexed ultrasound figure legend identifying muscle/vessel/pleural relationships, not a copied figure or block protocol. A blanket claim that this muscle is never visible by ultrasound is not adopted.
- [Diaphragm imaging review](https://link.springer.com/article/10.1186/s12890-021-01441-6): static anatomy versus motion, zone-of-apposition thickness versus dome excursion, and nonspecific elevation. No quantitative threshold or diagnostic protocol is reproduced.
- [Abdominal wall sonography](https://link.springer.com/article/10.1007/s40477-020-00435-0) ([PMC reading link](https://pmc.ncbi.nlm.nih.gov/articles/PMC7441131/)): outer-to-inner lateral muscle layers and aponeurotic relationships.
- [Imaging abdominal wall function](https://pmc.ncbi.nlm.nih.gov/articles/PMC8913712/): CT/MRI muscle, fascia and rectus-sheath orientation.
- ACR/RSNA [musculoskeletal MRI](https://www.radiologyinfo.org/en/info/muscmr) and [bone radiography](https://www.radiologyinfo.org/en/info/bonerad): broad modality scope and projection/soft-tissue limitations.

Only short original factual synthesis and reading links are distributed. Source
papers retain their own rights, including any non-commercial restrictions; free
reading access does not license their images for this commercial product. No
reference illustration, prose passage, scan, dataset, protocol or table is
imported. Existing MIT and BodyParts3D CC BY 4.0 obligations remain distinct.

## Verification

The focused validator checks 1,101 current schema records, all 48 actual React
note-callback renders, 720 altered-source/topic rejections, unique citations,
fresh returned arrays and unchanged physical bytes of the three source GLBs.
All other 9,861 topic placements, shoulder lessons and dissection recipes match
the pre-authoring snapshot. Offline transition reconstruction preserves older
fixed expected hashes; it never changes runtime content or approval decisions.
See `chest-wall-muscle-imaging-validation.json` for exact machine results.

TypeScript and production build pass. The original historical content-contract
suite passes 33,444 checks after refreshing only nine stale display-revision
fields in the shoulder draft export; its lessons and all original history
goldens are unchanged. The build verifies unchanged decoded scenes for 133
transport GLBs / 1,504 meshes. Existing large-chunk warnings remain.
Seven preceding brain/vessel/muscle imaging suites pass with their original
expected hashes. The 235 shoulder review safeguards and SQLite tests for 1,101 source contexts /
3,303 tracks pass with synthetic decisions, not production clinical records.
The body display fingerprint advances to
`03c04fa0cc7389dec8c073b7acbe3f3a608b932195fb6d8eda086c5ff7025dc0`
(483 inputs); no private approval is migrated.

Actual browser samples at 1280×720 verify diaphragm CT/ultrasound, Isolate &
frame, and right pectoralis-major MRI. At 390×844, the selected MRI tab survives
opening the information drawer; the text is readable and document width equals
scroll width (390). Abdominal Search selects left external oblique into the
drawer, its CT/MRI notes render, and Return to model restores focus to Structure
info. No assessment answers, saved views or review decisions were submitted.
This is sampled browser evidence, not physical-device or clinical acceptance.

Exact source/GitHub/D recovery is recorded separately in the coordinating
task's dated checkpoint. No new hosted availability is implied
by local checks or a source push. The website's four distinct contained exports
are unchanged by this root-body teaching batch.

## Remaining clinical and integration requirements

The radiologist should review all eight concepts, both sides where present,
and actual modality examples: intercostal/pleural separation, major/minor and
tendon distinctions, variable parasternal slips, diaphragm motion versus shape,
and abdominal muscle versus aponeurosis. Generic donor surfaces cannot prove
normality, map a tear, select a needle path or define a patient boundary.
Further pathology/clinical depth and real-image annotations remain separate
work, not completed by these orientation notes.

Keep all source scans, masks and accepted CT-head boundaries private and
unchanged. Use Didanix Education/light for future cleared imaging; existing
native CT/MRI tools remain local QA. Case, Atlas and lecture entitlements stay
independent. A reading link is not paid-lecture access, a structure match is not
spatial registration, and tests do not confer clinical or release acceptance.

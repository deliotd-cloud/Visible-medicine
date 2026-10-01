# Current atlas status

Generated from the current displayed catalogue, teaching resolver, dissection profiles and question definitions. Reproduce with `npm run requirements:audit`; verify with `npm run requirements:audit -- --check`. [JSON inventory](requirement-audit.json) contains source fingerprints and detailed counts. Historical milestone totals are not current coverage.

## Current source scope

- 1104 displayed root-body representations, 109 body GLBs (104390180 canonical bytes), 11 regions plus whole body; 1022 retained archival records.
- Dedicated shoulder: 9 representations / 11 source parts, overlapping the body catalogue.
- Nested dissections: 108 selectable parts, 47 teaching concepts / 125 references; 29 geometry-only selections retain pending teaching.
- 159 dissection stages / 207 focuses. These operate on supplied surfaces, not complete anatomy.
- Guided learning: 24 regional tours / 136 stops; dedicated shoulder 1 tour / 5 stops. These source-bound drafts reuse existing anatomy, not additional unique structures or clinical approvals.
- Nested eye guided learning: 2 source-bound draft guides / 8 stops across 15 existing distinct eye children. [Eye-layer guidance](EYE_LAYER_GUIDED_LEARNING.md) overlaps the nested anatomy above; it adds no root-body anatomy, regional tours, geometry or clinical approval.
- Independent source-guided dissection: 9 draft sequences / 72 steps. [Female pelvis](HRA_PELVIC_GUIDED_DISSECTION.md), [abdominal wall and back](WALL_BACK_GUIDED_DISSECTION.md), [kidneys](RENAL_GUIDED_ABDOMINAL_BONES.md) and [lower-limb regions](UM_LIMB_GUIDED_DISSECTION.md) reuse admitted surfaces in separate source frames; no new anatomy or validated surgical planes.
- Find/name identification; 166 draft reasoning concepts bound to 308 root-body representations in shoulder-arm, foot, thigh, pelvis, leg, forearm, head-neck, spine, thorax, abdomen, hand. [Reasoning practice](REASONING_PRACTICE.md) is separate from Quiz-tab notes.

Independent specimens retain separate source frames and teaching inventories. These counts are not added to root-body or nested coverage; lower-limb regional scopes overlap the same specimen.

| Independent specimen | Representations |
| --- | ---: |
| [Lower limb](UM_LIMB_DISSECTION.md) | 67 |
| [Kidneys](HRA_KIDNEY_SPECIMEN.md) | 82 |
| [Female pelvis](HRA_FEMALE_PELVIS.md) | 43 |
| [Abdominal wall](ABDOMINAL_WALL_SPECIMEN.md) | 29 |
| [Back layers](BACK_LAYERS_SPECIMEN.md) | 48 |

## Root-body teaching readiness

9936 topic placements across nine displayed topics. Counts describe displayed copy per representation, including shared source-group text, not unique lessons, medical correctness or approvals. The original eight topics remain; X-ray is additional. See [content contract](CONTENT_CONTRACT.md).

| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
| Anatomy | 1104 | 0 | 0 | 0 |
| Function | 1101 | 0 | 3 | 0 |
| CT | 906 | 0 | 198 | 0 |
| MRI | 878 | 0 | 226 | 0 |
| X-ray | 456 | 0 | 648 | 0 |
| Ultrasound | 626 | 0 | 478 | 0 |
| Pathology | 1099 | 0 | 5 | 0 |
| Clinical | 1099 | 0 | 5 | 0 |
| Quiz notes | 124 | 0 | 1 | 979 |

## Nested teaching readiness

Separate from root-body coverage and overlapping parent anatomy. Unnamed cranial pieces receive no inherited parent teaching. Brief drafts and model-scope self-checks are not full curricula or complete organ interiors. See [nested teaching](NESTED_ANATOMY_TEACHING.md) and [nested reviews](NESTED_REVIEWS.md).

| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
| Anatomy | 79 | 0 | 29 | 0 |
| Function | 77 | 0 | 31 | 0 |
| CT | 77 | 0 | 31 | 0 |
| MRI | 77 | 0 | 31 | 0 |
| X-ray | 9 | 0 | 99 | 0 |
| Ultrasound | 44 | 0 | 64 | 0 |
| Pathology | 77 | 0 | 31 | 0 |
| Clinical | 77 | 0 | 31 | 0 |
| Quiz notes | 79 | 0 | 29 | 0 |

## Dedicated shoulder teaching readiness

These representations overlap root-body anatomy. Shared text and introductory questions require independent review. See [shoulder review](REVIEW_WORKSPACE.md).

| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
| Anatomy | 9 | 0 | 0 | 0 |
| Function | 9 | 0 | 0 | 0 |
| CT | 9 | 0 | 0 | 0 |
| MRI | 9 | 0 | 0 | 0 |
| X-ray | 9 | 0 | 0 | 0 |
| Ultrasound | 9 | 0 | 0 | 0 |
| Pathology | 9 | 0 | 0 | 0 |
| Clinical | 9 | 0 | 0 | 0 |
| Quiz notes | 9 | 0 | 0 | 0 |

## Imaging implementation and configured resources

Atlas static registry: version 1; 0 configured resources / 0 correspondences in `content/learning-resources.v1.json`. Its scope is the Atlas document, not the separate website host configuration. Supported versions 1 and 2 cover 1221 scope-specific destinations, including 108 nested destinations; kinds: ct, mri, xray, ultrasound, lecture, quiz. See [resource contract](LEARNING_RESOURCE_CONTRACT.md) and [nested linking](NESTED_LEARNING_LINKS.md).

Implemented capabilities are distinct from registry counts: the [Didanix Education selection port](DIDANIX_SELECTION_ADAPTER.md), [optional decoded CT/MRI viewer](VOLUME_VIEWER.md), and [private native MRI import checker](NATIVE_MRI_VIEWER.md) exist in Atlas source. The separate website's canonical `docs/master-plan.md`, mapped in the coordination `WORKSPACE_MAP.md`, records Education integration and completed native MRI synthetic QA. This inventory does not inspect that website's runtime or certify deployment. Empty Atlas resource configuration is not evidence that image viewers or website integration are absent.

Didanix Education/light remains the learner imaging target. Local QA and optional decoded-volume rendering do not establish cleared cases, DICOM ingestion, generic-atlas registration or clinical acceptance. Anatomy, case and separately paid lecture access remain independent. Actual acquired-image mapping requires exact source/resource revisions, privacy/rights clearance, server entitlements and validated correspondence. Completed synthetic MRI QA is distinct from these remaining gates; teaching text and plausible mesh positions cannot supply scan registration.

## Scope limits and remaining gates

- Teaching and reasoning remain drafts. This inventory reads no private review records and determines no clinical approvals. Anatomy and teaching require separate revision-bound radiologist sign-off; approvals never transfer between scopes. See [specimen reviews](SPECIMEN_REVIEWS.md).
- Teaching identities FMA45097/FMA45098, FMA19728 and FMA61970 remain held; source/geometry holds such as FJ3211 remain separate. Peripheral nerves/plexuses, complete joint layers, finer organ interiors and female-body gaps remain. Independent female pelvis is not a complete female body. See [source inventory](SOURCE_INVENTORY.md), [gap decisions](GAP_FILLING.md) and [brachial-plexus source review](BRACHIAL_PLEXUS_SOURCE_REVIEW_20260928.md).
- Dated browser samples accept only tested revisions/flows. Full physical-device, accessibility, dense-label, free-orbit separation and performance acceptance remain separate; software/SSR tests do not complete that matrix.
- 140 public/archive GLBs; 808 classified lockfile entries / 0 unclassified. Asset totals include alternate/reference files. Preserve source credit/licences and reserved brand rights; classification is not exhaustive legal clearance or a perpetual free-hosting guarantee.
- This audit imports no patient scans, identifiers, CT-head masks or accepted boundaries. Clinical PACS and the separate desktop application remain outside this work.
- Recovery and publication require dated exact-source checkpoints and verified readbacks/restores. These counts do not verify deployment, GitHub/D recovery, private-review or conversation recovery.

Use [requirement/acceptance audit](REQUIREMENT_AUDIT.md), [multimodal plan](MULTIMODAL_LEARNING_PLAN.md), and [ordered improvement plan](CONTINUOUS_IMPROVEMENT.md). The full Atlas goal remains active; this source inventory is not clinical, visual, deployment or legal certification.

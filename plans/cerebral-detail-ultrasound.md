# Cerebral detail neonatal ultrasound draft — source-only handoff

Baseline: clean Atlas `d9bdfa1ceb1d86cabe059e963dcd6284f9527be1` at `G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us/atlas`. Proposal files under `files/content/` are copied or new; the baseline and canonical checkout were not edited.

## Scope and anchors

- New `cerebral-detail-ultrasound.ts`: four original `readiness: 'draft'` orientation sections (176 words total), each using the already registered `cerebralNeonatalUS` and `cerebralNeonatalUSWindow` reference keys.
- `nested-teaching.ts`: import at line 11; ultrasound fields for insula at line 1034, anterior superior temporal source part at line 1062, posterior source part at line 1074. Existing CT/MRI/function/pathology/quiz content is unchanged.
- `hippocampal-teaching.ts`: import at line 2, ultrasound field at line 37, and scope-note correction at line 41. Existing MRI/CT/body/function/pathology/quiz content is unchanged.
- One concept-level lesson is shared by each paired left/right binding; intended placements: eight. No renderer, source geometry, asset, reference metadata, count or test file was edited.

## Resolver identity checked against baseline bindings

| Concept | Left FMA / source name | Right FMA / source name | Resolver source hash |
| --- | --- | --- | --- |
| `cerebral-insula` | FMA72978 / left insula | FMA72977 / right insula | `7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410` |
| `cerebral-hippocampus` | FMA72714 / left hippocampus | FMA72713 / right hippocampus | `11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e` |
| `cerebral-superior-temporal-anterior` | FMA72801 / anterior part of left superior temporal gyrus | FMA72800 / anterior part of right superior temporal gyrus | `7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410` |
| `cerebral-superior-temporal-posterior` | FMA72805 / posterior part of left superior temporal gyrus | FMA72804 / posterior part of right superior temporal gyrus | `7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410` |

## Evidence and limits

Factual orientation cues follow the already reviewed Gonçalves/Hwang 2021 neonatal ultrasound roadmap (lateral sulcus and temporal cortex on anterior-fontanelle coronal views; hippocampal relation to temporal horn; insula deep to lateral sulcus with coronal/far-lateral sagittal orientation). The existing EFSUMB/ECMUS 2022 safety reference supports acoustic-window and technique limitations. No figure, image, asset or source prose was copied. The teaching distinguishes the diagrammatic source parts from validated neonatal boundaries and functional maps. It does not represent an actual ultrasound case or clinical approval.

Static inspection only: resolver bindings, exact two-file diffs, reference-key registry and word count. Builds, test runtimes, renderer generation and clinical review remain for integration when memory permits.

## SHA-256

Baseline source: `nested-teaching.ts` `0769D902CF0973CC84229061440FDE4E26CCB29442ED16C28F801FCD35193BAD`; `hippocampal-teaching.ts` `6EE598D0771A70CA570CE017222EB8A4894FEB4C8B59343EBC70F4CED435AF87`; `cerebral-lobar-imaging.ts` `44D14E43FE2C3B3BD07CAC9D25D9379E144DEEB54F602CCC5E4EC678B73E646B`; `nested-teaching-bindings.v1.json` `333FE4F02E3A776C119BD8D6AF75787DA27EBDD0D777FA5E028FE60CFD42A81E`.

Proposal: `cerebral-detail-ultrasound.ts` `C83B73B7B253A67C5B8F5502B31920577732119FE617A94A7500C6C886BA17B7`; `nested-teaching.ts` `E0AF4FBDBA183558D3D0EF0C5EE97E438A76FA04D92A0028784F3D1137611C09`; `hippocampal-teaching.ts` `B1A4210F55C8268A4013C7EDD948626859D1B15FAB770DD5813D4C93FB638A10`.

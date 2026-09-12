# Upper-limb vessel imaging orientation

Select a supplied vessel in Shoulder & arm, Forearm, Thorax (axillary veins) or Whole body, then open its existing **Imaging → CT / MRI / Ultrasound** tab. The two [arm vascular studies](ARM_VASCULAR_STUDIES.md) provide useful source context without another panel. No new control, image, mesh or vessel segment is added.

| Source group | Bilateral selections | CT drafts | MRI drafts | US drafts |
| --- | ---: | ---: | ---: | ---: |
| Axillary and brachial arterial trunks | 4 | 4 | 4 | 4 |
| Deep brachial branches | 2 | 2 | 2 | 2 |
| Axillary and source-labelled medial brachial veins | 4 | 4 | 4 | 4 |
| Cephalic and basilic veins | 4 | 0 | 0 | 4 |
| Total | 14 | 10 | 10 | 14 |

The **34 placements reuse ten distinct topic texts across four groups**, with seven selection-specific cautions. Side-specific surfaces share typical facts, not patient findings. All remain draft. The eight superficial-vein CT/MRI slots and all X-ray slots remain pending. Existing Anatomy, Function, Clinical, Pathology, Quiz, shoulder teaching and every dissection recipe are unchanged.

The notes distinguish CTA/CTV and MRA/MRV, flow-sensitive ultrasound versus an anatomical surface, small/deep-vessel limitations and partial venous coverage. There are no acquired slices, contrast enhancement, MR signal, Doppler waveforms, thrombi, stenosis measurements or validated vascular junctions. No test-selection algorithm, contrast/preparation advice, cannulation route, fracture management, procedural clearance or diagnosis is supplied. Source-level links are not patient registration or permission to access a separately paid lecture.

## Source identity and export

`upper-vessel-imaging-pins.json` retains all 14 full source records, their four unchanged bundles, source version/frame and each previous pending topic. Admission compares the complete selected record, not its name or FMA alone. Source changes fail closed for these new lessons. Each returned lesson owns new arrays, preventing mutation of another selection's notes.

The content shape schema previously accepted only top-level/full-body unversioned GLB paths. It now accepts one safe local BodyParts3D subdirectory and an optional 64-hex `?v=` version, which the already-admitted medial brachial vein uses. This is not asset admission: the content validator still compares the complete binding with an independently loaded trusted source registry. External URLs, traversal, extra depth, arbitrary query parameters and well-formed but wrong paths/versions are rejected. Schema version 2 remains backward-compatible; no database table or stored review is changed.

Exact offline teaching history restores the preceding pending topics for old authoring tests. It checks recorded before/after hashes, preserves all 9,506 unaffected displayed body topic slots, and never migrates clinical approvals. Historical tarsal tests explicitly remove only this recorded later teaching before comparing their older baseline; actual tarsal notes are still tested directly.

## References and rights

Original factual synthesis uses these primary professional-society educational pages, checked 12 September 2026:

- [ACR/RSNA CT angiography](https://www.radiologyinfo.org/en/info/angioct), reviewed June 2026.
- [ACR/RSNA MR angiography](https://www.radiologyinfo.org/en/info/angiomr), reviewed June 2026.
- [ACR/RSNA vascular ultrasound](https://www.radiologyinfo.org/en/info/vascularus), reviewed July 2026.
- [ACR/RSNA venous ultrasound](https://www.radiologyinfo.org/en/info/venousus), reviewed July 2026.
- [ACR/RSNA upper-extremity DVT imaging summary](https://www.radiologyinfo.org/en/info/acs-upper-extremity-dvt), reviewed July 2022: used only for introductory modality roles, not a current decision algorithm or comprehensive guideline reproduction.

The newer AVF paper and full ACR narrative were not available through the reader, so they are not evidence citations for this pass. No access restriction was bypassed. No publisher prose, diagrams, tables, scans or patient data are imported. The original notes/code use MIT; all existing BodyParts3D attribution and CC BY 4.0 obligations remain. No dependency, font, texture, model, paid service or additional runtime fee is introduced.

## Reproduction and acceptance

```sh
node scripts/pin-upper-vessel-imaging.mjs --check
node scripts/record-upper-vessel-imaging.mjs --check
node scripts/validate-upper-vessel-imaging.mjs
```

The validator covers full-record bindings, unchanged bundle hashes, previous teaching/recipe preservation, all 34 topic placements, eight deliberately pending slots, independent returned-copy mutation, 336 rejected source/topic combinations, six invalid asset-path cases, content-schema exports and 42 actual existing-notes React renderings. It confirms the no-imaging-loaded disclosure and unchanged source catalogue. Source-derived word budgets are conservatively checked per reading reference.

These are software/content checks, not medical sign-off, actual-device/GPU acceptance, diagnostic accuracy or acquired-image registration. The owner-radiologist must approve terminology, applicability and limitations at the exact content/renderer revision. Continue substantive other regional anatomy/function; this pass does not fill all vascular imaging gaps.

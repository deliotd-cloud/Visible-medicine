# Achilles: model-to-imaging teaching pilot

Open Leg or Foot, select the right or left calcaneal (Achilles) tendon, then choose **Imaging → MRI** or **Imaging → Ultrasound**. Both existing selections also work in the whole-body atlas. The compact information panel, dissection, Study together and region links are unchanged. No new toolbar, viewer or subscription is introduced.

Two original topic drafts are shared by the two exact sided representations: four displayed sections, not four independent lessons. MRI covers the relationship between model orientation, acquisition planes, sequence names and the questions an examination can address. Ultrasound covers long-/short-axis inspection, surrounding tissues, anisotropy, plantaris confusion and the difference between live imaging and an exploded model. Neither contains acquired images, measurements, diagnostic thresholds, a patient case or treatment instructions. CT remains explicitly pending; this pilot does not fill CT, X-ray or the head-atlas integration gap.

## Source and editorial boundaries

The existing BodyParts3D v4 IS-A records remain unchanged: right FMA258847/FJ1405 and left FMA264844/FJ1405M, in `leg-connective-gaps`. These are complete retained source surfaces, not independently resolved subtendons, paratenon, bursae or enthesis microstructure. The lesson resolver requires the exact identity, side, category, regions, bundle, node and source-file hash. A near name match or mismatched source cannot inherit these drafts.

Factual sources checked 9 September 2026:

- [ESSR ankle ultrasound technical guide](https://www.essr.org/content-essr/uploads/2016/10/ankle.pdf), section 13: coverage in two planes, surrounding tissues, anisotropy annotation, plantaris pitfall and dynamic examination. Short original paraphrases only; no PDF, image, diagram or scanning table redistributed.
- [UW–Madison Achilles MRI protocol](https://radiology.wisc.edu/wp-content/uploads/2018/11/3T_Achilles.pdf), sequence overview: sagittal, axial and coronal acquisitions using T1, proton-density and fat-suppressed T2 sequences. Institutional example, not a universal protocol or transferred machine settings.
- [AAOS Achilles tendon rupture](https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/), Imaging Tests: MRI evaluation of tear location/extent and alternative injury; ultrasound assessment during motion. No AAOS images or patient examples copied.

The references are factual teaching citations, not evidence that the publishers endorsed the atlas or licensed their figures. Existing code/teaching terms and BodyParts3D attribution remain in force. No new dependency, font, model, texture, paid API or media asset is added.

## Evidence and remaining acceptance

`npm run achilles-imaging:test` checks four exact lesson changes against a full previous-copy fingerprint, both official source rows, retained leg/foot/whole-body navigation, V2 export readiness, mutation isolation and rejected identity/source changes. `content/achilles-imaging.before.json` and `.transition.json` preserve the preceding revision and exact new lesson fingerprints. The offline history adapter restores only those four pinned sections for historical comparison; runtime/export always use the new drafts. Earlier unrelated text, recipes, source files and clinical-review fingerprints remain unchanged.

Independent radiologist, anatomist and educator review must assess factual accuracy, terminology, teaching value, source applicability and model limitations before clinical publication. Browser/device acceptance remains separate from software checks. No patient images, segmentation, MRI intensity or ultrasound beam simulation is provided. The production resource registry remains empty; future approved scans, spatial registration and separately entitled lectures still require the existing linking contract and host-side access checks.

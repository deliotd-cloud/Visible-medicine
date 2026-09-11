# Hip and proximal-thigh imaging orientation

Select a participating muscle in **Hip & thigh**, **Pelvis & hip** or the whole-body atlas, then use **Imaging → CT / MRI / Ultrasound**. Existing notes, dissection, side controls and source surfaces are reused. No new permanent panel or scrolling requirement.

## Bounded coverage

| Concept | Source selections | Distinction retained |
| --- | ---: | --- |
| Iliopsoas region | 4 | Iliacus and psoas major remain different muscles |
| Lateral abductors | 4 | Medius versus deeper minimus and different attachments |
| Rectus femoris | 2 | Whole muscle versus unsegmented tendon contributions |
| Medial adductors | 8 | Longus, brevis, magnus and gracilis are not interchangeable |
| Proximal hamstrings | 6 | Long biceps head/semitendinosus versus semimembranosus |
| Quadratus femoris | 2 | Deep region, not patient-specific impingement measurement |

These are **26 unchanged source selections, 78 introductory topic drafts, six groups and 18 distinct modality topics**. Shared left/right and group prose is not 78 unique concepts. Each of the 13 muscle/head pairs has an additional selection-specific caution. Short-head biceps, adductor minimus, other quadriceps and other deep rotators are not silently assigned this teaching. Existing X-ray, Anatomy, Function, Clinical, Pathology and Quiz content is unchanged. No claim of complete hip/thigh imaging coverage.

Root draft counts after this addition: **90 CT, 92 MRI, 53 X-ray and 41 ultrasound**. The remaining 932/930/969/981 root topics, respectively, remain pending. Independent specimens and dedicated shoulder records are separate counts. Teaching status is draft, not clinical approval.

## Source and clinical boundaries

`hip-imaging-pins.json` retains all 26 complete version-4 source records, their relevant bundles and coordinate definition. Runtime lookup requires the exact canonical record, not its display name or FMA alone. Frame/bundle consistency is verified offline; this structure-only API is not a runtime patient-frame validator. Returned arrays are detached. The application/export resolver shares one teaching source.

The one-time before/after records bind the change to source commit `fa1ce62ee804e439ca55e987b79a16ce64a41cac`. Historical reconstruction checks the exact new lessons before restoring earlier pending topics for previous-milestone tests. It is never used by the runtime or to migrate approvals. All **9,120 other body topic records**, original shoulder material and study recipes are preserved. Review-material fingerprints are regenerated normally; no older approval is carried onto changed teaching.

No patient image, DICOM series, artificial MR signal, ultrasound cine, tissue deformation, scan registration, measurement, acquisition protocol, diagnostic threshold or return-to-sport prediction is supplied. CT notes emphasize bony orientation and limits of tendon assessment; ultrasound notes distinguish acoustic limits from mesh hiding. Missing internal tendons, aponeuroses and bursae are not presumed absent in a patient. Explode is not retraction, injury or diagnostic spacing.

## References and commercial-use boundary

All new interface/source-binding code and prose are original MIT material. References below are links for verification/further reading only; no figures, tables, PDF pages, publisher prose, scanned images, video or question bank is imported or relicensed. Public reading access is not commercial asset permission. No new dependency, font, texture, mesh, remote runtime dependency, paid API or subscription was added. Existing BodyParts3D CC BY 4.0 attribution remains required and separate.

- [ESSR hip ultrasound technical guidance](https://www.essr.org/content-essr/uploads/2016/10/hip.pdf): regional windows and layered relationships; source wording/figures are not reproduced as a protocol.
- [Flores et al., pelvic tendon MRI/US review](https://pubs.rsna.org/doi/full/10.1148/rg.220055): modality distinctions, proximal tendon anatomy and artefact context. Free-to-read publisher content is not an included asset.
- [Hamstring MRI/US review](https://pubs.rsna.org/doi/10.1148/rg.240061): proximal versus intramuscular relationships, modality limitations and caution about isolated prognostic findings. No time-to-return rule or injury grading system adopted.
- [Primary rectus femoris MR study abstract](https://archive.rsna.org/2004/4412390.html): internal tendon course and site distinction; conference abstract, not full-study clinical validation.
- [Primary trochanteric anatomy study](https://pubmed.ncbi.nlm.nih.gov/11687692/): attachment/bursal relationships; bibliographic/indexed material consulted, not imported images or donor-specific findings.
- [Primary quadratus femoris/ischiofemoral study](https://pubmed.ncbi.nlm.nih.gov/19542413/): association of symptoms, muscle signal and regional narrowing; bibliographic/indexed material consulted, no thresholds adopted.
- [RadiologyInfo MRI](https://www.radiologyinfo.org/en/info/muscmr) and [ultrasound](https://www.radiologyinfo.org/en/info/musculous): broad modality capabilities/limitations, linked rather than copied.

## Verification and remaining requirements

`npm run hip-imaging:test` checks all exact official source-name/file rows, full-record rejection, runtime/export identity, detached data, coverage counts, unchanged prior teaching and the actual existing notes callback for every new structure/topic. Static rendering is not browser/device acceptance. The prior spinal history remains independently checked.

Before clinical or public educational sign-off:

1. Independent anatomist and musculoskeletal radiologist review of all six concepts, thirteen selection cautions, source boundaries, anatomical variants and modality limitations. Resolve source-interface and tendon-footprint accuracy independently of mesh labels.
2. Educator review of learning value and understandable grouping; actual desktop/mobile, touch, keyboard, GPU and accessibility acceptance remains outstanding.
3. Owner-supplied, rights-cleared, de-identified scans and validated subject/side/region/series/coordinate mappings before CT/MRI/US synchronization. X-ray projection and ultrasound probe/sweep registration require their own handling, not the atlas camera transform.
4. Server-enforced independent atlas and lecture/resource entitlements. A linked teaching topic or source citation never unlocks a paid lecture. Resource registry remains unpopulated.

Introductory orientation for these source records is complete, not the hip/thigh or atlas overall. Continue meaningful wider-body anatomy/function and genuinely cleared missing tissues. Routine oral detail remains deferred.

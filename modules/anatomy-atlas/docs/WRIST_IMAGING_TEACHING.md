# Wrist-bone imaging orientation

In **Hand** or the whole-body atlas, select a carpal bone and open **Imaging → X-ray / CT / MRI**. The existing bone exposure studies, source selections and notes panel are reused. No new control, scan viewer or additional scrolling requirement.

## Coverage and boundaries

All eight existing carpal bone pairs are included: scaphoid, lunate, triquetrum (source name: triquetral), pisiform, trapezium, trapezoid, capitate and hamate. Five teaching groups supply **15 distinct modality topics across 16 selections / 48 displayed drafts**, with eight selection-specific orientation notes. Bilateral/group reuse is not 48 unique lessons. Forearm bones, metacarpals, fingers and ultrasound remain outside this pass; their earlier content is preserved.

The notes cover projection/overlap, carpal alignment, multiplanar cortical assessment, sequence-dependent marrow context and source-specific limits. Trapezium/trapezoid, triquetrum/pisiform and hamate hook/body remain distinct. The lunate is not assigned a validated morphology type. No thresholds, fracture classifications, treatment advice, examination prescription, injury prognosis or surgical planning is supplied.

No X-ray attenuation, CT voxel, MR signal, disease geometry or patient data is generated. Explode and cutaway are display tools, not stress radiography, instability, fractures or acquired slices. Missing cartilage, ligament and tunnel contents cannot be inferred from bone surfaces. Reset separation before comparing ordinary relationships. Anatomical left/right and image orientation require explicit checking against a real patient study.

## Source binding and preservation

`content/wrist-imaging-pins.json` retains sixteen complete version-4 source identities, relevant bundles and the source frame. Each matches an exact official `isa` source-name/file row. The runtime requires the full canonical structure record; it has no name/FMA-only fallback. Frame and bundle checks are offline, not a patient-registration claim. Returned lesson arrays are detached from authoring data.

Before/transition records anchor this addition to source `56e9dc9e0e16f6cfbf3087a5af01aefde50e30d1`. Exact checked history restores only these 48 previously pending sections for older milestone tests. It is offline-only, never an approval migration or runtime downgrade. All other **9,150 root body topics**, original dedicated-shoulder records and dissection recipes remain unchanged. Earlier hip/spine/arterial checks now explicitly reconstruct their original milestones instead of masking unrelated changes with new baseline hashes.

Current root draft coverage after this addition: **106 CT, 108 MRI, 69 X-ray, 41 ultrasound**; remaining 916/914/953/981 topics respectively stay pending. Draft counts are not specialist validation or completeness. Generated inventory is authoritative for later changes.

## Evidence and rights

Original MIT code and short educational synthesis only. The following are optional verification/reading links; no publisher prose, figure, table, PDF, acquired image, video or question bank is imported. Public reading access is not commercial asset permission. No new dependency, font, texture, mesh, paid API, mandatory external request or lecture entitlement. Existing BodyParts3D attribution/licence notices remain in force.

- [RSNA wrist radiograph exhibit abstract](https://archive.rsna.org/2014/14011989.html): systematic projection and alignment landmarks; an educational abstract, not an acquired-image dataset.
- [RSNA wrist MDCT exhibit abstract](https://archive.rsna.org/2007/5001359.html): multiplanar versus rendered-image orientation; no imaging protocol reproduced.
- [RSNA sports-related hand/wrist review](https://pubs.rsna.org/doi/10.1148/radiol.2016150995): scaphoid/hamate and soft-tissue imaging context; free-to-read text inspected, figures not imported.
- [Gupta and Al-Moosawi, lunate morphology](https://pubmed.ncbi.nlm.nih.gov/12413964/): primary CT study abstract, section-dependent morphology; no dimensions or population normal range assigned to the source.
- [Raghupathi and Kumar, nonscaphoid injuries](https://pubmed.ncbi.nlm.nih.gov/25104893/): primary retrospective series abstract and figure descriptions; no incidence generalized or image imported.
- [Hidlay and Levine, four trapezoid cases](https://pubmed.ncbi.nlm.nih.gov/32322329/): indexed abstract supports occult-injury caution. This small series does not establish universal modality sensitivity. Direct PubMed text did not render in this pass; no challenge bypass.
- [Davis, hamate hook review](https://pubmed.ncbi.nlm.nih.gov/28834449/): indexed abstract/figure descriptions, corroborated with the accessible RSNA review. Full PMC page returned a challenge; no bypass or full-text claim.

## Verification and outstanding work

Run `npm run wrist-imaging:test`. Checks cover exact official source rows, complete identity admission, 960 changed-binding rejections, all 48 runtime/export lessons, detached data, before/after preservation, history tamper rejection and 48 renders of the actual notes callback. The imaging-link, review and previous regional tests remain separate checks. Static rendering does not verify GPU, browser, mobile, keyboard or screen-reader usability.

Before clinical/educational sign-off: independent anatomist and musculoskeletal-radiologist review; educator review of usefulness and group-specific limits; real device/accessibility acceptance; source-surface/interface verification; and separately cleared, de-identified imaging with validated patient/side/series/coordinate mappings. An atlas selection never establishes CT/MRI registration, X-ray projection or ultrasound probe position. Separately paid lectures still require server-enforced entitlements when connected; the resource registry remains unpopulated.

Continue substantive wider-body anatomy, missing tissues and deeper teaching after this bounded pass. Do not repeat these introductory carpal lessons or resume routine oral detail.

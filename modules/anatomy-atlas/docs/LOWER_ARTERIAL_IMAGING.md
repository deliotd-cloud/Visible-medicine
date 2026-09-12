# Lower-limb arterial imaging orientation

This implements the audited-source recommendation to improve useful radiological teaching without adding permanent controls. Select an existing femoral, deep femoral, popliteal, anterior tibial, posterior tibial or dorsalis pedis artery, then use the existing Imaging topics.

## Scope

Twelve exact left/right source selections receive CT, MRI and Ultrasound drafts: 36 placements, not 36 independent lessons. Nine regional/modality texts and six selection-specific cautions distinguish thigh, posterior knee and distal vessels. Earlier Anatomy, Function, Clinical, Pathology, X-ray and quiz content is unchanged. No geometry, source coordinates, visibility, dissection, labels, search, practice, paid-resource eligibility or interface layout changes.

The single femoral source is not split into common/superficial segments. A separately selectable tibioperoneal trunk and fibular artery remain missing. No complete runoff, lumen, plaque, waveform, dynamic entrapment or perfusion result is inferred.

## Source binding and checks

The immutable pin records complete source identities, frame metadata, bundles and pre-change lessons from source revision b5725a6b8cf2fa9028b93a9e3853d864bc874bc3. Runtime lessons require an exact full-record match, not just a name or FMA ID. Returned arrays are detached. Offline checks verify unchanged geometry hashes and all earlier teaching/recipes, reject changed identities, and execute the actual existing notes-render callback.

Run:

    node scripts/pin-lower-arterial-imaging.mjs --check
    node scripts/record-lower-arterial-imaging.mjs --check
    node scripts/validate-lower-arterial-imaging.mjs

Checks cover 36 rendered modality entries, 288 altered-source rejections and 9,666 unchanged body-topic entries. These are software/content checks, not browser, physical-device or clinical acceptance.

## References and reuse

Read on 12 September 2026:

- [TTUHSC El Paso lower-limb arterial anatomy](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html): course and named continuations.
- [RSNA/ACR CT angiography](https://www.radiologyinfo.org/en/info/angioct): vascular assessment and adjacent tissues.
- [RSNA/ACR MR angiography](https://www.radiologyinfo.org/en/info/angiomr): acquisition distinctions, small vessels, motion and metal.
- [RSNA/ACR vascular ultrasound](https://www.radiologyinfo.org/en/info/vascularus): real-time flow assessment, depth/calibre/calcification limitations.
- [ACR 2022 lower-extremity claudication imaging assessment](https://pmc.ncbi.nlm.nih.gov/articles/PMC9876734/): tibial calcium and contrast-timing limitations. Used for these technical limitations, not a current patient-management protocol.

Only original short factual synthesis and links are included. No source table, illustration, scan, publisher passage or protocol is redistributed. Publisher/non-commercial article terms are not adopted as application licences. Original teaching/code uses the project MIT licence; unchanged source meshes retain their own notices.

## Remaining approval

The owner/radiologist must review regional identity, imaging wording and limitations before clinical publication. No patient study is loaded or registered; no external resource or paid lecture access is granted. Browser/device review and acquired-image integration remain outstanding.

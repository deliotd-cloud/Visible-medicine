# Private shoulder atlas integration

The Atlas menu and catalogue now open `/atlas/shoulder-3d`. A same-origin self-contained shoulder module sits inside the existing website header. It is generated from the anatomy atlas source; its exact source commit, files and SHA-256 hashes are in `public/atlas-runtime/shoulder/manifest.json`. It adds no npm dependency to this website.

The module preserves rotation, dissection, explode styles, selection, isolation, labels, anatomy notes and identification practice. The host supplies navigation; the module supplies contained controls. Tools become drawers in narrow panels. A full-screen link is available; no unrelated site layout is changed. Catalogue modality filters include 3D and are functional server-rendered links.

Licences accompany the copied module: `BUNDLED_NOTICES.txt`, the MIT source licence and the existing BodyParts3D CC BY 4.0 source credit. The software/mesh licences do not guarantee free hosting. No patient scan, font binary, paid service or clinical PACS component is added.

## Security and next stages

This is an **owner-private review pilot**, not a paid-product release. The same-origin frame is a style/application boundary, not an authorization boundary. Sites access must stay owner-private; a hidden route or `noindex` is not protection. No account, role, subscription, database, storage policy or public audience was changed. No patient data or licensed lecture is served by this module.

Didanix Education/light is the chosen future CT/MRI/X-ray/US viewer. Do not embed the clinical PACS. The separate Education task currently has real-DICOM/OIDC/readiness gates still outstanding. Reuse its frame/LPS/registration contract, not a second scan viewer. Use stable anatomical and learning-resource IDs; absent validated registration means independent comparison, not synchronized patient coordinates.

Select one fully cleared scan and lecture anchor for the next private end-to-end test. Atlas, imaging-case and lecture rights must be checked independently server-side at resource delivery, including revocation. Atlas entitlement alone never unlocks a paid lecture. There are currently no cleared production case/lecture links in the atlas registry. Do not manufacture a patient case or approval to complete the journey.

Before public launch: radiologist anatomy/teaching sign-off; case de-identification and publication clearance; licence review; signed-in and denied-access journeys; mobile/keyboard/focus/GPU/performance acceptance; real Didanix frame/registration validation. Website and atlas source remain separately versioned for rollback. No CT-head segmentation boundary was modified.

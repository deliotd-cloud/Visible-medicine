# Pelvic reproductive Anatomy/Function depth — 4 October 2026

Source-only, local, unpublished draft batch. Parent: `3d1d0f862d2e7567d298bc89690b11bf38ca3326`. The website still imports `d6f25010210fd14aa2172605b78fa8cbc1875fb1`; this note does not claim website integration, browser acceptance or clinical approval.

## Scope

Exactly eight existing adult-male reference roots receive Anatomy and Function drafts (16 placements): prostate; left/right testes, seminal vesicles and epididymides; and the male urethra. Their complete source identities, ordered component bindings, coverage notes, coordinate frame and two affected bundle byte hashes are pinned in `content/pelvic-reproductive-core-pins.json`.

The lessons distinguish production, maturation/storage, gland secretion and transport. Prostate teaching adds position, base/apex and conceptual zones; testicular teaching adds the internal outflow sequence and supporting/endocrine cells. Seminal-vesicle and epididymis expansions are modest, not comprehensive. The male urethral regions remain conceptual, not separately validated source layers. Testes are scrotal; “pelvis” is their navigation group, not their anatomical cavity.

No new mesh, model, image, texture, font, dataset, dependency or fee is introduced. The other 9,920 root topics, existing Clinical/Pathology/CT/MRI/Ultrasound/Quiz lessons, shoulder material, dissection profiles, tours and source anatomy are preserved. Exact-source matching rejects missing/extra/altered source fields and prevents these male-root lessons being attached to female or nested sources. Returned arrays are fresh copies.

## References and asset boundary

New prose is original introductory teaching checked against these primary text references; no article passages, diagrams, photographs or media were copied. Referencing a page does not license its imagery or any third-party asset. Existing model/dependency notices remain unchanged.

- [NCI SEER male accessory glands](https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html)
- [NCI SEER prostate anatomy](https://training.seer.cancer.gov/prostate/anatomy/)
- [NCI SEER testes](https://training.seer.cancer.gov/anatomy/reproductive/male/testes.html)
- [NCI SEER male reproductive ducts](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html)
- [NCI SEER urethra](https://training.seer.cancer.gov/anatomy/urinary/components/urethra.html)

Questionable generalisations in the references were not adopted: uniform urethral epithelium, prostatic pH, obsolete pelvic-floor terminology, numerical cancer distributions or treatment advice. Paired teaching shares prose without implying verified internal or right/left mesh detail. A final independent editorial correction makes clear that sperm enter the ejaculatory duct via the ductus deferens, not the seminal vesicle.

## Revision and verification

`content/pelvic-reproductive-core.transition.json` binds all 16 current/previous lesson hashes and the complete 9,936-topic/shoulder/dissection snapshot. Its final canonical hash is `3a0be27bf5b89d4d41fb74d80c3b3083b04a451155bb9ce438ff1ed70bc0d2ac`; the immutable source-pin hash remains `d343309d262a854581d85b332d74254d69bbecfe16d03efe9fdf021cd2729633`. Prior teaching epochs are reconstructed by a test-only adapter; none of their frozen pins, hashes or expected parents are rebased.

Focused entry point: `npm run pelvic-reproductive-core:test`. It checks the exact parent, all current root topics, source/schema mutations, copy isolation, source bundle bytes, full prior snapshot, mixed/foreign/helper refusal, current Review parsing, 88 forged-material refusals and 24 stale teaching/material submissions before storage. The eight changed teaching revisions require fresh review; the other 1,096 root teaching materials remain exact. No private decision store is read or migrated.

The shared renderer revision also changes. Geometry decisions must not be carried forward just because mesh bytes are unchanged; existing renderer-bound geometry gates remain in force.

The checkpoint also requires selected historical replay, content-contract, root/nested Review, source-hold, renderer, TypeScript, regional learner build, production build and delivery checks. Full logs and effective pass identities are recorded in `E:/VisibleMedicine-LocalStaging/20261004-pelvic-reproductive-core/validation-final.json`; initial test-only registry/fixture and ungenerated-display failures are retained separately, as are both pre-commit editorial transitions. This is risk-matched validation, not every historical suite or browser/device/clinical acceptance.

## Owner-radiologist review still required

- Verify each root's visible shape, laterality, position and neighbours against its actual source revision; teaching cannot validate geometry.
- Review each new Anatomy and Function lesson, cited support, conceptual zones/pathways and distinction between gross surfaces and unsegmented internal anatomy.
- Preserve explicit adult-male scope and the scrotal-versus-pelvic navigation distinction.
- Do not infer lumen continuity, microscopic anatomy, physiology, fertility, continence or patient findings from the mesh.
- Validate any future imaging registration, independently entitled case/lecture link and intended teaching use separately. No Didanix Education host contract, patient registration or modality launch is invented here; the clinical desktop PACS and CT-head masks are out of scope.

## Recovery and next action

Main coordinates the guarded commit, incremental bundle and exact-head/tree restore into the existing standalone E: Git repository. `source-recovery.json` and `final-state.json` record verification only after it succeeds. E: is same-machine recovery, not verified GitHub or off-device backup; D: is untouched. Existing website changes and canonical map/plan raw tails must be preserved.

Next: import the saved source locally through the established generated website/Clinical Review pipeline, then inspect the desktop learner panels and review bindings. The full Atlas goal remains active, and held plexus candidates remain quarantined.

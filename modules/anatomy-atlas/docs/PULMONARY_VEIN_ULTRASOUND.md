# Pulmonary-vein ultrasound orientation draft

Four existing source-bound pulmonary-vein selections now have distinct ultrasound orientation notes in `content/central-vessel-imaging.ts`: right and left, superior and inferior. The notes distinguish transthoracic echocardiography (TTE) from transesophageal echocardiography (TEE), and keep the left superior vein separate from the nearby left atrial appendage. The two left vein selections remain grouped source surfaces, not individually identified branches.

References: the [ASE comprehensive TTE guideline (2019)](https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf), apical atrial/pulmonary-vein views; and the [ASE/SCA comprehensive TEE guideline (2013)](https://www.asecho.org/wp-content/uploads/2014/05/2013_Performing-Comprehensive-TEE.pdf), mid-esophageal pulmonary-vein views and left-atrium/pulmonary-vein discussion. These are educational reference links; no images, figures, tables or source prose were imported.

These drafts do not claim that all four veins will be visible, that an atrial ostial count or continuous lumen is established, or that the model measures Doppler velocity, pressure, patency or disease. A superior-vein view does not identify its inferior counterpart. The source-coordinate surfaces are not registered to a patient. Existing airway, pulmonary-artery, CT and MRI material and the interface are unchanged. Revision-bound radiologist review remains required before clinical approval or learner release; private draft publication is not sign-off.

## Verification

The before-record is replayed from exact Git source `f54d6339e8c7820c2fe37b5161f548776e3c873e`.
Four pending ultrasound topics become drafts; all other 9,932 topics, source
identities and study recipes remain exact. The focused validator exercises the
real note-rendering callback, 68 altered-identity rejections and three negative
history cases. Historical replay removes only this recorded addition; it does
not replace old evidence hashes or change runtime teaching. This is not a browser,
echo acquisition, clinical-validation or patient-registration test.

The broad content contract (33,445 checks), laryngeal-history validator,
TypeScript, targeted lint, review/renderer fingerprints and shared build pass.
The older central-vessel history validator initially failed its baseline snapshot:
expected `de8c41fb18b49b0e3ff04b72f146341950b29fb6f8ddd02710358caa81f8eb1a`,
actual `4f64f24137c13afd151a2cd33b47028bb39fc86e6c6dd197d7e68c0a9d96f9f2`.
The same result is reproduced after restoring the exact previous all-topic/recipe
snapshot (`d5ce1738cbd115d4304926a4772d2eb5e3e16ff0040894975cb2bfc6fbd40f10`).
Comparison with its original Git source identifies older lacrimal CT/MRI,
corpus-spongiosum and recipe history differences, not these four ultrasound
topics. [The historical audit is now repaired](CENTRAL_VESSEL_HISTORY_REPAIR.md):
exact original Git trees prove the unchanged baseline and all 79 recorded
replacements, separately from current export/rendering/identity checks. The old
expected hash is preserved. The public test also unwinds later recorded topics
before checking the original 79-placement pin; it does not overwrite that pin.

No scan is loaded by these notes. Atlas, imaging-case and lecture entitlements
remain independent. Generated website integration and hosted checks are pending.

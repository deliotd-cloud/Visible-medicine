# Rectal and deferent-duct imaging drafts

Twelve previously pending CT, MRI, Ultrasound and X-ray placements now have
introductory notes in the existing viewer: root rectum FMA14544 and left/right
deferent ducts FMA19236/FMA19235. Eight distinct topic texts are used; paired
ducts share factual copy but retain exact sided source bindings. No new
controls, routes, meshes, images, dependencies or fees.

## Scope and boundaries

Rectal notes distinguish cross-sectional orientation, dedicated rectal MRI,
endorectal versus transabdominal ultrasound, and plain-film versus contrast
fluoroscopy. Duct notes orient the inguinal/posterior-bladder course and explain
segmental imaging visibility without inferring continuity, obstruction or
fertility. No acquisition protocol, staging score or procedure is supplied.

The runtime returns drafts only for all fields of a pinned original source
record. Anatomy text, modality pitfalls and model limitations remain separate
from the factual summary. Separation must be reset before image comparison.
No scan or patient registration is attached. Didanix Education/light, separate
case/Atlas/lecture access and radiologist sign-off remain mandatory.

The independent HRA female-pelvic rectum does not receive these root lessons.
Existing anatomy/function, rectal clinical/pathology and duct self-check notes
are preserved. Duct clinical/pathology gaps remain pending, not silently filled.
No rectal wall, mesorectal fascia, sphincter or continuous duct lumen is added.

## Evidence and source identity

Baseline: Atlas 130fda71a2af14fbbe5c018beed52e4c1212ed45.
Three exact identities and two unchanged original bundles are pinned before
dispatch activation. The prior full lessons/recipes hash is retained.
The dedicated validator checks 12 changed slots, all other 9,906 root topics,
shoulder teaching and recipes, exported schema, source mutations and actual
React note rendering. Historical adapters restore only recorded prior lessons
after exact source/current-content checks, and never enter the viewer/review API.

Run `npm run rectal-deferent-imaging:test`. The machine-readable report is
`docs/rectal-deferent-imaging-validation.json`; final build/recovery evidence
is recorded in the main workspace checkpoint, not inferred from this guide.
Technical tests do not establish clinical correctness or device acceptance.

## Reading sources and commercial boundaries

Exact reading links are in content/rectal-deferent-imaging.ts:

- ESGAR Rectal Imaging Guideline Group, European Radiology (2026),
  [primary-staging consensus](https://link.springer.com/article/10.1007/s00330-025-12274-w).
- ACR, [rectal cancer imaging criteria](https://acsearch.acr.org/docs/3195870/Narrative/).
- ESUR-SPIWG, [male-infertility imaging recommendations](https://pmc.ncbi.nlm.nih.gov/articles/PMC11782349/).
- NCI SEER, [male duct system](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html).
- ACR/RSNA RadiologyInfo, [lower-GI fluoroscopy](https://www.radiologyinfo.org/en/info/lowergi)
  and [abdominal radiography](https://www.radiologyinfo.org/en/info/abdominrad).

Original brief factual summaries are linked to their sources, not reproduced
articles or treatment recommendations. No publisher passage, table, figure,
scan or dataset is imported. RadiologyInfo permits linking, not copying its
site; its illustrations/text are not reusable Atlas assets. The ESGAR and
ESUR papers state CC BY 4.0, but no third-party material is imported under
those licences. Existing BodyParts3D attribution remains required and unchanged.
Per-reference word totals are checked over distinct notes; duplicated sided
placements are the same shared copy, not new derived passages.

Independent read-only source review identified two X-ray citation gaps and a
potential duct-junction ambiguity; the final copy adds the general radiography
source and describes distinct displayed surfaces, not absence of a duct junction.

## Radiologist review / release

Review source extent, sided duct course and junction wording, rectal MRI
compartments, endorectal ultrasound scope, and the learner-facing distinction
between reference surfaces and acquired findings. Approvals must identify the
actual source and teaching revision. This is introductory orientation, not
comprehensive rectal staging or infertility teaching.

Website publication is separate: the preceding corpus-spongiosum GLB still
requires authenticated model staging/verification before activating the
combined export. Source progress does not establish hosted availability.

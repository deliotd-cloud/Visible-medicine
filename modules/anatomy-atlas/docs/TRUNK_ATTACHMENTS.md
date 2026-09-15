# Trunk attachment studies

The existing collapsed panel now covers all 23 current trunk-curriculum concepts
(38 retained muscle/part/group selections), with 54 existing bone and 14 costal
cartilage partners. This is not complete trunk musculature or new geometry.

Select a muscle in Thorax, Abdomen, Spine or Whole body, open Muscle attachment
relationships and choose Show. Source membership controls availability; the
existing whole-body continuation preserves structure and side. Bone/cartilage
buttons select the actual mapped structure. Show enables connective tissue when
cartilage is needed and retains both muscle homologues for side switching.

## Mapping distinctions

- Pectoralis major uses only its represented sternocostal/abdominal components;
  no clavicular-head origin is invented. Its reading reference gives a typical
  upper cartilage series, not verified individual origin slips.
- Transversus thoracis selects costal cartilage, not adjacent rib bone as a
  substitute. Pectoralis minor reaches the scapula; major reaches the humerus.
- Diaphragm uses combined typical bony partners, not independently segmented
  crura. The central tendon, arcuate ligaments and costal-cartilage contributions
  are not mapped by this study. No breathing/pressure simulation or procedure.
- External oblique links ribs and the hip bone while retaining its aponeurotic
  and linea-alba qualifications.
- Trapezius parts remain separate. The middle part's exact vertebral origin
  levels remain unassigned; lower-part and upper-part partners are not swapped.
- Iliocostalis lumborum and longissimus thoracis retain sacropelvic partners but
  do not receive guessed vertebral/rib insertion lists. Iliocostalis thoracis
  retains its distinct rib/C7 pattern. Semispinalis thoracis has vertebral
  partners, not a skull insertion.
- Intercostals, rotatores, mixed spinalis, lumbar intertransversarii and sparse
  thoracic interspinales retain reference-pattern prose without guessed
  numbered slips or bone pairs. Show can isolate these source entries, but the
  interface explicitly says unresolved, not non-bony.
- A midline-labelled composite stays whole: Left/Right changes paired partner
  visibility, not the muscle geometry. It does not create unilateral slips.
- Whole-bone/cartilage associations are not marked or donor-validated
  footprints. Partial mappings remain partial even in Whole body.

The original Anatomy/Function teaching and full references remain unchanged.
The compact panel reuses attachment prose with brief mapping-specific limits.
Its primary reading links and original curriculum provide further detail.
Facts were checked against the [TTUHSC thorax table](https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html),
[abdomen table](https://anatomy.ttuhscep.edu/anatomytables/muscles_abdomen.html),
[back table](https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html),
[pectoralis major reference](https://www.ncbi.nlm.nih.gov/books/NBK525991/)
and the existing targeted anatomy references. These resources are reading
references, not imported tables, figures, databases or licences to redistribute
publisher material. No scans, third-party artwork or question banks are copied.

## Verification and review

Run `npm run trunk-attachments:test`. Twelve original GLBs and 106 identities
are pinned to exact source data. Tests independently check endpoints, left/right
IDs, composite entries, cartilage types, actual component/button/parent callbacks,
whole-body links, region boundaries, altered-source rejection and Undo/Redo.
Source changes fail closed. No additional model or paid dependency.

The report records exact results; tests are not clinical approval or hands-on
browser/device acceptance. Radiologist sign-off must inspect actual surfaces,
source-group identities, rib/cartilage numbering, direct versus mediated
attachments, vertebral ranges, incomplete maps and laterality. No saved review
is carried forward as approval of this changed renderer.

Show resets camera, separation and inspection. Dissection Undo restores layers/
removals, not camera or system switches. Exam mode hides these study controls.
Source scans, CT-head masks, clinical PACS and independent Atlas/case/lecture
entitlements are unchanged. Didanix Education/light remains the imaging route.
Publication and GitHub/D recovery are recorded separately in the task checkpoint.

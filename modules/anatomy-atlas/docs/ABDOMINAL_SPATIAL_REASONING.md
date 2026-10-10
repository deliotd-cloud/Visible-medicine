# Abdominal spatial reasoning — draft revision 1

Four original Apply anatomy questions cover six existing displayed roots: liver,
pancreas, paired kidneys and paired adrenal glands. This adds relationship-based
practice using the existing controls, not new anatomy, scan data or Quick Checks.
The source baseline is `f89b6c01aec40fba4de81e26ec433ef4fe2b5e96`.

| Concept | Exact displayed source scope | Learning distinction |
| --- | --- | --- |
| Liver | FMA7197; all 57 ordered PARTOF files | Porta hepatis belongs to the liver, not the nearby gallbladder |
| Pancreas | FMA7198; FJ1895, FJ1896, FJ2630 | Head in the duodenal curve; tail toward the splenic hilum |
| Kidneys | FMA7204/FJ3147 right; FMA7205/FJ3145 left; PARTOF | Retroperitoneal organ with renal pelvis continuing into ureter |
| Adrenal glands | FMA15629/FJ3130 right; FMA15630/FJ3129 left; ISA | Separate gland superomedial to the kidney, not the collecting route |

Full displayed identities, ordered source hashes, frame and bundle hashes are
pinned in `content/abdominal-spatial-reasoning-pins.json`. The raw pancreas
archive also contains FJ2629: it is excluded from the corrected displayed parent
and must not be admitted by a broad FMA or name match. Liver file count does not
prove complete parenchyma, segment boundaries, ducts or patent vascular lumens.
No root surfaces or held alternatives are changed.

## Factual references and licensing

Original short questions and explanations use the following university teaching
references, inspected 10 October 2026:

- [Texas Tech hepatopancreatic anatomy tables](https://anatomy.ttuhscep.edu/gastrointestinal_system/duodenum_tables.html): organ relationships and porta hepatis.
- [Texas Tech kidney and retroperitoneum notes](https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_ans.html): renal/adrenal position and pelvis–ureter continuity.

These are factual reading citations, not redistribution grants. No university
text, question bank, table, figure, image or model has been copied into the app.
New original prose/code retain project MIT terms; existing BodyParts3D source
credits and CC BY 4.0 conditions are unchanged. No dependency or fee is added.

## Review and verification scope

All four concepts remain drafts requiring revision-bound radiologist sign-off.
Supplied groups do not demonstrate microanatomy, physiological function, full
duct continuity or patient registration. Side-matched answer choices use only
available, loaded source selections. Scans, accepted masks and clinical PACS are
untouched; Didanix Education and independent access entitlements are unchanged.

`npm run abdominal-spatial-reasoning:test` checks exact identities and the change
from the fixed baseline, including existing question/content preservation and
stale/tampered Review refusal. `npm run reasoning-practice:test` checks the live
combined pool. The older brain-connections transition is replayed against its
original completed Git revision, not silently relabelled as current coverage.
Source verification is not browser, clinical or website-deployment acceptance.
Generated website integration remains a separate checkpoint after source checks.

Focused regression preserves all 337 earlier bound sessions, all 9,936 topic
placements and 1,098 unaffected teaching revisions. Six new teaching revisions
require fresh review. It rejects 326 altered source identities and 42 tampered
packets, and verifies 36 answer/retry cases. The combined practice validator
passes 22,175 checks with 190 concepts across 343 exact root representations.
The initial stale display-fingerprint failure after wording adjustment was
resolved by regenerating the exact evidence and rerunning, not by bypassing it.

# Abdominal vessel reasoning — draft revision 1

Six original Apply anatomy questions distinguish the celiac, superior mesenteric and inferior mesenteric arterial territories from hepatic portal and inferior vena cava venous return. The abdominal aorta supplies the arterial-trunk contrast. They bind the six existing BodyParts3D v4 catalogue records by complete source identity; no vessel mesh, branch, junction or territory geometry was added.

The pinned display identity retains every ordered OBJ membership: two files each for celiac artery, superior mesenteric artery and inferior vena cava; one each for the other three. Celiac is bound to its immutable corrected display bundle `celiac-display-corrected`, after an exact comparison between the correction's original identity and the raw catalogue record. The other five use the raw display identities. The superior mesenteric artery and abdominal aorta retain the catalogue `midline` tag. The other four retain `unspecified`. Aorta and cava retain ordered `abdomen`, `pelvis`, `thorax` region memberships. Each question uses an authored same-tag alternative under the existing Apply anatomy engine. These tags describe catalogue records, not independently established anatomical symmetry or side.

## Teaching references and rights

The original short prompts paraphrase usual anatomy supported by [TTUHSC El Paso arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html) for the celiac branches and superior mesenteric midgut territory, [UAMS abdominal arteries](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/) for inferior mesenteric distal-colon territory and aortic continuation, and [TTUHSC El Paso veins](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html) for portal formation/liver route and cava formation/right-atrial route. Reading citations are not asset licences. No images, tables, models, question-bank text or downloads from these sites were imported. Existing BodyParts3D CC BY 4.0 geometry credits and notices remain applicable.

## Review boundary

All six concepts remain drafts pending revision-bound radiologist review of wording, usual anatomy and exact source boundaries. The source records are selected vessel segments. They do not establish branch origins or junctions, lumen continuity, flow, perfusion, individual vascular variants or patient-specific findings. No imaging registration, clinical PACS, scans, masks or patient identifiers are involved. Earlier review of another teaching revision does not approve these questions. Atlas, case and lecture access remain independent through Didanix Education/light integration.

The pin generator refuses a catalogue or celiac display correction differing from source commit `ff5ff41986f2d87e6b1ecb4d572fb811510461fb`. Recheck the draft source pins with:

```text
node scripts/pin-abdominal-vessel-reasoning.mjs --check
```

The main integration task owns question-bank imports, shared validation, renderer/display pins, licences and any subsequent build or release evidence. Pin generation and a source check alone do not prove browser behaviour, clinical acceptance or deployment.

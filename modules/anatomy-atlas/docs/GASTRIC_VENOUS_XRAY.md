# Gastric venous X-ray orientation

Four original X-ray-tab drafts distinguish the lesser-curvature gastric pair
from the greater-curvature gastroepiploic (gastro-omental) pair. The normal
drainage relationships are comparison references, not validated source
confluences, a complete variant atlas or guaranteed contrast visibility.

| Retained selection | FMA | Source file | Source side |
| --- | --- | --- | --- |
| Left gastric vein | FMA15399 | FJ3500 | left |
| Right gastric vein | FMA15400 | FJ3595 | right |
| Left gastroepiploic vein | FMA15390 | FJ3502 | left |
| Right gastroepiploic vein | FMA15397 | FJ3597 | right |

All four remain whole, unvalidated `portal-veins` bundle selections. The lesson
resolver matches the complete identity in `abdominal-branch-imaging-pins.json`,
including source hashes, coordinates, limitations and review status. An altered
or partial identity is refused; no matching by name or FMA alone.

## Scope and reading sources

- [UAMS abdominal veins](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/): usual drainage and naming relationships.
- [ACR/RSNA catheter angiography](https://www.radiologyinfo.org/en/info/angiocath): distinction between contrast catheter X-ray imaging and CT/MR angiography.

Plain radiographs do not delineate these lumens. Acquired contrast venography,
CTV, MRV and Doppler are not interchangeable, nor supplied by this model.
No patient series, annotation, registration, procedural route, blood-flow
simulation, variceal network or clinical approval is added. Source left/right
names are preserved even where a surface crosses the midline; they are not
screen-side rules or patient markers. Compare assembled anatomy before using
explode separation.

These are original factual summaries and reading links. No source publication
text, table, image or dataset is imported or relicensed. Existing BodyParts3D
CC BY 4.0 attribution remains unchanged; original project code/prose retain
MIT terms. No dependency, model, font, texture, service or fee is added.

## Verification and review

Run `npm run gastric-venous-xray:test`. The admission test replays baseline
`9e229803af93cdb12c711ba738771ce92ee51191` against the first committed addition,
checks the four pending-to-draft placements and four changed Review worksheets,
and preserves every other placement, mesh and source identity. It also checks
full-identity mutations, stale/forged packets and decisions before storage.

Queue revision-bound radiologist review for all four drafts and their source
coverage limits. Do not mark them approved or registered. Atlas, case and
paid-lecture access remain independent. Source completion alone does not mean
the separate website integration has been refreshed or deployed.

# Lower-leg attachment relationships

The existing collapsed attachment panel now covers 28 sided muscle/head
selections (14 concepts) and 46 existing bones. Select a muscle in Leg or Whole
body, open Muscle attachment relationships, then choose Show. Selecting a bony
partner uses the existing selection control. Left/Right and Undo/Redo remain
available. No new permanent toolbar, pop-out, model or external service.

## Anatomical distinctions

- Medial and lateral gastrocnemius heads retain different femoral origin notes;
  their shared calcaneal insertion does not imply separately mapped subtendons.
- Soleus does not gain a femoral origin; popliteus retains femur-to-tibia links.
- EDL reaches middle/distal toe phalanges through the extensor apparatus. FDL
  reaches distal phalanges; EHL/FHL reach the hallux distal phalanx. No tendon
  slips or extensor expansions are reconstructed by these links.
- Tibialis anterior and fibularis longus link to medial cuneiform/first
  metatarsal; brevis and tertius retain their distinct fifth-metatarsal site text.
- Plantaris shows its usual calcaneal partner with explicit variability and
  absence cautions, not a universal specimen-specific insertion.
- Tibialis posterior separates the main navicular insertion from a third row of
  reported variable extensions. Cuneiform, cuboid, calcaneal and metatarsal
  partners form a union of reported sites, not one donor's full footprint map.
  No claimed prevalence, measured coordinate, new tendon or operative advice.

Origins/insertions and source cautions reuse the original lower-leg curriculum.
The tibialis-posterior distinction adds brief original factual synthesis from
[Willegger et al. (2020)](https://link.springer.com/article/10.1186/s13047-020-00392-1)
and [Park et al. (2021)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8466387/).
Routine bony partners were cross-checked against the existing
[TTUHSC table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html)
and linked curriculum references. No source prose, illustrations or tables are
imported. Counted reference budgets include both sided placements; core teaching
and its reading references remain unchanged.

## Spatial and interaction limits

Source pins bind all 74 participating identities, five original GLBs, coordinate
system, licence and source revision. Changed names, bounds, source hashes,
regions, sides, duplicate identities or bundles fail closed. No inferred FMA
number pairing. The fifth middle-toe phalanx has explicitly pinned asymmetric
identifiers. Existing holds and clinical review states remain intact.

Foot bones stay outside the leg region's existing membership. Unavailable
partners are labelled and offered through the existing whole-body continuation;
Show never silently adds anatomy to a regional specimen. The selected muscle
and side survive that host link. In whole body, Show retains both homologues
and their paired bones so the side switch remains useful. Existing reversible
visibility actions are used; camera/system resets are disclosed separately.
Examination mode does not expose the attachment study.

## Validation and sign-off

Run `npm run leg-attachments:test` for independent bony endpoint expectations,
source guards, actual panel rendering/button callbacks, parent handler,
reversible visibility and host-link tests. See the generated validation report.
Source-scope tests/builds are not browser-device or clinical acceptance.

Radiologist review must verify muscle/head identity, sides, compartments,
digital numbering and all direct/indirect or variable attachment qualifications
against the actual rendered source. Whole-bone links are not footprints, tendon
segmentation, complete connective anatomy, movement simulation, patient imaging
or registration. Source scans/masks, clinical PACS and Education entitlements
are untouched. Draft only; no sign-off is migrated from another revision.

GitHub/D recovery and hosted availability are recorded in the main task's dated
checkpoint. Building this feature does not prove website publication.

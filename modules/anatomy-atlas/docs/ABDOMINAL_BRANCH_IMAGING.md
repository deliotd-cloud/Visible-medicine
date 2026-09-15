# Abdominal branch imaging — 15 September 2026

48 original draft notes extend 34 existing vessel selections: 34 CT, seven MRI
and seven ultrasound. These cover colic/appendicular and pancreatic branches,
gastric/mesenteric veins, hepatic tributaries and bilateral inferior epigastric
vessels. All five source bundles and all other 9,861 topic placements are retained.
The compact teaching panel is reused; no controls or geometry are added.

## Evidence and limits

Exact source identity, laterality, existing anatomy and pending topic state are
pinned to Atlas 193de0e4273fee3ae69cf3f4402b74b6cde5e118. Offline history verifies
the recorded new notes before reconstructing preceding teaching snapshots; it
does not migrate clinical decisions. The source-bound resolver rejects changed
identities and returns independent note arrays.

The 24 reading references in content/abdominal-branch-imaging.ts were checked
against indexed publisher/PMC article text on 15 September. They support brief,
original factual synthesis, not copied prose, tables, figures or scans. Article
access is not commercial asset clearance: in particular, the gastrocolic CT
paper has NC-ND terms and none of its protected material is imported. Existing
BodyParts3D attribution and all other source licences/holds remain unchanged.
No new dependency, model, texture, font, paid API or mandatory fee is introduced.
Per-reference synthesis budgets count repeated placements, not only unique text.

MRI and US notes are limited to the left gastric vein, two hepatic tributary
groups and four inferior epigastric vessels. The remaining 27 MRI and 27 US
topics in this batch stay pending. This is a curation boundary, not a statement
that specialised imaging cannot depict those vessels. Research flow-selective
MRI is distinguished from routine MRI; a static mesh cannot measure blood flow.

## Radiologist review required

- Verify actual arterial origins, mesenteric venous crossings, accessory colic
  supply and marginal continuity; small-vessel nonvisualisation is not occlusion.
- Preserve the source-labelled ileocolic ascending branch, trunk-only GDA and
  grouped pancreaticoduodenal veins without inventing named terminal branches.
- Review anterior/posterior pancreatic arcades and variable dorsal supply;
  overlapping projections do not establish an anastomosis.
- Confirm left/right gastric and gastroepiploic courses separately. Hepatic
  enhancement variants cannot be diagnosed from this donor atlas.
- Hepatic tributary groups do not establish patient segment boundaries or
  drainage territories. Check venous phase, continuity and US visibility limits.
- Check deep versus superficial epigastric vessels, dedicated MR venous mapping
  and dynamic inguinal ultrasound landmarks. No procedural safe corridor follows
  from donor dimensions, and red/blue Doppler colour alone does not name a vessel.

All notes remain draft pending revision-bound radiologist sign-off. No patient
scan, mask, spatial registration or clinical approval is supplied or modified.
Didanix Education/light remains the imaging target; Atlas, case and paid-lecture
access stay independent.

## Verification

`npm run abdominal-branch-imaging:test` checks the 48 actual React note renders,
912 altered-source/topic rejections, all 1,101 current body schemas, five original
GLB hashes, modality limits and exact preservation of the other 9,861 topics,
shoulder teaching and dissection recipes. Thoracic/central vessel tests and the
historical content/review suites remain separate regression checks. None confers
clinical, browser/device or real-image acceptance. Actual source, GitHub/D recovery
and website publication are recorded separately in the coordinating checkpoint.

Continue remaining modality gaps and regional anatomy/dissection detail under
the full goal. Native MRI QA is already completed; do not rebuild a learner PACS.

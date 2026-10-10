# Abdominal vascular MRI orientation drafts

Eighteen existing abdominal arterial/venous donor selections receive original,
conditional MRI orientation notes. No new model, image, scan, protocol, source
identity, finer branch admission or clinical approval is added. All other tabs
remain unchanged. The prior nine colic MRI drafts remain intact.

## Scope

- Mesenteric veins: inferior mesenteric, ileal, middle colic, right colic.
- Pancreatic arteries: anterior/posterior superior and inferior pancreaticoduodenal,
  inferior pancreaticoduodenal trunk, dorsal, inferior, great and caudal pancreatic.
- Gastroduodenal trunk only; pancreaticoduodenal vein grouped from three donor
  components, not three newly validated named veins.
- Left/right gastroepiploic veins and right gastric vein; greater- and
  lesser-curvature routes stay distinct.

Exact source identity, FMA, side, region, bounds, bundle and component hashes are
bound by `content/abdominal-vascular-mri-pins.json`. A changed source refuses
these notes. A recorded transition and test-only historical replay preserve the
previous content hashes; they never transfer review decisions.

## Evidence and rights boundary

References are reading links only. No figures, tables, images, meshes, downloaded
dataset or copied prose are incorporated. Existing asset notices, dependencies and
models are unchanged. CT, cadaveric and angiographic studies support anatomical
variation, not MRI visibility or diagnostic performance. Routine abdominal MRI is
not equivalent to dedicated MR angiography. All notes are conditional on the
actual vessel being resolved in the available study.

- [TTUHSC abdominal arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html)
- [TTUHSC abdominal veins](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html)
- [ACR/RSNA MR angiography](https://www.radiologyinfo.org/en/info/angiomr)
- [Dorsal pancreatic artery: original CT study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11769064/)
- [Pancreaticoduodenal arteries: original cadaver study abstract](https://pubmed.ncbi.nlm.nih.gov/33392701/)
- [Splenic pancreatic branch variation: original angiographic study abstract](https://pubmed.ncbi.nlm.nih.gov/24599560/)
- [Mesenteric venous anatomy: original CT study abstract](https://pubmed.ncbi.nlm.nih.gov/9129413/)

The last three references were assessed through their indexed primary abstracts;
no full-paper or image-use permission is inferred. Linked educational sites are
not imported asset licences. No performance percentage, procedural route or
treatment recommendation is taught.

## Outstanding clinical and imaging validation

Radiologist sign-off must address the exact source and teaching revision. Confirm
identity, laterality, origin/termination, continuity, variants and whether the donor
geometry illustrates the stated relationship. Camera projection and exploded
surfaces do not establish an arcade, lumen, flow, perfusion or patient orientation.
Keep separation at zero for anatomical comparison. Actual series, acquisition
plane and image visibility require separate review; no patient image or approved
spatial link is connected. Independent Education case/Atlas/paid-lecture access
remains required. Pending or previously approved reviews are not migrated.

## Verification

`npm run abdominal-vascular-mri:test` checks the actual note-rendering callback,
all 9,936 topic placements, unchanged source frames and bundle bytes, exact
historical reconstruction, altered-source refusals and stale synthetic review
requests rejected before private storage. This is source/render-contract evidence,
not browser/GPU or clinical acceptance. Generated website import is a separate
local-only checkpoint; no publication is implied.

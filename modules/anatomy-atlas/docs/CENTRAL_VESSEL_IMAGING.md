# Central vessel imaging teaching — 13 September 2026

79 original draft topic placements cover 29 existing source selections: CT and
MRI for all, ultrasound for 21. This is a substantive central-circulation pass,
not completion of all vascular anatomy, variants, imaging or clinical teaching.

- Thorax: ascending aorta, arch, descending aorta, SVC, azygos, hemiazygos,
  right/left pulmonary arteries and four named pulmonary veins.
- Abdomen: aorta, IVC, coeliac/SMA/IMA, common/proper hepatic, splenic and left
  gastric arteries, portal vein, right/left renal arteries, right/middle/left
  hepatic veins, SMV and splenic vein.
- Ultrasound remains pending for the descending thoracic aorta, azygos,
  hemiazygos, four pulmonary veins and left gastric artery. This does not claim
  that specialised transoesophageal or endoscopic imaging is impossible.

## Content and binding

`content/central-vessel-imaging.ts` provides modality-specific landmarks and
pitfalls. Each panel also retains the exact existing anatomical teaching and
source limitation. No new toolbar, generic copied image or unregistered scan is
introduced. The pulmonary veins remain left-atrial drainage, hepatic veins are
caval outflow, and portal vessels are hepatic inflow; arterial and venous
enhancement are not treated as interchangeable.

Pins retain the complete identities, source bundles, anatomy and previous
pending topics at Atlas `6d8c900b4f80843ca7568e4222ffb49d0d22e1f1`. Runtime
binding requires the exact source signature, not just an FMA ID or matching
name. Laterality labels including `unspecified` and hemiazygos `midline` are
preserved rather than silently corrected or mirrored. Original coordinates,
source-piece counts, geometry, dissection recipes and asset holds are unchanged.

The 27 linked publications are factual reading references checked through their
indexed article text. No publisher figure, scan, article text, model, font,
texture or dataset is redistributed. The short notes are original synthesis,
not acquisition protocols or management advice. Source word budgets are checked
across all placements, including repeated notes. Existing asset licences and
full attribution remain. No dependency, API or mandatory fee is added.

## Verification

Run `npm run central-vessel-imaging:test`. The validator checks 79 actual React
note renders and citations, all 1,101 current body content records, 1,501 altered
source/topic rejections, five original GLB hashes, all 9,830 other topic
placements and preceding shoulder content/dissection recipes. The immutable
before/after record is for offline regression only, never clinical approval.
The previous organ and historical content suites remain separate checks.

Publication and exact GitHub/D recovery evidence belong in the coordinating
checkpoint, not inferred from a build. Browser/device and clinical acceptance
are separate gates; this text-only increment does not assert new browser QA.

## Radiologist sign-off requirements

Review the actual source/revision and each modality, particularly:

1. Aortic measurement planes, cardiac motion and incomplete echo windows.
2. Venous mixing, sequence-dependent signal and variant central connections.
3. Pulmonary arterial versus venous courses; ostial/lobar drainage variants;
   limits of echo coverage and of proximal imaging for distal disease.
4. Coeliac/mesenteric branching, fasting Doppler interpretation, incomplete
   distal imaging and the distinction between vessel patency and bowel viability.
5. Hepatic inflow/outflow, replaced/accessory arteries, variable portal and
   hepatic venous confluences, waveform interpretation and donor source limits.
6. Renal retrocaval anatomy, accessory/early branches and Doppler limitations.

No existing approval is migrated to the new display revision. Patient scans and
masks remain local and untouched. Real cases need privacy/release clearance,
reviewed source mappings and independent case/Atlas/lecture entitlements through
Didanix Education/light; no clinical PACS access or spatial registration is added.

Continue remaining coronary, thoracic inlet/wall, mesenteric/pancreatic/gastric
branch teaching, wider anatomy/dissection detail, imaging links, clinical content
and the complete shared roadmap. The earlier native MRI QA is already complete;
this work must not restart a competing learner PACS implementation.

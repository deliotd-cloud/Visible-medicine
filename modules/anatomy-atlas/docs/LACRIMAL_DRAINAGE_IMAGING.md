# Lacrimal drainage CT/MRI orientation drafts

Six existing Head & neck selections receive CT and MRI notes: right/left canaliculi (FMA59582/FJ1349, FMA59583/FJ1298), sacs (FMA59545/FJ1360, FMA59546/FJ1309) and nasolacrimal ducts (FMA59555/FJ1353, FMA59556/FJ1302). Each of the 12 placements remains a draft requiring source- and revision-bound radiologist review. Ultrasound and X-ray remain pending.

The notes distinguish the medial drainage apparatus from the superolateral lacrimal gland. CT provides a bony orientation for the sac fossa and nasolacrimal canal; MRI gives surrounding soft-tissue orientation. Neither routine modality guarantees depiction of the tiny canaliculi or the duct's membranous part. Specialised CT/MR dacryocystography is identified as a separate examination, never inferred from the atlas surface.

The exact-source pins retain each original selection, file hash, bundle, coordinate frame, side and baseline Anatomy. The transition records only CT/MRI replacement hashes. All other teaching slots and dissection recipes are checked against the pre-change digest. No geometry, image, registration, diagnostic interpretation, channel/patency/flow assessment, clinical approval or resource access is added. Atlas, case and lecture entitlements stay independent under Didanix Education/light.

## Primary reading and limits

- [Nair et al., British Journal of Radiology 2022, PMID 35522773](https://pubmed.ncbi.nlm.nih.gov/35522773/): CT delineates lacrimal-region anatomy and bone; MRI further characterises surrounding soft tissues. Its disease examples do not validate this source model.
- [Singh et al., Annals of Anatomy 2019, PMID 30954539](https://pubmed.ncbi.nlm.nih.gov/30954539/): reviews specialised dacryocystography; canaliculi and membranous duct remain insufficiently detailed. These notes make no performance or examination recommendation.

Only original concise factual wording and links are included. No publisher figures, prose passages, scans or datasets are imported. Radiologist review must verify the six identities, orientation, small-structure visibility limits and wording against the actual content revision. Software tests do not constitute clinical or device acceptance.

Run `npm run lacrimal-drainage-imaging:test` and `npx tsc --noEmit` for the focused contract and TypeScript checks.

## Bounded browser review, 24 September

The exported `a9d30e2` regional module was served only on loopback and opened in a temporary in-app browser tab. Selecting the right lacrimal sac displayed its draft CT and MRI notes with source and review warnings; Ultrasound displayed `CONTENT PENDING` and `No imaging study loaded`. The temporary tab and server were closed. This is a single pointer/browser sample, not physical-device, screen-reader, radiologist, patient-imaging or full six-selection acceptance. The new exact-source tests cover all six programmatically.

The older umbrella curriculum replay still fails at its historical whole-body teaching digest, and the broad content-contract test reports stale review-evidence hashes on unrelated viewer files. Neither was repinned or waived for this addition; focused transition, source-holds, source-geometry and TypeScript checks passed.

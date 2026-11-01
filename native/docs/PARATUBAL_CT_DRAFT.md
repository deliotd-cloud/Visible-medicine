# Paratubal CT teaching draft

Added 1 November 2026 against native source `32c000e5b9afb20503f3ce37c25ec119f0eaa3ab`.

Four existing selections receive research-context CT teaching: left/right levator veli palatini (FMA46729/46728) and tensor veli palatini (FMA46732/46731). Admission reuses each complete identity from `pharyngeal-mri-pins.json`, including source-file hashes; matching a name or FMA alone is insufficient. Both lessons remain drafts.

Primary references:

- [McDonald et al., cine CT research (2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3679544/): methods and figure captions 2–3 checked. The captions label both muscles on one side for clarity. Ten participants and a dedicated dynamic acquisition do not establish routine CT visibility, complete boundaries, bilateral segmentation accuracy or a diagnostic protocol. Proposed recruitment remains a hypothesis.
- [Huang et al., fresh cadaver dissection (1997)](https://pubmed.ncbi.nlm.nih.gov/9290650/): abstract checked for relative orientation to the auditory tube; full text not verified. This supplies anatomical context, not CT validation.

All teaching is original prose. No figures, images, meshes, datasets or contours were copied. Existing source-model notices remain applicable; no dependencies or paid services were added.

Palatopharyngeus, stylopharyngeus and salpingopharyngeus CT lessons are intentionally unchanged: specimen micro-CT or dissection alone does not establish visibility on ordinary patient CT.

Focused test: `npm run paratubal-ct:test`. Regional teaching snapshots are generated through the existing pipeline. Milestone verification compares all 9,936 root-topic placements with the base snapshot: four pending-to-draft changes and 9,932 unchanged. This count excludes nested and independent specimens.

Before delivery, regenerate the review revisions and website exports through the normal pipeline and complete candidate acceptance. No clinical approval, patient-space registration, scan pairing, entitlement change or public deployment is implied. The separate prostate candidate is preserved.

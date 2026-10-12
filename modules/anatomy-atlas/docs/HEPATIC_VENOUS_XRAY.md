# Hepatic venous X ray teaching

Four exact existing selections gain original X-ray/venographic orientation
drafts in Abdomen and Whole body: inferior vena cava (FMA10951), right hepatic
vein (FMA14338), left hepatic vein (FMA14339) and middle hepatic vein (FMA14340).
The IVC also retains its existing regional memberships. No source selection,
mesh, mask, camera, tour, question or other teaching tab is changed.

The resolver checks the complete existing identity against
`content/central-vessel-imaging-pins.json`, not just the name or FMA. Both IVC
files remain one selection. The middle hepatic source's disconnected components
remain grouped, with unspecified laterality and pending anatomical review.
No new tributary names, confluence, lumen or Couinaud territory is inferred.

## Teaching and evidence

Contrast venography is distinct from plain radiography, CT/MR venography and
Doppler. Selective filling, balloon occlusion and projection overlap do not
establish unaltered drainage, pressure, patency or patient-space registration.
The original drafts use these reading sources:

- [ACR/RSNA venography](https://www.radiologyinfo.org/en/info/venography)
  supports the examination distinction, not reuse of images or instructions.
- [Joshi et al., 69 cadaver livers](https://pubmed.ncbi.nlm.nih.gov/20177869/)
  supports variation in major hepatic venous openings. This is anatomical,
  not acquired-venogram visibility evidence or a patient-specific frequency.
- [Wang et al., 102 selected portal-hypertension patients](https://www.wjgnet.com/2307-8960/full/v10/i14/4460.htm)
  documents balloon-occlusion hepatic angiography during TIPS assessment.
  Its selected disease cohort is not routine normal-anatomy visibility evidence.
  No pressure thresholds, preferred access or treatment recommendations are used.
- [Hicks et al., 108 referrals](https://pubmed.ncbi.nlm.nih.gov/8541675/)
  compares cavography and selective renal venography. Missed variants limit
  conclusions from a single cavogram; cohort dimensions are not sizing advice.

All wording is original factual educational prose. The Wang publication is
CC BY-NC 4.0: no article text, diagrams, angiograms, tables, patient images or
other assets are imported or adapted. Other publishers retain their rights.
Reading links are not redistribution grants. Existing BodyParts3D attribution
is unchanged; no asset, dependency, font, service or fee is introduced.

## Review and verification

These are drafts, not radiologist approvals or acquired imaging cases. Their
exact teaching revisions flow through the existing Review worksheet pipeline.
Atlas, Education case and paid-lecture entitlements remain independent.
Clinical review must assess anatomical relationships, examination wording,
source limits and appropriate learner level against the exact material hash.

`node scripts/test-hepatic-venous-xray.mjs` verifies the four-placement
admission transition, complete identity guards, unchanged remaining content
and source geometry, and rejection of stale or forged Review submissions.
Regenerate regional teaching snapshots and normal renderer/Review bindings
before exporting through the existing website module pipeline.

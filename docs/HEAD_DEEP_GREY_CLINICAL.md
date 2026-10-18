# Deep grey clinical teaching draft

Eight existing left and right caudate, putamen, globus pallidus and thalamus
selections now share four clinical orientation topics. Native CT and MRI and
the existing 3D Atlas show them inside the collapsed clinical teaching panel,
with modality-specific cautions, an unscored reflection and reference links.
No new controls, anatomy assets, masks or scan processing are introduced.

## Review the draft

Open the authorized Clinical Review area, choose Head learning, then select
Deep-grey clinical correlations in its structure/evidence picker. Each note
links to its existing CT, MRI and 3D target. Choose Deep-grey clinical corrections
in the same picker to open the folded Private corrections and saved history
form. It saves draft notes or correction requests for this packet only, not
clinical approval. Do not enter its corrections in older packet forms.

Wait for your private history to load before editing. Save private draft creates
a new history entry. Load a current saved version to continue it; previous entries
remain unchanged. Refresh history and compare your text if a save conflicts or
cannot be confirmed. Download working copy preserves unfinished text locally;
keep it private and do not enter patient data. The export is not a confirmed
server save or approval.

Notes are private to the signed-in account and institution. The independent
endpoint `/api/atlas-review/head-deep-grey-clinical` reuses the existing
administrator authorization, session continuity and same-origin save guards.
No database migration or access change is required. Signed-in browser saving
still requires acceptance testing; automated checks do not replace that test.

Clinical packet SHA-256:
`6f966b9f29ebd4a77fd8d6547c29c509e8c616f9158e3c0994ca05b7bb5d81e9`.
Bound head manifest SHA-256:
`0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.

The eight concept IDs are `deep-{left,right}-{caudate,putamen,globus-pallidus,thalamus}`.
Exact content and CT/MRI/3D bindings determine the separate packet revision.
Changed or missing bindings make the server verification fail; earlier anatomy,
quiz, sequence or clinical decisions do not approve this draft.

## Clinical validation

The radiologist must check the original sources, cohort and acquisition limits,
wording, bilateral identities and displayed targets. Review whether each
reflection is useful at its selected structure and whether its caution is clear.
The topics concern localisation, CT detection limits, MRI measurements and
lesion evolution; they do not establish diagnoses in these reference subjects.
Regional anatomy is not a lesion, perforator territory or functional-pathway
segmentation. Comparisons remain semantic, not patient-space registration.

## References and commercial use

The module contains original factual paraphrases and links to primary studies:

- [Das et al. 2015](https://pubmed.ncbi.nlm.nih.gov/25721075/)
- [Chung et al. 2006](https://pmc.ncbi.nlm.nih.gov/articles/PMC2564205/)
- [Tullo et al. 2019](https://pubmed.ncbi.nlm.nih.gov/31452289/)
- [Okazaki et al. 2015](https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2015.00118/full)

No figures, article passages, scans or datasets are copied. These links do not
grant rights to reuse the source images. No new asset, dependency or fee is
required. Existing third-party notices and independent access rules remain.

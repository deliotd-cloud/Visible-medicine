# Nasal cartilage MRI orientation

Five existing source-labelled selections receive three original MRI lessons:
the midline septal cartilage, paired major alar cartilages and paired lateral
nasal cartilages. All remain editorial drafts for revision-bound radiologist
review. No new anatomy, geometry, acquired image, scan annotation or registration.

The actual `bodyLesson` dispatcher invokes `nasalCartilageMriLesson`. Its five
group/FMA bindings reuse the complete admitted identities in
`content/nasal-cartilage-quiz-pins.json`; a changed ID, source component, side,
coordinate, boundary, provenance or extra field withholds that added lesson.
The other eight topics and unrelated structures keep their existing resolver.
Returned arrays are fresh. Normal regional snapshots, display-review pins and
renderer fingerprints must be regenerated; no review decision transfers.

The [Visscher et al.2017 original study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5577227/)
supports dedicated nasal-MRI orientation, not routine brain-MRI visibility. It
used one cadaver head and one volunteer; the selected spoiled-gradient-echo
acquisition had0.9×0.9×1mm resolution, not isotropic0.9mm. Partial lateral-crus
identification in the three-observer cadaver MRI-versus-micro-CT comparison does
not prove capture of the entire alar cartilage or its medial crus. The
[Varoquier et al.2021 primary abstract](https://pubmed.ncbi.nlm.nih.gov/33144032/)
supports caution about assuming a separate upper-lateral/septal interface from
the Atlas mesh edge. Kim2008 brain-MRI/cohort claims are not included in this
module because their detailed primary-text wording was not verified here.

These are original project-MIT factual notes. Article citations are reading
references, not imported datasets or media licences. No figures, prose,
tables, patient examples, scans or meshes from the studies are copied,
adapted or relicensed. See `LICENSES/THIRD_PARTY_NOTICES.md`. Existing BodyParts3D
CC BY4.0 attribution and unreviewed source boundaries remain. No new dependency,
font, service or mandatory fee. Atlas/case/paid-lecture access stays independent.

Run `npm run nasal-cartilage-mri:test` for the complete admission-epoch comparison
and separately scoped current delivery. Software checks are not clinical,
browser, image-registration or public-release approval. The website must receive
this source through its normal generated-module and protected Review pipeline
before these lessons are claimed as integrated learner content there.

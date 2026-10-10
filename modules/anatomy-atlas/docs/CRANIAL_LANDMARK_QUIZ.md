# Nasal and commissural landmark quick checks

Seven existing source selections receive five original Quiz-tab questions:
septal cartilage FMA59503; major alar FMA59505/FMA59506; lateral nasal
FMA59512/FMA59513; forniceal commissure FMA61970; posterior commissure FMA62072.
Paired cartilages share a question. This is not seven distinct exams.

Baseline: `dc8212978d4929c26c514bb08f9ed8e5f6df8cef`. Each resolver binds the
complete displayed source identity recorded in its `content/*-quiz-pins.json`,
not a name or FMA alone. Only these Quiz placements change from generated
identification to draft. Other topics, source models, accepted masks, tours,
dissections, access rules and clinical approval remain unchanged.

## References and limits

- [WSU external-nose anatomy lab](https://learning.medicine.wsu.edu/wp-content/uploads/sites/4/2023/04/PDF-Lab-20.pdf):
  paired alar crura and their columellar relationship; bony septal components.
- [Touro nasal-cavity teaching](https://gross.tun.touro.edu/2012%20Dissectors%20in%20MS%20Word/Dissectors%20PDF/2012Dissection14NasalCavityPterygopalatineFossaNasopharynx.pdf):
  septal/external framework and lateral cartilage continuity at the dorsum,
  with alar cartilages inferior to them. Publicly indexed text verified;
  direct PDF retrieval was unreliable. No source figures are included.
- [Akeret et al., 2022](https://pubmed.ncbi.nlm.nih.gov/35879431/):
  histological crossing fibres despite no crossing reconstruction in the
  study's 7 T tractography analysis. This does not establish an individual
  patient's fibres or validate the Atlas surface.
- [Aydin et al., 2026](https://pubmed.ncbi.nlm.nih.gov/42192803/):
  four-cadaver study locating the posterior commissure above the upper
  aqueduct in the inferior pineal lamina. The question tests gross orientation,
  not a universal MRI detection rate, surgical route or lesion diagnosis.

All source reading checked 10 October 2026. Original factual questions only;
no third-party question bank, prose, figures or assets reproduced. Existing
MIT project terms and BodyParts3D CC BY 4.0 credits remain. No new licence,
dependency, paid service or data upload.

## Verification and review

`npm run cranial-landmark-quiz:test` checks the seven transitions against the
pinned baseline, every unaffected topic, exact identities and model hashes,
correct-answer text and incorrect-answer feedback, actual Quiz rendering callbacks,
fresh arrays and stale/tampered Review submissions before storage. Run renderer
and Review display-pin generators before checking a newly edited source.

Radiologist review must cover the exact new teaching revision, question
ambiguity and source-surface limitations. Unit/render tests are not browser/GPU
acceptance, clinical approval or patient-space synchronization. Website delivery
is a separate generated import; source changes alone do not update the website.

# Spine and pelvic muscle imaging — 13 September 2026

Adds 192 draft CT/MRI/ultrasound sections across 64 exact source selections and
36 muscle/part/set identities. All three topics were pending at source commit
`213699f56adf0f25055913c906f3a976df80a10a`. Existing anatomy, function, clinical,
pathology, quiz, X-ray and other imaging notes and dissection recipes are retained.
This fills the current unambiguous spine/pelvic muscle imaging gaps, not every
possible anatomical structure or a complete clinically validated curriculum.

## Specific teaching

- Erector spinae columns, deep transversospinal muscles, cervical lateral muscles,
  splenius/semispinalis layers and individual capitis versus cervicis attachments.
- Posterior suboccipital versus anterior/lateral craniocervical muscles; C1/C2
  landmarks, oblique imaging and limits of visible ultrasound area measurements.
- Separate trapezius portions, posterior serratus sheets, short rib elevators,
  interspinal/intertransverse sets and coccygeus at the posterior pelvic diaphragm.
- Source sets are not validated per-level contours. A boundary that cannot be
  resolved on an acquired image remains unresolved; no synthetic fascicle or
  inferred patient registration fills the gap.

FMA19728 remains pending for CT/MRI/ultrasound. Its source components also map
to external anal sphincter in the source index; it is not safely identifiable as
a separate superficial transverse perineal muscle. Existing source-category
teaching and holds remain unchanged. Spinalis subcomponent and rib-elevator-longi
holds are also retained. No source identity, mesh or attachment footprint changes.

## Evidence and commercial boundary

The content module lists nine primary imaging/anatomical publications or official
ACR/RSNA reading references. Existing original attachment notes and their citations
are reused, not replaced. Some PMC full-page requests returned access challenges;
indexed passages and accessible publisher records supplied the cited facts.
New facts are short original synthesis, with a unique-fact word budget per source.
No article prose, figure, table dataset, scan, ultrasound image, model, font,
texture, dependency, paid API or mandatory service is imported. Reading links
are not grants to redistribute publisher material. Original notes/code retain
the project MIT terms; existing model licences/notices remain separate.

## Validation and clinical gates

`node scripts/pin-spine-pelvic-muscle-imaging.mjs --check` checks exact identities
and all four involved bundle hashes. Never overwrite baseline pins.
`node scripts/validate-spine-pelvic-muscle-imaging.mjs` compares all topics/recipes
against the predecessor, validates the actual displayed content records, renders
all 192 notes with the real viewer note callback and rejects 2,880 identity/topic
mutations. Offline historical reconstruction preserves earlier test evidence;
it is not a runtime migration or a migration of clinical approval.

Radiologist review must verify each revision's attachment wording, relationships,
scan coverage, unresolved boundaries and modality limitations. CT prose is an
orientation aid for existing imaging, not an indication or acquisition protocol.
No diagnostic thresholds, procedural route or lesion are inferred. Future cleared
case correspondence belongs in Didanix Education/light, with separate imaging,
Atlas and paid-lecture rights. Privacy/public-release clearance is independent.
No patient source scan or mask is touched. Tests do not confer clinical sign-off.

Rebuild the shared website module from clean committed Atlas source; never edit
its generated copy. See the dated coordination checkpoint for actual publication,
GitHub, D recovery and remaining device/clinical evidence.

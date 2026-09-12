# Hip and thigh muscle imaging drafts

13 September 2026. This milestone fills 112 previously pending CT, MRI,
ultrasound and X-ray topic placements for 28 existing bilateral BodyParts3D
selections. It does not add or alter geometry, connect imaging or approve
clinical content. The existing contextual tabs are reused; no controls are added.

## Coverage

Fourteen concepts: adductor minimus, superior and inferior gemelli, obturator
internus and externus, piriformis, gluteus maximus, pectineus, sartorius, tensor
fasciae latae, vastus lateralis, medialis and intermedius, and biceps femoris
short head. Other authored hip/thigh selections retain their existing teaching.
The short notes distinguish the selected muscle, useful spatial landmarks and
the limits of relating a donor surface to each imaging modality.

`content/thigh-muscle-imaging.ts` holds original prose and reading references.
`lib/thigh-muscle-imaging.ts` admits only the exact pinned existing source
records, not a matching name or FMA code from another specimen. Every lesson
remains `draft` and carries a radiology-review warning. Study access, registration
and lecture rights are not created by a citation or structure selection.

The website's `/atlas/lower-limb-3d` uses the separate Universiti Malaya CC0
right-limb specimen. This change is not automatically exported to it; reuse
would need an explicit source-specific binding and review. Do not mislabel
the two donors as registered or equivalent anatomy.

## Evidence and regression scope

Baseline: `388eb301a3c5f65c670cfb711f025a0716f98aea`.

- `node scripts/validate-thigh-muscle-imaging.mjs`: all 112 actual note-callback
  server renders, 1,680 altered-source/topic rejections, 1,101 current schema
  records, two unchanged GLB byte hashes and 9,797 unchanged other topic
  placements pass. This is React server rendering, not a browser/device test.
- `node scripts/validate-content-contract.mjs`: the original 33,444 historical
  contract checks pass without replacing their expected authoring hashes.
- `npm run reviews:test`: 235 checks plus 16 display-history negative cases pass.
- TypeScript and production build pass. Existing large-chunk warnings remain.

The one-time pins and transition files retain exact prior pending lessons and
new lesson hashes. Offline history reconstruction removes this milestone before
the preceding pelvic-organ imaging step; runtime lessons and review records are
not mutated. The root-body renderer revision is regenerated for the changed
teaching inputs (459 files, SHA256
`b0e3b5a54aa18e8fc7fd9fe227ba7799ccf38f2f5087404c3c432cc6d9529f05`).
Do not carry an old display approval forward to this new revision. No private
review database or approval has been altered.

## Reference and commercial-use boundary

The source file contains ten external reading links: ESSR hip/knee ultrasound
guides, TTUHSC lower-limb anatomy, NCBI and original research, and RSNA/ACR
modality explanations. These support brief original factual drafts, not an
imported diagram, chapter, table, scan or question bank. The validation report
counts unique reference-derived fact text and shared text once. Source rights
remain with their publishers; access or citation is not a reuse licence.
In particular, NC/ND reference articles are not included as commercial assets.

No package, font, model, texture, copied media, runtime reference-fetching service
or paid API is introduced. Existing MIT authored-content/code and BodyParts3D
CC BY 4.0 provenance obligations remain separate and unchanged.

## Remaining radiologist review

Review each bilateral selection against its source and the stated landmarks;
confirm adductor-minimus variability, deep-rotator tendon relationships,
quadriceps component distinctions and short/long biceps-head terminology.
Review modality wording and limitations, especially ultrasound visibility and
plain-film soft-tissue limits. Check actual panel readability in browser/device
acceptance. The outer meshes do not establish tendon subdivisions, safe
procedural routes, pathology, nerve variants or patient-specific findings.

Retain unresolved candidate mesh holds. Connect real imaging only through
cleared, versioned Education resources with verified frame/registration and
independent case/lecture authorization. Clinical approval must identify the
reviewed source/content revision; this milestone is not whole-atlas sign-off.

# Craniofacial organ imaging — review drafts

The existing CT, MRI, Ultrasound and X-ray tabs now have introductory
structure-specific orientation for nine retained selections: pituitary, both
eyeballs, both lacrimal glands and both submandibular/sublingual glands.
This adds 36 draft placements from 19 distinct short topic texts. The small
salivary-gland addition does not expand the separate dental/oral-cavity scope.
No new panel, toolbar, route, mesh, scan or dependency is introduced.

## What the notes teach

- Pituitary: sella and stalk relationships; dedicated sellar versus routine
  head studies; posterior bright spot as an MR appearance, not a mesh division.
  Ultrasound and plain-film limitations are explicit.
- Eyes: globe versus orbital contents, lens/fluid/coat contrast and the limits
  of a whole-globe surface. MRI safety and suspected open-globe injury require
  clinical assessment, never clearance by this reference model.
- Lacrimal glands: superolateral gland versus the inferomedial drainage system;
  complementary bone/soft-tissue imaging and limited sonographic access.
- Salivary glands: relation to the mylohyoid and neighbouring spaces, duct and
  stone localisation limits, and incomplete acoustic/plain-film visibility.

Each entry retains baseline Anatomy, a modality pitfall, explicit source limits,
reading links and review status. Source positions must be restored before
image comparison. No patient, sequence, image or coordinate registration is
connected. Didanix Education/light and independent case/Atlas/lecture rights
remain the integration boundaries.

## Exact binding and preservation

The pins bind nine full identities and three original bundles, with the original
frame, source files, hashes, laterality, bounds, anchors and review state.
FMA names alone never transfer notes to another specimen. The pituitary retains
the source's `unpaired` classification; no laterality is rewritten.

The right eye uses its existing corrected parent, not the archived pre-correction
aggregate. That archived record shares an ID but has different bounds/bundle/
source scope and does not receive the new teaching. The unchanged left-eye
record remains eligible. Geometry is unchanged in this milestone.

Thirty-six previously pending slots become draft. All other 9,882 current
root-topic slots, shoulder teaching and dissection recipes are hash-checked
unchanged. The preceding corpus-spongiosum baseline is preserved through a
strict offline transition: recorded new content hashes and exact source pins
must match before previous pending notes are restored for historical tests.
The historical adapter never enters the runtime or review/approval API.

## Verification

```sh
npm run craniofacial-organ-imaging:test
npm run corpus-spongiosum:test
node scripts/validate-content-contract.mjs
node scripts/validate-body-review.mjs
npx tsc --noEmit
npm run build
npx vite build --config integration/head-neck/vite.config.mjs
```

The dedicated validator checks current exported content/schema, all nine
bindings, 684 source/topic mutation rejections, archived right-eye rejection,
unchanged unrelated lessons/recipes, cloned outputs and actual React note
rendering for all 36 placements. References, review warnings and the existing
“No imaging study loaded” message must render. These are not device/GPU or
clinical acceptance tests. See the machine-readable validation report.

## References and rights

Exact links are held in `content/craniofacial-organ-imaging.ts`. Reading
references include Endotext, NCBI-indexed orbital/lacrimal/salivary imaging
papers and RadiologyInfo MRI safety. Some publications have NC/ND restrictions:
no publisher text passage, figure, table, illustration, scan or dataset is
imported, and citation is not a reuse licence. These are original concise
factual drafts, not reproduced review articles. EyeWiki material is not used.
Source-derived word totals are checked per reference over distinct new notes.
Existing model attribution remains unchanged; no paid service or new fee.

## Required radiologist sign-off

Review each source-bound note, anatomical relationships, sequence-dependent
appearance, ocular safety wording, pituitary/salivary limits and appropriate
level of learner detail. These introductory drafts do not provide complete
differentials, acquisition protocols, diagnostic performance or procedures.
Revision-bound approval must identify its real source and teaching content.
No existing anatomical/clinical approval is inherited.

Website publication is a separate checkpoint. The source tree also contains
the preceding unstaged corpus-spongiosum GLB, so model staging and verified
delivery must precede activating a new combined website export.

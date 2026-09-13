# Intrinsic foot muscle imaging drafts

13 September 2026. This extension fills 144 previously pending CT, MRI,
ultrasound and X-ray topic placements for 36 existing bilateral BodyParts3D
selections (18 source-labelled concepts). It adds introductory imaging
orientation in the existing regional/whole-body panels, not a new interface,
new meshes or a claim of complete imaging teaching.

## Scope and source identity

Coverage includes the four numbered lumbricals, three plantar interossei,
abductors hallucis/digiti minimi, flexors digitorum/digiti minimi brevis,
extensor hallucis brevis, flexor accessorius (quadratus plantae), separate
medial/lateral flexor hallucis brevis heads, oblique/transverse adductor
hallucis heads and the source-labelled opponens digiti minimi slip.

The notes keep toe numbering distinct from muscle numbering. Heads are not
presented as whole muscles, an alias is not counted as new anatomy, and a
source-labelled variant is not assumed to be universally distinct in patients.
The model does not delineate every tendon expansion, sheath, retinaculum,
plantar plate, neurovascular structure or internal fibre boundary.

`content/foot-muscle-imaging.ts` holds original notes and reading links.
`lib/foot-muscle-imaging.ts` binds only exact saved source records, including
side, source files/hashes, label, bundle, anchor and bounds. Neither matching
a name nor sharing an FMA ID admits an unrelated specimen. The source pins
were captured while all targeted topics were genuinely pending.

Open `/regions/foot` or select these muscles in the root-body explorer, then
use the existing imaging tabs. Every new topic is a `draft` and retains the
**No imaging study loaded** state. Anatomy, Function, Clinical, Pathology and
Quiz content remains unchanged. These notes are not automatically added to
the website's separate UM lower-limb specimen; source-specific adaptation and
review would be required.

## Imaging limitations

CT and X-ray notes orient the reader using bone/attachment landmarks without
inventing internal muscle detail. MRI notes distinguish visible image borders
from donor-surface boundaries; the cited 7T morphology work was a
single-participant proof-of-concept, not a rule requiring 7T for clinical foot
MRI, a diagnostic threshold, or a normative dataset. The atlas contains no
patient signal or muscle-fat measurement. Ultrasound notes are landmark-based
orientation, not a complete acquisition or intervention protocol. Hiding a
mesh cannot create an acoustic window or demonstrate dynamic function.

## Verification and review boundary

Baseline: `441ce856955f71b145420330fff3e37649d7ad4e`.

- `node scripts/pin-foot-muscle-imaging.mjs --check` verifies identity metadata
  and both original source-bundle byte hashes.
- `node scripts/validate-foot-muscle-imaging.mjs` checks all 144 actual React
  note-callback server renders, including prose, bullets, citations and absent
  imaging status; 2,160 altered-source/topic rejections; 1,101 current schema
  records; and all 9,765 other topic placements, shoulder teaching and recipes.
- Offline reconstruction reverses only these recorded changes before older
  milestone checks. It rejects unrecorded edits and does not alter runtime
  lessons, original golden hashes or private review records.
- Re-run leg/thigh imaging history, the full historical content contract,
  TypeScript/build, shoulder review safeguards and current body-decision tests.
  Exact results are retained in `foot-muscle-imaging-validation.json` and the
  main task's dated recovery checkpoint.

The regenerated body renderer revision invalidates stale display approval; no
approval is carried forward automatically. Server-rendered evidence is not a
browser, physical-device, radiological or patient-imaging acceptance claim.
Check actual panel readability and all anatomical/imaging statements during
revision-bound radiologist review. No clinical or media release is inferred.

## References and commercial compatibility

Reading references checked 13 September 2026:

- [TTUHSC lower-limb anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html)
- [Zaottini et al., plantar-foot ultrasound (2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/)
- [Franettovich Smith et al., intrinsic-foot MRI morphology (2021)](https://link.springer.com/article/10.1186/s12891-020-03926-7)
- [RSNA/ACR musculoskeletal ultrasound](https://www.radiologyinfo.org/en/info/musculous)
- [RSNA/ACR bone radiography](https://www.radiologyinfo.org/en/info/bonerad)

No article prose, illustrations, tables, patient images, segmented dataset,
protocol, quantitative measurement or question bank is imported. In particular,
the ultrasound article's CC BY-NC-ND terms do not permit treating its figures
or text as product assets; it is linked for factual reading only. Original
short synthesis/code retains MIT terms; existing BodyParts3D CC BY 4.0 notices
remain. No dependency, font, texture, model, paid API or mandatory service is
added. Future images require independent rights, privacy and release clearance.

Keep original scans/masks local. Use Didanix Education/light with independently
authorized Atlas/case/lecture resources and validated frame/registration
mapping. The full regional/whole-body goal and source/clinical gates remain
active after this teaching milestone.

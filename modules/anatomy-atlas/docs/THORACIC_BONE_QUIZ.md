# Thoracic-bone quick checks

2 October 2026. Nine original, four-option formative questions cover the 24
existing right/left rib selections and three midline sternal selections. They
are draft Quiz Notes for the existing Structure check. No new model, anatomy,
imaging, UI, dependency, entitlement or clinical claim is introduced.

`lib/thoracic-bone-quiz.ts` reads the complete identities in the existing
`content/thoracic-bone-quiz-pins.json`. These identities are verified against the
actual pre-change display catalogue and existing imaging identities. The exact `sourceCanonical` comparison
includes the source record, parent identity, laterality, geometry/provenance and
validation fields. The question groups use the actual pinned FMA IDs: first rib
FMA7857/7987; second FMA7882/8012; ribs 3–7 FMA7909/8039, 7957/8148,
8066/8093, 8175/8202, 8229/8256; ribs 8–9 FMA8283/8310, 8364/8391;
tenth FMA8445/8472; ribs 11–12 FMA8531/8532, 8533/8534; manubrium FMA7486;
sternal body FMA7487; xiphoid FMA7488. Each pair is right/left. No name-only
or FMA-only fallback admits a lesson, and no viewer screen position sets side.

## Source support

- First rib T1 articulation and atypical form; true ribs 3–7; floating ribs
  11–12: Safarini and Bordoni, [Anatomy, Thorax, Ribs](https://www.ncbi.nlm.nih.gov/sites/books/NBK538328/),
  Introduction and Structure and Function.
- Second cartilage at the sternal angle; manubrial notches; sternal body
  cartilages 3–7; xiphoid position and variation: Altalib, Miao and Menezes,
  [Anatomy, Thorax, Sternum](https://www.ncbi.nlm.nih.gov/sites/books/NBK541141/),
  Structure and Function.
- Eighth/ninth anterior-tip variation and separate tenth-rib question: Patel
  et al. (2023), [Anatomy of the anterior ribs and the composition of the costal
  margin](https://pubmed.ncbi.nlm.nih.gov/37982795/), cadaver study, abstract.
  Its observations explain why an attachment cannot be asserted for this
  specimen; its percentages are not applied to an individual.

Only anatomical facts are used; no source prose, figures, images, scan data or
licensed media are reproduced. Rib cartilage, named facets, joints, cortical
thickness and marrow are not separate validated selections. The questions do
not infer rib level from screen orientation, verify an acquired image, determine
normality or give needle/CPR directions. Atlas, imaging cases and lectures keep
independent access. Teaching review must bind to the actual source revision;
synthetic tests cannot replace radiologist sign-off or admit source anatomy.

The dispatch uses the existing folded Quiz Notes and Structure check. Answer
positions vary A, B, C, D, A, B, C, D, A. No additional controls are added.
`scripts/test-thoracic-bone-quiz.mjs --integrated` checks all 27 selections, source
identity mutations, schema/export/review packets, actual folded-note and radio
handlers, correct/incorrect feedback, retry focus and exam-mode concealment.
The source transition compares all 9,936 topic placements to exact Git parent
`d9cd141f1fefae6842754e134a1ef18d5661c727`: 27 quiz placements change,
9,909 remain identical. Source geometry, recipes, tours and other tabs stay intact.
History restores only exact pinned identities and rejects mixed or foreign edits;
original earlier question-history hashes are not replaced.
Review display pins and renderer fingerprints are regenerated; old revision
submissions are rejected, never migrated to an approval. Questions are drafts for
the owner radiologist, not an imported question bank or a clinically validated exam.

# Carpal-bone structure checks

2 October 2026. Source-bound teaching draft; no clinical acceptance or new
segmentation. Eight original four-option questions cover the 16 existing left
and right carpal-bone selections. Questions use the folded Quiz Notes and the
existing answer/check/reset component; no extra control, menu or navigation.
Exam mode does not disclose these learning answers.

The exact source record, rather than a name or FMA fallback, admits each lesson.
`content/carpal-bone-quiz-pins.json` records the whole identity and previous quiz
at parent `acd99b11e279a0525f1488456c0a8adf2abb2cf7`. The transition admits
exactly 16 quiz changes, preserving 9,920 other topic placements and existing
shoulder teaching and dissection recipes. The bilateral right trapezoid uses
the actual source FMA23725, not an invented neighbouring identifier.

## Topics and factual references

- Scaphoid: a normal early radiograph does not exclude fracture. AAOS OrthoInfo,
  [Scaphoid fracture of the wrist](https://www.orthoinfo.org/diseases--conditions/scaphoid-fracture-of-the-wrist/).
- Lunate: central radius–lunate–capitate relationship; pisiform and hamate:
  proximal/distal ulnar carpal-tunnel landmarks. ESSR,
  [Wrist ultrasound technical guidelines](https://essr.org/content-essr/uploads/2016/10/wrist.pdf),
  PDF pages 5–6 (zero-based), printed wrist pages 12–13.
- Triquetrum, trapezoid and capitate: assembled carpal-row groupings/order.
  Włodarczyk, J., Czaplicka, K., Tabor, Z., Wojciechowski, W. and Urbanik, A.
  (2015), [Segmentation of bones in magnetic resonance images of the wrist](https://doi.org/10.1007/s11548-014-1105-x),
  International Journal of Computer Assisted Radiology and Surgery 10:419–431,
  anatomy background. Publisher identifies Creative Commons Attribution with
  any-use permission and credit requirement, without a version in the HTML.
- Trapezium: first carpometacarpal saddle joint. Rusli, W.M.R. and Kedgley, A.E.
  (2020), [Statistical shape modelling of the first carpometacarpal joint reveals
  high variation in morphology](https://doi.org/10.1007/s10237-019-01257-8),
  Biomechanics and Modeling in Mechanobiology 19:1203–1210. CC BY 4.0;
  [licence](https://creativecommons.org/licenses/by/4.0/).

These are original factual exercises, not reproductions of publisher prose,
figures, scans, algorithms or datasets. Author/year credits accompany relevant
answers and full notices remain in LICENSES/THIRD_PARTY_NOTICES.md. AAOS/ESSR
reading links are not commercial redistribution licences. OpenStax's current
non-commercial edition was excluded entirely from shipped content and citations.
No new model, font, texture, dependency, paid API or mandatory fee was added.
Existing model licensing/attribution and source holds remain in force.

## Required radiologist review

Check both laterality records, wording, single-best-answer choices, distractors,
explanations, reference relevance and educational scope against the exact
revision in Clinical Review. Confirm the row/landmark relationships in assembled
anatomy, not screen position or separated/exploded geometry. These whole-bone
meshes do not separately validate tubercles, the hamate hook, articular surfaces,
ligaments, tunnel contents or alignment. No clinical diagnosis, normality,
patient-side determination, fracture exclusion or patient CT/MRI registration
is supplied by this reference atlas. Imaging cases and lectures still require
their independent access and dataset/privacy/registration clearances.

Teaching changes require new teaching sign-off. Renderer bindings are refreshed
separately; old geometry/teaching decisions must be refused before storage,
never migrated into current approval. Tests are synthetic, not clinical sign-off.

## Verification

Run `node --import tsx scripts/test-carpal-bone-quiz.mjs --integrated`,
`node --import tsx scripts/carpal-bone-quiz-transition.mjs`, and
`node scripts/test-carpal-bone-quiz-review.mjs` from the Atlas checkout.
Focused tests verify exact bindings, altered/missing source records, all 9,920
unchanged topics, genuine Quiz Notes lazy loading, correct/wrong answers and
exam suppression. Review proof covers the complete root catalog and nested
teaching preservation, rejecting stale revisions before synthetic storage.

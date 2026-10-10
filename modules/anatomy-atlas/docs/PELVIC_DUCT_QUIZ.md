# Pelvic duct quick checks — 8 October 2026

Three original question concepts now have five exact-source placements: both
testes, both deferent ducts and the adult-male urethra. Testis and urethra
identification-only placeholders become selectable questions; the existing duct
self-check becomes interactive without changing its underlying teaching point.
The eight earlier pelvic organ quizzes remain unchanged.

## Teaching and boundaries

- Testis: distinguish seminiferous sperm production from epididymal maturation.
- Deferent duct: identify the seminal-vesicle duct at the ejaculatory-duct junction;
  do not imply that sperm pass through the seminal vesicle itself.
- Urethra: distinguish the urinary outlet and male reproductive passage from a ureter.

The existing Quick check disclosure provides four choices, a single keyed answer,
feedback, an explanation and retry. The explanation is withheld until answering;
the disclosure remains hidden in exam mode. No new panel or navigation is added.

Original factual questions reference NIH/NCI SEER pages checked 8 October 2026:
[Testes](https://training.seer.cancer.gov/anatomy/reproductive/male/testes.html),
[Duct System](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html),
[Urethra](https://training.seer.cancer.gov/anatomy/urinary/components/urethra.html).
References are reading links, not imported prose, figures, datasets or licences
for third-party assets. Existing geometry and notices are unchanged.

All questions are drafts pending revision-bound radiologist review. They describe
usual anatomy, not verified microscopic structures, duct patency, fertility,
female-source equivalence or patient-space registration. No approval migrates.
Atlas, imaging-case and lecture access remain independent.

## Binding and verification

`content/pelvic-duct-quiz-pins.json` retains the five complete source identities,
actual predecessor questions and bundle hashes at Atlas parent
`343bbe3d2402502b698659fe5b9e5f9f2c2ff9c3`. The lesson resolver refuses any source
identity drift; it does not infer identity or side from names.

Run `node scripts/pin-pelvic-duct-quiz.mjs --check` and
`node scripts/test-pelvic-duct-quiz.mjs`. The focused test compares the actual
dispatch against that immutable parent: five changed quiz topics, 9,931 unchanged
topics, all eight prior pelvic quizzes, model hashes, review teaching revisions,
source refusals and actual Quick check interactions. Shared content/review,
decision, renderer, inventory and TypeScript checks are separately recorded on E.
These checks do not establish anatomical accuracy or signed-in browser acceptance.

This is an Atlas-source checkpoint. Generated website import and local website
acceptance remain a separate next step; nothing is publicly deployed here.

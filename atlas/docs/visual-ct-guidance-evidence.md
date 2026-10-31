# Visual-pathway CT orientation: bounded evidence proposal

Baseline: isolated Atlas source `09c42674b81c884ca419e6af7b43f2ef0977185b`, source manifest SHA-256 `ce1d2306955191af049aa3fb7e55056b1fac0d7cf972f9f626f999b95e376764`. This proposal changes two existing draft CT topics; it does not fill a new modality gap or establish clinical acceptance.

| Topic | Body words | Evidence used | Boundary retained |
| --- | ---: | --- | --- |
| `visual-optic-chiasm` | 55 | [ACR Appropriateness Criteria, Vision Loss (New 2025)](https://acsearch.acr.org/docs/3196640/Narrative), discussion of suspected chiasmal disease, MRI characterization and CT information about calcification/bone | Orientation only; no traced CT boundary, patient registration, compression finding or field deficit |
| `visual-optic-tracts` | 58 | [Chen et al. 2009 abstract](https://pubmed.ncbi.nlm.nih.gov/19837645/) on adult cadaver coronal sections correlated with MRI; existing [visual-system diffusion MRI review](https://doi.org/10.3390/biology11030454) | Anatomical relationship only; no claim of CT tract visibility, axons, validated termination, registration or field map |

The 113 combined body words are original paraphrases. The ACR guideline and Chen study receive their own professional source records. Neither is labelled CC BY 4.0 or linked to the existing reuse-license record. No source figure, table, scan, asset or extended source text is included.

The other three CT sections and four original reference records remain byte exact through the existing five-topic hash proof. `nestedBeforeVisualCTGuidance` validates both new lessons and both new references as a complete state, restores exact old bodies/references, and then `nestedBeforeCTOrientation` runs its unchanged original five-topic and four-reference hashes. Partial additions, altered bodies, foreign references and a changed older CT topic fail closed in the focused test.

Focused test: `node --max-old-space-size=64 --experimental-strip-types --test scripts/test-nested-visual-ct-guidance.mjs` passed 3/3 with zero skips. Broader Atlas validation, website binding, rendered behavior and radiologist review remain for the main coordinator. This is a source-only proposal; no patient material, masks, CT-head task, PACS, public artifact or clinical sign-off was changed.

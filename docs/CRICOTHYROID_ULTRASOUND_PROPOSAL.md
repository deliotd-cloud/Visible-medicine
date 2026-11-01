# Cricothyroid ultrasound teaching proposal

This is an original, staged teaching draft for `cricothyroid-source-parts`, based on the exact native source file at SHA-256 `ad6404871498f39639a478eef5a17c6abe8395e7351d2a6c8595606d2533b68d` (Atlas HEAD `7b2e5accf8538f3ffef396f95b0a206b06a76c1b`). The four FMA46611–46614 surfaces, other concept fields and existing references remain unchanged. No scan, figure, abstract quotation or model derivative was imported.

Primary abstract checks:

- [Park et al., J Voice 2016, PMID 26602419](https://pubmed.ncbi.nlm.nih.gov/26602419/): prospective ultrasound-guided laryngeal electromyography in 20 patients; cricothyroid muscles identified in all 20. The abstract does not establish separate straight and oblique belly visualization or general diagnostic accuracy.
- [Singh et al., J Ultrasound Med 2010, PMID 20040778](https://pubmed.ncbi.nlm.nih.gov/20040778/): airway sonography in 24 healthy volunteers; thyroid and cricoid cartilage appeared hypoechoic with a bright intraluminal air-mucosa interface. Intraluminal air artifacts obscured posterior structures.

The added paragraph is anatomy-learning context. It does not claim patient registration, ultrasound segmentation, muscle function, pathology, or clinical approval. Its readiness remains `draft` for revision-bound radiologist review.

Focused test command, to run when the main task says ready:

`node --test G:/VisibleMedicine-temp/proposals/20261101-cricothyroid-ultrasound/test-cricothyroid-ultrasound.mjs`

The test transpiles the isolated copied module with the website's installed TypeScript. It checks the exact native baseline hash, compares all existing exports after removing only the new fields, checks four exact FMA IDs, draft readiness, citation closure, reference URLs and paragraph length. No geometry or JSON models are read.

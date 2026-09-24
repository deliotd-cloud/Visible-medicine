# Renal collecting sequence · source-only concept guide

The independent HRA v1.10 Kidney dialog now offers a collapsed concept guide in the existing `collecting-left` and `collecting-right` studies. It does not open automatically, add navigation, change a study definition, or alter geometry. Other specimen views receive no new content.

The sequence is the typical anatomical route: collecting ducts open at a renal papilla → minor calyx → major calyx → renal pelvis → ureter. [NCI SEER kidney anatomy](https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html) and [ureter anatomy](https://training.seer.cancer.gov/anatomy/urinary/components/ureters.html) support this conceptual order. The source parts do not establish an individual route: letters, proximity, contact, and shells cannot be used to pair a papilla with a calyx or establish a continuous lumen. No flow animation is provided.

| Side | Papilla | Minor calyx | Major calyx | Pelvis | Ureter |
| --- | ---: | ---: | ---: | ---: | ---: |
| Left | 11 | 10 | 4 | 1 | 1 |
| Right | 10 | 10 | 3 | 1 | 1 |

Counts are supplied source parts, not branch counts. The collecting-only studies display minor calyces, major calyces and pelvis. Papillae and ureters exist in the retained source but are outside those particular views. The left papilla/minor-calyx asymmetry is retained without explanation or repair. Each stage discloses its exact source IDs on request.

Rendering is gated by an exact match to the HRA definition, including source version and licence, display frame, delivery bundle, retained surfaces and study boundaries. Source-only test coverage verifies these counts and IDs, off-study markings, closed server rendering, and non-renal absence. The three held surfaces—left outer cortex, right renal columns and left vein—remain excluded. The original female reference and CC BY 4.0 attribution remain in the existing source panel. This is draft teaching, not a clinical, device, registration or deployment approval; radiologist review remains revision-bound.

# Thorax respiratory-layer study draft

The Thorax study library now offers three focus-only views: all four supplied
respiratory-wall identities, the three intercostal identities together, and the
diaphragm alone. Selecting or hiding a source surface uses the existing
visibility controls; Undo and Redo restore prior study states. Left and right
filters both retain these records because the source labels each compound
surface `midline`, rather than providing separate sided entries.

| Identity | Retained source files |
| --- | --- |
| External intercostal, FMA9756 | FJ1451, FJ1451M |
| Internal intercostal, FMA9757 | FJ1455, FJ1455M |
| Innermost intercostal, FMA9758 | FJ1454, FJ1454M |
| Diaphragm, FMA13295 | FJ3131 |

All four entries remain in the existing `thorax-muscles` bundle. Runtime focus
availability checks exact target ID, FMA ID, bundle ID, node name and source-file
hashes. The study-library test also pins the bundle hash and checks missing,
duplicate and changed target records. There is no new mesh, transformation,
intercostal-space division, diaphragm subdivision or breathing animation.

The prompts are short identification and comparison drafts. The source surfaces
and their spatial relationships are not anatomically validated; revision-bound
radiologist review is required before clinical or learner-release approval.
Background anatomy references: [TTUHSC thoracic muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html)
and [NCBI Bookshelf diaphragm anatomy](https://www.ncbi.nlm.nih.gov/books/NBK538321/).

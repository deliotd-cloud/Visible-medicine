# Ophthalmic-nerve source study views

Draft, 24 September 2026. These two Head & neck and Whole body Dissect focus
views select only already admitted BodyParts3D v4 surfaces. The full body
catalogue supplies exact FMA identity, FJ file and SHA-256 source bindings;
`content/ophthalmic-nerve-studies.ts` records them for both sides. Every selected
target and context surface is checked before the focus displays. A missing,
duplicate or changed binding hides the focus rather than falling back to a
similar name. Both, Left and Right retain side filtering, Remove and Undo.

| Focus | Target source labels, on each side | Separate context |
| --- | --- | --- |
| Frontal & lacrimal | Frontal, supra-orbital, supratrochlear, lacrimal nerves | Lacrimal gland |
| Nasociliary | Nasociliary, anterior and posterior ethmoidal, infratrochlear, long ciliary, and communicating branch to ciliary ganglion | Ciliary ganglion |

The [Texas Tech University Health Sciences Center El Paso eye tables](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html)
place frontal and lacrimal nerves under the ophthalmic division (V1), name
supraorbital and supratrochlear as frontal branches, and list the selected
nasociliary branches.
The [institutional eye lab manual](https://anatomy.ttuhscep.edu/nervous_system/eye.html)
also teaches frontal, lacrimal and nasociliary identification in the orbit.
These references support a conventional teaching grouping; they do not validate
the boundaries, continuity or endpoints of this donor-derived surface set.

The admitted catalog supplies separate left and right supra-orbital nerve
surfaces (FMA52657/FJ1325 and FMA52656/FJ1376), now selected in the frontal
view. The lacrimal gland and ciliary ganglion are context,
not target nerve branches. The source display does not establish a complete CN V,
physiological sensory function, parasympathetic fibre route, patient-image
registration, a procedure or clinical approval. Relationships and source
geometry require revision-bound radiologist review.

Focused check: `npm run ophthalmic-nerve-studies:test`. It checks exact admitted
bindings, side scopes, missing/duplicate/changed sources, and Remove/Undo.

## Supra-orbital correction and browser sample

The original V1 view incorrectly described the supraorbital surfaces as absent.
The current catalogue uses the spelling `supra-orbital`; both exact admitted
sources are now included. There are 20 target and four context bindings across
the two views. The historical projection retains the original hashes only to
verify earlier recipes, including the now-corrected omission text.

On 24 September 2026 the local head/neck viewer rendered the frontal/lacrimal
view with 10/10 loaded entries, then 5/5 after selecting Left. Searching
`supraorbital` found the neural window, orbital window and corrected V1 focus;
global search for `left supraorbital` found the exact left source. Selecting it,
Remove and drawer Undo restored the five-entry focus. The desktop view was
visually inspected. This sample does not establish anatomical correctness,
physical-device acceptance or complete browser coverage.

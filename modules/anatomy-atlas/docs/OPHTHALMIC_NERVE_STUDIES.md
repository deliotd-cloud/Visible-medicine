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
| Frontal & lacrimal | Frontal, supratrochlear, lacrimal nerves | Lacrimal gland |
| Nasociliary | Nasociliary, anterior and posterior ethmoidal, infratrochlear, long ciliary, and communicating branch to ciliary ganglion | Ciliary ganglion |

The [Texas Tech University Health Sciences Center El Paso eye tables](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html)
place frontal and lacrimal nerves under the ophthalmic division (V1), name
supratrochlear as a frontal branch, and list the selected nasociliary branches.
The [institutional eye lab manual](https://anatomy.ttuhscep.edu/nervous_system/eye.html)
also teaches frontal, lacrimal and nasociliary identification in the orbit.
These references support a conventional teaching grouping; they do not validate
the boundaries, continuity or endpoints of this donor-derived surface set.

The admitted catalog has no separate supraorbital-nerve surface, so the frontal
view names that omission. The lacrimal gland and ciliary ganglion are context,
not target nerve branches. The source display does not establish a complete CN V,
physiological sensory function, parasympathetic fibre route, patient-image
registration, a procedure or clinical approval. Relationships and source
geometry require revision-bound radiologist review.

Focused check: `npm run ophthalmic-nerve-studies:test`. It checks exact admitted
bindings, side scopes, missing/duplicate/changed sources, and Remove/Undo.

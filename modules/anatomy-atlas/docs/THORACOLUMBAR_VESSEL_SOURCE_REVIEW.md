# Thoracolumbar vessel source screen — 17 September 2026

Six original BodyParts3D v4 IS-A sources were checked against the current
1,103-entry display catalogue. **No new mesh is yet admitted.** The four subcostal
surfaces remain candidates for a source-preserving regional extension; the two
ascending lumbar veins are held for source laterality adjudication.

## Exact findings

| Official identity | Complete file | Triangles | Source-side result / disposition |
| --- | --- | ---: | --- |
| FMA4634 right subcostal artery | FJ1967 | 1,526 | 708 unique vertices right,57 left. Small cross-midline portion; candidate, not a side-swap finding. |
| FMA4654 left subcostal artery | FJ1977 | 1,334 | All669 unique vertices left; candidate. |
| FMA4844 right subcostal vein | FJ1995 | 1,266 | All635 unique vertices right; candidate. |
| FMA4951 left subcostal vein | FJ1987 | 978 | All491 unique vertices left; candidate. |
| FMA4843 right ascending lumbar vein | FJ3589 | 7,884 | All3,944 unique vertices on the **left**; held. |
| FMA4950 left ascending lumbar vein | FJ3493 | 1,772 | All888 unique vertices on the **right**; held. |

Negative source X is right in the established body frame. The ascending-vein
bounds are wholly opposite their labels: FJ3589 X11.803…25.2278mm and FJ3493
X−27.5776…−7.20017mm. Do not swap labels, mirror, move, concatenate or use a
group alias to bypass these holds. Shape and proximity alone cannot settle which
source label should have been assigned.

All six have one closed oriented component under exact-coordinate combinatorial
checks, no duplicate/collapsed/degenerate faces, no boundary/nonmanifold edges or
winding inconsistencies. Together they contain14,760 triangles; the four
subcostal candidates contain5,104. None is an existing direct IS-A owner or an
exact represented geometry fingerprint in the retained cross-tree inventory.

The [full report](thoracolumbar-vessel-source-audit.json) records complete
definitions, archive CRC/size checks, SHA256, geometry fingerprints, topology,
bounds, side counts, prior source-hold evidence, all-catalogue bounds screening,
and286 detailed source comparisons. No exact shared triangles or similar
translated-shape flags were found. Neither direction of a sampled comparison
has25% or more samples within0.25mm. These are bounded diagnostics—not proof of
absence of self-intersection, tissue interpenetration or shared donor identity.

## Cross-midline and contact are not the same as reversed laterality

All57 positive-X vertices of the right subcostal artery lie within1.425mm of the
existing **abdominal-aorta-labelled** surface FMA3789 (median0.852mm). That is
consistent with a short proximal crossing, but does not adjudicate the displayed
thoracic/abdominal aortic boundary or prove a vessel junction/continuous lumen.
The report preserves the strict whole-half-space flag as false; it is not
silently changed into a clinical laterality approval.

Subcostal arteries and veins are close to one another and to their corresponding
twelfth ribs. At the2mm diagnostic threshold, sampled left vein→artery and
right vein→artery proximity reaches89% and70%; left/right vein→same-side rib
reaches86%/65%. Such adjacency can be expected but still needs surface/visual
review before a new rendered dissection is accepted. Closed source end caps do
not imply continuous patent vessels; retain them rather than invent bridges.

## Source scope and teaching references

The [publisher's subcostal artery reference](https://www.elsevier.com/resources/anatomy/cardiovascular-system/arteries/subcostal-artery/21248)
describes paired aortic branches associated with the twelfth-rib region and
abdominal-wall supply. Its [right subcostal vein reference](https://www.elsevier.com/resources/anatomy/cardiovascular-system/veins/right-subcostal-vein/19570)
supports the regional venous context. These are factual reading references only:
no publisher mesh, illustration, table, screenshot or copied teaching is used.

The [2026 human cadaver study](https://pmc.ncbi.nlm.nih.gov/articles/PMC13340972/)
examined30 sides in15 cadavers and documented variability in ascending-lumbar
extent, valves and septa. Do not teach an invariant uninterrupted, valveless or
bidirectional collateral route. This paper does not identify or validate the
BodyParts3D donor surfaces, and cannot correct their opposite-side labels.

Original geometry/index-derived evidence retains **CC BY4.0** with the required
credit: BodyParts3D, © The Database Center for Life Science licensed under CC
Attribution4.0 International. [Official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html),
[licence terms](https://creativecommons.org/licenses/by/4.0/). The permitted
commercial-reuse grant was rechecked. The only adaptation here is calculated
diagnostic data; no source geometry is modified. No paid service, dependency,
font, texture, patient data or new runtime asset is introduced.

## Reproduce and proceed

`node scripts/audit-thoracolumbar-vessels.mjs --check` replays the report against
retained original sources and the explicit baseline. `--fetch` retrieves the six
official candidate files with archive CRC/size verification when needed; it is
not a runtime import. Initial recording refuses to overwrite existing evidence.

Next: carry the two exact held definitions and their aliases into any proposed
export/admission guard, preserving earlier source-hold history. Inspect/render
the four candidates with same-source rib/aortic/azygos context, then use exact
source-preserving export, identity/geometry tests, browser/side/dissection tests
and revision-bound owner review. Do not ship all six because topology passed.
Anatomical contact/attachments, aortic boundary terminology and clinical
acceptance remain distinct decisions. No source is clinically approved here.

# Colonic source dissection — local review, not admission

17 September 2026. Baseline Atlas a915f17a. This audit partitions the existing
large-intestine display into its six retained source files. It does **not** add
six new anatomical segments, alter the public model or grant clinical approval.
The existing Bowel components panel now explains the relevant limitation inside
its collapsed Scope & controls section, without adding primary controls.

## Source and shape findings

Both official BodyParts3D 4.0 source hierarchies give the following singleton
labels. All raw OBJ hashes, canonical geometry fingerprints, original ownership,
coordinate frame and parent-bundle bytes were checked. Rectum FJ2571 and junction
FJ2599 retain their separate root owners and are not reinserted here.

| File | Source label | Triangles | Exact-coordinate connected components |
| --- | --- | ---: | ---: |
| FJ2566 | Ascending colon, FMA14545 | 3,310 | 1 |
| FJ2572 | Transverse colon, FMA14546 | 3,472 | 1 |
| FJ2567 | Descending colon, FMA14547 | 5,588 | 1 |
| FJ2569 | Taenia mesocolica, FMA15042 | 13,342 | 191 |
| FJ2570 | Taenia omentalis, FMA15043 | 15,922 | 37 |
| FJ2568 | Taenia libera, FMA15044 | 15,244 | 122 |

The three colon files each pass the closed, oriented manifold diagnostic. This
does not establish a lumen, wall thickness, tissue layer or clinically accurate
boundary. The taenia files have disconnected mesh components, not corresponding
anatomical subdivisions. Mesocolica also contains two degenerate faces and three
non-manifold edges. No automatic repairs, smoothing or connectors were applied.
There are no identical triangles shared between different files; this does not
rule out near-coincident surfaces or self-intersections.

Visual inspection of all six isolated surfaces and the assembled model shows
that FJ2567 includes a curved distal section. It is therefore held for review of
the descending/sigmoid extent; neither a new sigmoid label nor a segmentation
boundary is inferred from shape alone. In normal anatomical teaching the
descending and sigmoid colon are distinct regions, and the taeniae are
longitudinal muscle bands: [OpenStax, small and large intestines](https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines).
That reference is an anatomical cross-check, not validation of this mesh.

## Exact preservation and failure investigation

Rebuilding the source geometry reproduced every oriented position triangle, but
not all stored shading normals. The initial assertion correctly failed. The
final partition uses exact oriented source-position membership to copy original
parent attributes instead. No tolerance was relaxed to pass that assertion.

All **56,878** original triangles, winding and normals match the six-part union
exactly, including after GLB export and reload. Multiplicity is preserved. Missing
or ambiguously owned triangles are rejected. The parent has an identity world
transform; the established catalogue frame is retained. Parent catalogue and
bundle hashes are rechecked after generation. Complete proof, bounds, aliases and
topology are in [the generated source audit](colonic-components-source-audit.json).

## Reproduce and inspect

From the Atlas checkout:

```sh
node scripts/audit-colonic-components.mjs
node scripts/audit-colonic-components.mjs --check
node scripts/review-colonic-components.mjs
```

The audit uses the existing verified public-source OBJ cache, not patient data.
The review script uses an available Playwright installation; when it is supplied
by the workspace runtime, set `PLAYWRIGHT_MODULE` to that module's file URL. It
does not install a paid service or add a runtime dependency to the website.

Open `.local/colonic-components-review/review.html` in a WebGL-capable browser.
It is self-contained, labelled **review only**, and needs no model upload. Select
one source file, show all, rotate, choose anterior/posterior/left/right, or spread
and restore the surfaces. Separation is explicitly non-anatomical. Left and right
follow the catalogue's X-left convention, not screen position. The 390px layout
was checked for horizontal overflow; this is not physical-device acceptance.
Expanded bounds are kept in frame, including at full separation in desktop and
mobile-width checks; this refits the camera without changing the mesh vertices.

The review script saves screenshots and `visual-check.json` in that directory.
The diagnostic GLB is `.local/colonic-components-prototype/colonic-components.glb`.
These are ignored local artifacts, not published model-delivery inputs. The
review generator and audit are source-controlled; recovery receipts identify
the separately copied D-drive artifacts.

## Required review before finer anatomical segmentation

1. Decide the intended anatomical extent of FJ2566/FJ2572/FJ2567 against the
   supplied parent, especially the distal FJ2567 portion. Record exact
   source-bound boundary decisions; do not merely rename the file.
2. Assess taenia locations, extent and continuity. Determine whether the source
   surfaces are usable as draft visual bands or need a reviewed replacement.
   A mesh component count is not a count of real muscle parts or physical gaps.
3. If a derivative is approved, preserve source provenance and original parent;
   create revision-bound child IDs, review bindings and teaching. Confirm
   parent/children are not rendered twice. Add dissection/navigation tests and
   the controlled asset-delivery entry before activation.

These decisions hold this subdivision only. Other regional anatomy, teaching
and interaction work can continue under the full existing goal. CT-head masks,
patient cases, clinical PACS and imaging registration remain untouched.

## Rights and release

The existing [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
permits commercial reuse under CC BY 4.0 with attribution. The diagnostic retains
the required DBCLS credit and describes recolouring/separation; Three.js retains
its MIT notice. No publisher image or text extract was bundled. No source licence,
paid dependency, font or subscription was introduced. See THIRD_PARTY_NOTICES.

No new website deployment, clinical sign-off or patient release is claimed. The
existing two-model authenticated staging gate remains unchanged. This audit is
not a reason to bypass that gate or re-open completed native MRI synthetic QA.

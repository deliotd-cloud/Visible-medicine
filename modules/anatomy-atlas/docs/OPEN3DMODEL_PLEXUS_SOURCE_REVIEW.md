# New brachial plexus source acquisition — 3 October 2026

Status: **original archive obtained and inventoried offline; no asset admitted**.
This is a new alternative to the held SPARC and Cevallos leads, not a licence
change to the existing 1,104-root Atlas. No website or clinical desktop changes.

## Source-matched bone context — v7 checkpoint

The alternative now has an optional, default-off **Bone context** overlay:
the original `Humerus.r`, `Scapula.r.` and `Clavicle.r` from the same upper-limb
OBJ. All three preserve exact source coordinates, names and polygon boundaries;
their deterministic triangulation is bound to the separate
[context audit](open3dmodel-plexus-context-audit.json). No smoothing, scale,
mirroring, guessed FMA identity or source-to-body registration is applied.
The humerus has 4,224 nonplanar quads; tessellation does not certify its surface.

The original 42 neural objects and eight held entries match the v5 scene exactly.
Context bones never enter nerve search, selection, raycasting, labels or exported
nerve observations. They are faint ivory spatial context, hidden during isolate
and switched off by Reset. Framing remains nerve-focused; zoom out to inspect
the long humerus. A shared viewer/server validator refuses malformed geometry,
changed scope, duplicate identities or context promoted to a neural selection.

Final local candidate and report:
`E:/VisibleMedicine-LocalStaging/20261003-plexus-conversion-v7/`.
Report SHA-256:
`64e267450fa2d8d7c7c09f1a483133549bfb3cd5e800c95beec19f6d3cce15be`.
Earlier v5/v6 evidence remains intact. The source-matched context is an aid to
clinical inspection, not proof that the depicted plexus-to-bone relationships
are correct. The three added model derivatives remain CC BY-SA 4.0; their changes
are disclosed in the preview notices, independently of MIT application code.
No candidate geometry is admitted to the 1,104-root learner atlas or hosted site.

Nineteen focused source, context, tessellation, camera, label and loopback-server
tests pass. Actual desktop checks at 1280 × 800 confirm rendering, context
on/off, exclusion from nerve choices, isolation and Reset. Download-file and
reduced-motion browser checks from the earlier checkpoint remain unverified.
No clinical approval, publication or off-device backup is inferred.

## Earlier conversion and review checkpoint

The offline v5 candidate converts **42 of 50 neural objects**, including **all
15 core objects**, with exact original vertex coordinates. Eight entire objects
remain held: three radial cutaneous branches, medial brachial cutaneous nerve,
the axillary superior-lateral cutaneous object, ulnar palmar/dorsal cutaneous
objects and lower subscapular nerve. Repeated coordinates, invalid projected
polygons, a nonplanar 12-sided face or zero polygon area are recorded per face.
No face was deleted to make an object pass. The original inventory remains
unmodified; its statement that no conversion was applied describes acquisition.

Triangulation checks source perimeter edges, winding, area, internal edges and
N−2 triangles. Nonplanar quads are disclosed deterministic display adaptations,
not proof of a unique original surface. All 42 converted objects pass the
combinatorial closed/oriented-manifold diagnostic. Multiple disconnected
components remain in many named objects (including three in each division
group and ten in the suprascapular object): this does **not** establish branch
continuity or anatomical correctness. Raw units remain unknown; diagnostic
areas/volumes are explicitly source-unit quantities, not millimetres.

Originals and earlier conversion evidence are preserved on E:. Final report:
`E:/VisibleMedicine-LocalStaging/20261003-plexus-conversion-v5/conversion-report.json`
SHA-256 `a52e44470c920932f708c9f8773fa08f9c5b0eb0598645f49fa8b400fe75c3ca`.
It binds exact OBJ/ZIP, named source geometry, conversion and preview code.
The preview manifest separately pins every delivered byte. None of the raw
geometry, rendered scene or observation notes is committed to this repository.

Local setup from the Atlas checkout (existing installed dependencies required):

```powershell
node scripts/build-open3dmodel-plexus-review.mjs --preview
node scripts/build-open3dmodel-plexus-review.mjs --check
node scripts/serve-open3dmodel-plexus-preview.mjs
```

The first command only creates new output; it refuses to replace a stale report
or existing preview asset. The second replays exact conversion/implementation
bindings. The server prints a loopback-only URL and serves four manifest-bound
files, never the source folder, scans, masks, authentication or Review database.
Host/origin, raw-path traversal, linked/tampered assets and write methods fail
closed. Hashes protect against accidental changes, not a malicious local admin.

Desktop browser checks cover actual rendering, source search, core/branch
visibility, isolation, fade, six source-axis controls, corrected branch-to-core
Reset, and left/right projected label gutters. Camera presets use eased
quaternion arcs, not straight lines through the object; reduced motion skips
travel. Axis labels intentionally do not claim anatomical orientation. Sixteen
focused parser/geometry/camera/label/server tests pass. Symlink creation is not
available in this Windows test environment; the gate exists, but that negative
test branch was not exercised. Browser blob-download observation timed out;
the UI reports only a **download request**, not verified saved notes. Actual
download-file and reduced-motion browser acceptance remain to be checked.
The initial v4 browser failure is preserved: an early RAF timestamp produced
negative progress and stopped the loop. v5 clamps progress to [0,1], tests the
early/late/interrupted clock cases, and exposes animation failures rather than
leaving a misleading ready state. Branch-to-core Reset is also corrected.

This independent-source preview is a candidate observation tool, not the
clinical approval area. Exported drafts explicitly carry source/object/scene/
report hashes and `approval:false`, `clinicalApproved:false`, `admissions:0`.
No FMA ID, left-sided anatomy, body transform or imaging link is inferred.
Before integration, the radiologist must inspect naming, grouped divisions,
junctions, disconnected components, boundaries and held objects; separately
establish units/orientation, rights lineage and a reviewed source-to-body map.
Approval must bind the exact derivative and mapping, not merely this source
licence or a passing test. Existing learner assets and live site are unchanged.

## Exact source and rights

The original [Open3DModel source page](https://anatomytool.org/open3dmodel-create)
places a CC BY-SA 4.0 link beside its July 2025
[upper-limb OBJ archive](https://caskanatomy.info/open3dmodelfiles/upper-limb/upper-limb-obj.zip)
and permits derivative hosting. The original [provenance page](https://anatomytool.org/open3dmodel-about)
describes newly modelled limb nerves in a LUMC-led anatomical project built on
BodyParts3D/Z-Anatomy. Credit must retain the [project team](https://anatomytool.org/open3dmodel-credit)
and relevant upstream contributors, not imply institutional endorsement.

The archive was downloaded without payment to
`E:/VisibleMedicine-LocalStaging/20261003-open3dmodel-plexus/`. It contains one
`upper-limb.obj`, no supplied material library or texture. Original pages and
files remain hashed there; the bounded [inventory](open3dmodel-plexus-source-inventory.json)
records exact ZIP/OBJ SHA-256 values and 50 source neural object identities.
Direct web-tool page requests failed; ordinary HTTPS requests obtained the
original pages. No mirror licence label substitutes for this evidence.

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)
allows commercial use without a licence fee, but is not MIT/CC0. Before delivery:
retain source/creator/licence/disclaimer credit and change history; distribute
model adaptations under the same licence; do not restrict recipients' licensed
reuse through conflicting terms or DRM. Review database-level ShareAlike scope
before substantial integration. Keep this as a separately licensed model
package; do not relabel its geometry MIT. Independent paid courses remain
separate products, not a mechanism for restricting the model's reuse rights.
This is a technical licensing screen, not legal certification.

Do not bulk ingest this site's other archives: its source page explicitly
identifies non-commercial upstream material in some thorax resources. No GPL
viewer code, publisher figures, texture, font, scan or private Review record was
imported. Existing renderer/dependency licences stay unchanged.

## New anatomical evidence and remaining gates

The original OBJ contains 532 objects. Fifty source names identify neural
objects, including these 15 core-labelled items:

- C5–C8 and T1 roots: five separate source objects.
- Superior, middle and inferior trunks: three separate source objects.
- Anterior divisions and posterior divisions: **two grouped source objects**, not
  six independently established divisions.
- Lateral, medial and posterior cords: three separate source objects.
- Medial and lateral roots of the median nerve: two separate source objects.

Named additional branches include suprascapular, long thoracic, dorsal scapular,
subscapular and pectoral nerves; terminal/digital objects have their exact source
labels retained. Some distal objects lack an explicit `.r` suffix. Source naming
is not proof of complete innervation, correct borders or functional continuity.

Every indexed position is finite and every face position index valid. The 50
selected objects have no cross-object position references. They contain 3,624
triangles, 96,516 quads and one 12-sided polygon. No triangulation, repair,
mirroring or coordinate transform was applied. This inventory is **not** a
manifold/intersection/branch-continuity test. OBJ units and registration are not
independently established; no distance is represented as millimetres.

Acquisition plan, with current disposition:

1. Preserve source object boundaries in a deterministic converter. Explicitly
   validate the 12-sided face and every tessellation; do not blindly fan-fill it.
   **Implemented offline**; the nonplanar 12-sided source face is held.
2. Prepare an **independent-source, right-sided candidate review**. Confirm units,
   orientation, grouped divisions, branch labels and junctions from several views.
   **Preview prepared**; clinical/source-frame confirmation remains pending.
3. Obtain revision-bound radiologist review of actual geometry/identities. Do not
   assign guessed FMA IDs, split group objects, or infer an observed left side.
4. Only after rights/geometry gates pass, generate a separately credited asset
   package and reviewed source-to-body mapping. No guessed whole-body fit, CT/MRI
   correspondence, imaging approval or exam admission follows from acquisition.

`node --test scripts/test-open3dmodel-plexus-source.mjs` checks the pinned metadata
and current non-admission. The E: `inventory.mjs` replay validates the original
OBJ indexes/coordinates without exporting geometry. All learner selections,
teaching, guided tours and controls remain unchanged while this source is offline.

## Author request and other alternatives

### Additional alternative screen — 3 October 2026

The owner's request to find an acceptable alternative does not authorise
relaxing the commercial-rights or clinical gates. Open3DModel remains the
preferred acquired **candidate**, not a clinically accepted replacement: its
exact upper-limb archive, separate named objects and source-matched bone context
provide more inspectable evidence than an unlicensed demonstration video.
Commercial use is compatible with its declared CC BY-SA 4.0 grant only if
attribution, change notices, ShareAlike and permitted recipient reuse are
preserved. This is not an unrestricted MIT/CC0 asset or a completed provenance
clearance. Existing eight object holds and registration limitations remain.

Two further primary-source listings were checked without importing assets:

- [Colorado State University: Kaitlin Napoli, The brachial plexus 3D
  educational model (2024)](https://mountainscholar.org/items/28b235cf-1827-489e-9c6b-d952bb33c50d/full)
  exposes a thesis PDF, not a verified mesh archive. Its item metadata declares
  copyright/related-rights protection and requires permission for other uses.
  The repository's submission `license.txt` is not treated as an end-user
  commercial redistribution grant. **Not an acceptable downloadable mesh on
  current evidence; no file imported.**
- [Commons: Brachial plexus 2.svg](https://commons.wikimedia.org/wiki/File:Brachial_plexus_2.svg)
  declares a worldwide public-domain release by the derivative authors and
  records its 1918 Gray's Anatomy source. This is a possible **2D teaching
  reference**, not 3D geometry, branch-boundary evidence or an imaging
  registration source. No SVG, font or other media was downloaded or admitted.
  Before any future import, pin and inspect the actual SVG, check embedded
  resources/fonts and obtain revision-bound anatomical review; do not infer
  unobserved depth by converting a diagram into a supposedly accurate mesh.

The Cevallos request remains drafted but unsent. No response, new permission,
clinical approval, learner admission or website publication is inferred from
this additional search. Independent Atlas development can continue while
candidate review is outstanding.

The owner authorised contacting Cevallos et al. The publisher contact was
verified and a scoped commercial mesh/branch/units/permission request drafted on
E:. **Not sent**: no email account is connected. This new source can be pursued
without waiting for that request; it does not manufacture an author response.
The previous [source decision](BRACHIAL_PLEXUS_SOURCE_REVIEW_20260928.md) remains
historical evidence, with its licence and anatomy gates intact.

The original [Thingiverse](https://www.thingiverse.com/thing:5226717)/[Thangs](https://thangs.com/designer/DaveMakesStuff/3d-model/16-Piece%20Full%20Size%20Brachial%20Plexus%20Model-47926)
16-piece listing remained inaccessible; conflicting
mirror labels were not accepted. Sketchfab candidate pages were inaccessible and
not cleared. The [Commons spinal-cord/roots STL](https://commons.wikimedia.org/wiki/File:Spinal_cord_and_nerves.stl)
declares CC BY 4.0 but does not establish a labelled plexus replacement.
[Z-Anatomy's repository](https://github.com/Z-Anatomy/Models-of-human-anatomy) acknowledges mixed
upstream restrictions, so its whole bundle is not blanket commercial clearance.
No asset from these alternatives was imported.

# Brachial plexus surface proximity review

This offline review compares the 42 converted neural objects in the existing
Open3DModel right upper-limb candidate. It helps the radiologist investigate
source boundaries and possible junctions before deciding whether any object is
suitable for the Atlas. It does not add learner anatomy or approve the candidate.
The eight held objects and the original v7 preview remain unchanged.

## Current inspection evidence

The saved report contains 861 object-pair queries and 84 grouped-component
comparisons, all with numerically verified witnesses. There are 148 edge-connected
components across the 42 objects; 24 objects have more than one component.
Both grouped division objects contain three diagnostic components. None is
assigned an individual anatomical division name.

Independent inspection checked all 1,890 witness points against the original
v7 triangles, the 861 unique pairs, component membership and eight held
identities, with no numerical failures. These checks do not settle whether the
surfaces represent valid anatomical boundaries or continuous nerves. The exact
measurement report SHA-256 is
`5c953975449645512afbe013ef13b4cc922d253c45a3a379a1c71c548bcbf125`.

## Open the measurements

Open the generated local file
`F:/VisibleMedicine/staging/20261012-plexus-proximity/review/index.html`.
The search field filters pairs by source name or result text. Each pair has a
folded witness showing original triangle indices and source coordinates. The
adjacent `proximity-report.json` contains full precision, exact source hashes,
component membership and all query results.

Use the existing v7 3D candidate alongside the measurements:

```powershell
node scripts/serve-open3dmodel-plexus-preview.mjs
```

Open the loopback URL printed by that command. Search the exact source name,
rotate using the six raw-axis presets, and optionally enable Bone context.
Those axes are not confirmed anatomical directions. The source-matched bones
remain separate context, not nerve selections or registration landmarks.

## Read the results

Each unordered neural-object pair is queried against its complete triangulated
surfaces using Float64 positions and indirect bounding-volume hierarchies.
There is no vertex sampling, source translation, smoothing or scale fitting.
The tool checks whether the returned witness points lie on the reported original
triangles and whether their separation agrees with the reported distance.
All distances are in **unknown source units**, not millimetres.

A verified witness is a numerical consistency result, not proof of an anatomical
junction or a formal proof of a global minimum. A zero separation may represent
touch, overlap or crossing; a positive separation does not establish correct
boundaries or absence of containment. Library results with invalid witnesses
remain explicitly unresolved. Coplanar triangles can produce this condition;
the tool does not repair or silently omit them.

Disconnected-object lists use faces joined by complete edges at exactly equal
coordinates. Point contact alone does not join components. The grouped anterior
and posterior division objects also have component-to-core comparisons. These
component numbers are diagnostic mesh identifiers, **not** named individual
divisions or assigned superior/middle/inferior trunk continuations.

## Clinical inspection

For each candidate structure, inspect its actual surfaces from several views and
record the exact object name, source face or component and report revision with
your finding. Prioritize root-to-trunk boundaries, grouped divisions, cords,
median roots and terminal branches. Decide whether apparent separation,
coincidence, crossing or disconnected tissue reflects intended source boundaries
or a problem needing correction. Do not infer individual divisions from a
nearest-neighbour ranking alone.

Source units, orientation, named boundaries, completeness, source rights lineage
and any future body fit still need separate adjudication. Existing candidate
observation exports remain drafts, not clinical approval. Neither these
measurements nor a future anatomy decision establishes patient-space CT/MRI
registration, bilateral coverage or suitability for nerve-block instruction.

## Reproduce the report

From the Atlas checkout, with the existing dependencies and migrated source cache:

```powershell
node --test scripts/test-open3dmodel-plexus-proximity.mjs scripts/test-open3dmodel-plexus-proximity-packet.mjs
node scripts/audit-open3dmodel-plexus-proximity.mjs
node scripts/audit-open3dmodel-plexus-proximity.mjs --check
```

The first audit creates new local JSON and HTML files without replacing existing
outputs. Check mode replays the original source hashes, v7 scene/report,
implementation and dependency hashes, measurements and readable report. A stale
file fails rather than being silently recaptured. Keep earlier evidence when
changing the implementation; use a deliberately new versioned output location.
The audit accepts no arbitrary source or destination path and never writes into
learner export directories.

The inputs are the original upper-limb OBJ/ZIP, source inventory and v7 report
`64e267450fa2d8d7c7c09f1a483133549bfb3cd5e800c95beec19f6d3cce15be`,
with scene
`37b3035a173269533e17e8d97a24d001b13e03c4adad2840a655e3dfd4b2af94`.
The report binds the exact installed geometry-library builds as well as code.

## Rights and delivery

The retained [source review](OPEN3DMODEL_PLEXUS_SOURCE_REVIEW.md) records the
publisher's CC BY-SA 4.0 grant, credits, change notices, ShareAlike and recipient
reuse obligations. These model derivatives do not become MIT assets because the
diagnostic code is MIT. This pass imports no new model, font, texture, image,
dataset, library or paid service. Raw geometry and measurement derivatives stay
in local staging; only diagnostic source code, tests and this guide enter Git.
No website route, accepted scan/mask, clinical PACS, entitlement or release
approval changes. Browser/GPU acceptance of the new report remains separate from
the automated checks.

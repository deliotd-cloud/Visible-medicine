# Female urinary junctions: source review, not runtime admission

17 September 2026. The existing 41-surface female pelvic and 82-surface renal
studies remain unchanged. This investigation found two potentially useful
ureteric-orifice surfaces in the same official female source. It does not add
unique ureters: both ureters are already present in the renal study.

## Source and rights

Original [HRA United Female v1.10 GLB](https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/assets/3d-vh-f-united.glb),
374,505,632 bytes, SHA256
`95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422`.
The [metadata](https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/metadata.json)
and [crosswalk](https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.10/assets/crosswalk.csv)
are separately SHA-pinned in the audit and existing source helper.

Credit: Kristen Browne and Heidi Schlehlein. 3D Reference Organ Set for Female,
v1.10. HuBMAP, 2026. Based on the NLM Visible Human Dataset.
Existing [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) attribution
and change notices are retained in the local derivative. No additional model,
font, image, service or dependency is installed; existing Three.js MIT text is
embedded in the self-contained review. This is not an assertion of clinical
validity or clearance of unrelated third-party rights.

## Reproducible findings

| Source node | Source identity | Triangles | Surface boundaries |
| --- | --- | ---: | ---: |
| 712 | Right ureteral orifice / FMA15939 | 180 | 30 edges |
| 713 | Left ureteral orifice / FMA15940 | 194 | 42 edges |

Both are source-labelled **surfaces**, not reconstructed lumen volumes. Each
has one connected component and no detected duplicate/degenerate faces or
nonmanifold edges/vertices in the exact-coordinate topology screen. They retain
their source normals, face order, positions and ancestor identity transforms.
The ten reviewed surfaces share no exact triangles with one another. That is
not a global ownership check against the complete original or runtime inventory.

Bidirectional bounded vertex-to-triangle sampling is recorded, not converted
into a pass/fail percentage intended for whole structures. Right-orifice to
right-ureter median distance is approximately 2.764 mm; left is 1.009 mm.
These are surface-sample medians, **not junction gaps or minimum distances**.
Thirteen of the 118 left-orifice vertices lie within 0.25 mm of the supplied
left ureter. No sample count establishes lumen continuity.

A separate original-face intersection screen tests both orifices against their
ipsilateral ureter, bladder dome and base; the orifices against each other; and
each orifice against itself excluding shared-coordinate-vertex pairs. It finds
five left-orifice / bladder-base triangle pairs: four orifice faces (72, 73, 74,
119) and three base faces (14091, 24460, 24461), all zero-based. The other eight
listed pair tests return zero hits. Five pairs are not five distinct defects;
touch versus penetration and clinical acceptability are unresolved. Floating
predicates do not prove absence of all intersections, containment or continuity.

The recorded name screen examines every original GLB node using its explicit
regex. Matches include ureters/orifices and **internal pudendal veins**, not a
verified pudendal nerve or pelvic-floor muscle source. This is a names-only
screen, not an exhaustive search of anatomical synonyms or external datasets.
Do not fill female-source gaps with male BodyParts3D meshes or infer new nerves.

## Local review and reproduction

Keep the SHA-verified official release outside the public runtime. From the
Atlas checkout, supply the directory containing GLB, metadata and crosswalk:

```sh
node scripts/audit-hra-urinary-junctions.mjs --check --source=PATH_TO_RELEASE
node scripts/audit-hra-urinary-contacts.mjs --check --source=PATH_TO_RELEASE
node scripts/review-hra-urinary-junctions.mjs --source=PATH_TO_RELEASE
```

The first two reproduce the committed reports without overwriting them. Their
`--record` mode refuses an existing report. The review generator uses existing
esbuild/Three.js and Playwright; `PLAYWRIGHT_MODULE` may point to the configured
bundled Playwright module when it is not locally installed. It writes ignored
`.local/hra-urinary-review/review.html`, screenshots and `verification.json`.
Open that self-contained HTML locally; it requires no server or patient data.

Review controls: both junctions, left/right close-ups, fit all visible, five
camera directions, ten source visibility switches, context opacity and orbit.
Optional magenta overlays identify the exact detected contact faces, displayed
through other surfaces with that effect explicitly disclosed. They do not move
the anatomy. A close-up can frame out long ureter portions; no geometry is cut.
Bladder base/dome retain identical official labels with source-name suffixes.

Actual browser checks cover every focus/view preset, all switches, opacity,
orbit, contact overlays, a 390px layout, and exact rendered positions/normals/
indices plus identity transforms after interaction. These are software checks,
not human-device or anatomical acceptance. Main review inspected rendered
right-junction, contact-highlight and mobile views.

## Disposition and next implementation

Both orifices remain **outside the learner runtime**, with no automatic approval.
Before admission: review source identity/extent and left base contact; check
ownership against all potentially overlapping source surfaces; specify whether
these are landmark patches rather than lumen geometry; then bind decisions to
the exact source and renderer revision. Never bridge, smooth or reposition them
to suggest continuous ureterovesical anatomy.

The useful implementation path that does not depend on those candidates is a
same-source urinary/pelvic context study reusing the already-admitted ureters
alongside bladder and uterine vessels. It must preserve the independent HRA
frame, source-local IDs and existing teaching; not concatenate the male main
body or imply patient registration. Audit the existing specimen/module export
contract before integrating; the local review is not that production feature.
Pelvic-floor/neural gaps and broader-body teaching remain roadmap work.

No scans, masks, private review decisions, entitlements, website modules or
clinical acceptance changed. No new publication occurred.

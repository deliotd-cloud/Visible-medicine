# Independent knee reference — source preparation

## Status

The same source specimen now also has [hip/thigh, calf, ankle/foot and whole-limb studies](UM_LIMB_DISSECTION.md) through the compact modal region selector. The original15 knee IDs, source files, GLB and six knee presets remain unchanged; broader views reuse them, without duplicating anatomy counts.

A 15-surface knee reference is available through **Knee & leg → Knee tissues · separate specimen**. It is an independent source subject, not an extension registered to the BodyParts3D body. Existing body anatomy, approval states, teaching and imaging links are unchanged. The original preparation remains immutable under `content/prototypes/um-knee`; runtime assets are in `public/models/um-knee`.

The selected source surfaces are four bones (femur, tibia, fibula, patella); distal femoral, tibial and patellar cartilage; ACL, PCL, MCL, LCL and patellar ligament; the source meniscus group; quadriceps tendon; and popliteus. The tibial cartilage and meniscus remain grouped entries. No medial/lateral component, attachment footprint or ontology crosswalk is invented.

## Rights and provenance

Source: Jeevaraaj N Vivekanandan and Juliana Binti Usman, *A Three-Dimensional Lower Extremity Musculoskeletal Geometry Model of An Asian Male*, Universiti Malaya Research Data Repository, 2026, [DOI:10.22452/RD/5T6TZ7](https://researchdata.um.edu.my/dataset.xhtml?persistentId=doi:10.22452/RD/5T6TZ7), version1.2. The repository declares **CC0 1.0** and marks STL file596 unrestricted. [CC0 permits commercial reuse](https://creativecommons.org/publicdomain/zero/1.0/), without a paid service or share-alike requirement; it does not waive third-party privacy, trademark or patent rights or guarantee accuracy. Retain scientific credit and do not imply author endorsement.

Original repository JSON and README are retained byte-for-byte in `LICENSES/um-lower-limb-v1-2`. The original STL archive has61,109,803 bytes, MD5`d7f066d2fd3fc21c21f64ad3d5a985fd` (matching repository metadata) and SHA256`0c6c7fa81329dba949e00c7d99de37afef0352368eb5b386eb8034ec0b66ec86`. The full archive is in the local work cache; fifteen extracted originals totaling14,661,060 bytes are in the committed prototype. No DICOM, segmentation mask, reference illustration, font, texture or new dependency was imported.

The source authors describe MRI-based segmentation and professional review, but also acknowledge unresolved boundaries and omitted structures. That is upstream reporting, **not Visible Medicine clinical approval**. Their cited textbooks/imaging sites were references; their images or prose are not included here.

## Coordinate and geometry evidence

Every selected STL header explicitly states `SPACE=LPS`. [Slicer's coordinate documentation](https://slicer.readthedocs.io/en/latest/user_guide/coordinate_systems.html) explains this convention. The prototype applies one fixed orientation-preserving transform: `(x,y,z) → (0.01x,0.01z,−0.01y)`, so the viewer axes are left/superior/anterior. No subject alignment, translation, warping, mirroring or independent part adjustment occurs. Scale is for display; no calibrated measurement or scan correspondence is asserted. Right-sided acquisition is reported by the source README, not guessed from mesh position.

Of293,196 source triangles, exactly40 have zero area in original float32 source coordinates: eight each in femoral cartilage, tibial cartilage and the meniscus group, plus16 in MCL. Only those individually indexed faces and unused vertices are omitted from the display derivative. Original STL bytes remain intact. All293,156 nonzero-area triangles retain their positions, relative order and winding. Exact-coordinate welding and recalculated normals support smooth display. The resulting surfaces have no boundary or nonmanifold edges by the implemented edge-count check; this does not prove absence of intersections, segmentation error or inaccurate attachments.

The GLB is5,297,012 bytes, SHA256`f4199fc6fdaed1a7ba2da1ae76bff266f0baf4e0972e0c79f9975fc526d17b48`. Round-trip float32 positions are exact; maximum reverse-transform coordinate error is0.0000228882 source units. Local IDs use `vm:reference:um-5t6tz7-v1-2:knee:*`, never existing body IDs. All records retain `anatomicalReview:false`, `registeredToBodyParts3D:false` and no asserted FMA mapping.

## Reproducible workflow

- `npm run um-knee:export` generates the public catalogue and GLB from the pinned prototype. Only node presentation metadata changes; the entire binary geometry chunk is byte-identical. `npm run um-knee:test` verifies the derivative, source bounds/anchors, presets/history/search and actual React control markup with only the GPU scene boundary replaced. It does not establish browser/device or clinical acceptance.
- `npm run um-knee:check` regenerates in memory from committed originals, compares the exact GLB/report, and independently verifies every original triangle against the derivative.
- Initial ingestion: download the unrestricted STL file596, README593 and repository JSON into `../work/um-lower-limb-v1-2`, then run `npm run um-knee:prototype`. The script checks source archive hashes, licence/version and archive paths before extracting selected entries to stdout. It refuses to overwrite originals.
- `--update-derived` may regenerate the GLB/report after an explicit reviewed script change; it first requires original evidence to match byte-for-byte. It never changes raw sources. Normal checks are offline and need no full archive.

## Interactive study and clinical gates

The compact modal reuses the shared scene, diagrammatic tissue rendering, screen-side labels, renderer recovery, selected-origin guides, separation layouts and reversible dissection reducer. Six choices show all tissues, cruciates, collaterals, cartilage/menisci, extensor tissues and posterior tissues. Search restores hidden selected entries. Each tissue-group toggle is a single Undo step; Undo/Redo resets separation/fading/framing to avoid a restored tissue remaining displaced or obscured. Reset restores all tissues and display defaults. Closing returns keyboard focus to the launcher and leaves the original atlas dissection intact. The extra GLB and component load only on opening.

The initial joint close-up is camera-only and covers the supplied non-bone tissue bounds with a margin. It is disabled during separation or fading others; whole bones remain selectable and can be framed. No surfaces are clipped, cut, warped, mirrored or registered. The public GLB is5,298,360 bytes, SHA256`cf61571a8c80f463805b1362bb81b3d9eec3c62a1780c7288355e4a20fa8515b`. All293,156 display triangles and the immutable originals remain unchanged.

The public source catalogue keeps FMA IDs null. A renderer-only adapter uses the legacy empty-string field for an unmapped FMA; it is not admitted to the BodyParts3D teaching, practice, scan or entitlement registries. The shared orientation adapter's scale field is only used to interpret axes, not to enable calibrated measurements. Detailed Anatomy/Function/Imaging/Clinical lessons and quiz questions for these independent IDs remain pending, explicitly disclosed in the source panel. Existing atlas and paid-lecture rights are unchanged.

Before clinical release: inspect surfaces and attachment relationships with an anatomist/radiologist, review grouped tissue coverage, assess self/cross intersections and device/browser usability, and verify source-side labelling. Future MRI linkage must separately inspect de-identification/consent, volume spacing/origin/orientation and the combination of acquisition segments; no raw scan is currently loaded. Do not infer a shared registration from the DOI or matching anatomical name. Paid lecture access remains independently entitled.

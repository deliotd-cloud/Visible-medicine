# Independent lower-limb dissection

## Experience

Open the compact **separate specimen** button in Pelvis & hip, Hip & thigh, Knee & leg or Ankle & foot. The modal region selector switches among Knee, Hip & thigh, Calf & ankle tendons, Ankle & foot and Whole source limb. Switching scope starts a fresh local dissection; closing returns keyboard focus and leaves the main atlas state intact.

There are 67 unique supplied surfaces across 26 study choices: the original 15 knee entries plus 52 additional entries. Scopes overlap and must not be added together as unique anatomy. The other atlas body remains unchanged; this source is never warped or silently grafted onto it.

| Scope | Study choices | Initial view |
| --- | ---: | --- |
| Knee | 6 | All 15 knee surfaces, unchanged |
| Hip & thigh | 8 | Gluteal muscle view |
| Calf & ankle tendons | 5 | Superficial posterior calf |
| Ankle & foot | 6 | Eight source bone selections |
| Whole source limb | 1 | All 67 surfaces; optional heavier view |

Selection, search/restoration, tissue switches, set aside, single-step group Undo/Redo, fade others, framing, labels and Spread/Extract/Tray separation use shared controls. Regional close-ups affect only the camera and pause during separation/fading. Bones and long muscles stay whole. The renderer loads only bundles with visible entries; the foot defaults to one 2.68 MB bundle, the knee to its existing 5.30 MB bundle. Full-thigh and whole-limb views are deliberately heavier; no device performance certification is claimed.

## Source and rights

Jeevaraaj N Vivekanandan and Juliana Binti Usman, *A Three-Dimensional Lower Extremity Musculoskeletal Geometry Model of An Asian Male*, Universiti Malaya Research Data Repository, 2026, [DOI 10.22452/RD/5T6TZ7](https://researchdata.um.edu.my/dataset.xhtml?persistentId=doi:10.22452/RD/5T6TZ7), version 1.2, CC0 1.0. The source README describes combined right-limb MRI acquisition; scientific credit and caveats are retained. CC0 does not itself settle privacy or other unrelated rights. No DICOM or segmentation mask was downloaded, no third-party reference images/textbooks copied, and no clinical approval inferred from the upstream review report.

The pinned 61,109,803-byte archive has SHA256 `0c6c7fa81329dba949e00c7d99de37afef0352368eb5b386eb8034ec0b66ec86` and repository-matching MD5 `d7f066d2fd3fc21c21f64ad3d5a985fd`. The 52 new originals total 113,202,768 bytes and are retained byte-for-byte in `content/sources/um-limb`; the 15 previous originals remain in the knee prototype. Exact source filenames are preserved, including spaces and upstream misspellings. Human-readable spelling corrections do not rename raw files or invent ontology mappings.

## Geometry and honest limits

All STL headers explicitly declare LPS. The fixed display transform is `(x,y,z) → (0.01x,0.01z,−0.01y)` with no reflection, individual shift, fitting or warping. The legacy renderer scale field is only used for direction interpretation; no calibrated measurements or patient coordinates are exposed. New IDs use `vm:reference:um-5t6tz7-v1-2:lower-limb:*`; the previous `...:knee:*` IDs remain stable. All public FMA mappings remain null, registration is absent and anatomical review remains false.

Of 2,263,968 new original faces, 282 have exactly zero area and are omitted from display with their original indices recorded. All 2,263,686 nonzero faces retain order, winding and original positions under the float32 display transform. Maximum reverse-coordinate error is 0.0000457763671875 source units. Exact-coordinate indexing and smooth normals are regenerated. At 60 vertices where opposing incident normals cancel, the direction of an actual incident source face is used; no arbitrary direction or geometric repair is introduced.

The 52 new surfaces retain 51 nonmanifold edge contacts across six entries and multiple disconnected components in eleven entries. They are not watertight simulation-ready solids or clinically adjudicated attachments. These defects are recorded in `content/um-limb-source-audit.json`, reflected in runtime source-quality notes and not silently deleted. Pelvis and the source `Phalanges` foot-bone surface remain grouped. The foot group has 14 connected components, but no digit numbering, metatarsal/phalanx assignment or separate component identity is inferred. Missing nerves, vessels, fascia, many intrinsic muscles, retinacula, hip capsule/labrum and ligament details remain missing.

The original knee GLB stays byte-identical. New surfaces are in four bundles below, avoiding a single oversized hip/thigh file:

| Bundle | Surfaces | Bytes | SHA256 |
| --- | ---: | ---: | --- |
| Hip | 14 | 11143104 | `72470f8171fcfe7b7eb397ea86be47f2ec781a4c12b4c9755213d91e4f04f262` |
| Thigh | 14 | 19648284 | `3edb8b2d00673b08631070a682d34d56aba8d55d5aa6398874580afa3036d3d2` |
| Calf | 11 | 9251564 | `76698dfcc0ed1710b06227cfccc5eb574cd03534966a406c9252899a7337437c` |
| Foot | 13 | 2676564 | `dbd323ceaa7385977905b8aa9dfbfa2c03a9e7ca02c3084b5fd8d94e933a14d5` |

## Implementation and verification

- `scripts/export-um-limb.mjs`: pinned offline archive ingestion and reproducible export; existing original files must match exactly before reuse. No traversal-based archive extraction or arbitrary network source.
- `npm run um-limb:test`: regenerate in memory from committed originals, compare exact output, inspect every original face against the public GLB, validate source IDs/bounds/normals and regional/history/loading contracts.
- `npm run um-knee:test`: preserved knee source and shared-control regression.
- `lib/independent-specimen.ts`: generic source-only rendering adapter and scoped state transitions, separate from the body/lecture entitlement registries.
- `lib/um-limb-studies.ts`: the actual source-scoped study definitions and camera bounds.
- `app/um-limb-study.tsx`: compact modal scope picker; the shared `KneeSpecimenView` remains backwards-compatible and accepts a specimen definition.

Brief study prompts are original, checked against [TTUHSC El Paso lower-limb muscle relationships](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html). They are not complete Anatomy/Function/Imaging/Clinical lessons. Detailed source-bound teaching, quiz content, deep links, specialist anatomy review, browser/mobile/GPU accessibility and performance acceptance remain future work. Any future CT/MRI/US/X-ray linkage requires actual source registration and de-identification evidence. Separate paid lectures remain independently entitled.

# Separate back-layer specimen

Open **Spine or Whole body → Back layers · separate specimen**, or `/specimens/back-layers`. The standalone route loads the separate viewer without rendering the root-body atlas. One optional launch control reuses the established specimen pattern and preserves focus on return.

## Scope and interaction

Fourteen source muscle surfaces: right/left latissimus dorsi, multifidus, rhomboid major and minor, plus three trapezius parts on each side. Thirty-four same-source bones provide context: all 24 cervical/thoracic/lumbar vertebrae, sacrum, occipital bone and paired scapulae, clavicles, humeri and hip bones. This is not a complete skeleton or back-muscle stack. The four sided latissimus/multifidus concepts are absent from the root-body catalogue; their availability here does not register them into that newer body.

Eight posterior studies reuse the compact Study menu: all supplied surfaces, trapezius hidden, latissimus pair, rhomboids, multifidus pair, right muscles, left muscles and muscles only. Selection, fade, framing, hide/Undo/Redo, system visibility, search, six camera directions, labels, illustrated surfaces, origin guides and existing separation mechanisms remain available. Separation is reversible display translation, not contraction, fascicle movement or a surgical plane. Whole source files remain intact when hidden. No new dissection toolbar or root-body recipe is added.

Fourteen Anatomy/Function drafts reuse five concepts in the existing collapsed Learn groups. The [detailed teaching extension](BACK_LAYERS_TEACHING.md) adds explicit attachments/motor supply, source-part and sided action qualifications, 46 extended topic placements (17 texts) and five clinical self-checks. Unsupported topics and skeletal-context teaching remain explicitly pending. Complete definition/source/frame/bundle/surface matching gates notes and identification; neither names nor FMA equality alone admit a foreign selection.

Identification practice draws only from visible, source-checked muscles: eligible pools are 14 / 8 / 2 / 4 / 2 / 7 / 7 / 14 across the studies. The shared engine samples at most ten questions per round. Bones are context, never answers. Labels and origin guides are suppressed in practice; first-try/reveal/retry-missed behaviour and return to the dissection use the existing engine. These are source-label exercises, not validated clinical examinations.

## Geometry and source conditions

`node scripts/export-back-layers.mjs` retrieves the exact official version-3 atomic files using ZIP CRC/size checks. All **333,182 source triangles** are retained in order across 48 meshes. The canonical GLB is **7,625,848 bytes**. No additional decimation, tolerance welding, smoothing, mirroring, fitting, segmentation, removed source faces or gap filling is applied. Identical vertex/normal index tuples share storage; original normals are rotated and normalized.

The common transform is `display = (source.x / 100, (source.z - 1050) / 100, -(source.y + 100) / 100)`, a proper rotation/translation and unit conversion, not registration into v4 or a patient. Source centres pass the side-sign check; near-midline overlap remains original geometry, not proof of anatomical accuracy. No source is independently shifted to fit a neighbouring muscle or bone.

Ten muscle files contain multiple disconnected components. In particular, right/left multifidus retain 64/38 components and 34/11 non-manifold edges; right/left latissimus retain 9/11 components and 2/3 such edges. Right rhomboid minor also has edge contacts. The selected-structure panel visibly discloses source fragments/edge contacts. Components are not assigned invented fascicle identities. All 34 bones have one diagnostic connected component. These diagnostics neither prove complete tissue coverage nor exclude intersections or anatomical defects.

No complete erector-spinae/transversospinal stack, thoracolumbar fascia, aponeuroses, discs, spinal ligaments, cord, nerve routes or validated attachment footprints are supplied. The multifidus study is a source-group comparison, not a full surgical exposure. The three trapezius source parts are not independent muscle origins or an animated force model.

## Commercial reuse and references

The [official v3 README](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/README_e.html) and every OBJ header specify **CC BY-SA 2.1 Japan**, not the newer v4 licence. The [governing legal code](https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode.ja) and [deed](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en) require attribution and matching adaptation rights. Primary source/legal-code pages were checked 12 September 2026; the web reader timed out on the deed, while the exporter obtained and retained its HTML. Source/licence snapshots and their hashes are retained with the selected OBJ files.

Required credit: **BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan**. The viewer, metadata and notices retain credit, licence and change descriptions. The live viewer links the official full source archive and provides the display GLB and notice. Selected originals remain in the source/GitHub/D-drive backup; no duplicate recovery ZIP is placed in the live assets.

Asset/adaptation ShareAlike scope: `public/models/bodyparts3d-v3/back-layers/**`, `content/sources/bodyparts3d-v3-back-layers/**`, and the specimen data/study definitions in `lib/back-layers.ts`. Original shared application code and independently written teaching remain under their existing MIT terms. Recipients retain licensed reuse rights: do not impose conflicting lecture/subscription terms, exclusivity claims or DRM on these assets. This engineering rights record is not legal certification of every future combined product or adaptation.

Factual reading only: [Loyola latissimus](https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/lat.htm), [rhomboid major](https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/rhmj.htm), [rhomboid minor](https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/rhmn.htm), [Texas Tech upper-limb muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html) and [back muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html). Short original concepts, not publisher prose, illustrations, tables, scans, question banks or procedural instructions, are included. No new dependency, font, texture, paid service or mandatory runtime fee is introduced.

## Verification and remaining acceptance

Run `node scripts/validate-back-layers.mjs`. It checks every retained source face corner (999,546), face order, source names/licence/hashes, bundle hashes, normals, bounds and surface anchors. Maximum observed coordinate round-trip error is 0.00002381 source mm. All eight dissection states, removal/Undo/Redo, invalid identities, twelve changed definitions, lesson-copy isolation, fourteen exact muscle lessons, eight practice pools and 42 actual React teaching renders are exercised. Existing abdominal-wall geometry/control and independent-limb teaching/practice regressions are retained.

Clinical sign-off must assess boundaries, laterality, attachments, retained artifacts, layer relationships and each teaching note. Browser/GPU/mobile/keyboard/accessibility acceptance is still needed; SSR/geometry tests do not establish it. CT/MRI/X-ray/US pixels and registrations are absent. FMA identities support future versioned crosswalks, not patient correspondence or paid-lecture access. Root-body counts, dissection recipes, previous meshes and separate review approvals are unchanged.

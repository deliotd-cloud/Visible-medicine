# Ankle and foot joint partners

12 September 2026. Draft teaching/navigation; radiologist sign-off and device acceptance pending.

Select a foot bone, tibia or fibula in the main atlas and open **Ankle & foot joint partners** in the existing selected-structure panel. The panel starts collapsed; it adds no permanent toolbar, diagram, modal or extra viewport. Clicking a local partner uses the existing restore/select/imaging-identity handler. Partners outside the region open the whole body through existing source-bound study links. In particular, the foot catalog does not contain the tibia/fibula: these are not silently injected into the region.

**Show available joint partners** keeps the selected concept and its listed non-variable neighbours, hides other regional structures in one Dissection history step, enables bones and resets cutaway/separation/camera. Both source counterparts are retained so normal laterality switching continues to work; the normal side filter determines which appear. Undo/Redo restores layer/removal state, not camera or system toggles. Source positions, bone surfaces, identifiers and teaching remain unchanged. Exam mode suppresses both the panel and the action.

## Coverage and boundaries

The map uses 56 existing source bones: 26 foot bones plus tibia/fibula on each side. There are 37 ordinary bone-pair relationships and two explicit variable pairs per side. These are graph edges, **not a count of anatomical joints, cavities or facets**. The talocalcaneal relationship does not split its individual facets. The tibia–fibula entry is specifically the distal syndesmosis, not a synovial articulation. Knee/proximal tibiofibular relationships are outside this ankle/foot map.

Navicular–cuboid and first–second metatarsal facets are labelled variable and excluded from automatic partner isolation. Individual bones remain selectable without asserting a donor articulation. The generic source “sesamoid bone of … foot” selections are not recast as individually validated hallux sesamoids. Accessory facets/bones, cartilage, ligaments, synovial cavities, motion axes, joint-space measurements and patient scan registration are not generated. Ligament attachment alone is never treated as a bone articulation. Missing relations are not proof of anatomical absence.

## Evidence and commercial boundary

These links are factual reading references, not imported anatomy datasets or licensed artwork. The implementation contains an original concise relationship map and unchanged licensed source metadata. No image, diagram, PDF, table or source passage is redistributed. Public readability is not reuse permission or endorsement. Existing BodyParts3D v4 / DBCLS CC BY 4.0 credit remains required and unchanged. No package, texture, font, model, paid API or mandatory service was added.

- [TTUHSC El Paso bones](https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html): ankle/hindfoot, naviculocuneiform and digital partner facts. Copyrighted text/tables are not copied.
- [TTUHSC El Paso joints](https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html): distal syndesmosis versus synovial joints and interphalangeal terminology. No illustrations or table reproduction.
- [Samojla, Normal anatomy of the forefoot, pp. 11–15](https://www-s3-live.kent.edu/s3fs-root/s3fs-public/HV-ch-02-Normal-Anatomy-of-the-Forefoot.pdf): metatarsal-base partners, cuneiform relationships and variable first–second metatarsal facet. Reference only; PDF/figures not bundled.
- [OpenStax lower-limb bones](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb): tarsal orientation/cuneocuboid factual cross-check. Current page displays non-commercial/share-alike terms; **no content asset is admitted under those terms**.
- [Rajaram et al., 2024, PMID 37968490](https://pubmed.ncbi.nlm.nih.gov/37968490/): primary morphological study supports treating the navicular cuboid facet as non-universal. No individual donor inference or copied abstract.

## Architecture and regression

The wrist/hand extension now shares the source gate and planner through `lib/regional-bone-joints.ts`; the foot API, pins and relationship data remain unchanged. The existing panel adapts its title and scope. See [hand joint partners](HAND_JOINT_PARTNERS.md). Foot regression still runs independently as well as through the combined selector.

`content/foot-joints.ts` defines exact FMA pairs, typed undirected relationships, joint kind and per-edge reading reference. `content/foot-joint-pins.json` preserves full source records, bundles and coordinate frame. Its generator verifies the original catalog SHA256 `109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7`; it refuses implicit overwrite. Runtime source gating checks complete records, unique identities, bundle metadata and frame before enabling the map. No runtime fuzzy name matching or nearest-surface assumption.

`lib/foot-joints.ts` returns reciprocal same-side neighbours and a reversible visibility plan. `app/bone-joints.tsx` reuses the established compact UI, selection handler and study-link contract. Adding another region later requires reviewed exact source admissions, reciprocal evidence-backed relationships, ambiguity handling and regression tests, not broad keyword inference.

Run `npm run foot-joints:test`. It exercises all 56 bones, reciprocal edges, both side filters, regional/whole-body plans, real Dissection Undo/Redo, source-bound cross-region links, source corruption rejection, exam guards, actual component markup and the actual parent handler. It does not certify GPU rendering, touch usability or clinical accuracy. Renderer fingerprints include the new runtime code/data so earlier review revisions are not silently carried over.

Remaining human checks: donor bone identity/geometry and spatial fit; listed articulations and variants; sesamoid ambiguity; leg/foot transition framing and small-screen legibility; clinical wording and modality correlation. Do not interpret source model gaps as measured joint spaces. CT/MRI/US/X-ray links retain the existing canonical identities; acquired imaging, registered correspondences and separate lecture entitlements still need their own content and integration.

Implementation checks passed: 224 partner plans, 156 reciprocal rows, 16 cross-region links, 72 corrupted-source rejection cases, 112 actual component renders and 112 actual parent-handler cases; existing acral-bone studies and selection-visibility regression; TypeScript and production build. The separate legacy `validate-study-links.mjs` invocation could not start because its direct TypeScript import chain cannot resolve the extensionless `lib/body-source-additions` import. Those existing files were not changed; the new bundled tests execute the real study-link API for this feature. This is not a whole-suite pass. No browser/GPU/mobile inspection was performed during background continuation.

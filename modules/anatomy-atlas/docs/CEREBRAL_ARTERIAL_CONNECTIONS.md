# Cervical and cerebral arterial connections

Status: original source-bound teaching draft; radiologist and device review pending.

In **Head & neck** or **Whole body**, select a carotid, vertebral or supplied cerebral artery, then expand **Arterial connections** in its inspector. Select a listed neighbour, or **Show available connections & bones** for one reversible dissection step. The existing compact controls, side filters and Undo/Redo remain in use; there is no extra permanently open panel.

## Scope and implementation

Fourteen existing BodyParts3D v4 vessel selections: paired common/internal carotid, vertebral, anterior/posterior cerebral and posterior communicating arteries, plus the midline basilar and anterior communicating arteries. The two PCA selections are official `partof` groups of nine components each; the other twelve selections use `isa` (including two basilar components). All 31 component bindings are preserved. Seven concept relationships expand to fourteen source-ID pairs. Eleven existing context bones are pinned: C1–C7, occipital, sphenoid and temporal bones. Cervical selections retain cervical context; intracranial selections retain only the four skull-base bones, not the whole skull shell. These are source bones, not segmented foramina.

`content/cerebral-arterial.ts` contains short original notes and explicit relationships. `content/cerebral-arterial-pins.json` binds them to exact source records, bundles, coordinate system and licence; `scripts/pin-cerebral-arterial.mjs --check` verifies their immutable catalogue baseline. Original meshes, component identities, coordinates and source files are unchanged. `lib/cerebral-arterial.ts` reuses the existing regional explorer and routes its disjoint IDs explicitly; missing or modified pins suppress this map instead of silently producing a partial graph.

**Confluence** is separate from branch/continuation: both vertebral inflows are listed for the single basilar selection. ACom and PCom–PCA relationships are communications, without a flow direction. Left/right arterial pairs do not acquire cross-side branches. A midline selection can list both sides when both are enabled. Visibility recipes retain both counterparts so changing the existing side filter remains reversible. Exam mode suppresses the explorer and its action.

The recipes reuse existing handling: showing connections resets camera/cutaway/separation. Dissection Undo restores layers/removals, not camera or system switches. No imaging selection/registration event or inferred connecting tube is generated.

## Limits and review checklist

- This map is not complete cerebral circulation: MCA, external carotid, ophthalmic, cerebellar, perforator and upstream arch/subclavian routes are not mapped here. Some related names exist in the offline inventory; an inventory record is not an admitted, validated vessel mesh. Missing map entries must not be interpreted as absent anatomy.
- ACA/PCA source selections are not independent A1/A2 or P1/P2 segmentations. No territories, lumen patency, stenosis, collateral adequacy or donor-specific arterial variants are established.
- Fetal PCA and communicating-segment variation require individual imaging review. A typical relationship is not a registered CTA/MRA finding. No angiographic series is acquired, loaded or claimed by this change.
- Radiologist review: confirm source identity/laterality, branch versus confluence/communication wording, visible context, and the limits of segment/variant teaching. Inspect any apparent disconnected surface without filling the gap by guesswork.
- Device review still required: head/neck and whole-body selection, each side, camera orientation, context visibility, small-vessel pickability, labels, Undo/Redo and touch navigation. Automated source/SSR checks do not establish visual or clinical acceptance.

## References and commercial boundary

[Texas Tech University Health Sciences Center El Paso head/neck artery table](https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html) supports the basic relationships. [The primary 3D-TOF-MRA morphologic study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4683875/) supports the explicit variation caveat. Reviewed 12 September 2026. No article prose, table dataset, diagram, angiogram or other third-party media is copied. Reference links confer no redistribution licence or endorsement.

No dependency, font, texture, model, paid API or mandatory service is added. Original code/notes retain the repository MIT licence; the reused source geometry retains existing DBCLS/BodyParts3D CC BY 4.0 attribution and derivative notices. Run `npm run cerebral-arterial:test`; wider arterial, dissection and review-freshness checks remain necessary after shared changes.

## Next owner step

The private CT-head draft review is independent of this generic body model. Follow [the local imaging workflow](LOCAL_IMAGING_STUDY.md) to review the existing posterior-fossa draft masks and return source-bound correction marks. No approval or mask change is inferred from merely viewing a draft. Continue other atlas work while those decisions are pending; patient imaging release and runtime publication are separate gates.

# First-release CT-head handoff

Read-only coordination check, 18 September 2026. The specialist task
**Visible medicine— CT Head Atlas** continues to own source data, segmentation,
accepted boundaries and its clinical review history. Nothing in this plan changes
its masks, approvals or storage. Didanix Education/light is the target; clinical
PACS is excluded.

## Current boundary to preserve

The specialist's local restart record is newer than some retrieved task messages.
It identifies a pending midbrain correction: excessive axial extent and deficient
superior extent on sagittal/coronal review. No correction was made at its last
shutdown checkpoint. Accepted anterior cerebellar edges and the accepted posterior
medullary edge must remain preserved; those scoped decisions are not approval of
all posterior-fossa anatomy. Broader extent/junction review is still outstanding.

This is a handoff dependency, not permission for the main Atlas task to edit those
masks. Do not use the midbrain as the first clinically released mapping while
its known correction remains outstanding. Select the first case/structure from
an actually approved, cleared revision with the radiologist and specialist owner.
No patient identifiers, scene archives or segmentation derivatives belong in this
repository or the website build.

## Integration work order

1. Identify one approved structure and its exact stable specialist code and
   source revision; do not infer approval from its name or an old screenshot.
2. Receive a metadata-only handoff: opaque case/series identifier, modality,
   intended educational scope, privacy/reuse clearance evidence, accepted
   segmentation revision, permitted distribution and required entitlement.
3. Choose the narrowest honest link: a named structure/case link first. Use a
   specified frame/location only when its series identity, orientation and
   coordinate conventions are validated. A reference-model surface is not a
   patient-registered segmentation.
4. Use existing shared anatomical-ID and Didanix Education interfaces. Preserve
   separate Atlas, imaging-case and lecture rights; metadata must not confer
   access to the underlying images.
5. Test allowed and denied routes, expired entitlement, wrong/missing series,
   unsupported structure, changed source revision and return-to-Atlas selection.
   Fail clearly instead of substituting an unrelated image or silently granting
   access. No paid lecture is needed to complete the basic learning journey.
6. Have the radiologist verify the actual displayed location and label against
   the exact cleared case. Record whether the link is navigational, approximate
   or spatially validated. Only then include it in the release evidence.

The first-release imaging gate remains pending. Existing adapter tests, source
teaching notes and ID hooks do not establish a live cleared case connection.
Routine source Atlas improvements can continue while this handoff is prepared.

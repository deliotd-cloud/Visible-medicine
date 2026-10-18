# Linked-tour bookmark

**Saved step** is a compact disclosure in the linked 3D tour toolbar, the CT/MRI
guided-learning panel, and the linked-tour library. Saving is explicit, replaces
the single previous bookmark, and never automatically navigates. Resume offers
only the canonical mapped 3D/CT/MRI destinations; absent modalities stay absent.
Escape closes the disclosure and returns focus to its summary.

This is a browser bookmark, not a learning-progress, assessment or clinical record.
It stores exactly five fields under `vm.head-learning-bookmark.v1`: schema version,
sequence ID, concept ID, head manifest revision, and the appropriate independent
sequence review revision. It does not store URLs, scan bytes, file handles, patient
IDs, camera state, answers, scores, completion or approvals. No server endpoint,
network synchronization, new dependency or asset is introduced. It is visible to
other users of the same browser profile and can be explicitly removed.

The parser rejects malformed/oversized/extra-field records, stale revisions and
unsupported sequence/concept combinations. Links are reconstructed from current
validated mappings, never trusted from storage. Stale bookmarks remain removable
but offer no resume links; they are not silently migrated or approved. Writes are
read back before success is reported. Storage denial/quota errors leave tours
usable, and same-tab/cross-tab storage changes refresh the disclosure.

Opening a bookmark does not restore an approved imaging folder or grant access.
CT/MRI folder sharing remains opt-in under the existing provider; exact-source
selection confirmation still governs the 3D guided host's comparison controls.
The bookmark's separate resume links represent an explicit navigation request,
not confirmation that the currently rendered 3D selection matches that step.
CT and MRI remain different, unregistered subjects.

Focused contract/UI tests cover canonical positions, invalid and stale data,
storage errors, replacement/removal, remount, cross-tab refresh and Escape focus.
Use the checkpoint's actual browser/build results for delivery acceptance; tests
do not establish loaded model/GPU behavior or clinical sign-off.

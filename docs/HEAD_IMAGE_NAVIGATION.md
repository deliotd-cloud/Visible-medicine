# Head image navigation

The CT/MRI head viewer preserves the selected canonical anatomical concept and Guided learning step when moving between modalities through either the main switch or the CT/MRI navigation tabs. The existing 3D Atlas comparison links remain wrapper-owned; generated geometry is unchanged.

## URL contract

- `lib/head-atlas-navigation.ts` accepts a bare route, one known `concept`, or a complete tour tuple (`concept`, `headTour`, `headStep`, `headRevision`). Tour revision must match the actual imported manifest and exact step membership.
- Twenty-five concepts have exact links for both CT and MRI; four further concepts link MRI only. The five sequences still use the original twenty-five shared concepts. Unknown, duplicate, extra or stale query metadata is rejected; the viewer shows a notice and clears selection rather than substituting another structure.
- Structure selection, Guided learning progression and clearing selection write canonical same-origin history entries. Back/Forward ends practice, restores the appropriate panel and resolves the exact concept against the currently loaded study. An absent source entry is not replaced with a nearby structure.
- The main CT/MRI switch preserves valid pending intent before local import and when the exact requested entry is absent from a loaded study. An absent entry leaves selection empty, explains the limitation and labels the action **Try requested anatomy**, not an availability claim. Explicitly selecting another source entry replaces or clears that intent. It does not transfer a file handle, pixels, masks, slice coordinates, credentials, scores or quiz answers. The destination requires its own local import.
- The shared imaging shell accepts a typed head-navigation context, not an arbitrary destination URL. It rebuilds CT/MRI tab links with the same canonical helper, only on CT/MRI head-region pages. Invalid/stale context uses the normal regional route. Ultrasound/X-ray and other regions never inherit an unsupported exact head-concept match; their existing regional links are unchanged.
- Practice start clears the current query to the bare modality route. Active practice exposes only a generic modality switch. Returning from a guided quick check explicitly restores the remembered step; Back ends practice before restoring anatomy. Practice is session-only, not a resumable or certified exam.

Plain concept links keep their established format; their interpretation still depends on the runtime manifest pin. Tour links carry an explicit revision. Neither format demonstrates patient-space registration. CT, MRI and the generic 3D Atlas are different subjects/sources: these links support semantic comparison only.

## Finding linked anatomy

An exact linked focus or tour step also exposes **Learn [structure], guided learning & sources** in the existing3D wrapper disclosure. It reuses the anatomy, function, family limitations and common-fact references from the same revision-bound teaching packet used by CT/MRI. Native-image exercises and modality-specific interpretation are deliberately absent from this reference view. Generic or stale-source entries receive no named teaching. The displayed heading follows the committed comparison focus/tour step, not later clicks within the generated model. Content remains an original cited draft; the packet hash and private review contract are unchanged, and no approval is inherited.

In the existing head-and-neck3D page, **Guided learning, coverage & sources** opens a compact library of the five existing source-bound sequences: brainstem, ventricles, deep grey matter, cerebral lobes and paired hippocampi. Each starts at its exact first concept in the existing3DAtlas with the canonical tour revision. Previous/Next and CT/MRI continue the committed step. **Leave tour** (or **Finish tour** at the last step) returns to ordinary exploration of that same exact source concept, removing only tour metadata. Finishing exits the sequence; it records no learning score or completion. The library stays inside the existing disclosure so no extra toolbar competes with the model. These are draft semantic-comparison sequences, not live tracking or registered camera/image synchronization.

The existing head-and-neck3D wrapper also exposes a compact **Linked anatomy** picker. Its twenty-nine options come from the canonical concept allowlist; **Open in model** rebuilds the exact pinned 3D destination. MRI-only options are explicitly marked, and CT links are withheld for those concepts, never replaced with nearby structures or subparts. See [MRI-only binding limits](HEAD_MRI_ONLY_LINKS.md). A plain regional entry has no specific CT/MRI comparison links until a valid focus is opened. The visible comparison focus names the committed source concept and supplies only its mapped modality links; changing the picker alone does not change those links. Picking another structure inside the generated model does not change wrapper focus or imply a new source match. Guided-tour entries retain their existing sequence strip and exact step destinations rather than receiving a second comparison bar.

The existing Structure index defaults to the complete imported inventory. A compact **3D-linked only** checkbox narrows it to exact source-matched concepts; each match has a small **3D link** indicator. The count is derived from the current study, not an assumed body-wide coverage number. Search also accepts the canonical concept label or ID, in addition to source labels/IDs/laterality; search, system and linked-only scope intersect. Reset filters restores the complete inventory without changing the selected structure, image or overlay group.

Discovery uses `lib/head-atlas-index.ts` and the same revision/ID/label/representation/laterality checks as navigation. Stale revisions or mismatched entries get no badge and cannot enter the linked subset. The filter is not an approval or completeness claim. It neither changes source assets nor loads meshes. Browser history restoration and a new local import clear linked-only scope; ordinary practice hides the whole index and its filters, and scoring/eligible targets remain independent. No filter state is serialized or transferred between modalities.

## Guided sequence positions and coverage

CT/MRI Guided learning keeps every canonical sequence slot, matching the step
numbers used by its URL and the existing3D tour. Missing, mislabeled, wrongly
sided or differently represented source entries are explicitly unavailable;
they never compact or silently skip the sequence. Entering an unavailable step
clears the previous saved selection and selected/group overlay, offers no native
Show/quick-check/teaching/handoff action for that entry, and allows Previous/Next
through the original order. The wrapper's validated semantic comparison intent
remains available without asserting anatomy exists in another subject.

A collapsed **Sequence steps** list shows current position and current-study
availability and supports explicit jumps. It adds no saved completion, scores,
approvals or file transfer. Start begins at the first canonical slot even if it
is unavailable; Finish returns to the sequence chooser and records no score.
Current-source revision, exact ID/label/laterality/representation checks and
active-practice concealment remain unchanged.

## Reviewing a completed practice set

After finishing or ending CT/MRI practice, **Review this set** opens an ordered, session-only list of eligible current-study questions with explicit correct/incorrect first attempt, revealed or unanswered outcomes. Unscored retries never replace the first result. The disclosure and its names/actions are absent during active or unfinished practice. Replacing the imported study or choosing another set clears the review; no scores or local file handles are stored or transferred. A revisit count and collapsed source-matched teaching accompany non-correct outcomes; opening notes does not change the score. Correct or unmatched/stale entries receive no substituted teaching.

**Review on this scan** closes the completed practice view and opens that exact current-study saved structure, restoring the selected-only overlay, native axial view and Structure heading focus. Only existing exact source matches at the current manifest revision offer canonical links to the existing3DAtlas or other native modality. Unmapped questions remain reviewable on their own scan without invented comparisons. Review is neither clinical approval nor registered spatial correspondence; partial masks stay partial. Paid lecture/case/Atlas access is unchanged.

## Keyboard slice navigation

Focus an axial, coronal or sagittal image (Tab reaches it without placing a quiz
answer). Page Up / Page Down change one native slice; Home / End select the first
or last. Values clamp at the study bounds. Only the current view's fixed native
axis changes, including oblique views; these keys do not imply an anatomical
travel direction or move coordinates between studies. Paging prevents the
focused image from scrolling the page. Ctrl, Alt and Meta combinations remain
available to the browser. Outside the image, ordinary controls keep their keys.

Arrow keys retain in-plane movement. In locate practice, Enter or Space places
an answer only after deliberate crosshair movement or an existing pick; paging
alone neither places an answer nor reveals the crosshair. The per-view collapsed
**Keyboard controls** guide is referenced by the image's accessible description.
It scrolls within its own bounded popup in compact views rather than growing the
page or obscuring the slice control. No global shortcuts, storage, scores,
anatomical mappings, accepted geometry or registration are added.

Verification uses the actual slice component and real native-geometry helpers
with generated scalar grids, not patient images: focused handlers cover all
three planes, genuinely oblique geometry, boundary/modified keys and quiz state
across rerenders. Browser checks cover axial/coronal paging, first/last bounds,
page position and a 200px compact popup. This does not replace screen-reader,
clinical or end-to-end approved native-package acceptance.

## Superseded loads

Study and selected-structure success callbacks check their own abort signal before
changing the displayed study, selection, cursor, window or loading status. This
defensive view-layer check also rejects a completion that arrives after effect
cleanup when a loader ignores cancellation. The byte-checked local loader's
existing abort, source and checksum checks remain unchanged. Package selection
already has a separate generation check; practice and grouped-mask loads retain
their own cancellation guards. No request is allowed to transfer anatomy or
coordinates between studies.

## Verification and limits

**Close atlas** ends the browser-local package session without refreshing the page.
It is available during package verification and after import, ends session-only
practice/results, aborts study/structure/group effects and drops component-held
package, native study, selected/group masks and display state. A generation guard
rejects late package verification even after a newer import. Verification itself
does not support cancellation; closing does not promise immediate browser garbage
collection, secure memory erasure or cancellation of already-running hashing.
Original files are never deleted. Focus returns to **Open approved atlas**.
Validated semantic concept/tour URL intent is retained for reopening/comparison;
practice targets cleared from the URL stay cleared. No local files or scores are
stored by this action, and no storage/authentication permissions change.

Pure tests cover every concept/step and invalid/private metadata. Component-callback tests execute the actual viewer with synthetic imports and deterministic hooks/history; they do not execute a medical canvas or replace browser checks. Browser verification uses the local-only sanitized preview and approved local package, with no scan pixels retained in recovery evidence.

Teaching remains a revision-bound review draft. This navigation change does not approve content, alter accepted masks, change access/lecture entitlements, add dependencies or affect the clinical desktop PACS. Exact registration, clinical content sign-off, signed-in production and assistive-technology validation remain separate gates.

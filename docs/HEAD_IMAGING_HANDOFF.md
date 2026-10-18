# Same-tab CT/MRI learning handoffs

## Multiple lecture anatomy links — 16 October 2026

A lecture slide can explicitly bind up to six distinct current head concepts,
including native-image-only concepts. The existing primary structure picker and
text suggestions still select/replace the primary link; a compact additional
picker adds further structures inside the same collapsed details. Each has a
separate removal action. Nothing is assigned from text automatically. Old slides
keep their exact optional single-pin shape unless the author changes their links.

The new optional `anatomyReferences` array and legacy `anatomyReference` are mutually
exclusive. Collections are dense, bounded and duplicate-free; saved pins retain
exact source revisions and allowlisted targets. Existing v1 manifest canonical
JSON/hash for legacy slides is unchanged. The 80-slide/48,000-byte slide envelope
and normal immutable publication/independent-review lifecycle remain unchanged.
This is not PowerPoint/media import or full-body mapping.

Playback groups exact CT/MRI/3D destinations by named structure. Image-only links
never gain a fabricated 3D destination. Stale bindings stay explicit/unavailable
without rewriting a published lecture or replacing a concept. Valid sibling links
may still be used. Any stale pin blocks a new review/approval/publication; authorized
reopening invalidates the unpublished approval while keeping review history.

Related lecture discovery considers every saved pin, then verifies the actual
publication, integrity and existing allocation/availability/prerequisite/course/
organization rules before disclosing slide metadata. Each matched slide appears
once with its exact lecture revision. Atlas, imaging and lecture access stay
independent. Malformed/conflicting collections fail closed, never fall back to a
convenient single link. No database schema or access-policy change was needed.

Local evidence: 53-file/506-case focused integration run, including20 new contract,
UI, actual-repository/SQLite and local workerd/D1 cases. This is not signed-in
browser/clinical acceptance or a full release-suite pass. Source inventory located
six specialist lecture packages, but source selection, image rights and independent
clinical review are not inferred from filenames or file hashes. No live database,
patient scans or approvals were read/changed. Local-only Sites workflow, no new
assets/dependencies/fees or publication. See
F:/VisibleMedicine/staging/20261016-lecture-multi-anatomy/NOTES.md.

## Continuous linked tours — 16 October 2026

Native CT/MRI Guided learning and the existing linked head 3D wrapper share a
compact, explicitly started Play/Pause transport with 0.5×/1×/1.5×/2× speeds.
Reading time is12seconds per confirmed stop at1×, reset when speed changes.
Native image dwell requires the exact loaded annotation; inline comparison also
requires its revision/session/command-confirmed matching model selection. The
standalone 3D wrapper retains its iframe and existing smooth focus behavior,
requests a fresh focus command for each automatic stop and waits for ACK plus a
newer matching selection. Automatic navigation does not move keyboard focus.

All12 currently mapped model sequences/42stops use canonical order. Image-only
cerebellar orientation remains image-only. New tours must retain exact authored
URLs/source bindings; a missing next model target is a gap, never a skip or Finish.
Manual controls remain. Manual interaction, Escape, visibility/history, failures,
source/session replacement and model practice/other guides pause playback. Final
notes remain visible; no score, progress/completion or approval is recorded.

The 3D header displays compact original anatomical notes only after confirmation,
with expandable source/scope and the existing complete teaching below. Verified
facial-teaching holds still apply. Native Play opens folded inline comparison
learning notes. Scans/models are separate subjects: this is semantic comparison,
not spatial registration, flow simulation or a lecture-access grant.
Local source/test/build evidence, not signed-in desktop/browser/clinical acceptance:
F:/VisibleMedicine/staging/20261016-head-model-playback/NOTES.md.

## Inline comparison — 11 October 2026

Compare beside 3D Atlas keeps the current native scan open and embeds the existing
head-neck Atlas for an exact current-revision mapped concept. The model confirms
its actual selection through source/session/sequence-checked messages. A different
mapped model selection offers an explicit Show … on CT/MRI action; no patient
coordinates or scan files are sent into the model. Package replacement, quiz mode
and retired selections invalidate callbacks. Unmapped structures show an honest
unavailable state, not a fabricated counterpart. Per-structure route links below
retain the source-dependent tab behavior documented next.

Structure & learning is collapsed during comparison; Expand workspace uses
browser fullscreen, with Exit/Escape. This compares anatomy across subjects, not
registered patient space. Actual configured CT/MRI interaction verified; additional
manual-folder inline acceptance and compact short-window refinement remain separate.
Evidence: F:/VisibleMedicine/staging/20261011-inline-head-comparison.

## Current manual-folder acceptance — 11 October 2026

Configured-local SSD packages use same-tab selected/generic 3D comparison.
Manually selected folders open 3D separately with an explicit new-tab cue,
preserving the scan in its original tab without sharing File references.
The session provider still clears on departure/pagehide/unmount.

Actual approved-folder browser checks now cover both CT and MRI. Each manual
import displayed the File-session notice and Folder sharing control. Selected
Pons opened the exact source-pinned 3D brainstem/Pons in a separate tab, while
the original CT remained usable at axial slice 68/199 and MRI at 146/256.
Close atlas disabled search and offered explicit reopening without autoload.
No scans/masks were edited or uploaded; source manifest remained
`0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
Evidence: `F:/VisibleMedicine/staging/20261011-manual-folder-browser`.
This is specific local browser acceptance, not clinical approval or hosted
release acceptance. Source-bound teaching remains draft; subjects unregistered.

Historical notes follow; their blanket separate-tab statement predates the
current package-source-dependent behavior.

9 October 2026 — local-only website change.

The selected-anatomy **Find … on CT/MRI** and guided-learning **Continue this
step** actions now use client navigation in the current tab, with prefetch off.
They preserve the existing exact concept, sequence, step and source revision.
The **3D Atlas** action still opens separately so the scan remains available.
No new button, setting or toolbar has been added.

## Folder consent and limits

This uses the existing default-off Folder sharing control. The link itself does
not opt in or retain anything. With consent, the existing provider can supply
verified file references to the next CT/MRI viewer; the destination verifies its
own study and starts fresh practice. Without consent, another import is needed.
New tabs, refresh, Close atlas and departure keep their existing clearing rules.
No image, mask, answer, score or cursor is serialized, broadcast or uploaded.

These remain anatomical comparisons between different subjects, not spatially
registered scans. Missing or stale targets stay unavailable. The change does
not alter teaching, approval packets, source geometry, accepted masks, clinical
PACS, entitlements, dependencies or licensing.

## Evidence

`E:/VisibleMedicine-LocalStaging/20261009-head-imaging-handoff/` retains the
focused test logs, type check, unchanged Review verification, isolated build
and local response readbacks. Ninety-three focused cases pass, including actual
guided component links in both directions, exact step/revision preservation,
stale refusal, default-off sharing, provider clearing, import races and fresh
quiz state. The actual native viewer component test checks the selected-anatomy
link and its absence during a question. Existing 3D links remain separate.

The final saved-state file records the exact commit and preview session.
Scoped E recovery is same-machine only, not a verified GitHub/off-device backup.
No publication, private scan loading or clinical approval is claimed.

## Synthetic real-router verification — 10 October 2026

`F:/VisibleMedicine/staging/20261010-head-router` now contains a separate local
Vinext App Router fixture importing the actual folder provider, native viewer,
guided learning and practice components. Only the scan IO boundary is replaced
with a sentinel and tiny synthetic volumes. Production importer, authentication,
masks and source geometry are untouched. It is explicitly labelled synthetic.

Browser actions verified default-off CT → MRI → Back import prompts; opted-in
CT browse slice 5 and contrast 500/2500 restored on Back; independent MRI state;
exact Pons sequence step/revision retained across CT → MRI → Back; a concept
link taking precedence over the old browse slice; and fresh practice after
switching away from an active Midbrain question. Turning sharing off, opening
a new tab, leaving to `/atlas` or `/outside`, and refreshing each required a new
import. 155 focused navigation/session tests pass. No production defect found.

The fixture's favicon returned 404; no application exception was observed.
Its sentinel mask hash restricts practice eligibility, so the browser question
check used the first eligible Midbrain mask, not every structure. The owned
preview is stopped and the extra browser tab closed. Recovery is source-only
and local: `F:/VisibleMedicine/recovery/checkpoints/20261010-head-router`.
This verifies real client routing with synthetic IO, not signed-in production
pages, approved-folder hashing, actual patient display, clinical acceptance or
deployment. No new build was needed because production code is unchanged.

## Remaining real-scan user acceptance

With the approved local folder and Folder sharing enabled, follow a guided
step CT → MRI → CT and use the ordinary anatomy comparison. Verify the correct
destination scan/step appears, Back returns to the prior route, and practice
starts fresh. Repeat with sharing off and a new tab. Component tests and exact
asset readbacks do not prove loaded-patient behaviour through the real router.

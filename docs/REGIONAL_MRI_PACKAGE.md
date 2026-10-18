# Private regional MRI package foundation

13 October 2026. Implemented in `lib/regional-mri-package.ts` with synthetic
fixtures in `tests/regional-mri-package.test.ts`. This is a browser-safe, local
Education loader, **not a connected knee viewer, DICOM reader, release approval,
registration engine or replacement for the accepted head package**. No patient
data accompanies this source. No new dependency, asset or service is required.

## Source and package contract

`RegionalMriManifest` is the executable schema. Version 1 uses
`visible-medicine.regional-mri/1`, little-endian C-order K,J,I arrays (I fastest),
per-sequence RAS millimetres, `registration: none` and `local-private-draft`.
It supports separately identified MRI sequences; each image has a complete
shape/affine, scalar type, file and SHA-256. The manifest's own exact bytes are
pinned independently by the caller. Never calculate the trusted expected pin
from the folder being admitted and then call that source verification.

Annotations explicitly name their owning sequence and image checksum. Their
anatomy IDs are opaque semantic references, not automatic 3D mappings. Labels,
laterality, coverage and exact source review revision/scope are retained. Status
is source-declared `accepted-scoped`, `provisional` or `deferred`; it is **not** a
website approval, clinical signature, privacy clearance or publication grant.
Deferred entries have no display geometry. Points, curves and cropped binary
masks are supported without synthesizing missing anatomy.

Unknown fields, duplicate identities/assets, unsafe or case-colliding paths,
mixed folders, missing/extra/wrong-size assets, stale hashes, invalid geometry,
nonfinite image values and nonbinary masks are refused. File and volume limits
are explicit in the implementation. Assets are checked lazily before returning
their data. Reads, hashing and chunked scans respect cancellation. The immutable
manifest and package/series/overlay ownership checks prevent borrowing an entry
or geometry from another loaded sequence or package.

## Native and derived geometry

A `source-native` mask must exactly match its source image's parent shape and
affine; its crop is bounded within that grid. A `derived-source-ras` mask retains
its **own** parent grid, spacing, crop and source-specific `mappingRevision`.
It must never be relabelled acquired resolution. Its declared mapping still
requires source/export validation and radiologist review.

`regionalMaskAtImageIJK` performs nearest-voxel lookup into that mask within its
owning image's RAS space. It does not rewrite or resample the original mask,
align separate sequences or synchronize with generic 3D anatomy. The existing
native geometry helper exposes obliquity and refuses shear/ambiguous native
plane labels; unsupported acquisitions need a separately validated display path,
not a relaxed transform check.

## API and future viewer boundary

Use `openLocalRegionalMriPackage` for a browser folder, or
`openRegionalMriPackage` for separately supplied pinned manifest bytes and local
asset handles. `loadRegionalMriSeries` loads one exact sequence. Default
`loadRegionalMriAnnotation` loads only source-declared scoped-accepted geometry.
Private Review may explicitly request `inspectProvisional: true`; its returned
`purpose: provisional-inspection` must remain conspicuous and must **never** be
used as learner admission. Deferred/absent geometry stays unavailable.

Returned image and mask arrays are consumer-owned display copies, not immutable
clinical source records. Consumers must not mutate them and then claim the
display still matches the verified source. Mask lookup retains a separate private
verified buffer so public-buffer mutation cannot change its result. No uploads,
network calls, browser storage, filesystem writes or entitlement changes occur.

Before real knee integration: export and independently verify the specialist's
source arrays, effective transforms and annotation geometry without changing
accepted files; bind the exact private package revision; reconcile source review
and partial-coverage scope; add an authorized, cancellable sequence viewer and
Review interface; verify real native-plane appearance and then obtain the
owner's revision-bound sign-off. Public release/privacy and independent Atlas,
case and lecture access remain separate gates. The loader cannot establish
de-identification, absence of burned-in identifiers, anatomical correctness or
clinical acceptance from a checksum.

## Source-preserving private export

`scripts/regional-nrrd.mjs` decodes supported scalar 3D NRRD0004/0005 files
using Node built-ins only. Raw/gzip, eight numeric types and explicit RAS/LPS
grids are supported. Endian normalization changes byte representation only,
never voxel order or geometry. Detached files, label extraction, unknown
metadata fields, unsupported axes, nonfinite values and unsafe sizes are refused.
The generic decoder may parse valid oblique NRRD; the export compiler separately
applies the unchanged native viewer's geometry limits before any output.

`scripts/export-regional-mri.mjs` accepts a separately checked local export plan.
Every image/mask must have an independently pinned original file checksum,
canonical little-endian array checksum, KJI shape and RAS affine. These are
checked against decoded bytes; a full binary uint8 mask keeps its own grid with
zero crop offset. The exporter does not extract labels, crop, smooth, resample,
merge acquisitions or invent missing geometry. Supplied annotation IDs, source
review revisions/scopes, coverage, points/curves and provisional/deferred status
remain explicit. The unchanged package loader checks all output assets before
persistence. A private ownership proof prevents saving a forged or mutated
compiler result.

Run with an existing approved **private, nonhosted** parent directory and a new
output folder outside every Git checkout:

```text
node scripts/export-regional-mri.mjs --plan <private-plan.json> --plan-sha256 <independently-checked-plan-sha256> --output <new-private-folder> --private-root <approved-private-parent>
```

The plan schema is `visible-medicine.regional-mri-export/1`; see the synthetic
fixtures in `tests/export-regional-mri.test.mjs`. Never put the real plan, source
paths, scans, exported raw arrays or patient-derived geometry in the repository,
hosting assets or a public/synced destination. Root containment and Git-ancestor
refusal reduce mistakes; a directory name is not privacy clearance. Existing
destinations are never overwritten. A disk/write failure may leave an incomplete
new folder; do not admit it or infer success. No additional runtime dependency,
font, model, texture, fee or third-party dataset is introduced by these scripts.

The first private knee export has five native MRI sequences, 72 canonical
annotations (66 scoped-accepted, six provisional) and one separately identified
scoped-accepted native axial patellar tendon variant. Four deferred taxonomy
entries have no established sequence geometry and are not silently assigned to
a scan. All source arrays/masks remain unchanged. Per-sequence native RAS is
used deliberately: each accepted markup was compared with the scene and its
image parent transform; the common reversible scene display parent is retained
in private provenance, not used to claim cross-sequence synchronization. The
original sagittal tendon and independent axial tracing are not interchangeable.
Original grid serialization differences are retained rather than snapped to
another image grid. Interpolated mask resolution is never acquired detail.

Independent local SimpleITK/NumPy readback matched all 23 image/mask arrays and
55 markups; these validation tools are not shipped as website dependencies.
The 102 focused synthetic cases, fresh typecheck and protected Review verification
also passed. This is source/export evidence, **not browser, anatomical, privacy,
smooth-contour appearance or release approval**. Binary mask rendering does not
inherit the accepted Slicer surface-derived contour appearance. The existing
private Review route remains locked until a separately checked exact revision
is configured; no real scan is publicly served or embedded by this milestone.

## Opening a bound package in private local Review

The existing `/workspace/atlas-review/regional-mri` page now receives a source
binding only after the unchanged administrator authorization check. Development
metadata lives in the ignored `.local/regional-mri-review-binding.json`:

```json
{
  "schema": "visible-medicine.regional-mri-review-binding/1",
  "revision": "<independently verified manifest SHA-256>",
  "label": "Private regional MRI source inspection",
  "region": "knee"
}
```

The revision is an independent prior source check, **not a hash obtained from
whichever folder the browser is asked to open**. No private source path, scan,
approval, user identity or registration parameter belongs in this metadata.
Malformed/oversize/duplicate/linked configuration is refused. Missing metadata
leaves Review locked. A local virtual module exposes only the sanitized pin,
label and region to development server environments; client modules and every
production build receive `null`. The runtime helper independently stays disabled
outside development. Builds never read the local binding.

The preview must remain loopback-only with Vite strict filesystem rules. The
plugin checks final resolved configuration, including late CLI overrides, and
retains existing default/custom denies while blocking direct and transform file
access to the binding. Git ignore alone does not prevent dev-server disclosure.
This uses the installed Vite compiled deny matcher; an absent/unknown matcher
fails closed and needs revalidation after Vite upgrades. No transport endpoint
serves regional scans or masks, and no authentication or permission is changed.

**Restart local preview after changing or removing the binding.** It is a pinned
development snapshot, not a hot-revocation mechanism. Keep the original source
and accepted specialist scene unchanged. Open private Review with an authorized
account, choose the complete prepared `education-package` folder, then choose a
sequence and structure. Files are read in the browser without upload. Provisional
geometry requires the existing explicit inspection-only option. Opening data
does not approve it or release it to learners; native binary contours do not
inherit accepted surface-derived Slicer display appearance.

The first knee source is now configured locally. Verification includes 62 passing
focused cases and one existing Windows symlink-privilege skip, fresh types,
protected Review verification and production build. A 741-text-artifact build
scan found none of the 27 private binding/array identity needles. Five direct,
transform and encoded metadata requests returned403 without the pin; anonymous
Review remained guarded and its API returned401/private,no-store. Late public
host and permissive-FS Vite resolution probes refused before listening. These
are source/runtime-boundary checks,not signed-in/browser/GPU,clinical,privacy,
smooth-appearance,spatial-registration or public-release acceptance.

## Source-bound comparisons with the existing 3D Atlas

Private regional Review now offers a collapsed **Compare in 3D · reference only**
section after a selected annotation's package, sequence and overlay have been
verified. Current knee mappings are authored semantic drafts, not clinical
correspondence or patient-space synchronization. A server projection checks the
matching Review/learner/reference-viewer source revisions and exact canonical
catalogue identities; compact public bundle pins and labels are also rechecked
by the consumer. Mapping SHA-256 is provenance, not permission or approval.

Same-side BodyParts3D references stay distinct from the independent **right-sided
UM knee specimen**. A left MRI opens the right specimen only with an explicit
opposite-side/not-mirrored warning. Whole bones are parent references; meniscus
and cartilage source groups are not separately segmented subcomponents. Missing
nerves and the unresolved patellar tendon/ligament alias get no substitute.
Provisional MRI geometry remains explicit private inspection, never learner
admission. These mappings and the reference geometry still need clinical review.

Links contain only public reference IDs, bundle/navigation pins and the Atlas
source revision: no MRI revision, annotation ID, source sequence, patient data,
coordinate, token or return URL. The existing body and lower-limb pages validate
the Atlas revision and relay only their canonical navigation fields to the
unchanged generated modules. Stale or mixed references fail rather than falling
back to another structure. No scans are uploaded or served, no 3D model is
mirrored/registered, and Atlas, imaging-case and lecture access remain separate.

## Side-by-side source inspection and temporary worksheet

Within the collapsed comparison section, **Inspect … beside MRI** keeps the
selected native slice and its controls open while loading the existing body or
independent lower-limb 3D runtime. No additional 3D model/viewer is created. The
reference is optional and closes without discarding the MRI or slice position;
changing folder, sequence, annotation or provisional-inspection mode retires it.
The MRI and reference occupy adjacent desktop panels, with responsive stacking
at smaller widths. Keyboard focus moves into the panel and returns to its opener.

The inspection context retains the exact verified package, image/sequence,
annotation/review scope and revision, geometry-grid distinction, semantic mapping,
Atlas commit, target side/parent/group and source/navigation pins. The iframe
receives only public reference navigation. A public manifest GET with omitted
credentials and no redirects checks the current generated source/region and
retained model hash before frame creation. A changed source fails closed.

**Frame loading is not confirmed anatomical selection.** These body/specimen
modules currently have no verified live-selection acknowledgement; their user
interactions do not move the MRI. Manifest fetching and iframe navigation are
separate operations, not an atomic geometry attestation. No patient registration,
mirroring, automatic reverse navigation or camera synchronization is claimed.

The closed inspection checklist is a temporary, browser-memory visual worksheet,
not a clinical decision or saved review. Source changes and reloads reset its
ticks. Full source/review/mapping identities are available in that disclosure
for inspection; private MRI fields are not sent to the frame, network, storage or
downloads. No save/approval/inbox-count action is added. Persisted decisions need
a separately, independently verified server-side annotation projection first;
neither client-selected metadata nor the semantic mapping digest supplies that
authority. This is an independent remaining implementation gate, not a reason to
pause other useful Atlas development or to invent clinical acceptance.

## Independently prepared private server review context

The local development server can now prepare an exact annotation projection
from the independently bound manifest, using the optional ignored environment
key `VM_LOCAL_REGIONAL_REVIEW_MANIFEST`. It must name the existing `manifest.json`
under the private `../private/regional-mri` tree, outside the website and any Git
checkout. No source file is copied into the repository, served or modified.
The ignored source binding remains the independent expected manifest SHA-256.
The selected browser folder cannot supply this authority.

The existing manifest validator is reused after detached-byte SHA verification.
The projection retains ordered sequence/image identities and per-sequence
annotation IDs, labels, side, coverage, source review status/scope/revision, and
geometry kind/grid distinction/mapping and mask identity hashes. Repeated anatomy
in different sequences is not collapsed. Spatial arrays, affine matrices, mask
crops, point/curve coordinates, image pixels and asset paths are omitted. Scope
text is still private metadata, not a privacy-cleared public dataset.

This is **host-owned development preparation**, which may run eagerly during
server module loading, before a visitor page's authorization function executes.
Authorization gates runtime disclosure/use and future decisions; it is not
claimed to prevent host-side startup preparation. A dedicated server-only
virtual module is `null` in client/unknown environments and production builds
without reading the source. There is no source or projection HTTP endpoint.
Actual source loading requires completed strict-loopback/root/filesystem-deny
validation, including direct native hook calls. The entire private source root
is denied through Vite's resolved rules and compiled matcher, preserving existing
default/custom denies. Bounded regular nonlinked file checks, identity checks,
Git-ancestor refusal, exact independent source pin and generic errors remain.

The development runtime helper rechecks an exact metadata whitelist, unique
per-sequence identities, source/region, status/grid consistency and canonical
projection digest, and returns frozen metadata only after the existing page's
authorization gate. The closed Review context disclosure shows readiness, counts
and the context revision, not an approval or global pending count. The digest
identifies a prepared source snapshot; it is not authentication or sign-off.
Changing the source binding or environment locator requires preview restart;
this is not hot revocation. Private saved corrections/history are the next step
and are not enabled by this foundation alone. Clinical/privacy/release approval,
accepted masks, desktop PACS and separate product access remain unchanged.

## Private annotation correction drafts and history

After selecting and verifying geometry, open **Private correction draft and
history** in the selected source scope panel. It is closed by default and makes
no request until opened. Source files still load locally; correction requests
send bounded text/checks and metadata to the existing same-origin private review
store, not image pixels, masks, coordinates or scan files. Do not enter patient
identifiers or paste scan data into notes.

The API independently obtains the development-only server projection after the
existing runtime authorization gate. Selection headers identify the expected
source/projection/sequence/annotation; private IDs are not added to URLs. The
server resolves the actual sequence/image/annotation/review/geometry metadata,
rejects changed or client-forged context before storage, and uses the existing
account-and-institution principal. Production/null context cannot save. Startup
source preparation can still be eager; this is not auth-before-filesystem-read.

Draft or changes-required notes, three inspection checks and attested:false are
the only writable fields. No clinical approval, publication or registration
authority is provided. Partial, derived, source-scoped and provisional statuses
remain unchanged. These are MRI-source correction drafts, not 3D correspondence
decisions, and no generic reference is silently treated as the same specimen.

Append-only history uses an isolated namespace within the existing review table.
Each exact source/projection/sequence/annotation has its own version stream;
changed sources do not inherit prior corrections. Earlier streams remain stored,
but this interface reads only the currently bound source. The conditional INSERT
checks the expected maximum version atomically, so competing saves cannot replace
earlier rows. No schema, migration, account or entitlement changes are required.

Failed or uncertain saves preserve in-memory notes and disable another save until
latest history is loaded and the reviewer explicitly keeps their edits against
that displayed version. Account/institution changes retire the old context.
Older-history pages do not overwrite the working draft. Clean same-account reloads
can adopt the latest saved draft; dirty reloads cannot silently raise its base
version. Source changes ask before discarding unsaved or unconfirmed corrections,
and browser navigation gets a dirty/in-flight-save beforeunload warning where
supported. Closing the disclosure does not discard text. Unconfirmed notes are
not a durable backup; save and confirm history before shutting down.

An in-place source/projection refresh while this viewer remains mounted retains
the old dirty session instead of silently replacing it. Its source controls and
save requests are retired; the notes become copyable/read-only until the reviewer
explicitly discards them and opens the current source. This does not survive full
component removal, browser crashes or operating-system termination.

Verification includes exact synthetic contract/API/route/UI cases, Node SQLite
and an isolated local Miniflare D1 conditional-save race, plus affected existing
regional/head-review checks. Authoritative final counts, type/build/privacy and
anonymous guard checks, preservation and source-only restore evidence are under
F:/VisibleMedicine/staging/20261013-regional-corrections and its recovery terminal
checkpoint. Synthetic fixtures are not signed-in browser, clinical, visual or
real-cloud deployment acceptance. No live private correction was created during
verification, and no scans, accepted masks or desktop PACS were changed.

## Keep and restore an unfinished private working copy

Open the selected annotation's **Private correction draft and history**, then
**Private working copy · keep unfinished notes**. Download a working copy before
closing the page when edits are unfinished or a save cannot be confirmed. The
download is text/checks and exact source/account-context metadata only, including
whitespace and short changes-required notes that are not yet valid to save.
It contains no scan pixels, masks, coordinates, credentials or approval. Keep the
file private; do not put it on GitHub or in hosted artifacts. A download request
does not confirm the browser successfully saved the file to disk.

To restore, open the same verified source sequence/annotation and load its current
authorized history first. Choose the JSON file using **Restore private working
copy**. Reading stays in the browser and is bounded to 65,536 bytes before/after
the read. Source/projection/annotation/review/geometry context and account context
must match exactly. Mismatched, malformed or approval-bearing files are refused
without changing notes. Replacing existing unfinished notes asks for confirmation.
Source changes, closure, other loads/saves or unmount retire a pending file read.

Restored text is an unsaved draft, never saved history or approval. Its recorded
baseVersion is informational and is not adopted for saving. **Reload latest
history**, compare it with your restored text, then explicitly **Keep my edits
against latest history** before using **Save private draft**. The server still
checks the actual source, account/institution continuity and current version.
No import can bypass those checks or change scans/masks.

A retired dirty source can still download its held working copy, but cannot
restore/save into that retired source. Closing the disclosure preserves its
recovery context so a soft source refresh does not hide the retained text.
In-flight or uncertain saves are recorded as uncertain in the working copy, not
confirmed. A full crash is recoverable only from a file already kept or confirmed
server history; no automatic browser-storage backup or background upload exists.

The inbox now calls this existing separate workflow **Regional MRI inspection ·
corrections and recovery**. It remains outside the loaded pending-review counts;
the label does not claim that private drafts have clinical approval or learner
release. Verification/restore evidence: 20261013-regional-working-copy under the
F-drive staging and recovery checkpoint roots. Signed-in browser behavior and
clinical/privacy/release acceptance remain separate.

## Private knee guided inspection

After opening a verified sequence in Regional MRI Review, expand **Guided
learning · this sequence**. Choose **Cruciate ligaments** or **Collateral
ligaments**. Each path keeps its two canonical slots, even when a structure is
missing. A sole accepted-scoped candidate loads after the explicit step choice
and jumps to saved geometry focus in the current native plane. Multiple source
variants require an explicit candidate choice; provisional/deferred geometry
is not admitted to guided teaching. Other sequences and nearby anatomy are
never substituted. Partial and derived-grid limitations remain visible.

Previous/Next changes the fixed step, not a score or approval. Failed or
unavailable steps do not retain the preceding overlay/reference. Manual source
selection exits the guide; pending loads retire. Unsaved/unconfirmed correction
edits still require explicit discard confirmation before changing annotation.
Leaving a pending guide cancels its load. Scan window and native plane are
retained; focus follows the current committed plane, not an earlier async request.

After geometry verification, **Show this step’s 3D reference options** opens
the existing comparison disclosure with keyboard focus on its summary. Its
original same-side/opposite-side, group/parent and exact public source checks
remain unchanged. References are separate subjects, not mirrored or registered
scan overlays. There is no new live model-selection/camera acknowledgement.

Short original concept captions cite primary cadaver research. Their teaching
version and exact MRI package/sequence/image context are in a closed disclosure.
They are private review drafts, not learner release or diagnosis. MRI correction
saves do not approve teaching/3D correspondence; no completion count or approval
is invented. No publication assets, new fonts/dependencies or fee-bearing
services are imported. Source/evidence/recovery: `20261013-regional-guided-study`
under the F-drive staging/recovery roots. Browser and clinical acceptance remain
separate from synthetic checks.

## Retained specimen focus during private guided inspection

The existing lower-limb specimen now supports a source-bound public selection
channel. After explicitly opening a specimen beside a verified MRI annotation,
moving to a compatible guided step retains the same iframe and model view.
The earlier reference is visibly suspended while the next MRI geometry verifies;
temporary checklist ticks clear and cannot authorize focus. Once verified, a
unique compatible reference is requested. Missing, ambiguous, failed or changed
source families close it without choosing a substitute. Manual annotation/series
selection retires it. Closing during verification cannot reopen it later.

Compatibility requires the exact public runtime, model bundle, navigation and
Atlas/mapping revisions, source side and relation, MRI package/sequence/image,
MRI side and provisional state. Annotation/target IDs may change only within
that family. No MRI identities, coordinates or private source metadata enter
the iframe URL or channel messages. Body references retain their existing
loaded-but-unconfirmed behavior; this is not a second 3D/PACS application.

The host accepts messages only from the exact same-origin iframe window, with
closed version/revision/session/sequence/command envelopes. A focus acceptance
alone never confirms selection: a newer exact model snapshot is also required.
The initial snapshot, stale command, malformed envelope, other selection, hidden
page, practice, active model guidance, load failure, suspension and unmount cannot
carry a previous confirmation forward. New readiness or iframe load starts a
fresh session, including same-window reload. Returning to a visible loaded frame
also requests a fresh snapshot. A stalled channel expires after seven seconds;
retry uses a fresh session or reload when readiness is unknown.

The named-selection report is not an anatomical MRI match, patient-space
registration, mirroring, completed camera transition or clinical approval.
The right-sided specimen and left-sided MRI remain separate subjects, with
source-reported side/group/parent limits visible. Existing smooth camera and
reduced-motion behavior remain model-owned; no GPU completion is inferred.
Correction history, masks, scans, source acceptance and independent entitlements
are unchanged. Verification/recovery: `20261013-specimen-website` under F-drive
staging/recovery roots. Browser/GPU/clinical acceptance remains separate.

## Source-bound reference teaching beside a verified MRI selection

In Regional MRI Review, select an accepted-scoped annotation and expand
**Reference teaching · Draft**. The panel stays closed by default and resolves
only after the exact current MRI geometry and its declared public 3D mapping
have verified. A single reference can be shown directly; multiple references
require an explicit target choice. No first-match or nearby-anatomy substitute
is chosen. Provisional, pending, failed, retired and unmapped selections withhold
teaching. Closing, changing topic/target/source or unmounting retires old content.

The compact topic selector reuses the existing Atlas drafts for Anatomy,
Function, MRI, CT, X-ray, Ultrasound, Pathology and Clinical. Missing source
topics remain explicitly pending. Source-authored reflections are folded and
unscored, with a separate explanation reveal. Sources and the exact content
revision are folded too. No new medical prose, publication images, fonts,
dependencies, fees, storage or paid-lecture access are introduced.

These notes describe the selected **reference**, not findings on the scan and
not a confirmed live model selection. Same/opposite source side, unmirrored
independent specimens and whole-parent/group limitations remain explicit.
The current public projection contains 35 target/relation packets, 280 topic
slots (276 existing drafts and four pending) and 35 original reflections; these
are not 35 MRI segmentations or a claim of anatomical completeness.

The authorized route builds the projection from current canonical source pins,
navigation and teaching. Entry digests bind the Atlas/mapping revisions, target
identity and all projected content. The resolver checks loader-owned current
MRI context and an exact unique target, detaches content before asynchronous
digest checking and returns an immutable owned result. Digest integrity is not
authorization or clinical approval. Saving MRI corrections does not approve
teaching or 3D correspondence. No coordinates, private source identifiers or
scan data are projected into this teaching catalogue or a model message.

Verification: 182 focused checks, fresh types, protected Review verification
and full website build pass. Production privacy scan and anonymous access guards
pass; signed-in/browser/GPU behavior and clinical acceptance remain unverified.
Existing source scans, accepted masks, original test bodies and unrelated work
are preserved. Evidence and scoped source-only recovery:
`20261014-regional-reference-learning` under F-drive staging/recovery roots.
No deployment, new website GitHub backup or off-device backup is claimed.

## Inspect the exact projected teaching draft in Clinical Review

After **Reference teaching · Draft** resolves for the current MRI selection,
**Review this exact teaching draft** opens a protected read-only page separately,
preserving the MRI workspace and unfinished correction notes. The link retires
with the displayed proof when source, target, topic or open state changes. A
pending topic can still link to its exact eight-topic packet; no pending topic
is presented as completed teaching.

Only five public fields travel in the URL: `target`, `relation`, `atlasRevision`,
`mappingRevision` and `teachingRevision`. No MRI package/image/annotation
identity, proof key, coordinates, scan paths or private return URL is included.
Fabricated or recomposed client proof objects cannot create this link.

The protected destination is
`/workspace/atlas-review/reference-learning` with that exact public tuple.
Authorization is checked before source configuration or catalogue access. The
server builds current canonical reference teaching and refuses malformed,
duplicate, absent, altered or stale identities rather than opening a substitute.
The resolver independently checks the public mapping/content digests and target
identity, detaches all inputs before asynchronous checks and freezes its result.
The route does not accept client content as authoritative review material.

The page contains all eight source topics and their readiness, references,
limitations, folded original reflection/answer and folded exact revisions. It
does not carry scan identity or establish an MRI-to-reference match. This is
**draft inspection only**: no saved notes/decision/approval controls, new API,
score or publication permission. Existing source worksheet decisions do not
approve this projected snapshot; it is outside the inbox's saved-status counts.
Private correction history for this exact projected packet remains future work.

Verification: 211 final combined tests, fresh types, protected Review
verification and full website build pass. All 35 current target/relation packets
resolve in canonical-public-metadata tests; actual loader-owned synthetic MRI
tests cover body and specimen links. 767 production texts contain none of29
private identity needles;19 anonymous HTTP checks, including ordinary/RSC and
valid/stale/duplicate protected review links, pass. Signed-in/browser/GPU and
clinical acceptance remain separate and unclaimed. Earlier fixture, test-path
selection and harness type diagnostics are retained with their corrections.
Evidence/recovery: `20261014-reference-learning-review` under F-drive roots.
The preceding teaching checkpoint's terminal record proves44 absent paths, not
the42 written in its earlier narrative; its original evidence remains intact.

## Private correction history for an exact reference-teaching draft

The exact teaching page now has **Private correction notes**, closed by default.
This supersedes the earlier read-only-notes limitation: the teaching snapshot
itself remains immutable, while private notes are separate. Opening the panel
loads your account/institution-scoped history. Choose Draft notes or Corrections
requested, enter notes and optionally mark four consideration checks. These are
not approval checks. **Save private draft** appends a version; it does not edit
teaching, approve an MRI-to-3D correspondence or publish anything. Do not enter
patient data. This separate workflow remains outside the inbox's saved-status
counts and source worksheet decisions.

History is bound to the exact public Atlas, mapping, teaching, target and
relationship identities. It does not include MRI identity or scan coordinates.
The server authenticates first, reconstructs current canonical reference
teaching, resolves the exact selection, then checks the entire submitted
correction context. Invalid/stale requests or approval-bearing drafts are
refused before a storage query. Existing same-origin/body limits and account/
institution continuity remain. No schema or permission changes are needed.

The existing append-only review table uses an independent private namespace and
`teaching` track. Conditional expected-version INSERT prevents two competing
saves from both winning. Reads verify storage success, every row/payload/context
envelope and descending version order, with20-entry pages. Changing account,
institution, target, relationship or revisions cannot inherit another stream.
Failed storage is not an empty history or a successful save.

Refreshing history never overwrites notes or silently adopts a newer base.
After a version conflict or unconfirmed save, refresh current history, compare
the entries, then explicitly **Keep my edits against latest version**. Only a
fresh successful same-context read enables that choice. Account/source changes
retire saving; retain/export text and reload rather than rebasing to a different
owner. Closing retains edits and retires pending responses. An interrupted save
may have committed, so discard/export must not claim its outcome is known.
Source changes hold the old copy read-only until explicit current confirmation
discards it. Stale confirmations, callbacks and speculative renders cannot
consume that confirmation or silently discard/rebase a replacement copy.

**Export working copy** downloads local JSON with the exact public context,
notes, informational base version and unsaved/uncertain state, using a generic
filename. Confirm the file saved and keep it private. This is not a saved server
event, approval, automatic browser-storage backup or a restored draft; file
import is not part of this increment. Full navigation/crash recovery still needs
a previously exported file or confirmed saved history. beforeunload is advisory.

Final238 combined tests, fresh types, protected Review verification and full
website build pass. Actual SQLite and isolated local Miniflare D1 tests prove
conditional version races; synthetic component tests cover dirty/uncertain
copies, fresh comparison, committed source retirement, destructive confirmation,
StrictMode replay and abandoned renders.775 production texts contain none of29
private identity needles;21 anonymous HTTP guards pass, including the new API's
GET/POST401 private,no-store. No live private note was submitted. Signed-in/
browser/clinical acceptance is not inferred. Initial worker fixture/lifecycle
failures and two type diagnostics remain in evidence. Source scans/masks,
private arrays, generated modules, access, original histories and desktop PACS
are unchanged. Evidence and scoped recovery:
`20261014-reference-teaching-corrections` under F-drive roots. No deployment,
new website GitHub/off-device backup, new assets/fonts/dependencies or fees.

## Finding exact reference teaching drafts — 14 October 2026

In **Clinical Review inbox > Other review workflows**, open **Regional reference
teaching · draft catalogue and private corrections**, or visit the protected
`/workspace/atlas-review/reference-learning` page without a query. Authorization
precedes source/catalogue access. No scan needs opening first. Unknown or partial
query parameters refuse rather than switching into browse mode.

The current source offers35 reference target/relationship packets (26body/nine
specimen), with search, source/side/relationship filters and12 rows per page.
Parent/group relationships and pending topics remain explicit. These source
totals are not MRI annotations, saved corrections, completed teaching or clinical
approval counts.276topic slots are source-authored drafts and four pending.
Exact Atlas/mapping revisions are folded; each Open draft link carries only the
five validated public reference fields and its own exact teaching revision.

All packets must resolve against the current canonical projection before any
list is displayed; invalid/stale/duplicate/inconsistent identities refuse the
whole index. The display contract independently checks link/metadata consistency,
readiness totals, limits and duplicates, not clinical authority. Inputs are owned
before the first async digest and results detached/frozen. No private scan
identity/path/coordinates or teaching prose/notes/history travels in this index.
Opening the catalogue does not load private notes; those remain lazy on the
exact draft page. The source-pinned Regional MRI page and test remain identical
to their prior checkpoint after an incidental discovery shortcut was removed.

Final247tests/fresh types/Review verification/full build pass;779 production
texts freeof29 private needles;23 anonymous HTTP guards pass. First Review
binding refusal is retained in review-1.log; no verifier weakened. Canonical35
packet/link/digest, source ownership, malformed data, auth ordering and client
filter/page/accessibility tests are included. No signed-in/browser/clinical
acceptance, live private write, registration or deployment. Evidence and scoped
source-only recovery/restore: `20261014-reference-teaching-catalogue` under the
F-drive roots. Private source arrays/masks, generated modules/access and desktop
PACS are unchanged; no new website GitHub/off-device backup, fees or assets.

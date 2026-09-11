# Compact imaging comparison host

Status: implemented integration foundation, September 2026. An optional [decoded-volume reslicer and Canvas renderer](VOLUME_VIEWER.md) is now available to host integrations. No patient image, CT/MRI loader, segmentation, clinical registration or connected production adapter is included. The disconnected atlas retains its existing controls and anatomy. This advances [the reference-clip direction](VIEWER_CT_REFERENCE_DIRECTION.md), not the completed imaging product.

## User flow

When an integration registers both the existing identity bridge and the comparison bridge with the same adapter ID, a **Compare CT/MRI** button appears above the regional model. Opening it adds the teaching image alongside the model on wide screens. At 1,100 CSS pixels and below, Anatomy/Image choices show one pane at a time rather than stacking two tall workspaces. Closing comparison leaves the model subtree mounted, preserving the existing camera, dissection and explode state. Escape within the comparison returns focus to its launcher.

The image mounts only when linked selection is enabled, practice is off, and the supplied image maps to the selected exact anatomy ID and source hashes. There are explicit disconnected, paused, no-selection, unmapped, source-mismatch, loading, denied and error states. None mounts an old image or substitutes a nearby structure. Opening comparison does not grant imaging or lecture access. Entering practice closes comparison; it does not silently reopen afterward.

This revision is always **Teaching comparison · not spatially registered**. No slice plane is drawn through generic anatomy. Existing dissection can remain exploded because it is explicitly an unregistered teaching comparison. Future spatial mode must require assembled anatomy, validated frame/transform evidence and reversible return to dissection; it cannot merely remove this label.

## Host contract

`lib/imaging-comparison.ts` provides `comparisonBridge` (or `createComparisonBridge()` for isolated tests). A trusted same-document host registers:

- `id`, `label`, and `modality` (CT or MRI); ID must match its `imagingBridge` identity adapter.
- `onPlane(plane)` and `onSlice(zeroBasedIndex)` callbacks, synchronous or asynchronous.
- `mount(element, frame)`, which renders the host's already-authorized teaching image in the owned slot and returns a synchronous cleanup function. Dispose all renderer resources/listeners; do not move the atlas DOM or change its camera.
- An initial frame with integer `revision`, `status`, `plane`, zero-based `slice`, positive `sliceCount`, and exact mapped anatomy `{id, sources: [{file, sha256}]}` when ready.

Registration returns `update(frame)` and `dispose()`. Frame revisions must increase for the entire registration, including study/series changes. Publish `loading` with null anatomy before requesting new imagery; then publish a newly authorized ready frame only if that request still belongs to the current selection/study. Never reuse the old frame while fetching another patient's/study's image. Publish `access-denied` and revoke/unmount imagery when access expires. A study/series swap needs a fresh revision even if the structure name is unchanged. Do not confuse adapter frame revision with a DICOM frame number.

The bridge retains only the specified identity/control fields, makes its snapshots immutable, rejects stale controls and updates, bounds slice requests, catches renderer/control failures and prevents old disposers from removing a replacement viewer. It does not fetch URLs or persist data. The existing identity bridge remains the authority for opt-in, side/scope selection and aggregate/component choices. The host must supply an explicit reviewed crosswalk, not infer IDs from names or bounding-box centres.

The mount callback is trusted application code, **not a sandbox or authorization boundary**. Actual study identity, orientation labels, correct displayed slice, window/level, privacy, source rights, server-side entitlements and asynchronous cancellation belong to the host and must be independently verified. Registering an adapter or setting `ready` does not establish clinical or publication approval. Protected payloads must not be fetched merely to advertise a locked resource. Atlas, imaging and paid-lecture entitlements remain independent.

No global window API, postMessage listener, arbitrary URL importer, local storage, uploaded scan or remote service is added. No package, model, font or texture dependency was introduced; existing license notices remain applicable.

## Actual CT-head export inspected read-only

The CT-head task's current export declares `elivion.cth.annotations.draft.v0.2`, taxonomy `Enhanced_v0.2-draft, 600 stable codes`, revision `posterior-fossa-extent-review-r5-20260910`, and `release: NOT_FOR_PUBLICATION`. Its keyed annotations include `atlas_code`, `laterality`, `parent_code`, `status`, `approved`, `geometry`, `label_anchor`, `provenance` and geometry/review histories. Those fields are evidence of a Slicer/annotation workflow, not a ready web-viewer interface.

The restart record explicitly defers canonical export and publication, preserves scoped cerebellar/medullary edge decisions and identifies outstanding midbrain corrections. MRI privacy and clinical review remain pending. No local case identifier, patient geometry, mask, volume, workbook, clinical decision or source file was copied into the site. No CT-task artifact was modified.

Next, define a versioned crosswalk from exact `cth.*` entries and geometry IDs to Visible Medicine source-bound anatomy IDs. Deduplicate aliases that share a geometry ID; distinguish component, aggregate and true equivalence. Local boundary acceptance must not be promoted into whole-entry, crosswalk or publication approval. Verify release/privacy/rights clearance independently before obtaining any browser-deliverable scan.

## Checks and remaining work

Run `npm run imaging-comparison:test`, `npm run imaging:test` and TypeScript validation. The focused suite covers immutable snapshots, source and side rejection, non-ready states, stale handles/revisions, bounds, synchronous/asynchronous errors, one-owner cleanup, linkage with the installed identity bridge, actual component server rendering and a control-free disconnected atlas. Fixtures contain synthetic identities only: no fabricated anatomical diagram or patient image is shipped.

Real browser/touch/keyboard layout, focus and renderer disposal, orientation/registration, slice correctness, volume/codec performance and clinical acceptance still require integration/device review. Next implement the actual rights-cleared host renderer; then same-study axial synchronization and optional four-pane MPR. The user's radiologist sign-off must name the reviewed revisions and scope. The atlas improvement goal remains active.

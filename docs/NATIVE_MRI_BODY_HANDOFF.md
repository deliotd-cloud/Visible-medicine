# Existing body Atlas ↔ native regional MRI

Local website implementation, 14 October 2026. This extends the separate
specimen-reference workflow; neither protocol replaces the other. It is semantic
anatomical navigation, **not patient-space registration**, mirroring, a clinical
match, synchronized cameras, or permission to publish private imaging.

## Use

Open the protected **Clinical Review → Regional MRI** workspace. Load the bound
local package, select an eligible annotation and open its same-side body
reference. Within that existing leg or thigh Atlas frame, select another mapped
structure. When a unique supported annotation exists in the current MRI sequence,
**Show [structure] on MRI** explicitly focuses its saved geometry. Simply rotating
or selecting in the model never changes the MRI or switches sequences.

An unmapped selection shows a no-link message. **Restore requested selection**
requests a fresh model session. Identity includes the public structure ID, source
bundle, laterality, protocol kind, Atlas revision and applicable scope/navigation
revision—not just the structure name or ID. A same-ID/different-source report must
remain browsing, not be described as the requested selection.

Compatible source families retain the model frame and camera while renewing the
selection session. A new target's bundle must exist in the verified manifest,
including when that manifest request was already pending. Incompatible references
mount a separate frame; no replacement anatomy is silently substituted.

## Boundaries

- Actual package, sequence, overlay, authored mapping and original inspection
  objects remain required. Serialized/copied reports cannot grant authority.
- Exact same-origin iframe, source revision, leg/thigh region, session and
  monotonic command/report sequences are checked. Fresh matching focus ACK and
  selection snapshot are both required before initial confirmation.
- Reverse navigation requires one unique authored same-structure, same-side root
  mapping and one accepted-scoped, nonempty annotation in the current sequence.
  Held duplicates, parent/group references, provisional annotations, opposite
  sides, stale mappings and other sequences do not qualify.
- MRI source/image readiness, active practice, pending geometry, close/unmount,
  hidden pages and unsaved-correction protections remain in force. Closing or
  renewing a session retires old callbacks and opaque selection proofs.
- Only public Atlas identities enter the model channel. MRI source identities,
  annotation IDs, labels, images, masks and coordinates do not.
- The owner's desktop clinical PACS, source masks and accepted boundaries are
  unchanged. Didanix Education/light remains the only web-viewer integration scope.

## Verification and remaining acceptance

Focused component/controller/ownership tests include both leg and thigh,
asynchronous source-message transport, different bundles, stale/foreign/copied
reports, missing bundle manifests, compatible frame retention, practice, dirty
correction and close/pending-load races. The original 21 inline and 52 parent UI
test bodies are retained.

The actual read-only local-package probe found eight eligible annotation
occurrences across three sequences: 14 ordered within-sequence handoffs,
including eight between different bundles, and 42 native-plane focus/visible
geometry checks. Fourteen copied and fourteen retired reports were refused.
All 38 originals, 23 arrays and the package manifest remained unchanged. These
are loader/channel/render checks, **not signed-in browser/GPU or clinical
acceptance**. No patient pixels, masks, coordinates or identifiers are copied
into source recovery or public artifacts.

Current verification/recovery status is authoritative only in the terminal
checkpoint, not this document's existence:

`F:/VisibleMedicine/staging/20261014-body-channel-website/terminal-checkpoint.json`

The radiologist still reviews anatomical correspondence, laterality, coverage,
native focus and reference limitations against exact revisions. Public release,
privacy clearance and any future spatial registration require separate evidence.

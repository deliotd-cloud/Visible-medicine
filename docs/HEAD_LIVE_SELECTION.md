# Live 3D head comparison focus

The normal Head & neck 3D page now follows the active model selection. Existing
exact-source mappings select CT/MRI links and linked reference teaching for the
33 authored concepts, including supported nested components. Selecting unmapped
anatomy (including neighbouring spine, thorax and shoulder-arm IDs shown in the
head region) or clearing selection clears the previous comparison instead of retaining
a misleading label. The existing anatomy picker remains available when ready.

Practice, in-model guidance and loading/failure states disable comparisons and
hide linked answers. Website-linked tour pages intentionally retain their fixed
authored tour-step focus and existing navigation. No extra permanent sidebar was
added; reference teaching remains in the existing collapsed disclosure.

The host validates the exact iframe, same origin, compiled Atlas Git revision,
random per-load session, monotonically increasing sequence and exact payload
schema. Nested IDs, source hashes, parent hashes, study and laterality must match
the existing registry. Unknown or stale messages cannot manufacture a mapping.
Both iframe-ready and load initiate a handshake, avoiding listener timing races.
Unmount clears the published state. A generated revision receipt prevents the
exporter from labelling an older compiled channel as a newer source revision.

These links compare separate reference subjects. They do not align patient
coordinates, synchronize slices, infer correspondence, open imaging automatically,
grant access, approve anatomy or alter Didanix desktop/PACS. Existing CT/MRI
source revisions and independent resource/lecture access gates are unchanged.

Verification is recorded under
`E:/VisibleMedicine-LocalStaging/20261008-live-selection-source` and
`E:/VisibleMedicine-LocalStaging/20261008-live-selection-integration`.
Parser and executable host-lifecycle tests cover all authored mappings, rejection,
replay, ready/load races, mode gating, clearing and cleanup. Affected regional
component checks retain their no-provider behavior. Signed-in native-image and
clinical acceptance remain separate; no draft has been marked approved.

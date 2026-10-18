# Native CT/MRI opening states

Local-only UI improvement, 17 October 2026. No source package, accepted mask,
anatomy boundary, desktop PACS, authentication or access change.

The native head viewer now distinguishes checking for a configured local source,
opening/verifying its package, loading the native study, a failed study, explicit
close, and absence of an automatic source. Unknown availability is not described
as a missing source. Cancelling the initial check offers Resume local atlas;
closing an admitted source offers Reopen local atlas and does not silently reload.
The existing guarded native-image retry is visible even when only the failure
flag is populated. Failed reads cannot remain labelled as opening indefinitely.
Manual folder help is collapsed by default; the real folder control remains.

The loader, source checksums, cancellation generations, quiz guards, native
geometry and existing inline/live-model protocol are unchanged. CT/MRI links
compare anatomical concepts across different subjects, not registered coordinates.

External Chrome: CT and MRI auto-open and explicit close/reopen render correctly;
the loading message accurately describes the in-progress read. CT side-by-side
Pons initially timed out with an empty frame, then its existing explicit Retry
model comparison loaded and confirmed Pons. This intermittent frame-start issue
remains open; no new automatic restart loop is added. MRI side-by-side Pons
comparison, slice scrolling without page movement, close and focus restoration
were verified on the unchanged canonical comparison protocol. This does not
resolve the in-app browser CT crash or establish its cause. Synthetic tests cover
states too brief or unsuitable to force using real source files.

The original register44 body, validator, document checks and complete 1,647-input
Review closure are preserved in the frozen historical epoch. Current delivery is
validated separately. Six parameterized history failures came from three stale
Next Link assertions on the ordinary Full 3D Atlas anchor installed in register44.
Their complete original test bytes are retained; only those assertion sites now
check native document navigation and absence of router/prefetch interception.
All other history assertions and generic/CT/MRI Link prefetch guards remain.

Clinical approval, patient-space registration, public deployment, whole-suite,
GPU/peak-memory and signed-in production-role acceptance remain separate gates.

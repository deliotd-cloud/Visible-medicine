# Desktop navigation and Guided learning focus — 6 October 2026

Priority: correct existing desktop journeys before adding controls or claiming
unavailable imaging links. This is a local engineering checkpoint, not clinical
acceptance or deployment.

The actual WorkspaceModes radio callback now identifies a mode switch. The body
host still restores the pre-tour camera and requests its reset, but does not queue
focus back to the old Guided learning launcher when Explore, Dissect or Practice
has just been selected. Explicit tour Exit retains launcher-focus restoration.
The optional argument is compatible with the existing shoulder host.

The original regional host assertions are retained. Added queued-animation-frame
checks execute the actual radio callback and actual body host for thorax and
whole-body, all three destinations and explicit Exit. The existing eleven
shoulder-session cases also pass. Browser keyboard verification remains a separate
acceptance step; a harness is not assistive-technology or representative-GPU proof.

Existing renderer/review fingerprint generators refresh the body renderer and
nine shoulder geometry revisions conservatively for this shared UI change.
Teaching, models, anatomical IDs, source frames and imaging-null status are not
changed; saved clinical decisions must not migrate to a newer revision.

The companion website changes preserve eight imaging-region return destinations
using an explicit existing-route whitelist, and distinguish independent Atlas
browsing from a case-linked reference. Neither navigation action establishes
registration, scan availability, clinical clearance or lecture entitlement.

Evidence and recoverable generated output are retained on E under
`E:/VisibleMedicine-LocalStaging/20261006-desktop-navigation/`. The full goal and
all release gates remain open. No public deployment, raw source upload, patient
asset, CT-head mask, D-drive write or clinical desktop application change.

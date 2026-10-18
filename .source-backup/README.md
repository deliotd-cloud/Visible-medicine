# Visible Medicine application-source snapshot

This is a screened source-file snapshot, not a public website deployment or a
copy of patient datasets. `.source-backup/manifest.json` identifies each original
file by SHA-256, byte count and Git blob. No raw website or Atlas Git ancestry is
included. Historical source assertions still belong to their declared original
Git context; this snapshot's new commit does not invent a replacement approval.

The application files retain their original contents and licences. Three
historical coordination documents are deliberately kept only in the owner's
verified F-drive recovery because they require a separate privacy review. The
manifest names those omissions; it does not contain their text.

The model/media files are not duplicated here. `existing-assets.json` gives exact
hashes and already-verified GitHub commits/paths for the 144 model paths and nine
static assets. These are source/reference assets, not the owner's CT/MRI scans.

For exact restoration, extract recorded Git blobs without text conversion, verify
their SHA-256 values, and recover the listed assets from their recorded commits.
Install the recorded dependencies using the retained package lock. Restore any
private configuration, review-support bindings and datasets separately from the
owner's local recovery; do not put them in GitHub or loosen a missing-input gate.
Without those local inputs, protected clinical workflows must remain unavailable.

See the retained application README and licensing notices for setup. Source,
unit tests and build receipts never establish clinical accuracy, patient-space
registration, privacy clearance or permission to publish scans or private cases.

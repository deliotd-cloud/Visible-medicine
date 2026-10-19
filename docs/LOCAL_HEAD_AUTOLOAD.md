# Local CT/MRI automatic loading

The development website can open the existing approved browser package directly
from a read-only SSD source. It does not copy images into public assets or Git.

Set `VM_LOCAL_HEAD_ROOT` to the absolute `browser-data-verified` directory in an
ignored `.env.local` file, then run `npm run dev -- --port 3000`. Open
`http://127.0.0.1:3000/atlas/ct-head` or `/atlas/mri-head`. This non-VITE-prefixed
setting remains server-side. Remove it to disable the local source.

The dev-only Vite plugin binds to loopback and accepts only same-origin local
requests with the explicit client header. It serves the fixed SHA-256-bound
manifest and listed, hash-verified regular assets. Arbitrary paths, symlinks,
hardlinks, cross-origin requests and changed releases are refused. There is no
CORS, upload/write endpoint or production transport. No new dependencies.

The client opens the manifest once per mount and loads each image/mask/surface
only when needed through the existing checksum/geometry validators. Closing or
choosing another folder cancels and invalidates outstanding requests. Close does
not reopen automatically; use Reopen local atlas. Manual folder import remains
available when this optional source is not configured. Refresh and CT/MRI route
switches reopen the configured source without a folder chooser.

The approved CT and MRI studies are different subjects. Linked structures retain
exact source revisions; links to the existing 3D Atlas are semantic comparisons,
not patient-space registration. This local convenience is not hosted deployment,
clinical approval, or a production access-control solution. Hosted delivery still
requires the planned authenticated/entitled private asset service and release gates.

Verification (11 October 2026): 20 importer/transport tests passed, one Windows
symlink-privilege test skipped; 131 viewer/history tests passed; fresh TypeScript
passed. Real local MRI autoload, Pons selection, matching CT handoff and explicit
close were checked in the browser. Source mask/image bytes were not edited.

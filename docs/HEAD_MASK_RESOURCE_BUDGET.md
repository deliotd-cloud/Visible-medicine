# Native head mask resource budget

Overlay admission counts a group plus the independently selected mask against
the256MiB mask limit, before reading any group files. Distinct entry objects can
retain independent arrays even with identical hashes. The exact selected entry
is counted once because the group waits for its verified load and shares that
buffer. A transient over-budget render keeps only the selected overlay; it does
not silently truncate a group into a misleading partial set.

Selecting an already loaded group member may borrow that exact verified mask.
Weak provenance matches package, study, entry, descriptor, image grid, original
asset object, array/buffer/offset/count and focus. An invalid supplied donor fails
before IO. Normal reads retain checksum, EOF, crop/grid, binary, focus and abort
checks; full selections still load and verify their own surfaces. Group-only
loads do not inherit surface geometry. No global mask cache or browser storage
is added. Mask arrays are internal read-only inputs by convention; provenance
does not rehash in-place mutation by arbitrary same-realm code.

Selection/group changes abort retired reads. The budget covers mask arrays for
the requested group and selection, not scalar images, surfaces, canvas/GPU
buffers, decompression, temporary reads, garbage-collection timing or total
browser/process memory. No peak-memory or crash-mechanism claim is made.

Accepted CT/MRI files, checksums, mask boundaries, image package revision and
Atlas source0ac11ca2 remain unchanged. The exact website Review binding advances
for these native-renderer inputs without migrating approvals. Frozen41/a058
contracts remain independently executable. Checklist42 adds engineering evidence
only; all71requirements/eightideas retain their status/scope/acceptance.

No scan upload, dependency/font/model/texture, fee, entitlement, schema,
permission, specialist-mask or desktop-PACS change. Synthetic browser/resource
tests are not full clinical, hosted-auth/D1, registration or release acceptance.

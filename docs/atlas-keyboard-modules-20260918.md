# Shared keyboard camera integration — 18 September 2026

All four generated modules (shoulder, regional/whole-body, female pelvis and
independent lower limb) now come from Atlas `84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02`.
Keyboard focus on a rotatable model supports arrow-key rotation and Shift fine
steps. A focus-only hint avoids another permanent toolbar. Fixed planar/tray
views remain fixed; pointer/touch behavior and existing controls are retained.
Atlas source behavior tests cover camera guards, angle limits and cleanup;
website tests bind every exported module to the tested helper and styling.

The dedicated female reference also catches up with the already saved regional
pelvic specimen: 41 original pelvic selections plus two source-matched ureters,
43 selections and 11 studies total. Original source identity, source frame and
display transform must agree. Other renal surfaces remain unavailable in the
pelvic UI, and the six withheld pelvic groups remain withheld. This specimen is
not registered to the main body or scans. All teaching awaits clinical review.

Protected delivery retains all 134 immutable model objects. The sole extra route
is `/atlas-runtime/female-pelvis/models/hra-renal/kidneys.glb`, targeting the
existing 3,557,552-byte object
`bd5d2affb912f135c8c8da7e7892fbc906ebae017ed7042e900646c2b6332cfc`.
There are now 141 routes, no new model bytes. Removing that alias reproduces
the previous complete model-array digest. Historical staging receipts remain
unchanged. The active inventory digest is
`c0ec8284a7b01b71b9a40b86258fe137fcd9e0d7d2c8b6200c8d1028463b9cf8`.

Credits, commercial-compatible reuse notices, administrator-review access and
independent Atlas/case/lecture rights are preserved. No patient data, source
scans or masks are included. Publication, browser acceptance and GitHub/D-drive
recovery are separate evidence recorded in the coordinating checkpoint; this
document alone does not assert their completion or clinical sign-off.

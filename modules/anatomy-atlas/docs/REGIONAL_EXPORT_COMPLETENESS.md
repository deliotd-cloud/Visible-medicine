# Complete regional export and structure-only links

18 September 2026. The clean-export gate previously compared the composite HRA
pelvic study against only its original 41-surface catalogue. The existing study
legitimately reuses two admitted same-source ureters, with the unchanged renal
bundle, so the expected composite is 43 ordered surfaces and two ordered bundles.

The exporter now validates that exact union, matching source version, original
file/metadata/crosswalk hashes, credit, licence and coordinate frame. Neither
missing source metadata nor a different donor/frame, duplicate surface, swapped
ureter or changed bundle is admitted. Existing per-model SHA-256, byte-length
and GLB checks remain. The independent contract helper is explicitly pinned in
the generated module's source inputs; export refuses an older build without it.
No source catalogue, model geometry or historical study recipe was changed.

## Navigation correction

A direct structure-only link used to be interpreted as the named `all` study.
That study deliberately retains its original 41 pelvic surfaces, so direct links
to the two context ureters were rejected even though named urinary studies worked.
Null study links now select from the exact complete admitted specimen definition.
Explicit study links still require membership in that named study. Source/revision
validation precedes state construction; history starts empty and the selected
structure is visible. All eight original pelvic recipes remain unchanged.

## Integration coverage

Regional/head/whole-body fixtures now include the three separately audited source
additions: corpus spongiosum, short ciliary source group, anterior cardiac vein.
Tests bind their exact IDs, source model hashes and bytes, rather than merely
increasing counts. Current regional delivery has 1,104 root selections, 104 nested
selections, 12 scopes and 133 model files. Website combined delivery has separate
shoulder/other modules and must be generated/checked, not inferred from that count.

Component tests use the actual regional Link adapter instead of attempting to
load the absent Next.js package. This is test harness maintenance, not a runtime
framework change. New mutation tests, all regional semantic checks, existing
independent navigation and pelvic-context checks, production/module builds and
TypeScript checks pass. Actual rendered-browser and clean-export evidence is
recorded in the coordinating checkpoint; those remain separate release gates.

Authenticated hosted staging of the previous two models is now verified: all133
registered complete downloads matched their recorded bytes and SHA-256. This
does not include the newly added anterior cardiac vein and does not activate
the newer runtime. Preserve the current delivery/access policy until that model
is registered, staged and verified, then follow protected integration/release
checks. No scans, specialist masks, role changes or clinical approval are supplied.

## Complete candidate prepared

The upgrade comparator now accepts only the reviewed pelvic additive transition:
41 ordered native surfaces to43 with the two verified ureters; eight retained
studies plus precisely the three urinary studies; original pelvic bundle plus
the exact renal bundle. All other fields remain identical. Unchanged pelvic
records and ordinary specimens still pass exact equality, including future
upgrades after this transition. Nested sources and all old model bytes are retained.
Twenty-six preparation tests cover success, mutation rejection and no-write gates.

Clean runtime source `6fe69ab68bd76d3648c0725eedabdba8ab778823` exports195 listed
files. The offline combined website proposal preserves131 models/137 paths and
contains134 models/140 paths. Three additions total94,372 bytes; only the new
17,252-byte cardiac model still needs staging. Readiness reports deliberately
remain unapproved/unactivated. Right/left ureter direct links were checked in
actual Chrome, including mobile at355 CSS pixels and removal/Undo on desktop;
the selected anatomy rendered and mobile had no horizontal overflow.

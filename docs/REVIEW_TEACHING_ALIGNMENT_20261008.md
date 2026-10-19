# Learner and clinical Review alignment — 8 October 2026

The learner module had advanced to Atlas343bbe3d while the independently
generated Review import still used a10496d. Consequently the five new girdle-bone
ultrasound drafts could be studied but were absent from the review worksheets.

The import script now pins the full immutable Atlas commit
`343bbe3d2402502b698659fe5b9e5f9f2c2ff9c3`. The existing importer, website binding
and review-viewer generator were run on E, and their exact outputs integrated
into the canonical website. No generated teaching was edited manually. The
1,099-file source import, website adapter inputs and viewer artifacts verify.
Only 32 generated paths changed; 19 obsolete generated bundles were copied to
recoverable E storage before removal. No patient files or private decisions were
imported, changed or migrated. The existing source geometry is unchanged.

Five worksheets now contain the same source-bound ultrasound drafts as the
learner: left clavicle, humerus, scapula and both hip bones. Old pending-topic
responses and altered prose, references or source identities are refused. All
remain drafts; imaging revisions remain unavailable. Integration/renderer hashes
advance deliberately, so prior evidence is not silently treated as current.

## Verification

- Four new/aligned teaching and delivery cases pass, with fixed hashes from the
  saved c1785141 learner import rather than a moving checkout. Literal prior
  digests preserve all 136 model bundles and 12 regional scopes.
- Eight affected Review cases pass across the original run and a focused rerun
  after correcting two obsolete integration-test source pins. Original failure
  is retained. Includes native synthetic account isolation, durable decisions,
  conflicts/corrections, displayed-evidence validation and all 1,577 model-to-
  worksheet return links. Synthetic identity is not actual signed-in acceptance.
- Fresh canonical TypeScript, Review build and sanitized website build pass.
- 46 loopback checks confirm exact review-viewer bytes, sign-in gates, refused
  unauthenticated API reads/writes, subsequent healthy navigation and protected
  model delivery. No clinical, patient-image or signed-in UI acceptance claimed.

The **combined** clinical-review verifier is not wholly passing. Its regional
checks succeed, then the separate plexus review refuses a stylesheet fingerprint.
Immutable parent c1785141 and current stylesheet both hash to `acd14e1c...77c0b`,
whereas the unchanged plexus packet expects `930718b6...f1d6df`. Evidence proves
this predates this import. That independent packet was not repinned or approved.
Investigate its exact presentation revision before any release; do not remove
the verifier or widen its accepted hashes merely to get a passing build gate.

## Storage and local preview

C reached zero free space. The task-owned ignored Atlas `outputs/dist` cache
(524 files, 181,957,624 bytes) was moved to E and every SHA-256 verified. Source,
scans and current website preview were untouched by that move. C remains tight;
keep outputs on E. The new website build's 144 duplicate static GLBs were omitted
only after verifying the existing E recovery copies and all delivery companions;
source/public originals remain intact. Future rebuilds must repeat preparation.

Local preview session50917 on port3000 replaces67989; historical3001 untouched.
No public deployment. Evidence, prior generated artifacts, verified cache and
incremental source recovery are in
`E:/VisibleMedicine-LocalStaging/20261008-review-teaching-alignment`.
This is same-machine recovery only, not a verified GitHub/off-device backup.
Full roadmap and separate clinical/access/release gates remain active.

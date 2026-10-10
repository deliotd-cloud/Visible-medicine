# Default-build input audit — 7 October 2026

## Newer packaging change

The default guard's source-archive dependency is now removed; source integrity
verification is a separate authoring command. Historical classifications and
assertions below remain pinned to their original program. The current guard
receives its own exact whole-program pin and generated-output-only semantics.
See [release archive packaging](RELEASE_ARCHIVE_PACKAGING_20261007.md) and the
new evidence under `E:/VisibleMedicine-LocalStaging/20261007-release-recovery-guard/`.
This does not close other discovery, archive-policy, rights/privacy, isolated
build or source-admission gates; raw Atlas upload remains held.

## Later checkpoint: known guard reads classified, restrictions unchanged

The offline auditor now distinguishes four reads in the exact inspected
`scripts/exclude-source-recovery.mjs`, using immutable Git bytes, its exact path
and a recognized build-script invocation. The complete source hash is pinned in
the implementation and tests; changed programs do not inherit these semantics.

- Lines 14 and 26 read the forbidden original-source ZIP during the default
  build. They are described as `BLOCKED_BUILD_INPUT_READ`, not admitted inputs.
- Lines 23 and 28 check generated `dist/client` archive/metadata bytes. They are
  `GENERATED_OUTPUT_CHECK`, not additional required source/runtime assets.
- Filesystem-discovery uncertainty and every policy conflict remain. An absent
  required ZIP now produces an explicit missing-input marker as well as the
  archive-policy conflict. The build guard and archive policy are not changed.

The same immutable Atlas `dcbdf95f83bbd65760456c9dda112ec60b410293` / tree
`6cfb9c6ed9e9513179b5d94f74ce88f9ccce31db` was audited with the previous Git-pinned
auditor and the revised implementation. All 1,270 discovered inputs and 25 policy
conflicts are identical. Exactly four previously generic markers become the
descriptive entries above: 58 unresolved sites become 54, not proof of closure.
Ten build/configuration seed hashes were independently reread from Git objects.
No forbidden archive bytes were read, copied, hashed or disclosed by this audit.

Seven new fixture tests cover exact matching, changed name/root/destination/read
arguments, an added computed read, missing ZIP, lack of recognized build-command
reachability, a different lookalike script path and dirty checkout changes. New
tests failed before implementation; the independent review's missing-ZIP case
also failed before its safeguard. The final combined suites pass 124 tests with
the same two explicit Windows platform skips out of 126. They never run source
build scripts. No website rebuild is needed for this offline-only change.

Evidence: `E:/VisibleMedicine-LocalStaging/20261007-build-read-classification/`,
especially `classification-evidence.json`, `classified-report.json` and
`classification-final.json`. Earlier evidence below remains historical and intact.
All closure/build/rights/privacy/admission flags remain false. Raw Atlas GitHub
upload stays held; no asset clearance, clinical approval or deployment occurred.

## Earlier inventory checkpoint

An offline, import-only auditor now derives conservative input records from a
full immutable Git commit. It does not run package scripts or copy source files.
The current real-source run audits Atlas
`18a68c6fd006ff4537e9765f745664b32059be28`, tree
`0d1282eb31d08bf089a5e82224941d325a289d90`. This is an input inventory, not a
complete buildable export, asset clearance or clinical approval.

## Verified results

- 1,269 policy-allowed discovered inputs: 1,131 code/text rows have computed
  SHA-256 hashes; 138 asset rows have Git blob identities and sizes only.
- All 372 conservative tracked app/public seeds are accounted for as either
  discovered inputs or named policy conflicts. Ten build/configuration seed
  hashes were independently reread and checked against Git objects.
- 25 unique policy conflicts: one unsafe path, 23 forbidden paths and the
  default build's required original-source ZIP. Forbidden bytes were not read.
- 58 unresolved sites: two computed imports, 24 dynamic local reads, eight
  filesystem-discovery imports, 23 URL resolutions and one plugin/environment
  discovery marker. These counts do not establish an exhaustive list of risks.
- The combined real-filesystem/Git fixture and existing collector/manifest
  suites pass 117 tests, with two explicit Windows platform skips out of 119.
  Virtual Git-tree case collisions and symlink-mode refusal run on Windows;
  the older native case-distinct filename and file-symlink tests remain skipped.

Fixtures cover immutable committed bytes despite a dirty checkout, transitive
imports, npm aliases/lifecycle hooks and cycles, TypeScript import-equals,
forbidden paths, annotated tag rejection, oversized code, staged missing/extra
files and same-size code/binary corruption. No fixture executes source scripts.
Main review also tightened Git no-lazy-fetch handling, report deduplication and
stage comparison. A separate read-only worker reviewed the final lifecycle and
import-equals deltas without finding another concrete issue in those deltas.

Evidence remains private on E:
`E:/VisibleMedicine-LocalStaging/20261007-build-input-audit/`.
The final receipts are `build-input-tests-lifecycle.json` and
`actual-input-audit-lifecycle.json`; the exact source inventory is
`build-input-lifecycle-report.json`, with independent checks in
`build-input-lifecycle-evidence.json`. Earlier reports are retained, not
overwritten. The initial 29 conflict records represented 25 unique paths;
the final report removes four duplicate records, not four restrictions.

## Restrictions remain in force

The existing default build preserves
`public/models/bodyparts3d-v3/abdominal-wall/original-source.zip` in authoring
source and excludes it from runtime delivery. The snapshot policy forbids every
archive. This audit reports that conflict; it neither exempts the ZIP nor changes
the guard, build command or policy. A different build profile would require
separate explicit review and must not claim the existing default-build proof.

No actual project stage was collected. Stage matching has only synthetic fixture
evidence and explicitly covers discovered policy-allowed inputs. Dynamic build
closure, installed tooling/environment inputs, content-level privacy inspection,
asset rights/notice evidence, an isolated build and a second-directory restore
remain open. All reports leave closure, build verification, rights/privacy and
source-backup admission false. Raw Atlas GitHub upload remains held.

This change alters only offline audit/test/documentation paths. Runtime teaching,
geometry, dependencies, licences, generated Review material and the website's
embedded Atlas are unchanged. The two earlier historical comparator failures
remain open; no original reference, hash, assertion or current notice is replaced.
E recovery is same-machine protection, not an off-device backup or deployment.

## Next priorities

1. Perform desktop learner acceptance on the current website: keyboard/focus,
   native zoom, model-failure recovery and representative hardware. Record
   actual observations separately from synthetic render tests. Human assistive
   technology and clinical sign-off cannot be inferred from this audit.
2. With a verified private target/account, validate authentic reviewer authority,
   durable revision-bound decision readback and independent course/Atlas/lecture
   entitlements. Do not use private decisions or patient images as fixtures.
3. Resolve build discovery and the archive-policy conflict through separately
   reviewed evidence before claiming a complete sanitized source backup. Do not
   turn the static inventory into its own rights or admission authority.

The full website/Atlas goal remains active. No CT-head mask work, desktop clinical
PACS changes, private asset upload, deployment or clinical acceptance is implied.

# Source-snapshot validation and build-input audit

The import-only manifest library checks caller-supplied exact-path/hash/byte
records before a separately reviewed sanitized-source backup can be considered.
A separate filesystem collector now supplies independently observed staged-file
records. A third module audits conservative inputs from an immutable Git commit.
None authenticates rights, proves dependency closure, builds an application,
grants admission, creates a backup or uploads anything.
Running these import-only modules as bare Node scripts performs no validation.

Run its synthetic tests from the Atlas checkout:

```sh
node --test scripts/test-source-snapshot-manifest.mjs
```

Import `validateSourceSnapshot` from `scripts/source-snapshot-manifest.mjs` in a
separately reviewed caller. Its five input records are:

- `stage`: asserted original-source commit/capture type, no Git ancestry or adapted export.
- `proposed`: exact relative paths, SHA-256, bytes and code/model/notice role.
- `observed`: independently collected exhaustive paths, hashes, sizes, regular-file
  and symlink evidence; the pure library cannot verify that collection.
- `admissions`: separate code/model/notice declarations with proof ID, revision and
  hash. Models additionally require bound, independently reviewed commercial,
  redistribution and derivative-use rights evidence plus an admitted notice path.
- `required`: independently adjudicated nonempty mandatory code/model/notice paths.
  This is not inferred from the proposal; an incomplete policy cannot prove a build.

Every selected file must appear once in proposed/observed/admission records with
matching identity. Unsafe Windows paths, case collisions, nonregular entries,
extra/missing files, archives, clinical/private/candidate paths and predictable
secret containers are refused. Formats and space-bearing filenames are deliberately
restrictive and need explicit future review rather than automatic exceptions.

The only recovery-name exception is the exact code path
`scripts/exclude-source-recovery.mjs`, inspected for the existing ZIP-preservation
build gate. It still requires matching regular-file identity and bound code proof.
No other recovery path, look-alike, archive or mismatched role is excepted.

A returned `consistencyOnly: true` result counts declarations. It cannot establish
their truth, legal permission, privacy clearance, source authorship, authenticity,
notice sufficiency, absence of secrets inside allowed text, external asset-reference
safety or clinical approval. Proof hashes must be verified through trusted records
outside this library. Do not construct those records from untrusted asset claims
or infer geometry rights from an MIT code licence.

## Current source-backup boundary

The protected website Review/runtime inventories at Atlas `9b2003d` are not a
complete buildable source whitelist. They omit default-build dependencies;
Review bytes may be adapted; delivered GLBs have separate source/rights evidence.
The default build also requires the original abdominal-wall source ZIP and proves
it is preserved in source but excluded from generated runtime delivery.

This change does not replace or bypass that build, modify its script, admit an
asset, alter a review decision, or lift the raw Atlas remote-upload hold.
A complete separately licensed, privacy-cleared authoring inventory, static/dynamic
build-input closure, independently collected stage and successful isolated
build/second-directory restore remain prerequisites. Any alternative build profile
needs its own explicit policy; it must not claim the default archive-preservation
proof. Existing E standalone source recovery and independently verified sanitized
website GitHub backup remain distinct from a complete off-device Atlas source backup.

Draft/test evidence:
`E:/VisibleMedicine-LocalStaging/20261006-source-snapshot-validator-draft/`.
Initial refusal-test failures are retained there; final staged synthetic suite
passed85/85. These are fictional metadata records, not admission of real assets.

## Independent staged file collection

Import `collectObservedSnapshot` from `scripts/source-snapshot-collect.mjs` and
pass a normalized absolute path to an already prepared, controlled local stage.
It takes no proposal, exclusion list, admission or rights declarations. It walks
every entry and returns deterministic relative-path, SHA-256, byte-count and
regular-file records for the manifest library's `observed` input. This prevents
the proposed list from determining which staged files are inspected.

The collector refuses empty stages, unsafe or forbidden paths, archives, links,
junction aliases, hardlinks, nonregular files and case collisions. It validates
directories before traversal, streams file hashes and checks file handles,
paths, directory metadata and entry names before and after collection. Default
bounds are 20,000 files, 20,000 directories, 8 GiB total file bytes and 32 directory
levels. Only positive integer `maxFiles`, `maxBytes` and `maxDepth` data options
are supported; no skip, role or admission option exists.

Run both suites:

```sh
node --test scripts/test-source-snapshot-collect.mjs scripts/test-source-snapshot-manifest.mjs
```

The 7 October Windows run passed 102 tests with two explicit platform skips
out of 104 tests: distinct case-colliding filenames and a file symlink could not
be created. Actual directory/root junction and hardlink refusal tests passed.
Filesystem fixtures are test-owned temporary files, not real admitted assets.
Evidence: `E:/VisibleMedicine-LocalStaging/20261007-celiac-history/snapshot-filesystem-final.json`.

Collection requires a controlled stage that remains unchanged throughout the
operation. Metadata checks detect ordinary changes, not hostile operating-system
races or edits that preserve all compared metadata. Deterministic concurrent
mutation tests remain to be added. Paths and errors may themselves contain
sensitive filenames; keep real collection evidence private until reviewed.
The collector does not inspect file contents for secrets or patient identifiers,
authenticate the source commit, infer roles, verify admission evidence or create
the stage. Independent closure, privacy/rights review and an isolated build and
restore are still required. The default build's original-source ZIP remains
forbidden by the existing manifest policy; this change adds no archive exception
and does not claim that a default-build stage is complete or exportable.

## Immutable default-build input audit

Import `auditDefaultBuildInputs` from `scripts/source-snapshot-build-inputs.mjs`
with a normalized absolute `sourceRoot` and exact full `sourceCommit`. The auditor
reads the committed Git tree and bounded code blobs, not mutable checkout content.
It does not execute repository scripts. Unknown options and caller-supplied file
inventories are refused. Git reads disable replacement objects and lazy fetching.

The conservative seeds include tracked app code/styles, public files, package
and compiler records, and tracked build configuration. The limited command parser
follows literal npm aliases and their pre/post lifecycle hooks, and literal
`node scripts/*.mjs` commands. TypeScript AST traversal follows literal imports,
exports, `require`, dynamic imports, import-equals and supported stylesheet imports.
This is not a complete model of npm, plugins, compiler resolution or shell syntax.

Paths are checked before blob reads. Archives and other forbidden inputs become
named policy conflicts; they are not read or silently admitted. Bounded text/code
rows have Git blob identities, byte counts and computed SHA-256 hashes. Other
assets have Git metadata only until independently inspected. A listed input means
neither that the build executes it nor that its contents or rights are cleared.

If supplied, `stageRoot` must be an actual controlled folder. The auditor invokes
the independent collector itself, then compares exact staged bytes and identities.
Same-size binary corruption is checked against the streamed Git blob identity;
code hashes, missing/extra files and refused entries are also checked. A matching
stage covers only the discovered policy-allowed inputs, not omitted or blocked
inputs, dependency closure or rights. The collector's race/privacy limits above
still apply. No stage is created by this API.

Computed imports, filesystem discovery, URL resolution and plugin/environment
inputs remain explicit unresolved sites. The additive `classifiedReads` array
describes four reads only for the exact inspected recovery guard, at its exact
path, invoked by a recognized default-build command. The immutable guard bytes
must match SHA-256 `b4d1eb161942dea1b8561fe3dcba41bcd77cc703aa5a6c206f47338c6816c20a`.
Two `BLOCKED_BUILD_INPUT_READ` entries refer to the source ZIP; two
`GENERATED_OUTPUT_CHECK` entries refer to generated `dist/client` files, not
source inputs. Changed bytes/paths, additional reads or absent recognized command
reachability retain generic unresolved reads. This pin is not a general data-flow
analysis or an archive exception. A missing required source ZIP is explicitly
unresolved and still policy-conflicting. Filesystem-discovery uncertainty remains.

Every report leaves
`staticTraversalComplete`, `closureProven`, `isolatedBuildVerified`,
`rightsOrPrivacyGranted` and `sourceBackupAdmitted` false. Treat these reports as
private engineering evidence: paths can themselves disclose sensitive details.

Run the three suites:

```sh
node --test scripts/test-source-snapshot-build-inputs.mjs scripts/test-source-snapshot-collect.mjs scripts/test-source-snapshot-manifest.mjs
```

Current real-source findings and remaining work are recorded in
`docs/BUILD_INPUT_AUDIT_20261007.md`. No archive exception, alternative default
build, runtime change or source-upload permission is introduced.

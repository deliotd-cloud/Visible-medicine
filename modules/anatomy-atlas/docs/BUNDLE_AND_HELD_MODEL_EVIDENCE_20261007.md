# Bundle inspection and held-model review matrix — 7 October 2026

This is local backup/release preparation, not a source-release admission,
clinical approval or website change. The full website/Atlas goal remains active.

## Observed code-only compilation

At immutable Atlas `baa936b011410d5ce5cff023da7404fd01e7889e`, 1,145
policy-allowed Git text inputs were copied with exact blob/size/SHA identities
into a history-free E workspace. No GLB, OBJ, archive, scan or image bytes were
copied. This is a diagnostic code-only stage, not a complete sanitized release.

The exact pinned workspace builder compiled the nested-review stdin recipe with
`bundle:true, write:false, format:esm, platform:node`. The normal recipe and the
metafile-instrumented recipe emitted identical bytes within this staged root:
one 5,609,421-byte module, SHA-256
`f74e8c147ced51abbbe5357b5a88902a40fafd6521c7b6f0638a32b5697ab2af`.
The generated module and the generator itself were **not evaluated**.

The metafile accounts for 190 unique Git source-file identities across 191
source modules plus stdin. One JSON file appears with two import-attribute
identities. Known source keys and structured `type:json` attributes are matched
explicitly, not by stripping arbitrary path suffixes. Every reported source
input/import edge is accounted for; no external metafile import or scanned
static/dynamic import, require/eval/Function candidate remains in the payload.
This AST scan is not a general proof against aliasing or runtime side effects.

Copied esbuild 0.28.1 API/package/native binary and notices, TypeScript parser
and Node identities are recorded. Versions match the pinned lockfile and the
native binary matches the package's self-declared digest. Registry tarball
integrity/tool authenticity is not independently granted. The child received
only a narrow process environment and E temporary paths. No OS sandbox,
network-tracing proof, canonical-checkout payload-byte equality, full unchanged
default build, generator execution, final binding output or release closure is
claimed. The static auditor's 44 unresolved obligations remain in force.

The first output parser failed on an attributed metafile key. Two further parser
assumptions failed while interpreting structured JSON attributes; all failures
and the incorrect intermediate hypothesis are retained. The existing successful
compilation was not repeated. The final verifier accounts for both observed
attribute forms and rereads all staged source/tool hashes.

Evidence: `E:/VisibleMedicine-LocalStaging/20261007-bundle-evidence/`, especially
`bundle-evidence.json`, `staged-inputs.json`, `isolated/recipe.json`,
`isolated/metafile.json` and the retained parser-failure records.

## Nineteen held models, no new admission

`scripts/held-model-decision-matrix.mjs` is an import-only pure metadata join.
The current immutable witness/catalogue produces 19 rows covering 159 structure
IDs and 251 source OBJ bindings. Rows bind exact public paths, derived hashes,
byte counts, catalogue identity, membership and claimed source provenance.
Neither GLBs nor upstream archives are read by this matrix.

Rights, privacy, path admission, authenticated evidence, build closure, restore
and clinical decisions are fixed pending. Explicit output flags grant nothing;
caller-supplied commit/witness claims are not independently authenticated by the
pure function. The E production receipt separately binds the actual Git inputs.
No path-policy exception or anatomy/renderer/review change is introduced.

Five synthetic regressions pass. The owner's existing source metadata smoke
returns the expected 19/159/251 join. Main review added two failing-before-fix
tests and corrected unsafe model IDs, globally ambiguous structure IDs and
unknown caller approval options; the original worker's 3/3 pass and these
failing assertions are retained. No admission assertion was weakened.

The official [BodyParts3D licence statement](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
still specifies CC BY 4.0 and DBCLS credit. The [CC BY 4.0 summary](https://creativecommons.org/licenses/by/4.0/)
permits commercial sharing/adaptation with attribution, change indication and no
additional restriction on the licensed rights. The matrix lists these existing
obligations; it does not independently clear every derived asset or privacy right.
Subscriptions must preserve those covered asset rights. This is engineering due
diligence, not a legal opinion or clinical acceptance.

## Next gates

Review the exact per-file matrix against the existing lineage/metadata-inspection
receipts, independent rights/privacy decisions and mandatory delivered notices
before any narrow path admission. Continue generated-module/runtime/tool and
unchanged-default-build discovery closure separately; this diagnostic must not
silently delete unresolved audit markers. Then perform a genuinely cleared,
history-free build and second-directory restore, plus authentic private reviewer,
native zoom/assistive and revision-bound radiologist acceptance. Preserve CT-head
masks and the desktop clinical PACS. E recovery is same-machine only; no upload,
deployment or off-device backup occurred here.

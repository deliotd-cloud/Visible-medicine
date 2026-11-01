# Atlas catalog compiler companions

The two full-body catalog imports retain their separate JSON payloads, manifests
and runtime checks. Compiler-only `catalog.d.json.ts` companions make TypeScript
use the existing `BodyCatalog` contract instead of inferring every anatomical
record a second time. No JSON, geometry, teaching, scan or approval is changed.

After importing or exporting Atlas sources, run `npm run generate:atlas-catalog-types`.
The generator checks each catalog against its own manifest, then checks all JSON
fields required by the complete existing TypeScript contract in an isolated
compiler program. It does not use `any`, an unchecked assertion to `BodyCatalog`,
or a smaller set of production source files. Additional JSON metadata is retained.

Both generated declarations contain hashes of their JSON and the exact type
contract inputs. `npm run verify:atlas-catalog-types` (also part of `prebuild`)
revalidates the contract and rejects missing, altered or stale declarations.
Changes to transitive type dependencies require updating the generator's explicit
schema list; they cannot silently inherit an old declaration. `allowArbitraryExtensions`
must remain enabled. Tests verify real module resolution and unchanged runtime
JSON loading; ordinary full website type checks and production builds are still
required. No type-check include, diagnostic or existing release gate is removed.

The generator checks each imported/runtime manifest independently so a new source
can be prepared alongside an older runtime. It does **not** assert that those
revisions are coherent or ready to install. Existing delivery and review checks
still decide that. Structural type compatibility does not establish clinical
accuracy, current review approval or MRI registration.

These files are website-owned generated compiler aids, not changes to the native
Atlas handoff. Regenerate them through the script rather than editing them by
hand. They introduce no dependency or external content. Measured compiler-input
and memory results belong in the milestone checkpoint; this document makes no
claim about full-program memory savings.

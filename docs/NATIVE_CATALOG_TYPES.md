# Native full-body catalog compiler companion proposal

`scripts/native-catalog-types.mjs` validates the complete current JSON against
`DeepReadonly<BodyCatalog>` in a separate strict TypeScript program. Only after
that succeeds does it write
`public/models/bodyparts3d/full-body/catalog.d.json.ts`. The small declaration
exposes the existing `BodyCatalog` contract to normal TypeScript imports of the
JSON path. It carries SHA-256 pins for the JSON bytes and the two transitive
contract files (`app/body-types.ts` and `lib/anatomy-coordinates.ts`). If the
contract imports another source file, the validator stops until its explicit
dependency list is updated. The validation proves structural compatibility;
it does not establish anatomical, source, licence or clinical acceptance.

The script changes no JSON, runtime import, manifest, review binding, or bundle.
`--check` validates the JSON again and requires the declaration's exact expected
bytes, rejecting missing or stale companions. Generation and check accept
`VM_ATLAS_ROOT` or the exported `atlasRoot` option for isolated fixtures.

After integration into the native checkout, the coordinator should generate the
declaration once, review its diff, and make `--check` a required predecessor of
typecheck, build and export. The package wiring and generated declaration are
outside this proposal. The focused test is
`node --test scripts/test-native-catalog-types.mjs`; it performs one full
real-catalog structural validation and uses compact temporary catalogs for
mutation, freshness and TypeScript resolution cases. The coordinator owns its
guarded execution and any full-project verification. A declaration must be
regenerated whenever either the JSON or a contract file changes. It must never
be hand edited to satisfy a stale check.

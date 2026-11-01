# Generated teaching imports and compiler memory

The regional teaching loader has always accepted `unknown`, decoded the snapshot, and matched complete source identities. The generator now also emits a small `region.d.json.ts` declaration returning `unknown` beside each JSON file. This prevents TypeScript from inferring a large literal type for every lesson while preserving the existing dynamic JSON imports and JSON bytes.

TypeScript's `allowArbitraryExtensions` option is required in both the native Atlas and consuming website configuration. The website must receive these generated declarations through its normal native-source import. Do not edit the generated Review copy manually.

This does not exclude any production TypeScript root, introduce `any`, skip another check, change the runtime decoder, or assert that unchecked data is valid. Generation still evaluates the actual complete resolver, checks all 9,936 root-topic placements through serialization, and rejects stale, missing or extra snapshot and declaration files. Existing regional and loader tests remain required.

Focused regression coverage proves that the compiler resolves eleven small declarations without loading eleven large JSON source files, each export remains `unknown`, and real lazy imports still return the same data. Generated declaration changes, including an `any` substitution, fail the freshness check. Full website type checking and production builds remain required; this focused evidence does not establish a whole-project peak-memory saving or a release pass.

References: [TypeScript arbitrary-extension declarations](https://www.typescriptlang.org/tsconfig/allowArbitraryExtensions.html) and [JSON type inference](https://www.typescriptlang.org/tsconfig/resolveJsonModule.html).

# Atlas model delivery

The website retains original, source-bound GLB exports for shoulder, female
pelvis, lower limb and head/neck in `public/atlas-runtime`. Source tests continue
to check their exact canonical hashes, inventory and licences. Do not hand-edit
these generated exports, replace their models with reduced meshes or rewrite
catalogue hashes to describe transport bytes.

For a smaller private deployment, commit and build this website, then run from
the separately committed Atlas checkout:

```sh
node scripts/prepare-website-model-delivery.mjs /absolute/website-checkout
node scripts/prepare-website-model-delivery.mjs /absolute/website-checkout --check
```

The Atlas checkout is available as `modules/anatomy-atlas` on the repository's
`backup/anatomy-atlas-2026-09-06` branch, or in the main task's workspace map. Use
its checked-in lockfile. The helper only writes `dist/client/atlas-runtime` and
rejects a different registered website or dirty source checkout. Package after
this step without rebuilding; another `npm run build` restores canonical files
and must be followed by the helper again. An ordinary unoptimized build remains
functional without an Atlas checkout or additional website dependencies.

Every model is compared to the Atlas original, compressed without quantization,
triangle/index reordering, normal filtering or simplification, then decoded and
loaded with the same installed loader version as the shipped modules. Both exact
accessor bytes and scene snapshots must match. Existing UI, model scope, notices,
teaching and independent case/lecture entitlements stay unchanged. No scan/mask
or patient-derived content is added.

In the delivered build, `manifest.json` lists actual transported file hashes.
`canonical-manifest.json` preserves the original export manifest verbatim;
`transport-manifest.json` binds both hashes, proof counts, source commits, codec
input hashes and decoder versions. All other files remain byte-identical. The
Atlas `--check` command recomputes these results instead of trusting the report.
Clinical review, actual-device acceptance, cleared imaging and public launch
remain separate gates. A size saving is not evidence of any of those approvals.

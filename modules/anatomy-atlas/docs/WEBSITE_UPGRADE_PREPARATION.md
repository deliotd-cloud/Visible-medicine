# Regional website upgrade preparation — 17 September 2026

The complete regional module has been exported from clean Atlas source
`a5baf03bb274e2e6f3dfe078603a0b9988b1f400` into the coordinating workspace's
`work/atlas-upgrade-20260917/public/atlas-runtime/head-neck`.
It contains 193 manifest-listed files (210,413,427 bytes), 132 model paths,
all 12 regional/whole-body scopes, 1,103 whole-body selections and 104 nested
selections. This is a prepared local candidate, not a website deployment.

The current website's four complete manifests and all their files were compared
with its active registry. All 131 unique models / 137 delivery paths are retained
byte-for-byte. The candidate preserves every prior regional ID, nested target
and independent specimen. The proposed combined registry contains 133 unique
models / 139 paths. Only these already-admitted source models require new storage:

| Model | Bytes | SHA-256 |
| --- | ---: | --- |
| Corpus spongiosum | 11,856 | `f704a79a0fe2c9b30a93380d36ab31cb241f1ca81f701b870ff288bfb616d826` |
| Short ciliary source group | 65,264 | `9272b6137e321e1ed243d0c79b8c3a022eb56f2954af2ec65dd8b06ebfe6e0a5` |

Total new upload: 77,120 bytes. Two audit-only pulmonary GLBs found by a broad
filesystem comparison are not required by the actual delivery plan and are not
included. Never populate a release by recursively copying the source models folder.

## Reproducible offline check

```sh
node --test scripts/test-regional-upgrade.mjs
node scripts/prepare-regional-upgrade.mjs WEBSITE_ROOT EXPORTED_HEAD_NECK_MODULE NEW_OUTPUT_DIRECTORY
```

The output directory must not exist and its parent must exist. The script verifies
every manifest companion, notice and model; it rejects traversal, symlinks,
unlisted files, changed/missing previous geometry, lost anatomical scope and
output paths inside either input. It prepares only new model bytes in `uploads`,
`proposed-inventory.json` and `readiness.json`. It never modifies a website,
uploads an object, changes a policy or activates delivery. Manifest source labels
are recorded, not independently attested; use the source-bound clean-tree exporter.
Privacy declarations and GLB headers are not patient-data or clinical validators.

The prepared set is `work/atlas-upload-set-20260917` in the coordinating workspace.
Its active inventory binding is
`9f686f1a2c9909bba2b46b1b76805aa8168287c4aa4d0f420e942b3fb7c90e2c`;
proposed inventory binding is
`a74532b7b64b61221f14ddefb02c267296376397c19da5553772996fdcaebba4`.
Candidate manifest SHA-256:
`bc8b31c36b3533bb996d7c4feccc84991e268f81cf7f7bebb4f7ed59ea06218e`.

## Activation sequence — still outstanding

1. Make a reviewed stage-only registration for the two exact hashes through the
   website's existing compile-time staging candidate mechanism. Preserve the
   current active runtime, inventory, policy, roles and private audience.
2. Publish that private staging change through the existing Sites workflow.
   Use a legitimate signed-in administrator to upload the two matching files,
   then verify actual stored size/hash and full downloaded bytes. Current
   authentication must not be replaced with custom headers, demo roles or tokens.
3. Only after storage verification, preserve the old generated module and activate
   the verified candidate plus regenerated combined inventory/policy binding.
   Run website integration/access tests and the protected-delivery packaging
   workflow; keep source/notices and omit only verified generated duplicate GLBs.
4. Verify private deployment, original protected URLs, desktop/mobile interactions,
   range/conditional requests and failure recovery. Retain prior source/objects.
   Learner/public activation and radiologist sign-off remain separate gates.

The browser-control runtime still fails initialization; the alternative available
browser reaches the private site's sign-in screen, not an authenticated session.
No staging upload, identity change or deployment was attempted. Do not retry the
unchanged connection repeatedly or activate absent storage. The prepared candidate
lets authenticated staging resume without redoing source export and comparison.

## Evidence and limits

Six generated-module browser journeys load the two new models and the new
longus-colli attachment control on desktop and 390px layouts. Actual local model
bytes are served through a confined test route; no page errors or horizontal
overflow. These are candidate-module tests, **not** live authentication, storage,
full website integration, physical-device or clinical approval. Six screenshots,
full reports and exact GitHub/D recovery are recorded in the coordinating
checkpoint. Sixteen preparation tests cover success and fail-closed behavior.
No runtime source changed during this preparation, so unchanged production builds
were reused instead of rebuilt. No scans, masks, licences, paid services or
independent case/Atlas/lecture entitlements changed.

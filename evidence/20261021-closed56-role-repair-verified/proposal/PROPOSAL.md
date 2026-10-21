# Closed56 historical/current role repair — 21 October 2026

Proposal only. Canonical Website HEAD is `b953ff3f5f1891599cb6e91cb91311d9d6006270` and intentionally dirty. Current clean Atlas is `190a63238eadcf906abe89dcbb6a67c88afe70b9`, tree `c314f1cbfa394caed4c6874864fda7dea0a3286c`; current Review binding is `34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f`. No canonical file was edited by this worker.

## Source roles and rationale

The immutable closed56 original is source `46c43ed8...`, with its full original test file in `fixtures/closed56-original-tests/current-atlas-delivery.test.mjs.txt` (SHA-256 `b27deaa67d4ea9aa6908abb5a3324efb43bcc2f8344e01c9a4d3ed9424ef0d41`). The four-seam introduction to `f5097af8...` is byte checked; the `bd5465...` reviewed successor is byte checked. `fixtures/current-delivery-test-before-roving.mjs.raw` is the later *historical introduction/render witness* for `87ed7e34...`, not the present live test (SHA-256 `28c42d029791da37a1b4060ff3dfc533b5beba1a5f246887822a38671f9ce5ce`). Current delivery is `190a632...`, independently checked by `tests/current-atlas-delivery.mjs` and the current pin/actual documents; Review has 1,710 bound inputs, 1,553 imported source files, 137 model identities and 144 model paths. Historical source, tree and counts are kept only in their immutable witness roles.

The helper no longer compares the moving `tests/current-atlas-delivery.test.mjs` against the 87ed witness. It projects both current-atlas and shoulder historical originals from their hash-bound original fixtures, with the exact declared Review seam. The live-preservation negative cases now mutate the archived 87ed witness to test its original model, clinical, emitted-hash, source, tree, count and appended-body obligations. The femoral live case uses the independently validated current190 delivery and keeps historical refusal checks. The prior whole-file inverse to the earlier closed56 repair remains executable against uniquely named byte-for-byte pre-role fixtures; its test also checks the new role markers. No original full source, mutation or refusal body was removed from the archive.

Direct preservation consumers mapped: `tests/closed56-live-preservation.test.mjs`, `tests/closed56-original-tests.test.mjs`, `tests/closed56-live-context-repair-contract.test.mjs`, `tests/current-atlas-delivery.test.mjs`, and `tests/head-index-tab-stop.test.mjs`. The latter two are unchanged and may retain unrelated current-epoch failures. The full native failure inventory remains `F:/VisibleMedicine/staging/20261021-remaining-native-matrix/POST_MATRIX_TRIAGE.json` (136 full baseline; 289 subset, 202 pass, 87 fail). Only subset failures 100, 102, 109 and 119 are claimed as addressed by this proposal.

## Proposed existing paths: preimage -> staged SHA-256

| Website-relative path | Canonical preimage | Stage |
| --- | --- | --- |
| `tests/closed56-femoral-epoch.test.mjs` | `bb6a8d631f190915f55d5ac4b5cdceb214691079b6502086f0d07c168026f037` | `61e2886316e369954d6902709d885357b1f6c62318eb4c5056260eb6d40ab718` |
| `tests/closed56-live-preservation.test.mjs` | `49bd6c57054d9e2788d41906b66415ddb5325c59c8a63f3321313a394ee935b7` | `8b550a7c9c6fabfd66a4ed873a6eacb89c2821d0602028e3668ad711f9c61c7f` |
| `tests/closed56-live-preservation.mjs` | `91db3ee295c49991dcd1943e97ddb0e40c5d943697e64854bc7dd34c0f2df242` | `fa573561406fb1bc2cb7d33e9526e1a8e0fba608366d101ce50de842876cbee9` |
| `tests/closed56-live-context-repair-contract.test.mjs` | `e44381435701b71f17cf3144f2d7d017e03fede6b012a1e6b6f7473a3391bff5` | `6bfd1e38702c527eb6b9bbfdd0a4ab4f3ea8d54e5a8c4fcae2b9f7878426f859` |

Four new full-source fixtures under `tests/fixtures/` preserve the exact canonical pre-role bytes of all four edited paths. New `tests/closed56-whole-role-transition-20261021.test.mjs` reconstructs each complete candidate with declared unique edits, proves its inverse to the byte-exact raw preimage, and rejects removal of an original negative assertion or an unknown append. The exact nine-path admission inventory, preimages, candidate SHA-256 and byte lengths are in `PROPOSAL.json`. `verification-root/` contains disposable copies for an isolated test run; it is **not** part of the proposed canonical change. `verify-source-only.mjs` is a staging-only check.

## Verification and limits

Actual staged isolated runs: `closed56-live-preservation.test.mjs` 15/15; `closed56-original-tests.test.mjs` 5/5; `closed56-live-context-repair-contract.test.mjs` 2/2; new whole-file role-transition guard 4/4. `verify-source-only.mjs` passed archived intermediate/projection/mutation checks and the independent current190 pin/tree/Review/1710/137 validation. All four edited modules passed `node --check`. `PROPOSAL.json` candidate hashes/lengths and canonical preimage/absence checks pass. Full femoral native execution, current Website suite, TypeScript, build and browser acceptance were not run by this worker. Main must recheck exact canonical preimages, install the nine proposed paths atomically, then run all affected native cases once against the actual Website; any existing failure outside these four markers remains outside this bounded repair.

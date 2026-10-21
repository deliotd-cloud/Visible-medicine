# Atlas source byte audit — 21 October 2026

Read-only diagnosis. Canonical Website, Atlas and the running native batch were not changed. This report contains path and hash metadata only.

## Scope and result

- Website `atlas-review/manifest.json` SHA-256: `b4ba7a95f08fe473d838a9be700dc76de8c3484879cadf2464b416d532e8881f`; declared source revision `190a63238eadcf906abe89dcbb6a67c88afe70b9`.
- Atlas HEAD is that exact revision; `git status --porcelain=v1` is empty.
- All **1,553** manifest `files[]` source rows were compared with working-tree bytes and exact `190a6323:path` committed Git blobs. Every committed blob SHA-256 equals its manifest `sourceSha256`. Working bytes match committed bytes for **1,544** rows. Exactly **nine** differ; none differs in content after CRLF-to-LF byte normalization.
- The nine working files are valid UTF-8. For every row below, replacing each working `\r\n` with `\n` reproduces the entire committed blob byte-for-byte. The committed version has zero CRLF pairs. The working-byte length exceeds the committed length by precisely the number of CRLF pairs shown. No arbitrary line-ending tolerance or semantic comparison is needed.

| Atlas source path | Working SHA-256 | Committed = manifest SHA-256 | Working / committed bytes | Working CRLF pairs |
| --- | --- | --- | ---: | ---: |
| `app/review/overview/page.tsx` | `ddafaa8e8aa91abcf1ac942f7089cc5adfecb07495fbca5d5648a1003f12e554` | `ebf6ddd5925a250be9e089c6462dbb088b3f40a22bbe184c277064e2a4e6c8f4` | 6,216 / 6,125 | 91 |
| `content/abdominal-branch-imaging-pins.json` | `735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1` | `5daaecd50fae68d64ef88d39237b6700b9f2bac3fa84f1a4792cbc05b3228d61` | 133,615 / 130,562 | 3,053 |
| `content/coronary-arterial-us-pins.json` | `8fe899c4cc342ee61afa2b086d2920b4eb46cc62bb52ae3583ce9f9e35e74435` | `9277caac4d2b97c75fced2f393b481f0c84800897a9faa9b28bd9c12e8854a18` | 13,749 / 13,342 | 407 |
| `lib/coronary-arterial-us.ts` | `6ca30f92e3085c431325c681b2bcd17ab867da6e3dd8a935acb38470332bfe59` | `fa2eae6fdab9639f5d971c146bae925342bd1caf4aca19d42076eb01cef4ed0b` | 1,865 / 1,843 | 22 |
| `content/coronary-arterial-us.ts` | `4ba07709b49b9c72f5d9e42f12495bc2a8439cc3505a7a5132018ca0fa290307` | `64598a6dcb26aa59123b20539911faa9e3eabebb2015ad7198e105d341865efb` | 1,759 / 1,742 | 17 |
| `lib/abdominal-branch-imaging.ts` | `c93f1b7ea40b7d2646b51d84632b3388b32b957351370ea78b948808a99631ae` | `3d4c1a7604c3277cdc31b1db77adbcd15b55345848e3345b7f322a1be5eadcf3` | 1,958 / 1,935 | 23 |
| `content/abdominal-branch-imaging.ts` | `ec3c59407eb763814afa4a9bd749ea801a39931d0dc884fbe294a165fc083d67` | `5976ad5d71b7aceedb81e4bff184ac40486c051cd0d69efb128d81c3124b6bff` | 15,266 / 15,184 | 82 |
| `lib/imaging-sync.ts` | `337351363197184239a62ff840bc9f6f1f260ce0d9fc61fa9adddf433f7b3331` | `42696bac9b39e5761bd6e654996d6d6245bd51782b8387a8f946e9f42882b147` | 7,784 / 7,558 | 226 |
| `lib/didanix-atlas-adapter.ts` | `54d3483448a4cebce88a15eefd9ad43782e9d4cc0fb2d41b971d2278d614c382` | `a3035a986d57d6d261d61f9f2a4c28c1ae5b74869e016a97412bcf0ab6947b11` | 7,636 / 7,542 | 94 |

`git ls-files --eol` reports `i/lf` for all nine index blobs. Six working files are `w/crlf`; `app/review/overview/page.tsx`, `lib/imaging-sync.ts`, and `lib/didanix-atlas-adapter.ts` are `w/mixed` (their existing LF line endings remain intact after removing CRLF pairs). All nine show `attr/`. `git check-attr text eol -- <nine paths>` reports both attributes `unspecified` for each; the Atlas `.gitattributes` has no matching explicit EOL rule for them. Local `core.autocrlf=true` explains why Git considers the checkout clean despite these byte differences.

## Recommendation

After the frozen batch is terminal, a bounded, preimage-checked mechanical normalization of **only these nine Atlas working files** to their exact committed bytes would restore the original strict `sha(readFileSync(atlas+'/'+f.path)) === f.sourceSha256` assertion for all 1,553 source rows. Recheck HEAD, the nine working hashes, Git cleanliness, manifest identity and all 1,553 source hashes immediately before and after. This is a checkout-byte correction, with no source-semantic, manifest, test or Review hash edit. It does not by itself establish that the full `atlas190-current-delivery` module or whole native suite passes; unrelated failures remain separately diagnosed.

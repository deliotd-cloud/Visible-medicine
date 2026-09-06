# Ocular source preparation — not an admission

**Historical pre-admission evidence.** The subsequent [ocular dissection milestone](OCULAR_DETAIL.md) explicitly admits these ten source-labelled entries after bounded geometry checks, retaining unvalidated status. This preparation report remains unchanged; statements below about non-admission describe that earlier checkpoint, not the current atlas.

Retrieved ten exact BodyParts3D v4 ISA source components (469,532 raw bytes) from the [official archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html):

| Source-labelled group | Right FMA / component | Left FMA / component |
| --- | --- | --- |
| Lacrimal canaliculus | FMA59582 / FJ1349 | FMA59583 / FJ1298 |
| Nasolacrimal duct | FMA59555 / FJ1353 | FMA59556 / FJ1302 |
| Lacrimal sac | FMA59545 / FJ1360 | FMA59546 / FJ1309 |
| Upper eyelid tarsal plate | FMA59091 / FJ1375 | FMA59092 / FJ1324 |
| Lower eyelid tarsal plate | FMA59089 / FJ1379 | FMA59090 / FJ1328 |

The preparatory audit verifies the hash-pinned ISA index, official v4 ZIP member CRC/size, exact identities and both-index aliases, finite triangular geometry, raw/canonical hashes, bounds and the established source side-centre convention. None has an existing component owner, exact rendered canonical-fingerprint match, cross-candidate exact match or inherited component hold. These are bounded source-integrity findings, not proof of distinct anatomical tissue or correct anatomy.

**None was admitted or rendered at this preparation checkpoint.** The next required work was to compare original surfaces against one another and the existing globe, eyelid, extraocular, lacrimal and nearby facial source geometry. That bounded evidence and the later decision are now documented separately. Tiny source shapes are preserved instead of thickening or inventing connections. Source names alone do not establish a complete tear-drainage pathway or eyelid anatomy. No lumen, flow or internal tissue is manufactured.

Evidence is `content/ocular-candidate-audit.json`. Alias entries retain matching candidate components, complete source-record hashes and total component counts. `npm run ocular-candidates:audit` regenerates this historical evidence using its pinned Site source commit, archive reader and raw cache. `npm run ocular-candidates:test` now passes 214 committed-evidence assertions without Git history or raw downloads: `ocular-history.mjs` reconstructs the exact earlier catalogue and inventory and checks both complete serialized hashes before using them. Adding `-- --raw` passes 284 assertions and recomputes raw hashes, canonical fingerprints, bounds and face/vertex counts from the verified cache. Current admissions are checked separately by `ocular:test`. Raw files remain outside the Site and GitHub snapshot.

The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), rechecked 6 September 2026, remains CC BY 4.0. Retain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and change notices. Derived source evidence is not converted to MIT/CC0. No fee-bearing service or additional dependency is introduced.

Existing catalogue/profile/model hashes, prior source holds and clinical-review status are unchanged. Clinical identity, extent, continuity and spatial accuracy still require independent review, and actual device acceptance and acquired US/CT/MRI integration remain external gates.

# Spinal corpus CT contract proposal

Only these files belong to this proposal. Integration copies the test and its new fixture into the Website `tests/` paths; `INVERSE_CHECK.mjs` and this handoff remain local proof.

| Path | SHA-256 |
| --- | --- |
| `tests/atlas-spinal-muscle-xray.test.mjs` | `c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa` |
| `tests/fixtures/atlas-spinal-muscle-xray-original.raw` | `af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13` |

The fixture is the whole frozen Website test, byte for byte. `INVERSE_CHECK.mjs` pins both hashes, reverses all 20 actual text diff hunks in memory, and compares the restored bytes to the fixture.

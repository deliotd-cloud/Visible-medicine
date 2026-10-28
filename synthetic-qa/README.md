# Synthetic browser check helpers

Use these successor scripts for future head-history or guided-focus synthetic checks, from the main coordination workspace, with a fresh before-N or after-N build phase. They retain the original synthetic-only assets, loopback binding and byte checks. Do not reuse phases containing STARTED.json or TERMINAL.json.

The input and HTTP lifecycle uses the tested V2 helper. Coordination uses the existing allocated-file saveIndex implementation to avoid truncating the current index while C is full. Historical scripts and receipts are untouched. Original script preimages and successor hashes are in MANIFEST.json.

Six child-process lifecycle cases pass. The actual successor scripts were syntax-checked but were not launched against browser bundles during adoption; no authenticated website or browser acceptance is claimed. SIGINT was simulated via an emitted event in V2 tests.

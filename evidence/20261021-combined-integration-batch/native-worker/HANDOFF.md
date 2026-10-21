# Portable dental MRI native gate handoff

Copy `scripts/test-dental-mri-native.mjs` into the prepared Atlas root's `scripts/` directory, then run from that root with `node --test scripts/test-dental-mri-native.mjs`. Main owns that copy, the focused run, alias registration, integration and evidence retention. This worker ran `node --check` only; it did not run the gate because the exact-source context was still being assembled.

The gate imports the existing hermetic `workspace-test-build.mjs`, bundles the real dental module, content and display catalog helper graph, and reads the local raw catalogue and pins. It checks all 28 full source identities in both raw and display catalogues, frame and catalogue SHA, raw member hashes, unvalidated status, 4 shared method groups, copy-safe results, wrong tabs, whole-record mutations, unrelated catalogue lookalikes, study citations and protocol/subject/privacy limits. It excludes the complete body lesson, review and history resolver from its entry graph.

Prerequisites: the project root must contain the proposed `lib/dental-mri.ts`, `content/dental-mri.ts`, `content/dental-mri-pins.json`, baseline `lib/body-display-catalog.ts` with its actual local dependencies, `lib/body-source-additions.ts`, the public full-body catalogue and `scripts/workspace-test-build.mjs` with installed `esbuild` dependencies. No external baseline checkout, stage proof, original files, source pin proof or platform path is used.

Scope limit: this is a focused native helper and catalogue gate. It does not execute the full body dispatcher, current/history/Review/export integration, browser/GPU behaviour, clinical approval or deployment. Revision-bound radiologist review remains pending.

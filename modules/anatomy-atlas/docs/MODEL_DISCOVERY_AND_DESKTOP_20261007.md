# Model discovery and representative desktop checks — 7 October 2026

Baseline: Atlas `71f9801c2e21889c55b6aacf4bd80aeee5de812f`, website `1addaffc87d4f96ec3f70ba41b4329b9983a4f00`. Local evidence: `E:/VisibleMedicine-LocalStaging/20261007-desktop-native-acceptance`.

## Exact model enumeration, not source admission

The immutable build-input audit recognizes only the exact `scripts/compress-model-delivery.mjs` program (SHA-256 `b18e1c9b00891f31190f8f3ccc02287500673fab48d9e74f0490cc68e9fbddf4`) reached once through the literal default command `node scripts/compress-model-delivery.mjs`. Source/path/command changes lose classification. A different model set receives a different identity, never the previous set's proof.

The report records every committed `public/models/**/*.glb` path, Git blob, byte count and policy disposition, distinguishing source enumeration/rereads from generated-output checks. The real baseline has140 models:121 policy-allowed and19 policy-held. All input identities/policy conflicts and other audit fields remain exact; six previously unresolved filesystem/read sites become classified, leaving44 unresolved sites and25 policy conflicts.

**A classified read is not permission to perform it.** The delivery program would read held GLBs if built from that tree; any held row remains a sanitized-build/source-admission blocker. This is a Git-tree inventory, not proof of the eventual filesystem, codec/dependency effects, plugin/environment discovery, rights or privacy. Closure, isolated-build, rights/privacy and backup-admission flags remain false. No name exception or clinical approval is broadened.

Thirty additive audit tests pass, including changed program/path/flags, duplicate invocation, dirty working-tree independence, added allowed/held models, and virtual symlink-mode refusal. Existing assertions remain intact. Independent read-only diff review found no concrete admission regression. Initial worker fixture/scope failures and final logs are retained. Main's real same-commit comparison loads the previous immutable auditor with only exactly reversible import-resolution replacements; original/derived bytes and mapping are retained, not described as an unchanged executable file.

## Observed local desktop behavior

Chrome tested the existing local worker build with fresh empty local D1/R2/DO, remote bindings off and no spoofed account. That prior build includes60 uncommitted specialist paths: this is not isolated sanitized-tip acceptance. Six HTTP checks pass, including exact current module manifest/HTML and expected307 directory normalization.

Observed: whole-body model and new FMA4149 teaching; keyboard search/selection and focus return; picker navigation to thorax/head-neck/hand; thorax stage advancement and Ctrl+Z; explode-style selection; correct/wrong practice feedback and targeted retry; guided step/caption/target changes; correct guided quick-check feedback; constrained system-sheet Tab/Escape focus return; hand50% explode and reset0%. CSS viewport1280×900 and constrained640×450 have no horizontal document overflow. Constrained viewport testing is **not native200% zoom**. No frame-time/smoothness, screen-reader, diagnostic, authenticated reviewer or clinical acceptance is inferred.

One actionable P2 remains: after **Finish practice**, focus falls to the iframe document rather than the completed-results heading. Question/answer-feedback focus works. Correct the results focus/announcement, add focused regression tests, then regenerate renderer/Review bindings and integrate source-first before retesting the browser. Also retain six unattributed listener errors and six Three Clock warnings for diagnosis; no sanitized caller was captured, so there is no clean-console claim.

The task-owned tab/preview were closed, viewport restored and Listen3000 absence verified. Browser zoom was never changed; native200% testing still needs its explicit temporary-setting permission. CT-head boundaries, clinical desktop PACS, scans, approvals, geometry, dependencies, hosted site and remote backups are untouched. E evidence is same-machine recovery, not off-device protection. The full goal remains ACTIVE.

# Model-first historical validation repair — 17 September 2026

## Scope and invariant

This repair changes validator history only. Runtime source, anatomy, teaching,
geometry, delivery, and the immutable `content/model-first-baseline.json` are
unchanged. The validator still compares the complete canonical named-handler
map and sorted callback multiset, so any unlisted change fails.

## Audited migrations

`scripts/model-first-migrations.mjs` pins each admitted departure by exact
canonical TypeScript SHA-256, commit provenance, and an existing executable
script (these references identify coverage; this repair does not claim that
every referenced script currently passes):

- asset retry and saved-view/reset behavior: `772e3da`, `12bf83e`,
  `2dad4fc`, `5c20d43`, and `6786ed3`; corresponding loading, study-view,
  camera-orientation, and dissection-workbench scripts are recorded;
- vessel visibility: `f271f3f` plus the `47b60cb` source-part integration;
  the vessel-visibility script is recorded;
- attachment exploration: `b1e3710`, `90b117d`, `b6b1ffe`, `0f72c69`,
  `e581676`, `4a9a5d5`, `1bf124a`, and `4516a19`; each regional attachment
  scripts execute the real parent handler;
- callback-only migrations: `47b60cb` canonical formatting for the vessel
  toggle and three existing guarded specimen launchers; `b1e3710` attachment
  show/select bindings; and `720e44a` live-camera zoom-step bindings.

The callback migration applies six exact removals and eight exact additions.
It does not replace the original callback baseline or accept callbacks by
prefix, count alone, or current-source discovery.

## Validator fixture repair

Since `6786ed3`, the workspace session hook owns the active Explore/Dissect/
Practice mode. The server-markup fixture previously injected only the internal
workspace state, so all three iterations rendered Explore after the historical
checks passed. The fixture now injects its requested mode at that session-hook
boundary. Production code is still compiled and rendered; the GPU scene and
session mode remain explicit doubles.

## Evidence

- Source checkpoint: `135dc56634194ad4b8f35e9720746573b0942cc1`.
- Initial failure: five exact named-handler differences
  (`retryAnatomy`, `resetView`, `restoreView`, `changeVesselVisibility`, and
  `showMuscleAttachments`).
- After named pins: the callback gate exposed only the three audited migration
  groups above.
- Final command: `npm run model-first:test`.
- Machine-readable result: `docs/model-first-validation.json` (`passed: true`).

Only `model-first:test` was run as acceptance for this bounded repair. The
referenced behavior scripts are exact follow-up commands, not fresh pass claims;
the main task is reviewing and selecting targeted runs independently.

The main task's independent targeted review reported that the workspace-session
and arm-attachment scripts pass (arm evidence:
`.local/arm-attachments-20260917.log`). Two separate legacy gates remain
unresolved and are not waived here: anatomy loading has a whitespace-sensitive
`practiceQuestionCount` assertion at line 309, and vessel visibility expects
184 arteries while the current admitted catalogue contains 198. Neither failure
changes the exact model-first migration pins or authorizes a runtime edit.

This is source/test evidence, not browser/device acceptance, clinical review,
or deployment evidence. The main task chooses any additional targeted behavior
suites after reviewing this validator-only diff.

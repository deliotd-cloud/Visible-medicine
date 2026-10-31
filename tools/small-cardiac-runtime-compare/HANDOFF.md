# Small cardiac current-state comparison — prepared, not run

`compare.mjs` is a read-only comparison for the **future verified** visual-CT Atlas baseline and its exact seven-file small cardiac successor. The current visual-CT baseline has pending validation and is **not verified**. No runtime bundle, generation, approval, installation, or clinical decision was executed here.

## Inputs and admission

Run only after the existing visual-CT 13-step validation and normal successor generation have completed. Supply `--before`, `--after`, `--overlay`, `--before-source`, `--after-source`, `--before-source-sha`, `--after-source-sha`, `--before-state`, and `--before-state-sha`, each as `--name=value`. The overlay is `F:/VisibleMedicine/recovery/checkpoints/20261031-small-cardiac-imaging-prepared/OVERLAY.json` and its hash is hard pinned. The source inputs are the existing `SOURCE.json` receipts with `site` and complete `sourceRows`; their exact hashes must come from the integration checkpoint. The before state is the completed 13-step `VERIFICATION_STATE.json`, whose path and hash must match the before source receipt. Today's prepared baseline cannot satisfy that gate. The after receipt pins the successor source inventory without requiring this comparison to have already passed.

Every source row is checked against its actual bytes and size. Baseline completion additionally requires all13 ordered results to succeed without a signal or execution error, unchanged log hashes, and the exact visual-CT preparation receipt. Only the seven accepted overlay files and two generated files may differ: `content/body-renderer-revision.json` and `docs/nested-review-validation.json`. The generated review report must be identical except for exactly two fewer pending topic states. Upstream source receipts establish the inventory; this script does not generate them.

The script refuses to bundle when free RAM is below 4096 MiB. It uses each checkout's `workspace-test-build.mjs` and `workspace-component-test-build.mjs`, not a production build. It writes only one JSON result to stdout. Redirect that output to a separate immutable checkpoint when actually run; stop on any failed assertion.

## Comparison scope

The exact accepted inverse must restore all previous concepts and references. Across all 108 nested selections and 972 topics, only FMA4714 X-ray and ultrasound lessons may differ; the rendered learner component must carry each draft body and citation. Review source, link, binding, checklist, blockers, and imaging block must remain intact. FMA4714 review teaching must contain exactly the two draft topics and references. The renderer-driven geometry and material revision changes must cover all 108 selections, while the teaching revision changes only for FMA4714. Old revision/material values must receive HTTP 409 before any storage access; imaging submissions remain blocked. This is software evidence only and does not approve geometry or imaging.

The rejected broad `test-nested-coronary-sinus-xray.mjs` must remain byte-identical to the overlay's baseline pin. The separate historical validators remain required in the normal candidate validation, with their historical fixtures; this comparison does not replace them.

## Current verification

Only `node --check compare.mjs` passed. Main review and runtime execution remain pending until sufficient RAM and verified inputs exist. The current baseline receipt is still prepared, not verified. Preserve the installed/candidate distinction.

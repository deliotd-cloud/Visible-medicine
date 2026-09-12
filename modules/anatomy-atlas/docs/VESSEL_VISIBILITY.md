# Compact artery / vein visibility

Open **Vessels** in the existing narrow system rail (or mobile Controls sheet). The label expands in place to Arteries and Veins with shown/available counts and mixed-state checkboxes. The master switch is unchanged. No new toolbar, always-open panel or persistent filter state is added.

- Changes affect only that vessel type in the current region and laterality scope, including unpaired/midline vessels already in that scope.
- **Show** explicitly restores all available selections of that type, including those hidden by the current recipe. **Hide** removes currently visible selections of that type. Other vessel types and nonvascular tissues retain their exact visibility.
- The stage/focus identity, camera, isolation, selection, separation, cutaway and tissue opacity are not reset. A hidden selection remains recoverable through the existing notice. These controls change dissection inclusion; they do not bypass clipping, isolation or the master switch.
- Undo/Redo share the existing bounded dissection history. Each group change is one step; repeated no-ops do not consume history or clear Redo. The buttons are available in the expanded group without changing workspace mode. They undo the latest dissection action, not exclusively vessel changes.
- Exam mode locks all mutation callbacks. Group changes are disabled while the Vessels master switch is off. New recipes retain their existing clean-reset behaviour; saved views continue to serialize ordinary hidden IDs.

The control reuses `lib/anatomy-vessels.ts`, the existing checked source-name/FMA classification used for vessel colours: 175 arterial and 98 venous selections in the present display. No source taxonomy, new medical claim, geometry or vessel identity is introduced. Ambiguous/unknown vessel labels remain **Other vessels** if present, rather than being silently assigned to an artery/vein group. These counts do not imply complete networks, lumens, territories, perfusion or patient correspondence. Independent specimen and nested pulmonary controls remain separate.

## Validation and limits

`npm run vessel-visibility:test` exercises the actual helper/reducer through 36 region/side scopes and 2,109 changing stage/focus plans, checks other-tissue preservation, no-op/deduplication, exact Undo/Redo, unclassified rows, exam/master-off guards, actual component callbacks and actual parent handler. The real component is server-rendered in collapsed/mixed/unknown states. Existing classification, source catalogue, renderer, teaching and dependency lockfile are byte-preserved against the pre-change source.

The existing dissection-history, vessel-colour and hand/foot joint suites remain independent regressions. The model-first test retains its original portable baseline and explicitly records the new vessel handler/bindings plus the previously implemented joint navigator; their behaviour is checked by their focused suites rather than accepted by hash alone.

No browser/keyboard-focus/touch/screen-reader/GPU acceptance has been performed in this background pass; source/clinical sign-off and production publication are separate gates. No dependency, font, texture, dataset, external service or licence obligation was added. Existing commercial-use attribution remains intact.

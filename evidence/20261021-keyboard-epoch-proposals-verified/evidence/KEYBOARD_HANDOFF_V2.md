# Regional keyboard V2 proposal — 21 October 2026

The main task's retained-junction native run `F:/VisibleMedicine/staging/20261021-keyboard-epoch-native-proof/KEYBOARD_CURRENT_HISTORY.json` recorded six registrations: two Review passes and four regional failures. The first regional failure is the old combined `enabled || enableRotate` source expression. Atlas source190 intentionally checks `enabled`, handles camera zoom, then checks `enableRotate` before rotation arrows. V1 and its 6-test failure evidence remain unchanged. The Review proposal remains unchanged and passed both registrations.

Only `v2/tests/atlas-keyboard-modules.test.ts` is newly proposed. The exact original whole test is retained at `../preimage/atlas-keyboard-modules.test.ts` (SHA-256 `c51ddcb68911a77154846e14459e666b1c2199dc466feda3d4c497b4fbf3275c`), permitting an exact whole-source inverse of this proposal. The original saved-export manifest/source assertions are still in the V2 test. The original focus, combined disabled-rotation and prevent-default source assertions now additionally execute against the exact historic camera source at `a10496da94d9d054306bbc48e5ae9c98239d82b5`, whose SHA-256 remains pinned at `9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220`. The current source190 branch retains focus and prevent-default checks; its ordered guard requires disabled controls to return before zoom, camera zoom to be consumed before the rotation-only gate, and rotation-disabled arrows to return. The exact source190 SHA-256 `47d9ea06a7b43ee613ad734767daaf567b765f3b931efb8f8c3b680026a3909e` rejects any source drift. The zoom helper is also checked for independence from `enableRotate`; fitted-camera camera-argument and all four exported module checks remain.

| Version | SHA-256 |
| --- | --- |
| Original complete regional test / frozen candidate preimage | `c51ddcb68911a77154846e14459e666b1c2199dc466feda3d4c497b4fbf3275c` |
| V1 regional proposal, preserved | `898ccdd2e6fbcd6399b67305d2e2285e8f98755d5d1c19ae72a2dfbe78f11b40` |
| V2 regional proposal | `6988cd068f47729143dffa7ff33f16db9293d78c098a54ca9961821485e9fa70` |
| Unchanged Review proposal (native 2/2 pass) | `3c96b803580556775d34863291a0043f233c1e663be93dcc4d65a50230269f19` |

No new native test, build, typecheck, source edit, or candidate edit was performed here. Main owns admission after the running full suite is terminal. Main can compare the frozen regional test to the original preimage byte-for-byte, compare V2 to V1 and original, copy only V2 into its retained-junction native harness, and rerun once:

```powershell
node --experimental-strip-types --test F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check/tests/atlas-keyboard-modules.test.ts F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check/tests/atlas-label-keyboard.test.ts
```

That command is for main after replacing its harness regional test with V2; the copied Review test remains as its passing proposal. A pass would establish these source/export contracts only, with no clinical, spatial, deployment, or public-release claim.

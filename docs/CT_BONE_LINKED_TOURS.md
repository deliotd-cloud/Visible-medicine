# CT-only bone guided learning

Two draft sequences extend the existing linked-learning controls without changing the original sequence packets:

- `ct-parietal-occipital`: left parietal, right parietal, occipital.
- `ct-nasal-ethmoid`: left nasal, right nasal, ethmoid.

These use only the six existing bindings in `head-ct-bone-comparison-review.ts`. No new mesh, annotation, scan, clinical fact source, external asset or dependency is imported. Each saved CT representation remains a partial mask. Generic 3D bones and CT are separate subjects and extents; there is no spatial registration or exact MRI equivalent.

## Navigation

Both sequences appear in the 3D linked-tour picker, linked-learning library and CT Guided learning selector. MRI excludes them. Existing step controls, missing-mask slots, source-bound links and eligible-mask practice are reused. Practice feedback can return to the exact corresponding tour step. MRI absence is explicit rather than an empty link or incorrect CT-absence message. Existing sequence IDs, order and review digests are unchanged.

## Review

The independent packet revision is exported as `HEAD_CT_BONE_LEARNING_REVISION`. Its verifier requires the exact head manifest, verified six-binding comparison packet, correct CT-only source links and ordered packet digest. Clinical Review displays this evidence inside the existing collapsed CT-bone section, behind its existing authorization gate. It fails closed on a stale source or sequence.

The existing bone-comparison decisions still apply only to their existing packet. There is no new approval or save endpoint; the new tour evidence is for inspection and feedback, not a recorded clinical approval. Before release the owner must review ordering, educational usefulness, every actual mask extent, side and native-plane orientation, and the independent generic models. Loaded-image/GPU and signed-in review acceptance are separate from source/rendered-component tests.

## Verification and recovery

Evidence is local under `E:/VisibleMedicine-LocalStaging/20261009-ct-bone-tours`. Tests cover all six exact CT/3D step links, MRI exclusion, missing and mismatched entries, partial-mask practice, stale revisions, altered order/source/wording, independently verified review rendering, and prior tour regressions. No scans or private identifiers are included in URLs or recovery sources. Work is local-only; GitHub/off-device backup and public deployment are not implied.

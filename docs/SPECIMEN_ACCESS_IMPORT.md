# Specimen access and retry integration

Local integration: Atlas `b7ed1802210cfc12110bcac57b3c6fe7471e0f13`.
The existing pipeline delivers matching learner and protected Review code.
Eye layers, femoral/cranial arterial components, independent specimen dissection
and identification now retain exact-request 401/403 reasons and fixed guidance.
No extra controls, view resets or access grants are introduced. Unknown errors
retain generic feedback; hidden/unrequired bundles cannot dominate notices.

Arterial asset retry no longer falsely resets the independently observed canvas
health. Successful model loading can recover Education links without waiting for
a second canvas-ready event. Actual renderer loss, absent required models and
failed loads still block linked navigation and practice. Identification failure
immediately rejects stale answer callbacks; successful loading recovers the same
question without changing the score.

The source regression suite exercises actual component callbacks and retained
view/readiness state. `tests/atlas-specimen-access.test.ts` pins all four source
files in learner inputs, Review inputs and the renderer fingerprint, checks
delivered bundle bytes/messages and guards against the false renderer reset.
Native browser/GPU acceptance is separate and recorded in the dated checkpoint.

No geometry, teaching, scans, CT/MRI masks, desktop PACS, entitlements, licences,
dependencies, fees, clinical decisions or public deployment change.

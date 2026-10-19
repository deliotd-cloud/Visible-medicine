# Exact return from guided practice

9 October 2026. Guided CT/MRI practice now captures its sequence and step when
a single-structure or sequence set successfully starts. Browsing another tour
after finishing no longer changes the completed set's comparison context or
the destination of **Return to Guided learning**. The return restores the
original position and canonical URL, selecting only its exact current-study
entry; an unavailable entry is not replaced with other anatomy.

The snapshot is session-only. It clears on study replacement, package close,
browser-history restoration, ending the set, or starting ordinary practice.
Rejected starts preserve the existing context. Returning is refused while a
question is active. The UI adds no control, storage, network request or panel.
Scores, source-bound comparison mappings, clinical review packets, entitlement
checks and imported scan/mask bytes are unchanged. These are semantic links
between unregistered subjects, not patient-space synchronization.

## Evidence

- Read-only Sol Medium audit confirmed the mutable-origin defect; a second
  bounded diff review found no blocking lifecycle regression.
- Before correction, both new CT/MRI tests failed: Results used a later
  ventricular tour instead of the original brainstem step.
- The actual-viewer harness now covers both single and sequence starts,
  intervening tour browsing, original comparison context and exact return URL.
- 80 focused tests, fresh types and the unchanged combined Review verifier pass.
  An older harness invoked the hidden Return callback during an active question;
  it now verifies refusal, then finishes the set and tests the actual return.
  Initial diagnostic and corrected logs are retained, not discarded.

Local build, delivery and source-only checkpoint evidence is saved under
`E:/VisibleMedicine-LocalStaging/20261009-guided-practice-origin/`.
This is not new signed-in browser/native-image, GPU, clinical or registration
acceptance. No public deployment or verified GitHub/off-device backup is claimed.
The Site workflow keeps this change in the local website, without modifying
the generated Atlas modules or the owner's desktop clinical PACS.

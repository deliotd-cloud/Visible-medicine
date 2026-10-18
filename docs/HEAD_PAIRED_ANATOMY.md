# Same-study paired head anatomy

The structure information panel offers **Other side** for five explicitly mapped pairs: lateral ventricles, caudate nuclei, putamina, globi pallidi and thalami. It uses the existing accepted CT/MRI head package and canonical concept links; no new geometry or source dataset is included.

## Identity and interaction

- Require the current pinned head-manifest revision, exact source ID, label, laterality and representation through `headAtlasConcept`.
- Require the selected entry to be the actual current study entry and exactly one mapped entry on each side. Missing, duplicate, changed or shared-geometry alias entries fail closed.
- Select the saved counterpart in the **same study**; never mirror geometry or substitute another structure. Clear the search and grouped overlays, show the selected annotation and use its existing native-plane focus.
- Update the canonical concept URL, CT/MRI comparison and existing 3D Atlas link. Browser Back restores the previous concept through the existing history flow.
- Focus the structure heading after the matching annotation loads. Hide the action with no loaded selection, during a pending different selection and during an active practice question.

The existing asynchronous selection loader can briefly retain the previous annotation before its loading effect clears it. This is not a promise of atomic frame replacement. Source read errors remain explicit; no fallback anatomy is loaded.

Current pinned-package availability: all five CT pairs (ten directional actions) are eligible. The corresponding MRI entries are shared-geometry aliases, so no MRI paired action is exposed in this release. This deliberately preserves the source gate; having a canonical concept link alone does not establish independent geometry. Existing MRI semantic comparison links remain available with their source limitations.

## Scope and review

This is semantic discovery of the saved opposite-side annotation, not a diagnostic symmetry comparison, a claim of complete boundaries, a new clinical approval or patient-space registration. CT and MRI are different subjects; the anatomical 3D Atlas is a generic reference. Existing source limitations and revision-bound teaching/review gates remain in force. The separate desktop clinical PACS and specialist-owned masks are untouched.

The pure helper tests exercise all twenty potential directional CT/MRI pair mappings, ambiguity, aliases, forged entries and revision/identity mismatches. A metadata-only audit against the pinned manifest records the actual availability above. Actual-viewer hook tests cover URL/history, heading focus, search/overlay reset, active practice concealment, pending loads, cancellation and late completion. The integrated 1280px desktop check verifies CT thalamus selection, exact links, heading focus, filter reset, Back and quiz concealment; the MRI check verifies alias suppression. No horizontal overflow or page scrolling was observed. The final screenshot is the closed scan-free import page, not the action over a native scan. Exact source/build hashes and observations are retained in the same-machine E-drive checkpoint; they do not constitute clinical sign-off or public deployment.

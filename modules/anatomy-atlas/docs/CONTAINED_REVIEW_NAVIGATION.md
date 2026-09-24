# Contained nested review navigation

The website's private regional integration exposed a standalone `/review/nested`
link in the coronary teaching panel. That route belongs to the standalone Atlas
review application, not the contained website viewer.

`NestedTeaching` now accepts `reviewAvailable`, defaulting to true so standalone
review is preserved. The eye, named-component and ventricular/organ workbenches
pass `!assetBase`. The separate unnamed cranial-artery source fallback applies
the same guard to its direct link. A contained viewer therefore retains teaching,
source identity, references and self-checks without advertising an unavailable
review destination. No permission, stored review, source mesh or teaching draft
is changed. Website review integration must be implemented explicitly rather
than inferred from a working standalone URL.

Run `node scripts/validate-contained-nested-review-links.mjs`. It renders actual
React components for coronary venous, cardiac, eye, named femoral and unnamed
cranial-artery studies, plus direct teaching samples. Exact source-bound links
remain in standalone mode and are absent with the contained asset base. The
GPU-only fixture is not evidence of visual/device or clinical acceptance.

Regenerate the shared module before website publication; editing an exported
bundle by hand is not permitted. Rendering revision fingerprints must advance;
no old radiologist approval is migrated or implied.

# Guided library discovery — local website import

The whole-body Guided learning library includes optional tour search and region
filtering from Atlas `b148cb9ed9ac7e397d1005f7e7aca4017c3c2373`.
Find a tour starts collapsed. Search includes existing titles, regions and step
titles; the current tour remains visible and unchanged until a different visible
result is explicitly selected. Regional libraries keep scoped choices.

The generated learner and protected Clinical Review share the same source epoch.
No anatomical content, models, masks, patient data, licence, entitlement or approval
is added or changed. These are semantic educational tours, not registered scan
trajectories. Existing private model access remains enforced.

Source tests cover the actual picker, preserved player identity, invalid/hidden
selection refusal, nested eligibility, failed-load recovery and regional scope.
Website import tests check matching source bytes and built-runtime delivery;
they do not establish clinical or actual-browser acceptance.

Local evidence and recovery:
`E:/VisibleMedicine-LocalStaging/20261008-guided-library-integration/`.
No public deployment or verified GitHub/off-device backup is claimed.

## Verification

Eighteen affected integration tests pass, along with types, the combined Review
verifier, regional/website builds, 46 route/access checks and 19 exact learner
asset readbacks. Initial incorrect test assumptions about namespace and renderer
binding transformations were corrected against the actual importer; see the
local test-corrections.txt receipt. Production gates were not relaxed.

Actual desktop browser QA at 1280×720 confirmed initial collapse and Enter-key
expansion, step-title search (Trachea), incompatible region yielding no results
and a disabled chooser, keyboard clearing back to 37 choices, Thorax narrowing
to four choices, and explicit selection of Cardiac veins. Filtering did not
change the current tour; selecting a result did. Collapsing again retained the
selection and filtered state. Page width and scroll width both measured 1280.
Screenshot: desktop-guided-library.png in the evidence directory above.

The unsigned browser correctly received 401 for protected models; successful
rendered anatomy, camera playback, enlarged text and clinical acceptance were
not established. No authentication bypass was attempted. Existing scan tabs
were untouched; the temporary QA tab closed and viewport override reset.

34 obsolete generated chunks have exact local recovery copies. 144 redundant
build-only model copies were removed only after checking existing E recovery;
canonical originals remain unchanged. This is local delivery, not publication.

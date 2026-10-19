# Guided head learning: question style

9 October 2026. Local-only website improvement.

Within CT or MRI **Guided learning → Sequence steps**, the existing collapsed
disclosure now includes a labelled question-style selector: **Find it on the
scan** or **Label the highlighted structure**. Changing the choice alone starts
nothing. **Practise available steps** opens the same ordered, eligible set in
the chosen style. No additional controls appear in the main image toolbar.

Find-it remains the default. The per-structure **Find this structure** action
still starts Find-it practice. Unknown modes are refused without altering an
existing set. Points, unavailable masks and shared-geometry aliases remain
excluded; no extra images or inferred anatomy are added.

Label mode uses the existing mask/choice engine. The anatomical label stays
hidden until feedback; image clicks cannot submit a label answer. First-attempt
scores, unscored retries, separate missed-question follow-up and return to the
exact previous tour position retain their established behavior. This is
session-only formative practice, not clinical acceptance or exam certification.

## Verification

Actual-component CT/MRI tests cover the collapsed selector, explicit starts,
mode forwarding, hidden labels and exact return navigation. Hook tests cover
label scoring, first-attempt preservation, revisit mode, invalid-mode refusal
and the unchanged single-target Find action. The broader affected suites also
cover native navigation, saved-mask scoring and completed-set review.

Initial verification exposed two pre-existing test issues: a literal assertion
for an obsolete single-target guard and a missing orbital-teaching dependency
in the Review test loader. Both are corrected to test the existing behavior;
original failures and baseline diagnostics are retained. The initial 91 passing
cases and 10 corrected-suite passes (one overlapping case) cover 100 unique
checks. Types and unchanged Clinical Review verification pass.

Build, route/exact-client receipts and scoped same-machine source recovery are
recorded in `E:/VisibleMedicine-LocalStaging/20261009-guided-question-style`.
No new actual-browser, GPU, native-image or clinical acceptance is claimed.
No approved masks, patient data, models, paid access, source registration,
desktop PACS, dependencies or public deployment changed. Separate source
repositories, specialist work and the full roadmap remain intact.

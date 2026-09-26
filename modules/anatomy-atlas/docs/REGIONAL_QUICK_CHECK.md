# Selectable regional structure checks — 26 September 2026

The shared regional/whole-body Practice panel used to render every question as
plain text, including the explicitly keyed questions already interactive in the
dedicated shoulder viewer. `QuizNotes` now uses the same `StructureQuickCheck`
for the 11 current display-catalog entries with explicit answer keys. It preserves
the existing collapsed panel, so no new navigation or permanent controls are added.

Choose a radio answer, select **Check answer**, read the formative draft feedback,
then **Try again**. No score, clinical decision or personal record is stored.
Changing selection resets the attempt; changing question/options/key/explanation
also resets it. Exam mode suppresses these notes entirely. Invalid explicit keys
cannot be marked. The other 1,093 entries retain their exact existing text, source
notes and references; no answer has been inferred from their bullets. Anatomy,
teaching text, model bytes, source holds and entitlements are unchanged.

## Evidence and limits

- `node scripts/test-regional-quick-check.mjs`: actual component SSR for all
  1,104 display entries, real key/choice forwarding, initial explanation hiding,
  unchanged legacy markup/citations, exam suppression and invalid-key handling.
- `--baseline` replays `f46b48c`'s actual component and fails on the first clavicle:
  no radio choices instead of three. It does not edit the checkout.
- `node scripts/test-structure-quick-check.mjs`: actual component callback tests
  cover correct/incorrect answers, retry, focus and content-revision resets.
- Renderer, selection visibility, body/shoulder review checks, TypeScript and
  the shared regional production build pass. Existing build size warnings remain.
- Review renderer fingerprints regenerated; existing decisions are not migrated.

Current browser/keyboard/mobile acceptance and website integration remain open.
The website still uses its separately saved module; this source change is not
a deployment or clinical acceptance. The coordinating checkpoint records exact
source, GitHub and independently restored D-drive recovery evidence.

## Worker handoff

Terra Medium performed bounded read-only discovery; its optional femoral
recall-question suggestion was deferred in favour of the demonstrated existing
keyed-question gap. Sol Medium authored the focused component regression.
The coordinator implemented the UI, reviewed the test, corrected an assertion
to inspect `explanation` rather than `note`, ran integration checks and owns all
backup steps. Token measurements unavailable; no savings percentage claimed.

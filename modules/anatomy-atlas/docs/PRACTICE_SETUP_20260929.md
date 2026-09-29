# Compact practice setup — 29 September 2026

Session length now sits inside the existing Practice options beside answer mode
and target selection. There is exactly one selector; the header duplicate is
removed. Phone users can select 5,10 or20 questions without closing/reopening
the modal panel. Existing candidate limits, scoring, retries, active-session
controls, anatomical content and model bytes are unchanged. Shoulder detail has
a fixed authored question set and did not have the relocated control.

Verification: reasoning practice18,669 assertions, practice panel navigation,
result navigation23 scenarios (including guided-tour selection rejection),
TypeScript, requirements inventory and regional/shoulder builds pass. The result
test's missing guidedLearning fixture was corrected and its guard explicitly
tested; no guard or application selection logic changed.

Actual generated viewer runs at1280×900, touch375×812 and touch320×480 with200%
text each change session length10→5→20 in the open setup panel, complete20 questions,
score16/20 for deliberate errors and retry4/4. Feedback/citations work, with no
page errors, failed resources or horizontal overflow. See
`docs/evidence/practice-setup-browser-20260929.json`.

No new dependencies, assets or licensing requirements; no scans or approvals.
This is a source/browser improvement, not clinical or physical-device validation.

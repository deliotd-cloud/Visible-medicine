# Source-specific interactive reasoning review

27 September 2026. Draft evidence, not clinical sign-off.

The body worksheet now includes a collapsed Interactive reasoning section,
separate from the nine teaching topics and Quiz notes. It shows the actual
Apply anatomy prompt, correct answer, eligible same-side alternatives,
explanation, references and exact source/model checksums. At introduction this
covers 146 concepts in 268 source representations; 836 selections explicitly
have no eligible question. This is not comprehensive assessment coverage.

`bodyReasoningReview` uses the learner's actual practice engine with the complete
corrected display catalogue. It sorts choices for stable review fingerprints;
learner filters can reduce the displayed choice set and randomize its order.
No new question, guessed alternative or one-choice fallback is manufactured.
Review applies only to this exact representation and displayed question, not
all laterality variants, nested specimens, other questions or the whole bank.

Worksheet transport is version 2. The old version-1 parser rejects the expanded
packet rather than letting an old interface hide the newly included material.
Source fingerprints intentionally retain the original version-1 source domain:
source geometry has not changed. Teaching fingerprints include the full question
snapshot, correct choice, alternatives and component/model hashes. The teaching
checklist now explicitly includes that evidence. All previous teaching revisions
are stale and require re-review; historical events remain untouched. Geometry
revisions remain unchanged when their source and renderer are unchanged. No new
decision track, database migration, automatic approval or authentication change.

Validation: `node scripts/test-body-reasoning-review.mjs`,
`node scripts/validate-body-review.mjs`,
`node scripts/validate-body-decisions.mjs`, and TypeScript. Focused validation
compares all eligible questions with the real session generator, tests content/
source mutations and malformed packets, reconstructs historical revision hashes,
and checks that the actual old response parser rejects new worksheets. These are
software checks; the owner radiologist must still evaluate the medical content.

No new external assets, licences, dependencies, patient data or model changes.
Source changes require the normal pinned import before they appear on the website.

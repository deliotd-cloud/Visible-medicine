# Regional quiz website integration — 26 September 2026

The local shared regional/whole-body viewer and Clinical Review import/viewer now
use Atlas `36c53fb9e19fca1c7e579f79d6d4807e4778ac19`. This delivers selectable
answers, formative feedback and retry for 11 explicitly keyed structure questions.
The other 1,093 quiz notes remain unchanged. No answer is inferred; no grade,
clinical decision or personal record is created. Exam mode hides these notes.

All 136 registered models / 143 paths / 199,033,932 bytes are unchanged. Only
the shared regional source/manifest inventory binding changes. The dedicated
shoulder, female-pelvis and lower-limb exports remain independently pinned.
Access stays administrator-review; no imaging connection, skin candidate admission,
scan/mask import, dependency, clinical approval or database migration is added.

The review import remains 837 files; 778 overlapping learner inputs match its
pinned source. Nine raw differences are only CRLF/LF endings. Review integration
hash: `e43199ff35ad70a54d3d0179404f97c5c8388bcd42e4eb74f763162e704c419a`.
Prior decisions stay append-only; changed render revisions require re-review.

The existing 94 Atlas/access/model/review integration checks, source parity,
inventory verification, review/website production builds and TypeScript pass.
A further delivery test binds the new question controls to the source already
tested with actual Atlas components. Release pins are mechanically refreshed;
behavioral assertions and historical independent-module fixtures are preserved.
Current browser/keyboard/mobile acceptance remains outstanding because the local
website navigation was blocked. These checks do not establish clinical acceptance.

Previous replaced generated JS/CSS and manifests were hash-verified and retained
under `D:/VisibleMedicine-Atlas-Recovery/regional-quiz-prior-generated-20260926`.
No model files were removed. Source/runtime recovery and GitHub/D verification
are recorded in the main task's `work/REGIONAL-QUIZ-WEBSITE-CHECKPOINT-20260926.md`.
Local-only; no publication or remote storage change. Next: verify the actual
regional Practice and Clinical Review journeys when browser access is available.

# Header keyboard proposal — 21 October 2026

The staged `components/SiteHeader.tsx` changes one focus guard. A closed primary group now stays closed while Tab reaches its top-level link or disclosure button. Focus inside an already open panel retains it. The disclosure's existing `onClick` still opens and closes the panel for pointer and native Enter/Space activation; link hover, Escape focus restoration, blur, outside pointer, and page-scroll handlers are unchanged.

The exact original is retained at `originals/components/SiteHeader.tsx.raw`. Canonical and frozen-candidate source bytes matched SHA-256 `ab71e13765bb490f5f891d933f09b40987c9643f4e4bee1ba7c2471fa94feeec` at handoff. `FILES.json` lists proposal hashes and the source guard. The self-contained prop-handler harness passed 2/2 focused tests; output is in `TEST.log`. The diff is one line at the group `onFocus` handler. Existing header-session and fixture guard files were read, not changed.

This is a proposal only. The isolated test cannot prove native Enter/Space behavior, visual layout, mobile behavior, or real browser focus order. Main should recheck the expected source hash, integrate only after the live full suite terminates, then run the relevant header tests and browser keyboard acceptance. No source or candidate files, running processes, metadata pins, dependencies, Git state, or hosted artifacts were changed.

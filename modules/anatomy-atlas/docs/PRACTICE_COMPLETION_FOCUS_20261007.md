# Practice completion focus — 7 October 2026

The local desktop check recorded in `MODEL_DISCOVERY_AND_DESKTOP_20261007.md`
found that Finish practice removed the active control without moving keyboard
focus to completed results. The pre-fix component at `20405ebcf79b25107334a073127cd1b396b47495`
mounted its navigation helper only in the active-question branch.

The helper now remains in the information panel. Explicit question, feedback,
results and inactive phases retain the existing question/feedback behavior and
focus the results heading once after normal completion or partial early exit.
Its score paragraph describes the heading. Focus uses `preventScroll`; only
the panel's own scroller moves. Hidden, inert, disconnected, outside-panel or
closed-sheet targets are not focused; opening a closed compact sheet retries
after its normal initial-focus transition. Idle/outside-Practice phases do not
take focus. Scoring, anatomy, models, entitlements and reducer state are unchanged.

`test-practice-panel-navigation.mjs` exercises the actual helper with controlled
hooks and reducer transitions; `test-practice-completion-focus.mjs` binds the
target and phase wiring to the actual JSX and checks the committed pre-fix markup.
These are not browser or screen-reader acceptance. The wider reasoning-practice
check exposed an existing missing `coronaryScene` fixture: the exact committed
handler reproduced that failure; only its missing empty context fixture was added,
without removing assertions. The original failure and corrected pass are retained.

Evidence: `E:/VisibleMedicine-LocalStaging/20261007-practice-completion-focus`.
Renderer identity must advance through the normal pipeline; prior approvals must
not be carried forward. Generated website delivery, keyboard/browser checks,
genuine reviewer/private-host acceptance and radiologist sign-off remain separate.
No dependency, asset, scan, mask, approval, GitHub upload or deployment is added.

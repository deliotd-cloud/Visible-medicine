# Compact tour-step navigation

29 September 2026. The existing Step n of total indicator is now a drop-down
with numbered stop titles in all 17 regional tours and the dedicated shoulder.
No additional toolbar, permanently expanded contents list or scroll section.

Opening the picker pauses timed playback and camera motion. Selecting a different
valid stop uses its existing smooth camera transition, source structures, caption
and fresh step-bound teaching. Closing or cancelling never resumes playback;
the learner explicitly presses Play. Re-selecting the current stop changes nothing.
The picker is disabled and its open menu discarded when anatomy becomes unavailable.
Start, Back/Next, Finish, reduced motion and Exit restoration retain their behavior.

The existing Select primitive supplies keyboard navigation and focus return.
Menu titles wrap at narrow widths and enlarged text. No dependencies, anatomy,
teaching facts, tour definitions, progress persistence or clinical approvals change.
Jumping to a stop is navigation, not a claim that preceding teaching was completed.

`npm run tour-step-picker:test` checks all 97 stop selections across 18 tours,
exact IDs, invalid/unavailable requests, pause-before-selection, no implicit
resume, real regional frames and the shoulder host session. Browser and website
delivery evidence belongs to the coordination checkpoint. Physical-device and
screen-reader acceptance remain separate from automated/browser-emulation checks.

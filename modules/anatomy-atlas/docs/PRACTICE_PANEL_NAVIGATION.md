# Practice panel navigation

The desktop anatomy study aside retains its scroll position between questions. Starting a new session or advancing after feedback previously left the new prompt above the visible panel area. Starting, answering, and advancing also remove the focused button, which can leave keyboard focus on the page body. The same content is mounted in a focus-managed sheet on compact layouts.

`PracticePanelNavigation` runs only for an active question. It focuses the question heading on a new session or question, and the feedback container after a correct, incorrect, or skipped answer. The heading describes the visible prompt; the existing polite live output remains the question and result announcement. The effect resets only the panel's own scroller and uses `focus({preventScroll:true})`, so it does not ask the browser to scroll the outer page. It handles a closed mobile sheet after that sheet opens and runs again if switching panel layouts remounts the question. A repeat render of the same question and answer phase leaves user scroll and focus untouched.

Focused check: `npm run practice-panel-navigation:test`. It executes the installed component effect with controlled hooks and practice reducer actions for all three answer outcomes, retained scroll, mobile sheet opening, and layout remount. It is not a browser, screen reader, or clinical validation.

24 September bounded local Chrome verification: start a naming session, Tab
from the focused prompt to an answer, Enter to answer, then Tab/Enter from
feedback to the next question. Focus followed each intended target; the outer
page remained at scrollY 0 and the new-question aside at scrollTop 0. A temporary
390 × 844 desktop viewport remounted the active question in a sheet. Opening
Practice settled focus on that prompt after the sheet animation; Skip and Next
focused feedback and the following prompt with outer page/popup scroll at 0.
The screenshot showed all four choices, Skip and Return to model without
horizontal overflow. The viewport was restored and temporary test tab closed.
An attempted final Close check encountered a refreshed Explore state, so no
close-button focus-return result is claimed. This is not real touch, a screen
reader, 200% text zoom, or a hosted correction. The existing private website
must receive a new generated module before claiming the fix there.

The broader `model-first:test` initially exposed an omitted historical coronary
launcher migration, unrelated to this focus change. Its exact callback is now
checked once against immutable commit `23bb61d97371fd343202ae60fd7c21af8b9b4854`
and once against current source, then executed to verify camera capture, cleared
nested selection, coronary study, return-focus launcher and selected parent.
All prior baseline assertions remain. The resulting 3,754 checks pass; original
source geometry, recipes and handler-preservation checks remain in force.

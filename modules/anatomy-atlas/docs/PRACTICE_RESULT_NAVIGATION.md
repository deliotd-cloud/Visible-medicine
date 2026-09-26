# Study from Practice results

Completed and early-exit regional/whole-body Practice results now open Explore,
select and frame the chosen structure, and request its information panel.
The results remain available when returning to Practice. An active examination
still disables/guards this action. No teaching, geometry, entitlement or clinical
approval changes; no extra persistent control is added.

Explore is restored before selection so its saved hidden structures/system
choices cannot overwrite the new selection. The existing selection handler
restores only the selected target. A saved camera restoration is cleared before
framing, with an explicit camera reset, avoiding its precedence over recentering.

The action uses a native button. After its results panel becomes hidden, focus
can move to the selected structure's named heading without scrolling the page.
The lookup stays within the original information panel, including the portalled
compact/mobile sheet. It ignores disconnected panels, closed sheets and a newer
focus destination. Actual browser, touch and assistive-technology acceptance
remain pending; source tests do not establish those outcomes.

## Evidence

- `practice-result-navigation:test`: 23 controlled scenarios executing the actual
  component and selection/result callbacks, workspace hook and dissection/quiz
  reducers. Complete/early-exit result retention, restored visibility, action
  ordering, camera clearing, active-exam guard and scoped focus guards pass.
  Responsive flags exercise the action contract, not physical viewport behavior.
- The same test executes the original result callback from `167dcb9`: it selects
  the target while leaving the mode as Practice, reproducing the hidden-teaching
  defect before the fix.
- Practice return/panel, renderer and selection visibility checks pass. Log:
  `.local/test-logs/2026-09-26T11-51-49.480Z-52480-8865cce7.log`.
- The actual search transition harness retains its 19 passing scenarios.
- Review/decision checks pass with refreshed unsigned renderer/shoulder
  fingerprints; no approvals migrated. Log:
  `.local/test-logs/2026-09-26T11-52-24.685Z-25152-3525ebc9.log`.
- TypeScript passes. One test-only prefer-const lint diagnostic was corrected;
  focused lint and the 23-scenario test rerun pass.
- Production module build passes: 3,376 modules in 6.57 seconds. Existing
  large-chunk warnings remain; this change does not claim a performance gain.

Before publication, test completed and early-exit results in the actual browser,
desktop and phone-width/focus information sheets, using pointer and keyboard.
Check visible named details, framing, no page scroll, return to retained results,
and isolation of two embedded viewer instances. Existing licensing, privacy,
clinical and imaging release gates remain unchanged.

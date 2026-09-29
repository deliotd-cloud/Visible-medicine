# Sequential clinical review navigation — 29 September 2026

Integrated locally from Atlas `1ccfb21d4dcb07fd6a9a1ef8306b6c1d13dfea1d`.
In Clinical Review > Body review, use **Previous structure** or **Next structure**
at the worksheet top. Region, system and search filters stay in place. The queue
page follows selection across20-row boundaries and opens at deep-linked entries.
The counter describes queue position, not completed reviews. Manual queue-page
browsing remains separate from changing the selected worksheet.

Unsaved edits require confirmation before leaving. Cancel preserves the current
draft; confirm discards it. Clicking the selected queue row does nothing, preserving
edits without a needless prompt/refetch. Save or export needed edits first.
These controls never save or approve automatically; existing per-user access,
revision checks, separate clinical tracks and audit history remain in force.

## Evidence

- Nine actual source-component tests: boundaries, filtered/empty/missing
  selection, cross-page and initial deep-link navigation, manual paging,
  dirty cancel/confirm, same-row no-op, stale-response and error clearing.
- Source types and unchanged renderer/shoulder fingerprint checks pass.
- All296 website tests, types, Clinical Review and production builds pass.
- Real localhost interaction:20→21→20 navigation; two-result filtered queue;
  unsaved notes retained on Cancel and same-row click, discarded on confirmed
  navigation. No review write requests or approvals. Desktop1280px, phone375px,
  and200%-text phone checks pass without document horizontal overflow.
- The phone test found old review-action buttons overflowing with enlarged text.
  Their source styles now constrain/wrap labels. Earlier failure logs retained.
- Dev preview hot reload hit a Vinext async-local stack recursion. Restarting
  the owned preview restored it; no dependency patch or error suppression.
  Browser harness waits for hydration/network settling before interaction.
- Exact learner files and all137 registered model hashes unchanged. Existing
  module builds re-exported only after their full dependency hashes matched;
  no unnecessary anatomy rebuild, new dependency, asset or clinical teaching.

No scans, CT-head masks or desktop PACS changes. Clinical materials remain drafts.
The website integration is revision-bound; no old approval is carried forward
as approval of new delivery. Separate fracture work remains unstaged.

Local only, not published. GitHub/C recovery receipts are in the main coordination
checkpoint. D is full/pending; no D writes, deletes or restore claim.

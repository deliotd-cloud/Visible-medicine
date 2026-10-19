# Studio queue navigation

Local website improvement, 10 October 2026. No data migration or new dependency.

- Home's **Drafts to continue** opens Library with draft and changes-requested
  workbooks selected together. Search, mode, individual status and Clear remain.
- **Awaiting review** and **Changes requested** open the corresponding release
  queue. Review & publish has a compact GET form for status and course, a result
  count, explicit empty state and Clear filters. URLs retain the chosen context.
- A course's **Open review queue** retains its course ID. Sign-in return paths
  retain valid queue context. Invalid/repeated release filters show no releases;
  an unknown course never silently widens to all courses.

Filters only operate on the existing authenticated Studio snapshot. They grant
no authority and do not change release decisions, independent review, readiness,
learner entitlements, invitations or publication gates. The Library queue is an
initial preset; subsequent search/filter adjustments remain local to the page.
Re-entering via a different queue remounts the table with that preset.

Verification evidence and before/after recovery are in
`F:/VisibleMedicine/staging/20261010-studio-queues` and the corresponding
`F:/VisibleMedicine/recovery/checkpoints/20261010-studio-queues` checkpoint.
Signed-in acceptance is distinct from fixture tests; no approval or deployment
is implied by checks.

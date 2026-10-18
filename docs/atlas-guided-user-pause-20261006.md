# Guided-tour pause and availability — 6 October 2026

Canonical Atlas candidate: `9b2003d75b9c27861befeaf253ce7d52cce497a6`.
Regional predecessor: `30535013e3eec4a83ea13231cfb6f704e546192d`.
Local education candidate; no public or clinical acceptance.

Regional and shoulder tours now invalidate an already queued automatic step when
a learner deliberately pauses or opens reading/step-picking controls. Valid manual
Back/Next preserve intentional Play but replace the outgoing stop's timer. Invalid
or same-stop callbacks leave a live timer intact. Closing a reading panel does not
resume playback. Regional Exit revokes pending playback; the shoulder's existing
synchronous active-session Exit guard is preserved.

Actual shoulder renderer/model callbacks also revoke active tour playback
immediately on lost readiness, before React rerenders. The current stop, selected
structure and frame remain unchanged; recovery makes controls available but does
not restart Play. Existing stable callbacks and immediate exam-readiness updates
are preserved, including the compact keyboard identification answers.

The original actual-component regressions fail at the expected premature advances
before each correction. Final canonical regional tests pass 51/51, shoulder tour
tests 11/11 and keyboard exam tests 2/2. Twenty-two selected final source phases
pass, including TypeScript, build, renderer/recovery, context and review safeguards.
The earlier pause-only source pass and later availability pass are retained
separately; the final source is not inferred from an earlier staged full-suite pass.

All 108 nested source/teaching packets and nine shoulder teaching/imaging revisions
remain exact. The shoulder model hash and display-file membership are unchanged;
only the shoulder component's current display hash changes. Renderer/material
contexts are rebound without migrating decisions or adding approvals. No tour
definition, camera path, geometry asset, clinical fact, dependency or licence asset
was introduced. Private candidates, accepted CT-head boundaries and the clinical
desktop PACS/native MRI application remain out of scope.

One generated website refresh carries both corrected players. Live revision/hash
pins and the reference-reading handler token bind to the tested epoch-revoking
implementation; immutable historical fixtures remain unchanged. Exact runtime,
protected-review, access/persistence, browser, recovery and remote-backup evidence
are recorded separately in the website checkpoint below. Physical GPU, assistive
technology, device and clinical acceptance are not inferred from software checks.

Evidence on E:

- `E:/VisibleMedicine-LocalStaging/20261006-regional-user-pause/`
- `E:/VisibleMedicine-LocalStaging/20261006-shoulder-user-pause/`
- `E:/VisibleMedicine-LocalStaging/20261006-regional-user-pause-draft/`
- `E:/VisibleMedicine-LocalStaging/20261006-shoulder-user-pause-draft/`
- `E:/VisibleMedicine-LocalStaging/20261006-shoulder-availability-draft/`
- `E:/VisibleMedicine-LocalStaging/20261006-guided-user-pause-website/`

The full existing goal remains active. Clinical sign-off, cleared real imaging and
independent Atlas/case/lecture rights remain separate gates. No public deployment,
default-branch update, raw Atlas upload or D-drive write is implied by this note.

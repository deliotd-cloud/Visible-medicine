# Repeat practice in the native MRI viewer

Regional MRI private Review → load the independently bound local package → choose
a sequence and accepted-scoped annotation → **Try structure check** → **Next
structure**. The next question stays in the current sequence and activity; no
additional panel, folder, sequence, source variant or 3D view opens automatically.

The current question remains paused while the next annotation loads. Target
names are not shown in the loading/error notice. Only after actual loader-owned
geometry, a valid question in the selected activity and an in-bounds saved focus
are verified does the target replace the previous question. The new question
heading receives keyboard focus once its native image has been drawn. Ordinary
slice navigation does not repeatedly move focus.

## Source limits

- Selection proceeds in cyclic source-manifest order, not randomized exam order.
  Current-concept variants, ambiguous labels, provisional/deferred annotations
  and absent geometry are excluded. Multiple annotations for the same normalized
  concept require explicit inspection; no variant is chosen automatically.
- Naming may use accepted points, curves or masks. Find-on-image practice requires
  a saved nonempty accepted mask. Metadata eligibility is not display validation.
- Exactly one next candidate is loaded per explicit click. A failed load, empty
  extent, invalid focus or unavailable question retains the preceding question
  and offers return to inspection; no nearby target or sequence is substituted.
- Off-annotation or undrawn views may be left using Next structure; answering
  remains subject to the existing exact-image and visible-annotation gates.
  Skipping/revealing does not record a correct answer or completion.
- Changed/retired sources, pending loads, old callbacks and unmounted sessions
  cannot replace the current question. Existing unsaved-correction protection
  remains in force. Next structure closes an optional reference inspection, not
  the underlying MRI source. Semantic 3D references remain unregistered.

No score, attempt history, progress, completion, annotation approval or clinical
decision is stored or transmitted. Masks, scans, source statuses, entitlements,
desktop PACS and public deployment are unchanged. This remains private formative
practice for revision-bound radiologist review, not a released learner exam.

Synthetic actual-loader/helper and parent/card lifecycle tests cover source
ownership, variants/ambiguity, pending verification, failure retention, stale
callbacks, keyboard-focus handoff and exact grading after target replacement.
Browser/GPU, signed-in keyboard/visual and clinical acceptance remain separate.

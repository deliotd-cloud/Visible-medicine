# Compact Guided learning chooser

The active tour should be identifiable from the tour selector itself, rather
than a placeholder plus a duplicated heading. A compact desktop chooser leaves
more vertical space for anatomy while retaining a labelled native select and
44-pixel minimum controls. Narrow layouts must wrap without horizontal overflow.

Search and regional filters only discover tours: they do not change the current
player, step, playback or imaging consent. When filtering excludes the active
tour, its identity must remain visible outside the matching-results list.
Clearing filters restores the active option. An actual tour change still
suspends imaging and replaces the revision-keyed player; choosing the same tour
does neither. Nested studies retain their own source keys and error boundaries.

No anatomy, caption, quiz, modality correspondence, source licence, clinical
approval or entitlement changes. This is a navigation/presentation improvement.
The current generated learner and Clinical Review must be imported together
before claiming website delivery. Software checks do not replace actual desktop
layout, keyboard, long-title, zoom and authenticated model acceptance.

Focused check: `node scripts/test-whole-body-guided-learning.mjs`.
Local checkpoint evidence: `E:/VisibleMedicine-LocalStaging/20261009-compact-tour-picker/`.

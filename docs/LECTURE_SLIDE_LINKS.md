# Published lecture slide links

Published lectures now offer an exact Slide link. Learners can bookmark a slide,
open its linked CT, MRI or existing 3D Atlas separately, and reload the lecture
without returning to the beginning. The link identifies a stable slide and the
verified published edition; it does not grant access to either product.

## Using a slide link

1. Open an allocated published lecture from My learning or its course.
2. Move with Previous, Next, the slide outline or unmodified left and right
   arrow keys while the presentation itself is focused.
3. Bookmark the address or copy the Slide link beside the lecture title.
4. Open Explore linked anatomy to compare the mapped structure in CT, MRI or
   the existing 3D Atlas. These open separately, keeping the lecture in place.

Changing slides replaces the current address rather than adding an entry for
every slide to browser history. Back therefore remains useful for leaving the
lecture. Revisiting an exact lecture link restores its slide. Keyboard actions
inside controls and editable fields are left to those controls.

## Changed or unavailable editions

A malformed link, missing slide or changed publication does not silently select
a replacement slide. The player explains that the target is unavailable. Start
current lecture is an explicit choice to open the first slide of the current
verified edition and update the address. It does not approve revised teaching.

An unverified publication cannot be recovered through this control. The
existing access and publication checks still determine whether a lecture can
be read. A learner with Atlas access but without the lecture allocation remains
unable to read the lecture; a slide link cannot bypass that separation.

## Integration contract

Both `/learn/lectures/[workbookId]` and
`/learn/[courseSlug]/[workbookId]` accept the paired query parameters
`lectureSlide` and `lectureRevision`. The former is a stable slide ID, not an
array position; the latter is the complete immutable publication SHA-256 from
the existing verified lecture manifest. Authentication retains the pair. Invalid
pairs retain a bounded invalid marker through sign-in rather than becoming an
unqualified first-slide request. Unrelated query parameters do not select content.

The server checks the existing lecture allocation and course membership before
supplying the verified publication to the player. Client URL handling changes
only the selected slide. Old callbacks, unrelated routes, source changes and
unmounted players cannot rewrite another learner route. Existing anatomy links
retain their own source revisions and independent entitlement checks. These
links express semantic comparisons, not patient-space registration.

Studio previews remain independent: even a published-version preview neither
reads nor writes the learner's address. There is no new database schema,
progress storage, score tracking, dependency or licensed asset.

## Desktop acceptance

For a signed-in desktop check, use an existing authorized published lecture:

- Open its second slide, bookmark it, reload and confirm the same title and
  body. Open a linked Atlas and return to confirm the lecture remains in place.
- Follow the bookmark signed out; sign in normally and confirm the exact slide.
- Alter the revision or slide ID and confirm an unavailable state with no
  replacement content until Start current lecture is chosen.
- Check the outline, keyboard focus and Slide link at 1280 pixels and wider.
- Confirm an account without the lecture allocation still receives the existing
  access restriction, even when it has Atlas access.

Automated route and real-component harness checks cover these navigation and
refusal rules without creating accounts or changing allocations. They do not
replace signed-in desktop visual acceptance. Evidence and scoped local source
recovery are under `F:/VisibleMedicine/staging/20261011-lecture-slide-links` and
`F:/VisibleMedicine/recovery/checkpoints/20261011-lecture-slide-links`.

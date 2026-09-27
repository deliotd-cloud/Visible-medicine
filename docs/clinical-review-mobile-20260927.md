# Review workspace mobile navigation — 27 September 2026

## Reproduction and fix

The prior review inspection reported 377px document width for a 375px client
area. A fresh browser did not reproduce this with the index or left whole-body
calcaneal-tendon worksheet: both fit at 390px touch viewport and 375/390px
desktop-sized viewports (including the 15px scrollbar).

Further checking found a distinct reproducible bug at 320px touch viewport.
Opening the Institution workspace switcher placed its 190px menu at x139.09375,
ending at x329.09375 and widening the document from 320 to 329px. A screenshot
confirmed the right edge was off-screen. This affects the compact shared header,
including Clinical Review, rather than the anatomy model or review content.

The existing mobile media query now anchors this menu at `right: 0` and limits
its maximum width to the viewport less 32px. No global overflow masking, hidden
controls, changes to desktop placement, imported Atlas code or new dependency.

After reload and an actual pointer click, the same 320px browser measured a
320px document; the menu occupied x71.703125 through x261.703125. All three
workspace links remain in the original menu. The existing review source/model
pins, status storage, clinical gates, independent entitlements and drafts are
unchanged. No clinical decision or personal review input was saved.

## Evidence text wrapping

Opening CT Draft by pointer subsequently reproduced the original 2px overflow:
375px client width, 377px document width. The overflowing list item contained
the complete CC BY 4.0 licence URL, with normal word wrapping. The website's
review adapter now allows long paragraph/list tokens to wrap anywhere; no text,
licence URL or source attribution is removed, abbreviated or hidden.

After reload/pointer activation, the same open CT panel measured 375/375px,
and a fresh 320px touch check measured 320/320px. No overflowing evidence list
items; full licence URL retained, no unsaved review edits. This adapter is a
revision-bound integration input, so the guard correctly rejected the initial
build until normal binding and review-viewer regeneration were performed. No
guard bypass, historical decision migration or source Atlas mutation.

## Checks and boundaries

- Seven existing actual-component header/session and Studio workspace tests pass.
- Production build, including Clinical Review source/artifact verification, passes.
- Five review search/integration/contained-viewer tests pass after rebinding,
  including authorization, revision conflicts, source delivery and history.
- Real local browser sign-in uses the existing local test identity; no auth bypass
  or alteration. Five Achilles contexts still returned before the menu change.
- The original browser automation runtime could not initialize after restart;
  fresh Chrome DevTools browser provided the reproduction and geometry evidence.
- Follow-up screenshot capture was delayed but returned and visually confirmed
  the open menu fully within the 320px viewport. Pointer opening of CT evidence
  also succeeded. Broader whole-site pointer/mobile acceptance is not claimed.
- Main-workspace logs: `work/review-mobile-tests-20260927.log` and
  `work/review-mobile-build-final-20260927.log`,
  `work/review-mobile-viewer-build-20260927.log` and
  `work/review-mobile-integration-tests-20260927.log`. The earlier build log
  records the expected changed-input guard rejection, not the final result.
  Recovery checkpoint records commit and
  independently verified GitHub/D backups. No public deployment.

Continue the wider regional/teaching roadmap and bounded radiologist reviews.
Do not restart the already-completed native MRI groundwork or modify desktop PACS.

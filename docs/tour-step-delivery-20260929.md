# Guided-tour step navigation — 29 September 2026

Local integration from Atlas `9ddeaed1a045cc86aeda7ac40d0dd48bf6a405b1`.
Click the existing step count in Guided learning to revisit any stop. Shared
control covers 17 regional tours /92 stops and the dedicated shoulder /5 stops.
Opening pauses; selecting a different stop uses existing smooth motion and does
not restart autoplay. Escape keeps playback paused. Unavailable anatomy disables
the control; navigation does not imply completion, assessment or approval.

The existing Select primitive supplies keyboard navigation and focus return.
Labels wrap at narrow widths/200% text; no additional permanent toolbar or sidebar.
No new dependency, artwork, anatomy, teaching text, entitlement or imaging mapping.
All137 model hashes and tour definitions preserved. Desktop clinical PACS untouched.

## Verification

- All97 source stop positions: IDs, invalid values, unavailable anatomy, pause
  before jump and no implicit resume;36 regional player,3 shoulder,7 session tests.
- Both source module builds, Clinical Review build and website types/build pass.
  All294 website tests covered:292 passed in the final full run; two bundler
  subprocess exits passed on isolated rerun (2/2). Earlier pre-wrap run294/294.
  No approval records submitted or transferred.
- Six local browser cases: regional and dedicated shoulder at1280px,375px,
  and375px with200% text. Keyboard End/Enter, mouse first stop, pause, Escape,
  focus return, no horizontal overflow, touch target size, and exit verified.
- Browser evidence: `tour-step-browser-20260929.json`. Device emulation is not
  physical-device certification. Generated chunks replaced from verified source;
  previous chunks retained in coordination recovery folders.
- Earlier test clicked Escape before menu opening committed; the harness now
  waits for visible open state. Subsequent phone test found a real text-wrapper
  selector mismatch; source CSS corrected before final successful browser checks.

## Delivery gates

Local only; no hosted publication or clinical sign-off. GitHub and C recovery
receipts are in the coordination checkpoint. D remains full/pending: no write,
deletion or restore claim. Separate fracture work is preserved unstaged.

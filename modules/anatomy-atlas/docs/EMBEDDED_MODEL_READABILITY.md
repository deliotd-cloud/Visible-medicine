# Readable models in short embedded views

28 September 2026. Source-only layout change; website import and publication are
separate. No geometry, teaching, source identity, entitlement or decision changes.

## Reproduced problem and correction

On the website's Thorax page at 375 × 812, the available module was 375 × 577.
The model's drawing area measured 134px high. At a 200% root-font preference,
the header consumed 417px and the model workspace became a 24px-high inner
scroll slot. Controls and the model could not be usefully viewed together.
The production-module baseline regression also failed at about 141px model
height; these different browser scrollbar metrics are recorded, not conflated.

`app/atlas-panel.css` now gives short embeds one outer scrolling surface and
reserves a useful model row beneath its orientation text. Enlarged controls and
captions retain their natural height. At ordinary phone text size, the four mode
segments share one row: their decorative radio circles are visually clipped,
but the same labelled radios, selected styling, focus outlines, keyboard
navigation and disabled states remain. Touch labels are at least 44px high.
No smaller fixed fonts, deleted labels or replacement mode handlers are used.

Five representative scopes—Thorax, Head & neck, Foot, Spine and Whole body—were
checked in the actual production module at phone panel size, phone 200% root
font, and desktop size: 15 passing cases. Model height was about 206px at normal
phone size and 212px at enlarged text. At normal text, the model was visible
without first scrolling; at enlarged text it could be scrolled fully into view.
All clipping ancestors were checked, not just the canvas's bounding rectangle.
Desktop behavior remained intact. Keyboard Explore/Dissect transitions, Search
and Tools sheet closure/focus return, and reversible muscle-system toggles pass.

The visible Windows browser also confirmed the model at default/enlarged text.
Classic scrollbars can cause additional toolbar wrapping; all controls/credits
remain reachable. Some scrolling in short or enlarged-text embeds is deliberate,
not a promise that every control fits simultaneously. This is not physical-touch,
screen-reader, browser-native-zoom, complete dissection or clinical acceptance.

The separate shoulder production module was also checked at 375 × 577 with
default and 200% root font: its loaded canvas remained about 200px high and
fully reachable, with no horizontal page overflow. At enlarged text its overlay
labels still wrap heavily; label readability is a separate outstanding issue,
not covered by the canvas-height pass. Temporary browser probes were removed.

## Reproduce

Build and serve the exact regional production module with its existing verified
loopback QA helper. It exposes `/qa` containing the module in an iframe. Use an
already installed Playwright module; no runtime dependency or paid service is
added by this check:

```text
VM_PLAYWRIGHT_MODULE=<module specifier or file URL for installed Playwright>
node scripts/test-embedded-model-readability.mjs <loopback module index URL> <local report.json>
```

The test rejects non-loopback URLs, records served and candidate stylesheet
hashes separately, conserves failure evidence, and performs real browser focus
and visibility checks. Report paths stay outside hosted content. On the checked
host, final evidence is `work/embedded-readability-acceptance-20260928.json` in
the coordination workspace. Earlier failed runs remain separately retained.

Renderer and selection-visibility suites pass. The initial broader model-first
run exposed historical Guided learning omissions, unrelated to this CSS fix.
A separate test-only correction now replays exact Git binding deltas from
`dbbf361` and `7724467`: the tour handler, dissection-shortcut guard and two exit
callbacks. The immutable baseline and runtime code remain unchanged. The host
test executes both exit bindings and all 24 mode/exam/study/tour shortcut states.
Model-first, tour-host, whole-body library and shortcut tests now pass. Original
failure logs remain retained; the model-first passing log is
`.local/test-logs/2026-09-28T22-03-06.546Z-26740-a5d21f1d.log`.

Presentation fingerprints are refreshed conservatively. No clinical approvals
are copied to the changed presentation. Exact commit, builds, source recovery
and subsequent website delivery are recorded in the coordination checkpoint.

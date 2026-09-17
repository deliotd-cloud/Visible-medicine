# Regional viewer reflow

The root body viewer now constrains its grid to the actual model pane instead
of allowing the controls' intrinsic minimum width to expand the canvas beyond
the pane. Wrapped controls contribute to its height. The model retains at least
160 CSS pixels of height; a short window scrolls the model pane to reach all
controls rather than clipping them. Ordinary full-height mobile layout remains
unchanged. In a narrow toolbar, the existing explode selector sits above its
slider; no extra action, geometry or dependency is added. Compact panel buttons
wrap within their columns rather than overlapping at the narrowest text size.

The reproduced failure was head/neck at a 720x480 viewport with the root rem
font enlarged from16px to32px: a400px pane contained a493px scene and hid zoom
controls. After the fix, its scene stays398px wide inside the400px pane and the
zoom/arrangement controls remain reachable. These are local CSS measurements,
not a complete browser-zoom or accessibility conformance claim.

Browser verification covered whole body, head/neck, spine and foot at1440x960,
390x844 and720x480 with the enlarged root font. The actual StructureNavigator
supports keyboard browsing without changing selection until Enter; all three
explode styles reach100% and restore0% with the keyboard. Compact panels close
on Escape and return focus to their opener. Controls and scene remain within
the model pane, with no page horizontal overflow or browser page errors. Two
additional head/neck journeys at320x640 check normal/enlarged rem sizes and
explicitly reject overlap between the panel-launch buttons.

The dated coordinating checkpoint contains exact source, screenshots, build and
regression logs, GitHub readbacks and D-drive recovery. This is emulated browser
evidence. Shoulder, embedded host constraints, full browser/text-only zoom,
screen readers, touch hardware, low-GPU performance and free-orbit label-side
checks remain in the broader acceptance matrix. No clinical sign-off, anatomy
source change, patient data or deployment is implied by this layout fix.

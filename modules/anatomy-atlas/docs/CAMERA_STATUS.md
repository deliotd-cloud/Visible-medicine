# Camera orientation status

The shared body scene now keeps its accessible direction aligned with the
rendered camera. Previously, keyboard rotation wrote a polite status with angle
details, but a later preset could leave that old direction in the accessibility
tree while the visible direction had changed.

`SceneOrientation` observes the same real camera direction as the silent visual
heading. It retains immediate keyboard angle feedback only while the camera
still faces that keyboard pose. A subsequent orbit or preset replaces stale
angle details with the current direction. Identical text is not rewritten each
frame. This uses the existing demand-render loop, source coordinate basis and
orientation hysteresis; it adds no camera mutation, React per-frame update,
animation loop, visible control or learner imaging stack.

Exam mode omits both orientation outputs. Renderer failure still removes the
scene through the existing recovery boundary. No anatomy, teaching, model bytes,
source holds, imaging registration or entitlement changes are made.

Run `npm run camera-orientation-status:test`. New component tests exercise an
opposite preset, reset, same-sector pointer movement, keyboard detail persistence,
duplicate-frame silence and exam non-disclosure. Existing keyboard and
orientation tests retain their original assertions. These are controlled
component tests, not a screen-reader or GPU certification.

Source renderer fingerprints must advance and existing geometry/display
approvals must not silently cover the new renderer. Teaching/source revisions
remain unchanged; private decisions are neither read nor migrated. Generate
website modules and protected Review from the committed Atlas source, never
patch generated files by hand. Actual local desktop evidence and recovery are
recorded in the dated workspace checkpoint.

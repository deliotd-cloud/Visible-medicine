# Native MRI practice: focus follows the user's intent

The private regional MRI Structure check still focuses its question heading once
when a committed question or activity first has a ready image, without scrolling
the page. The launcher already being focused does not cancel this transition.
A new activity first seen while retired becomes eligible when active.

While its image is waiting, deliberate focus on another connected HTML control
consumes that question's focus intent. This also covers a quiz answer or viewer
control focused after layout but before the passive focus effect. Later painting,
feedback, slice changes, same-question renders and StrictMode replay cannot
steal focus back. A new question/activity has its own intent. Blur to body/document
after disabling a launcher, detached targets and non-HTML events do not count as
deliberate navigation. The listener is question-owned and removed on retirement,
replacement or unmount; abandoned renders cannot install it.

Only focus ownership changes. Grading, question identities, native images and
masks, saved annotation scope, Guided learning return, 3D comparison, access,
clinical statuses and storage are unchanged. No answer/score/completion is sent
to a server or saved. This is not a clinical or spatial-registration decision.

## Evidence and limits

`tests/regional-mri-practice-focus.test.ts` executes the actual transpiled card
with commit-aware hook/ref/host/document events. Against the untouched card the
refined eight cases produced five passes and three late-focus failures. The
test-harness TypeScript stripping and button-host setup corrections are retained
separately; they were not production defects. Existing card/viewer and guide
tests remain required alongside fresh types/build and private Review verification.
Logs: `F:/VisibleMedicine/staging/20261015-native-mri-practice-focus`.

Synthetic component checks are not signed-in, browser, GPU, screen-reader,
physical-keyboard/device or clinical acceptance. The local-only Sites workflow
does not upload, publish, change authentication or affect the desktop PACS.

# Saved-view dialog keyboard return

Saving the twentieth bookmark disables the Save current view button. Deleting a
bookmark removes its opener. The prior component relied on the dialog library's
default previously-focused-element behaviour; neither a disabled nor removed
opener provides a usable return target.

Both dialogs now explicitly return to their original button while it remains
connected, visible and enabled. Otherwise they return to the existing Saved
study views summary, which is already keyboard-operable. No new control, popup,
shortcut or visual label is added. Focus moved outside the dialog is preserved;
hidden/unmounted containers do not receive focus. Each dialog retains separate
opener/popup references, avoiding cross-dialog close-animation interference.

Opening a removal confirmation also clears an earlier operation's error. Storage
and anatomy state are unchanged: writes still precede success feedback, failure
retains bookmarks, and no clinical/patient/access information is added.

`node scripts/test-study-view-dialog-focus.mjs` executes the actual component with
controlled hooks and storage. It checks successful/cancelled/failed deletion,
another-tab removal, ordinary and capacity-reaching saves, and focus guards.
The baseline option reads only the old component from Git; it demonstrates the
previously absent tested return-target contract, not a browser focus trace.
TypeScript checks the installed Base UI `finalFocus` API. Browser keyboard,
Escape, backdrop-dismissal and mobile acceptance remain required when available.

## Separate navigation finding

Read-only audit found that nested study links are consumed at initial catalogue
load while close handlers update only local state. The address can retain a
nested target after closure. Reload/back expectations need joint website and
embedded-module design plus actual browser acceptance; changing only an iframe's
URL would not reliably fix outer-page reload. No URL/history workaround is added
here. Preserve source-hash resolution and independent access when addressing it.

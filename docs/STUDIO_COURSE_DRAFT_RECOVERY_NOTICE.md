# Visible course-details draft recovery

Course details remain collapsed by default. When the existing course-details
form recovers an unsent device-local draft, Studio shows a generic notice outside
both Course options and the details panel. **Review recovered edits** opens the
existing form explicitly; it does not submit, publish, navigate or expose text
in the notice. The same action can hide the details again.

Unreadable recovery shows **Check device draft** instead. No draft is deleted
because recovery failed. A confirmed exact save clears the notice; failure or
newer unsent edits do not falsely clear it. Retained/conflicting cleanup shows
the generic attention notice. Late recovery timers cannot recreate a notice
after the exact version has been saved or its form has been retired.

Only a three-state signal (`none`, `recovered`, `attention`) leaves the form.
No title, description, hidden comparison baseline, storage key or identifier is
copied into the notice. It belongs to the currently open course; an old course
callback cannot replace that course's status. Default disclosure and selected
Content/Preview/Review pane stay unchanged.

The existing browser draft keys, recovery validation, locks, cross-tab ownership,
revision comparisons, submit payloads and navigation/unload protections are
unchanged. Device-local drafts are not a cloud backup or a saved Studio version.
No actual server save, publication, account/access/schema change or new dependency
is performed by this UI. Synthetic checks are not signed-in/browser/keyboard or
screen-reader acceptance.

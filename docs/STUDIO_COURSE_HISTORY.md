# Course tabs and browser navigation

Content, Preview and Review & publish now use the `pane` query parameter.
Valid direct URLs initialize the selected pane; other values fall back to Content.
Choosing another pane adds one history entry, retaining other query parameters,
the fragment and existing history data. Repeated choices do not add entries.
Back/Forward restores the pane without remounting the editor or replacing its
forms. Course/search changes restore from the current URL; the popstate listener
is removed during effect replacement and unmount. Form persistence across a tab
change is distinct from saving its content on the server.

The installed Vinext router treats a bootstrapped history payload as app-owned.
Reusing it can skip the router search-store update. The editor therefore updates
its own pane after successful native history writes and restores from the live
URL, rather than relying solely on a router notification or modifying private
framework flags. This parameter belongs to the editor; the local change is not
general shallow-routing acceptance for every other query consumer.

Run `node --test --experimental-strip-types tests/studio-course-editor.test.ts
tests/studio-course-history.test.mjs`. The actual component tests use explicit
React scheduling/search seams with the installed history classifier. Seven
existing server-render/form tests keep their assertions and only add an explicit
null search-hook seam. The preserved E-only prior proposal's URL-change-without-
pane-change defect was also reproduced in an isolated browser sample using
actual React/editor/Vinext shims, then corrected.

The browser sample uses inert forms/links and the installed browser ALS fallback;
it is not a genuine signed-in course route or SSR hydration acceptance. It covers
tab activation, focus, duplicate entries, Back/Forward, unsaved fixture input,
direct/invalid URLs and settled external-query/course transitions. A first
immediate read during one course transition was pre-render; its fresh DOM and
settled read show Preview. That timing observation remains separate evidence.
Real-account routing, authoring retention, native zoom and assistive technology
still need their own acceptance. No database, permission, publishing or entitlement
change is made; workbook selection in EducationRuntime is outside this batch.

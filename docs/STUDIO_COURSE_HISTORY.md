# Course tabs and browser navigation

Content, Preview and Review & publish now use the `pane` query parameter.
Valid direct URLs initialize the selected pane; other values fall back to Content.
Choosing another pane adds one history entry, retaining other query parameters
and the fragment. Repeated choices do not add entries. The editor retains its
form panels while selecting panes and restores the selected pane on Back/Forward.
Course/search changes restore from the current URL; the popstate listener
is removed during effect replacement and unmount. Form persistence across a tab
change is distinct from saving its content on the server.

The installed Vinext router treats a copied bootstrapped history payload as
app-owned: it can skip search notification and alias the previous traversal index,
which can force a route-tree restoration rather than retain the current form.
The editor now passes caller-owned `null` to the public History API. Vinext's
external-history path preserves its navigation metadata and, when the current
tree snapshot is retained, claims it with a distinct index. Caller data is not promised across
pane entries. The local pane setter remains for immediate feedback; no private
framework flags or history methods are rewritten. Installed-controller tests
prove distinct indices/current-tree classification, not complete browser-tree
acceptance. This parameter belongs to the editor, not every query consumer.

Run `node --test --experimental-strip-types tests/studio-course-editor.test.ts
tests/studio-course-history.test.mjs tests/studio-course-history-controller.test.mjs`.
The actual component tests use explicit
React scheduling/search seams with the installed history classifier. Seven
existing server-render/form tests keep their assertions and only add an explicit
null search-hook seam. Known v2 notification and v3 duplicated-index negatives
are retained. Five additional source/controller checks include three controller
exercises with an in-memory History API seam; older snapshot approval is synthetic.

The browser sample uses inert forms/links and the installed browser ALS fallback;
it is not a genuine signed-in course route or SSR hydration acceptance. It covers
tab activation, focus, duplicate entries, Back/Forward, unsaved fixture input,
direct/invalid URLs and settled external-query/course transitions. A first
immediate read during one course transition was pre-render; its fresh DOM and
settled read show Preview. That timing observation remains separate evidence.
Real-account full-router DOM retention, RSC requests, route return, BFCache,
SSR hydration, native zoom and assistive technology still need acceptance.
No database, permission, publishing or entitlement
change is made; workbook selection in EducationRuntime is outside this batch.

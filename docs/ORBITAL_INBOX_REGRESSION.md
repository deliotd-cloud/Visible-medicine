# Orbital inbox: historical proof and current admission

The previous test used source408759d5 as both a historical marker and the expected
live Atlas HEAD. That already failed against installed3e66 before the current
7b3e source. The test now uses the existing closed current-delivery pin and checks
the actual Atlas repository identity. Its historical ab8f5594→a70b6f64 proof,
14 exact old teaching hashes, twelve changed CT worksheets/two unchanged ganglia,
stale continuation rejection, read-only storage and account isolation remain.

The complete original test is preserved byte-for-byte at
tests/fixtures/orbital-inbox-source-before-current-admission.txt, SHA256
4cbdbfd69d43a4f12e407dcd27ccc2794751822259d12ba976cad074553ae2f9.
A source-equivalence test permits only five enumerated current-admission
transformations. It does not claim the original test was run against an
unavailable original website deployment. A wrong old live source is rejected.

Additional tests pass saved synthetic old approvals through the real inbox,
queue, decision parser and source/teaching revision logic. At least the original
twelve teaching changes and all14 renderer-bound geometry revisions require
re-review; exact unchanged valid material is treated separately. Positive exact
current approvals and corrupted-storage failures are also checked. Every database
operation is SELECT-only and private worksheet content never appears in the inbox.
All records are synthetic in-memory fixtures, not human review or clinical approval.

This is a verification-only change: no production app, native scan, mask, model,
teaching, renderer binding, entitlement or private saved decision changes.
Register47 retains all71 requirements/eight optional ideas and their statuses.
The full-suite result must be read from the current saved checkpoint; focused
passes alone do not establish complete regression, browser or release acceptance.

Five separate Atlas epoch comparisons have a read-only repair audit at
F:/VisibleMedicine/staging/20261017-orbital-inbox-regression/atlas-history-audit.json.
They have not been repaired by this website test-only change.

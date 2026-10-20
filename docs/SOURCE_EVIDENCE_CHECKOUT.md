# Pinned evidence on Windows checkouts

The source-hold loader hashes the exact committed `content/source-inventory.json`
and supplemental audit reports. These files must not receive automatic CRLF
conversion. The generated nested-review binding checker expects canonical LF
serialization. `.gitattributes` now states those requirements explicitly for the
previously unprotected files; existing protected reports remain protected.

`npm run source-evidence-checkout:test` compares seven working files with their
committed Git blobs, checks their attributes and simulates checkout filtering
under `core.autocrlf=true`, `false` and `input`, with `core.eol=crlf`. These are
process-local test options, not changes to the owner's Git configuration.

The 20 October isolated checkout initially failed nested-link and source-hold
checks because text conversion changed bytes. Restoring LF was verified against
the immutable parent blobs and existing expected SHA-256 values. No source-hold
definition, admitted geometry, source table, clinical record or expected hash
was changed. A line-ending repair must never conceal a substantive source edit.

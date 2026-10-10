# Compact learner teaching headings

The regional and whole-body teaching panel collapses consecutive exact copies
of the selected structure name at the beginning of a heading. For example,
`Mesoappendix · Mesoappendix · Ultrasound · draft` displays as
`Mesoappendix · Ultrasound · draft`.

This is presentation only. Source lesson titles, teaching, references and review
display evidence are unchanged. There is no case folding, fuzzy anatomical-name
matching, removal of laterality or suppression of draft status. Distinct topic
names and qualifiers stay visible. The renderer revision changes and must travel
through the existing generated website import; this does not grant approval.

Checks from the Atlas checkout:

```sh
node --test scripts/test-teaching-heading.mjs
node scripts/validate-teaching-heading-content.mjs
```

The second check compares all source lessons and recipes against the exact
pre-change commit, exercises real headings and verifies idempotence. Neither
check proves anatomical correctness or loaded-model browser acceptance.

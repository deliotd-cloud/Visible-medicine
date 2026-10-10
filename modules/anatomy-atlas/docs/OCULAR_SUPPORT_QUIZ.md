# Ocular support quick checks

Two original multiple-choice teaching drafts replace generic identification on
eight existing root-body representations: four rectus check ligaments and four
upper/lower eyelid tarsal plates. The earlier trochlea/common-ring questions are
unchanged. This is Quiz-tab teaching, not additional Apply anatomy concepts.

The [Texas Tech eye dissection teaching page](https://anatomy.ttuhscep.edu/schemes/eye_ans.html)
supports the limited facts tested: check ligaments connect muscle sheaths with
the orbital sides, while fibrous tarsal plates support the eyelids. No source
figures, tables, prose, scan or additional mesh has been imported. These are
original educational questions, not clinical or operative guidance.

`lib/ocular-support-quiz.ts` admits only the eight allowlisted identities from
the existing `content/orbital-support-mri-pins.json`, using full canonical source
identity equality. It cannot attach teaching to a changed side, source, bundle,
geometry identity or unrelated structure merely sharing a name/FMA label.
Answers, explanations and citations participate in the existing revision-bound
clinical Review material. All drafts await the owner's radiologist review.

The source-labelled static surfaces do not validate attachments, tissue
mechanics, complete orbital anatomy, image visibility or patient registration.
No change to CT/MRI masks, access entitlements or the desktop clinical PACS.

Verify with `npm run ocular-support-quiz:test`. The regression compares the
actual resolver with parent source `245ccffe3a3161a83ee0fd7be643184519b2887a`,
checks only eight Quiz placements changed, preserves other teaching/geometry,
and exercises altered identities, fresh arrays and revision-bound Review.

# Renal X-ray teaching refinement — 7 October 2026

Exactly two existing root-body kidney X-ray drafts are deepened: FMA7204/FMA7205,
right/left kidney. The current learner and Clinical Review use the same text.
No additional anatomical representation, image, segmentation, registered plane,
control, dependency or asset is introduced. Draft totals do not increase.

The notes cover projection/side and renal-region landmarks, variable soft-tissue
outline visibility, the limits of a negative plain film, and the distinction
between IVP, a non-contrast radiograph and CT/MR urography. Four short bullets plus
the existing landmark and source-scope cautions replace two introductory bullets.
The generic mesh never supplies stone diagnosis, excretion or renal function.

## Reading references and rights boundary

- [Wong, Patel and Curtis: Interpreting abdominal radiographs, BMJ](https://www.bmj.com/content/345/sbmj.e5375).
  Publisher search text was accessible; direct opening returned403. No full-text
  retrieval or figure rights are claimed.
- [RSNA/ACR/ASRT: Intravenous Pyelogram](https://www.radiologyinfo.org/en/info/ivp).
- [EAU Guidelines on Urolithiasis](https://uroweb.org/guidelines/urolithiasis/chapter/guidelines).

These are factual reading links, **not** licensed image or dataset assets.
Only original concise teaching prose is included. No passages, figures, tables,
scans or files are copied; there is no new fee-bearing service or dependency.
Reference access may change and is not required to render the notes. Existing
third-party notices, admitted geometry and all asset/source holds remain intact.

## Exact editorial boundary

`content/renal-xray.transition.json` records the actual preceding source
`ce9dcce39fb088975bee2ec890730d1ee153d70f`, both full pinned identities,
previous/current lessons and metadata, and unchanged catalog/source frame.
Its SHA-256 over serialized JSON is
`ba280268012a53fc4a357b6caab353ecb0310fecca5963b79512b73cbc615166`.
Original abdominal-organ and renal-ultrasound pins/transitions are not repinned.

The offline predecessor adapter rewinds only these two X-ray lessons and their
three new references. It admits the independently pinned pre-ultrasound metadata
epoch for older checks, not arbitrary foreign metadata. The original pulmonary
milestone checks substitute the exact preceding abdominal editorial and display-pin Git blobs;
their assertions and golden hashes stay unchanged. Current renal checks exercise
today's real source separately. No adapter is imported by the application.

Run `node scripts/run-focused-checks.mjs renal-xray:test`. Focused checks compare
all9,934 unrelated topics,1,102 unrelated Review packets/contexts with a shared
current renderer, both real note renders, current worksheet parsing, source
forgeries and stale/foreign refusals before storage. Review display pins advance
only for the two kidneys. The conservative renderer fingerprint also advances
for the changed editorial file and package test scripts; no geometry changes or
private approvals migrate.

The broader `abdominal-organ-imaging:test` whole-history snapshot still fails.
An independent replay of the complete application and helper graph at the
immutable preceding commit reproduces exactly the same actual snapshot
`f232dd6f232a1b871662927baf54f9f8d5b785d4f6f7eb51a22d79a41df83703`
against its original expected
`2b6197e7025f3142c39d1356739d4375eeeec28b2fbad7502fd10660a6aba071`.
This predates the kidney edits; it is not relabelled a pass, and its original
assertions/pins are unchanged. Evidence is `abdominal-baseline-evidence.json` in
the stage below. Initial fixture failures are retained. The first pulmonary
run also correctly refused newer kidney display pins; its explicitly historical
adapter now replays the two exact preceding editorial/display-pin blobs while
current renal behavior is checked separately.

## Clinical and delivery gates

Radiologist sign-off is still required for exact bilateral source/revision,
orientation, visibility caveats, calcification wording and exam distinctions.
Software tests and reading references do not provide that sign-off. This change
does not load or clear patient images, validate image registration or confer
case/Atlas/paid-lecture entitlements. CT-head masks and the clinical desktop PACS
remain untouched; Didanix Education/light remains the integration target.

Canonical phase logs and exact save/recovery evidence:
`E:/VisibleMedicine-LocalStaging/20261007-renal-xray`.
Website import/visual acceptance/deployment must be verified separately; the
source checkpoint alone does not update the hosted site. E is same-machine
recovery, not an off-device backup. Raw Atlas upload remains held and the full
goal stays active.

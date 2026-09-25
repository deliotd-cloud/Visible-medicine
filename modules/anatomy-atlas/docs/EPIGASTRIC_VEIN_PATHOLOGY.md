# Inferior epigastric vein teaching — 25 September 2026

The existing Pathology panel now offers a short original draft for both admitted
inferior epigastric veins: left FMA21164/FJ3512 and right FMA21163/FJ3605, isa,
`inferior-epigastric-vessels`. Complete source identities are required; matching
names or FMA identifiers alone cannot attach the teaching. No geometry changes.

## Evidence and limits

[Hattori et al. (2012)](https://onlinelibrary.wiley.com/doi/10.1155/2012/492594)
is a single case report, consulted 25 September 2026 (Case Report and Discussion).
The draft describes its catheter-localisation lesson, explicitly preserves the
right-sided observation and distinguishes the selected deep vein from the
superficial epigastric vein. It makes no incidence, diagnostic-performance,
treatment or procedural-safety claim. Left-side placement is an anatomical
reading link, not an additional patient case. No article media or prose imported;
the reference is not an asset licence. Existing BodyParts3D attribution remains.

CT/MRI/ultrasound/X-ray lessons, quiz, existing Clinical content, source models,
navigation and independent Atlas/case/lecture access are unchanged. This is not
patient-linked imaging or an indication that a reference mesh contains disease.
Clinical approval requires the owner's review of this actual teaching revision.

## Verification

- `node scripts/record-epigastric-vein-pathology.mjs --check`
- `node scripts/validate-epigastric-vein-pathology.mjs`

The new test checks both real panel callbacks, content export/schema, unchanged
catalogue/model bytes, 74 rejected source mutations and all 9,934 other topics
against the recorded parent. The strict test-only replay accepts only recorded
old/current states, rejecting mixed or edited content. Older lamina/mediastinal
tests retain their immutable baselines; the lamina test now explicitly scopes
itself before this newer teaching revision.

The broad content check also detected stale shoulder review fingerprints from
the preceding shared Search change. They were regenerated from current source
with `scripts/review-revisions.mjs`; no review decision or approval was migrated.
This is a revision-evidence correction, not a shoulder mesh change.

Final verification and recovery paths are recorded in the parent workspace
checkpoint. Real-browser acceptance and website publication are not established
by the panel-render test and must be recorded separately.

Verified locally: content contract, body review/decision checks, original cranial
boundary history, lamina and mediastinal regressions, TypeScript, focused oxlint,
current renderer/review records and shared-module production build. The existing
large-chunk build warning remains. All eleven pilot entries remain unsigned and
imaging-blocked. No patient material, new media or dependencies were introduced.

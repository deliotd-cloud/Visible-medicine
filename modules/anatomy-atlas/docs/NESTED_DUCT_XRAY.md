# Named duct X-ray orientation drafts

14 October 2026. Source-only addition, pending normal website module/Review import
and the owner's revision-bound clinical review. No images, masks or mesh edits.

The existing exact source bindings resolve two concepts to four selections:

| Study | Concept | Pinned selections |
| --- | --- | --- |
| Pancreatic | pancreatic-ductal-system | FMA10419 PART-OF aggregate and FMA63103 IS-A singleton |
| Hepatic | hepatic-biliary | FMA71857 right and FMA71858 left intrahepatic duct groups |

These are four placements of two notes, not four new anatomical trees or new
patient image mappings. The [pancreatic source limits](PANCREATIC_DISSECTION.md)
and [hepatic relationship limits](HEPATIC_BILIARY_RELATIONSHIPS.md) remain intact:
no validated lumen, patency, accessory duct, confluence, papillary opening,
extrahepatic boundary, obstruction, safe procedural plane or spatial registration.
Unlabelled vascular source partitions are not given invented branch identities.

## Evidence and reuse

Main inspected the primary [NIDDK ERCP page](https://www.niddk.nih.gov/health-information/diagnostic-tests/endoscopic-retrograde-cholangiopancreatography)
(page reviewed January 2024) and [ACR/RSNA biliary-interventions page](https://www.radiologyinfo.org/en/info/biliary)
on 14 October 2026. `content/nested-duct-xray.ts` contains original, short factual
orientation summaries with source-model caveats, not copied diagrams, photographs,
article passages or procedure instructions. No external asset, dependency, font,
texture, paid API or service is added. Existing commercial-compatible asset
notices and clinical-release gates remain unchanged. References do not validate
these meshes or confer clinical approval.

Two shared scoped keys avoid duplicating a URL to evade conservative source-word
budgets. The combined ERCP-associated text is 170 words; both notes stay draft.
Only citing concepts receive the new reference titles in their Review packets.

## Verification and history

`npm run nested-duct-xray:test` checks the immutable f3d6966a source baseline,
exact four X-ray changes, actual teaching rendering, complete remaining topic
preservation, all 146 tracked GLBs and current source/Review refusal behavior.
The renderer fingerprint conservatively advances every nested worksheet's
material/geometry revision; that is not a geometry change or an approval migration.
The four authored teaching revisions advance; the other 104 teaching packets
retain their content after the three independently proven renderer-context fields
are projected. All 9,936 root lessons and 1,104 root Review packets stay exact.

The offline `nestedBeforeDuctXray` helper reverses only the two exact recorded
concepts and references. Its frozen transition is bound to the real f3d6966a Git
commit; mixed or unrecorded states fail. The older nested validator keeps every
historical digest, its 9/62 pre-duct X-ray coverage and 115/116 reference counts,
then separately checks current 13/58 coverage and 117/118 source counts. Missing
modalities remain pending. No resolver, parser, API or review checklist is changed.

Automated checks are not browser/GPU acceptance or radiologist sign-off. The full
website/Atlas roadmap continues independently of this queued review batch.

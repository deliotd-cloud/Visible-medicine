# Brain CT/MRI orientation drafts

13 September 2026. Adds 54 previously pending CT/MRI placements for 27
existing root-body selections (18 concepts). No geometry, dissection recipe,
clinical decision, scan, mask or registration is created or altered.
This is introductory imaging orientation, not complete neuroradiology teaching.

## Read the notes

Open `/regions/head-neck`, select a structure, then **Imaging → CT / MRI**.
On a narrow screen, open **Structure info**. The root whole-body explorer uses
the same resolver. The existing tabs, selection, isolation and return controls
are reused; no additional permanent control or automatic scan navigation.

| Source concept | Existing selections | Particular distinction |
| --- | ---: | --- |
| Brain aggregate | 1 | 59 source pieces are not 59 validated anatomical scan regions. |
| Caudate, putamen, globus pallidus, thalamus | 8 | Ventricular/capsular relationships; whole structures, not all nuclei. |
| Amygdala, fornix | 4 | Hippocampal interface and fibre-course visibility limits. |
| Lateral and medial geniculate bodies | 4 | Visual versus auditory relay; specialised MRI evidence is not routine visibility. |
| Anterior, posterior and forniceal commissures | 3 | Landmark localisation is not full fibre delineation or registration. |
| Corpus callosum | 1 | Whole source, not independent callosal segmentations. |
| Choroid plexus and mammillary body | 2 | Each selection contains two source components; no fabricated independent labels. |
| Stria medullaris | 2 | Reference surface is not reconstructed patient tractography. |
| Lamina terminalis and septum of telencephalon | 2 | Thin membrane/CSF distinction; broader septal identity remains unresolved. |

All sections remain **draft**, with **No imaging study loaded**. CT visibility,
MR sequence/resolution and source boundaries are separated explicitly. The
forniceal-commissure Function entry remains pending; new imaging notes do not
settle its disputed function. The broader septal source is not silently renamed
septum pellucidum. Source holds, the separate specimen curricula and the user's
accepted CT-head segmentation boundaries remain untouched.

## Evidence and authoring history

Baseline: `affddc827d88194b25fffa657531437c39781eed`. Pins were recorded before
runtime wiring, while all 54 target sections were pending. The lesson resolver
requires the complete source identity, including hashes, laterality, name,
category, bundle, node, bounds and anchor. FMA/name agreement alone is insufficient.

Commands:

```text
node scripts/pin-central-neural-imaging.mjs --check
node scripts/record-central-neural-imaging.mjs --check
node scripts/validate-central-neural-imaging.mjs
```

The focused check validates all 1,101 current source records; renders all 54
notes using the real React panel callback; rejects 810 changed-source/topic
combinations; preserves all 9,855 other topic placements plus shoulder teaching
and dissection recipes; verifies the three original GLB bundles; checks fresh
returned arrays and unique citation links. It enforces a 200-word per-reference
ceiling on unique original factual synthesis (actual maximum 130 words).
Machine evidence: `central-neural-imaging-validation.json`.

The offline history layer reverses only the exact recorded additions. Earlier
hand/forearm/foot/leg/thigh and original content histories are reconstructed
before their existing checks; no previous expected checksum is replaced.
The body display fingerprint advances to bind the new runtime inputs. No
approval is transferred to that new revision, and shoulder display inputs stay
unchanged. Passing these checks is not clinical acceptance.

Actual browser sampling: right thalamus CT/MRI, isolation alongside the rendered
model, forniceal-commissure MRI, and the same notes in the 390×844 information
drawer with Return to model. Viewport was restored. These are samples, not
all-structure, real-touch-device or acquired-imaging acceptance. The desktop to
mobile panel transition resets the active information tab to Anatomy; selected
structure survives. That navigation continuity issue remains for follow-up.

## References and rights

The thirteen exact reading URLs are in `content/central-neural-imaging.ts` and
are linked from each relevant section. They include RSNA/ACR RadiologyInfo,
UTHealth neuroanatomy, Rushmore et al. (2022), Kitajima et al. (2015), Akeret
et al. (2022), the stria-medullaris tractography study and the lamina-terminalis
cine-MRI study. CT plane/landmark suggestions are original educational synthesis,
not tested scan protocols or evidence that all named borders are visible.

These are factual reading references, **not commercial asset admissions**.
No diagrams, figures, publisher prose, tables, source datasets or scans are
copied, traced or downloaded. Linked StatPearls and other restrictive material
retain their own terms; reading availability is not permission to redistribute
them. Original short notes/code retain project MIT terms; unchanged BodyParts3D
models retain their CC BY 4.0 credits and modification notices. No new package,
font, texture, paid service or runtime reference-fetching dependency is added.

## Remaining clinical and integration requirements

Radiologist review must assess the exact identities, aggregated-source scope,
landmarks, laterality, CT/MRI visibility statements and source limitations.
Further sequence examples, pathology differentials and cases need separate
authoring and revision-bound approval. These drafts do not replace expert review
of all regional geometry or supply comprehensive clinical teaching.

The main website's three separately generated specimen pilots are unchanged;
these root-body notes are not silently copied into their content. Didanix
Education/light remains the learner imaging viewer. Protected studies and
lecture sections require independent entitlements, cleared assets and reviewed
anchors; spatial linking additionally requires validated patient registration.
GitHub/D recovery and actual hosted state are recorded in the main task's dated
checkpoint. A source backup is not a successful deployment.

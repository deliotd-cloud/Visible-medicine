# Intrinsic laryngeal muscle tour

Draft `intrinsic-larynx-muscle-orientation-v1` uses seven existing source surfaces:
right/left posterior cricoarytenoids (FMA46577/46578), right/left lateral
cricoarytenoids (FMA46580/46581), transverse arytenoid (FMA46582), and right/left
oblique arytenoids (FMA46584/46585). Exact catalogue names retain `crico-arytenoid`;
learner titles use the customary joined spelling. This muscle tour is distinct
from the existing laryngeal-framework tour.

All muscle targets require `head-neck-muscles`. Faded cricoid (FMA9615) and
right/left arytenoid cartilages (FMA55113/FMA55114) require the existing
`head-neck-connective-recovery` bundle. These recovered cartilage surfaces remain
unvalidated. Cricoarytenoid close-ups include the cricoid and ipsilateral arytenoid;
the final three close-ups include both arytenoids without the larger cricoid.
Existing posterior/right/left camera directions preserve the common source frame.
No geometry, source records, models or display corrections are added or changed.

Original captions use the muscle rows of the primary
[Texas Tech larynx and neck anatomy table](https://anatomy.ttuhscep.edu/schemes/larynx_tables.html),
checked on 28 September 2026. These support usual posterior-cricoarytenoid
abduction, lateral-cricoarytenoid adduction, transverse/oblique arytenoid
approximation, and recurrent/inferior laryngeal supply. No reference prose or
media is copied. Combined title, description, stop titles and captions are capped
at190words.

Selected static reference surfaces do not establish complete intrinsic muscle
coverage, detailed attachments, nerve courses, mucosa, lumen, airway patency,
phonation or endoscopic/procedural anatomy. No vocal-fold movement, acquired
imaging or patient registration is modeled. Fading is not dissection. Clinical
review remains pending and must identify this actual revision and scope.

`node scripts/test-intrinsic-larynx-tour.mjs` imports this module directly and
checks ten complete displayed records against baseline `5a0952d7ff841e0aac20522faf2a4d4cfe030415`,
the two existing model byte hashes, unique seven targets/three contexts, finite
local frames and invalid identity/bundle/region/frame cases. Source-pin comparison
also rejects altered source hashes, bounds, laterality or approval metadata. The
shared resolver checks availability and bundle identity; full revision-bound
review is the review layer's responsibility. This focused test writes no shared
outputs. Registry/player/review integration and browser acceptance are separate;
no test establishes deployment or clinical approval.

## Integrated source acceptance, 28 September 2026

Fourteen tours now use the existing selector; head/neck retains its framework
default alongside orbit and this muscle sequence. All thirteen preceding tour
definitions and individual evidence are unchanged. Three cartilage selections
now expose both laryngeal tours; all ten affected teaching fingerprints require
fresh review, while all other teaching fingerprints are retained.

Focused checks,29 player tests,102 tour-bound review records,386 invalid-review
rejections,324 modality bindings and the33,460-check content contract pass.
TypeScript and regional production build pass. No geometry or access change.

Actual local375x812 browser sampling traversed all seven stops and inspected
lateral-muscle and final-oblique screenshots. Correct labels, source positions,
one canvas and no horizontal overflow. The final step opens existing left-oblique
MRI notes and pauses playback. Switching to the framework tour requires Start;
Exit returns to Explore. This is mobile emulation, not physical-device or clinical
certification. Website import and radiologist approval remain separate gates.

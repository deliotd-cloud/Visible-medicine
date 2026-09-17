# Portal inflow and hepatic venous outflow — 17 September 2026

**Abdomen → Study windows & focuses → Liver: portal inflow & venous outflow**
combines five existing main-body selections: liver, hepatic portal vein, right
and left hepatic veins, and inferior vena cava. Choose Both sides for all five;
Left or Right retains the corresponding hepatic vein plus the three unpaired
context/inflow selections. No new mesh, source name, regional assignment,
coordinate transform or vessel junction is introduced.

The existing picker, selection, teaching, removal/Undo/Redo and separation
controls are reused. Select the liver and remove it to inspect covered vessels;
Undo restores its context. Source surfaces stay whole, including the long vena
cava. No new permanent control, window, camera crop or flow animation.
The initial posterior view favours hepatic venous outflow; the vena cava can
occlude the portal surface from that direction. Rotate or choose Anterior to
inspect it, or select and isolate it. The supplied portal surface is limited:
do not mistake this comparison for a complete intrahepatic portal branching map.

This complements, rather than replaces, mesenteric portal drainage and the
separate nested liver-branch/biliary study. Inflow and outflow are an anatomical
teaching distinction, not a claim of simulated flow or joined source lumens.
The middle hepatic vein, complete tributaries, sinusoids and arterial inflow
are not included. This is not a complete portal triad, liver segmentation,
procedural plan or patient-imaging registration.

## Evidence, licensing and review

The short original study text is checked against the [Texas Tech abdominal
vein table](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html), read
17 September 2026, and uses the same inflow/outflow distinction as the existing
vessel lessons. The copyrighted table, images and prose are not redistributed.
Existing BodyParts3D/DBCLS CC BY 4.0 credit and change notices remain. No font,
texture, external diagram, patient image, dependency or paid service is added.

Source pins bind all five exact surface records, two existing bundle hashes and
the common source frame. The family is unavailable when a record, frame, source
version or bundle is missing, ambiguous or changed. Clinical approval does not
transfer from metadata matching.

`npm run portal-hepatic-study:test` verifies original mesh bytes, complete saved
catalogue/teaching equality, exact previous-study reconstruction, three side
scopes, study-library discovery, removal history and identity-mutation rejection.
Sequential side changes retain usable Undo/Redo without rendering contralateral
surfaces. The 62 negative identity cases also exercise the aggregate admission
guard and the actual study-link resolver, not just the isolated helper.
The newest transition is removed before replaying earlier cubital/teaching
history; original historical hashes are preserved, not replaced.

Actual build/browser/recovery results are in the main coordination checkpoint.
Tests do not approve source relationships. Radiologist review must confirm
source-labelled venous anatomy, occlusion, learner interpretation and the exact
content revision. Publication and cleared-case/lecture links remain separate.

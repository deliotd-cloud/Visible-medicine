# Heart chamber spaces: guided learning

Available in Whole body or Thorax → Guided learning → Heart chamber spaces,
and the existing Heart nested cavity workbench. Six explicit steps compare all
four cavities, the right pair, the left pair and the overview again. Camera
transitions reuse the existing 1.8-second eased movement; reduced-motion users
get immediate changes. Nothing starts automatically. End restores the prior
manual view, selection, visibility, dissection settings and captured camera.

The source is the existing BodyParts3D v4 cardiac bundle `64d93898db3b6cb4dbea452508799c98cbe65b361eba2f17658ecae532a01f67`.
Only four source cavities are guided: FMA11359, FMA9465, FMA9291 and FMA9466.
The two atrial-wall context surfaces in the same bundle are not guide targets.
The factory requires exact parent/child records, source hashes and bundle metadata;
regional discovery also verifies the existing parent bundle. Missing or changed
records refuse the complete guide, without substituted or repaired anatomy.

Captions are original draft teaching based on [NHLBI blood-flow teaching](https://www.nhlbi.nih.gov/health/heart/blood-flow)
and the [University of Minnesota heart tutorial](https://www.vhlab.umn.edu/atlas/physiology-tutorial/the-human-heart.shtml).
No reference images, videos or text extracts are redistributed. Existing source
licensing/attribution remain in force; no new assets, fonts, dependencies or fees.

Static cavity surfaces do not resolve valves, myocardial thickness, septa,
conduction tissue or vessel openings, and cannot establish blood flow, cardiac
phase, pressure, chamber volume, ejection fraction or patient-space registration.
The guide is not an echocardiographic view or an acquired cardiac scan.

The four nested Clinical Review teaching packets include the exact guide and a
new unchecked guided-learning item. Previous decisions do not approve the new
captions. The owner must review identity, orientation, visibility, source omissions,
camera behavior and restoration before clinical acceptance. Geometry/source
records are unchanged. Global renderer changes require their ordinary re-review.

Focused checks: `npm run cardiac-cavity-guide:test`, existing ventricular component
and camera tests, regenerated requirement inventory and fresh TypeScript. Browser
and website integration evidence are recorded at the milestone checkpoint rather
than inferred from these tests. No public deployment is authorized by this guide.

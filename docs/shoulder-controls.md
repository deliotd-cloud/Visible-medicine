# Shoulder control placement

13 September 2026. The shoulder pilot is regenerated from Atlas
`f26c886ce1fec191d5fff7b5a42001ce9813c747` to move its existing zoom buttons
beside the heading, outside the canvas/label layer. The shorter embedded view
previously allowed the proximal-humerus label to overlap those buttons.

The heading wraps; no extra control, permanent panel or tool is added. Camera
fitting and zoom semantics are unchanged. Model/catalogue hashes, dependency
licences and notices are verified unchanged. The female-pelvis and lower-limb
exports remain on `cc34a98783d8f01d44951b5566f0adaf7f9db75e`; they do not use
the shoulder-only heading layout.

Source checks cover 1,350 shoulder render/handler assertions, 96 camera
composition/restore checks, TypeScript, production build and revision-bound
review safeguards. Actual standalone browser sampling covers 390 x 844 and
1280 x 554 layouts, keyboard zoom, label selection, separation and Reset.
The actual website iframe also rendered the model with its zoom group in the
heading: both zoom buttons responded to Enter at the default desktop size.
At 390 x 844, embedded separation advanced by keyboard and Reset returned it
to 0%; the host had no horizontal document overflow. No claim of physical
touch-device or complete keyboard acceptance follows from this sample.
Exact GitHub/D recovery and private publication outcome are recorded in the main task's
`work/SHOULDER-CONTROLS-CHECKPOINT-20260913.md`.

No splash behavior, teaching text, geometry, patient data, source masks,
entitlements or clinical approval changes. This is not a new camera-fit or
anatomy-detail milestone. Physical touch devices, 200%-text/screen-reader
acceptance, conservative initial fitting and substantive regional anatomy/
modality teaching remain open under the shared master plan.

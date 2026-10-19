# Foot and upper-arm guided learning — 27 September 2026

Local integration imports Atlas `82dee8b0b48b9f5bc2f1a1893dd302bf3993af6f`.
No publication or clinical approval is implied.

- Right foot: five stops from extensor hallucis brevis on the dorsum to
  abductor hallucis, flexor digitorum brevis, abductor digiti minimi and quadratus
  plantae (source label flexor accessorius) on the sole. Superior/inferior views
  follow the actual source axes. This is not a complete four-layer sole dissection.
- Right upper arm: six stops separate the long/short biceps heads, brachialis,
  and long/lateral/medial triceps heads, with exact humerus/scapula context.
  No claim of complete distal attachments or nerve courses.
- Nine regional tours plus the separate shoulder tour; 208 step/modality
  teaching-note bindings. Imaging notes are not paired patient scans or registration.
- Shared camera interpolation now rotates one orthogonal camera frame rather
  than separately interpolating radial/up vectors. This prevents the reproduced
  superior-to-inferior midpoint singularity. Quintic easing, reduced-motion,
  pause/resume and exact endpoint restoration are retained.
- Learner shoulder/regional payloads and protected Clinical Review were generated
  from the same source. All tour captions, context, frames and source identities
  are revision-bound drafts for radiologist sign-off; prior approvals are not reused.

## Verification and boundaries

Source tests cover polar sweeps, camera restore/resize/zoom, actual player events,
review tampering and modality bindings. Website integration tests cover all nine
regional tours, exact source delivery and fail-closed review evidence. TypeScript
and production build are required. Actual mobile source previews exercised all
five foot and six upper-arm stops, posterior medial-head framing and Finish.
Final website browser and recovery evidence is recorded in the coordination
workspace `work/FOOT-ARM-TOURS-CHECKPOINT-20260927.md`.

All 136 model files/143 delivery paths and independent lower-limb/female-pelvis
source pins remain unchanged. No new assets, fees, licences, datasets, scans,
masks, approvals, access changes or clinical desktop PACS modifications.
Replaced learner assets have verified prior copies under
`D:/VisibleMedicine-Atlas-Recovery/foot-arm-tours-prior-generated-20260927`;
previous review payloads remain recoverable from Git and the prior verified bundle.

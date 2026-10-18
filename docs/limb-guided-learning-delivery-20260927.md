# Thigh, leg and hand guided learning — local delivery

Atlas source `84f18150a8a3f5ee4da6f0f20442b8502469ec25` adds three five-stop,
right-sided tours. Existing compact controls, smooth camera interpolation,
explicit Start/Finish, interruption pause and return-to-workspace are retained.
Selected-target frames keep small muscles visible; 60 additional existing
CT/MRI/X-ray/US notes bring the source-bound step/modality count to 164.

Thigh uses anterior quadriceps, medial adductor and posterior hamstring surfaces;
leg moves anterior to lateral to superficial/deep posterior groups; hand moves
from thenar to hypothenar muscles. Exact source context includes femur,
tibia/fibula and first/fifth metacarpals respectively. Full sequences, bounds and
context enter radiologist review. A new parser guard rejects altered context
source details against the trusted build catalogue, not merely hash formatting.

Original captions reference TTUHSC anatomy tables. No new source images,
models, fonts, dependencies, patient scans, masks or registrations are imported.
Existing licence notices remain; independent lower-limb and pelvis pins stay
unchanged. All content is draft, and no clinical decision is submitted or migrated.

Regional learner and protected review are regenerated from the same source;
shoulder payload is unchanged with revalidated source manifest. Old generated
regional JS assets are recoverable in the D-drive prior-generated backup.
All 136 model files / 143 delivery paths remain byte-identical.

See the coordination workspace's `work/LIMB-TOURS-CHECKPOINT-20260927.md` for
final checks, browser acceptance and recovery receipts. Local delivery is not
public deployment or clinical approval. Patient-linked tours still require
cleared cases, exact mappings, independent access and validated registration.

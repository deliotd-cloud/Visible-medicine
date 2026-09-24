# Central airway source study

The Thorax **Central airway source segments** focus retains its ID and title,
but now targets three exact source records instead of matching names. The
separate **Central airway window** and all other recipes are unchanged.

| Target | Catalog ID suffix | Source file | Bundle |
| --- | --- | --- | --- |
| Trachea, FMA7394 | `unpaired:organ:trachea` | FJ2541 | `thorax-organs` |
| Right main bronchus, FMA7395 | `right:organ:right-main-bronchus` | FJ2539 | `thorax-organs-inventory` |
| Left main bronchus, FMA7396 | `left:organ:left-main-bronchus` | FJ2450 | `thorax-organs-inventory` |

Each target is bound to its catalog ID, FMA ID, laterality, bundle, node name,
source file and source hash. The Both filter needs all three records. The Left
and Right filters each retain the trachea and matching bronchus with exact
source checks; a missing opposite-side record is allowed only when that side
is absent from the filtered scope.

The learner prompt identifies these as exterior, proximal source surfaces.
It does not claim a lumen, carina or lobar tree, continuity, or patient
registration. Source boundaries and anatomical relationships require
revision-bound radiologist review before learner-release or clinical approval.

# Supporting-tissue queue: exact source classification

The lexical query returned **12 source-set groups but only 10 unique components**. It is not a list of twelve missing ligaments or fascia. The index-only audit distinguishes:

| Queue | Components | Disposition |
| --- | --- | --- |
| Tendon candidates | FJ1343, FJ1581 | Generic/right aliases share each source. The levator-palpebrae tendon has no inferred left counterpart; the intermediate tendon needs parent-muscle/attachment evidence. |
| Superficial thumb-muscle heads | FJ1514, FJ1514M | Source-named right/left superficial flexor-pollicis-brevis heads, not connective tissue. Compare shape and laterality with held whole-muscle alternatives before admission. |
| Forearm arteries | FJ2223, FJ2275, FJ2245, FJ2297 | Left/right common and recurrent interosseous arteries. Route to vascular geometry/identity review, not fascia completion. |
| Held whole thumb muscles | FJ1469, FJ1469M | Prior laterality/position holds remain. Aggregate aliases cannot bypass them. |

None is newly rendered. The complete anatomy catalogue, coordinates, source holds and all model hashes remain unchanged. Multiple names or bilateral group aliases do not create independent anatomical surfaces.

`content/supporting-candidate-audit.json` retains every source alias and its exact inventory-record hash, single-component definitions, current owners and inherited holds. It is pinned to the source evidence at commit `7e8718882ffc4eb98753bb965c785faa81de6de7`. `npm run supporting:audit` regenerates from the unchanged committed indexes/catalogue and needs no raw cache or Site Git history. `npm run supporting:test` passes 119 checks against those exact definitions and hashes.

This is **index classification only**. No new raw geometry, tissue relationships, source registration, source-side correctness or clinical accuracy has been established for these candidates. No missing anatomy is AI-invented.

Next: retrieve and audit the four exact forearm artery sources (FMA22808, FMA22807, FMA268669 and FMA268667), including source-version rights, CRC/size/hash, side/bounds, existing owners, nearby surface comparisons and branch/group aliases. Separately establish the two tendon sources' parent/extent evidence and compare thumb-head alternatives with the held pair. Do not lift any hold without new evidence.

The official BodyParts3D indexes and derived evidence retain [CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), DBCLS attribution, licence links and change notices. No dependency, model, paid API, copied diagram, private review or patient data is added.

# Supporting-tissue queue: exact source classification

The lexical query returned **12 source-set groups but only 10 unique components**. It is not a list of twelve missing ligaments or fascia. The index-only audit distinguishes:

| Queue | Components | Disposition |
| --- | --- | --- |
| Tendon candidates | FJ1343, FJ1581 | Generic/right aliases share each source. The levator-palpebrae tendon has no inferred left counterpart; the intermediate tendon needs parent-muscle/attachment evidence. |
| Superficial thumb-muscle heads | FJ1514, FJ1514M | Source-named right/left superficial flexor-pollicis-brevis heads, not connective tissue. Compare shape and laterality with held whole-muscle alternatives before admission. |
| Forearm arteries | FJ2223, FJ2275, FJ2245, FJ2297 | Left/right common and recurrent interosseous arteries. Route to vascular geometry/identity review, not fascia completion. |
| Held whole thumb muscles | FJ1469, FJ1469M | Prior laterality/position holds remain. Aggregate aliases cannot bypass them. |

This is the historical pre-admission classification. The subsequent [forearm audit and extension](FOREARM_VASCULAR_DETAIL.md) admits the four arteries after separate raw-geometry checks; it does not admit the tendon/muscle candidates or lift any hold. Multiple names or bilateral group aliases do not create independent anatomical surfaces.

`content/supporting-candidate-audit.json` retains every source alias and its exact inventory-record hash, single-component definitions, then-current owners and inherited holds. It is pinned to the source evidence at commit `7e8718882ffc4eb98753bb965c785faa81de6de7`. The generator/test now use `forearm-vascular-baseline.json` to reconstruct that exact pre-admission state and verify both complete catalogue and inventory hashes. They need no raw cache or Site Git history. `npm run supporting:test` passes 119 checks against those original definitions and hashes; the subsequent admission has its own separate validator.

This is **index classification only**. No new raw geometry, tissue relationships, source registration, source-side correctness or clinical accuracy has been established for these candidates. No missing anatomy is AI-invented.

Next: establish the two tendon sources' parent/extent evidence and compare thumb-head alternatives with the held pair. The separate forearm source audit is complete as a bounded engineering screen, not clinical validation. Do not lift any hold without new evidence.

The official BodyParts3D indexes and derived evidence retain [CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), DBCLS attribution, licence links and change notices. No dependency, model, paid API, copied diagram, private review or patient data is added.

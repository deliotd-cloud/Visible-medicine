# Thoracic small-vessel dissection

## Available study views

The atlas now has **958 source representations in 79 body bundles**, including 175 vascular entries. Four BodyParts3D v4 IS-A components add one 91,700-byte bundle; total body assets are 94,943,836 bytes. All previous 954 records and 78 bundle hashes remain exact. No old identity, source coordinate, shoulder mesh or source hold changed.

Open **Thorax → Dissection, inspection & study tools → Study windows & focuses**:

| View | Targets and retained context |
| --- | --- |
| Bronchial arteries & airway | Two arteries with trachea, main bronchi and aortic arch/descending-aorta context; lungs and heart removed |
| Oesophagus & arterial branches | Two arterial identities with oesophagus and descending thoracic aorta; four entries |
| Thoracic small arteries exposed | Four arteries with only two aortic surfaces; airway and organ surfaces removed |

Each card offers an independent window and equivalent focus. Targets remain distinct from context; side filters retain applicable anatomy without inventing vessel laterality. Select/frame, hide/restore/Undo, isolate/fade, explode, arrangement, labels, related-study navigation, private study links, local saved views and focused practice include the additions. Whole-body views include their original source identities too.

There are **116 dissection stages and 98 focuses**: 47 regional layer steps and 69 independent windows. The library presents 167 recipes as 140 cards, including 27 equivalent window/focus pairs. These are visibility recipes, not complete anatomy or surgical depth.

## Exact source decisions

| Admitted official identity | Component | Decision |
| --- | --- | --- |
| FMA4149 esophageal artery | FJ1934 | Retain exact name; identical PART-OF alias is not a second structure |
| FMA10704 variant bronchial artery | FJ3418 | Retain explicit variant label; FMA14177 bronchial branch of arch of aorta, FMA3714 variant artery and FMA66267 variant systemic artery share this source and are not rendered separately |
| FMA68109 bronchial artery | FJ1933 | Retain generic source label without inferring side or normal branch count |
| FMA71537 set of oesophageal branches of thoracic aorta | FJ3431 | Retain one grouped identity, without invented individual branch names |

`content/thoracic-baseline.json` pins commit `84a6adbf3814b2d28bd4a3a053622a0da0ad3a9a` and catalogue hash `e253e9ec0c1a1567b3ac614501c6511338d44234a28696501733679f377821c9`. The source audit records exact definitions/aliases, archive CRC/size, raw/canonical hashes, bounds and coordinate evidence. The separate allowlist in `scripts/thoracic-selections.mjs` admits entries; running the audit admits nothing.

All four have finite triangular surfaces, zero degenerate faces, no existing canonical duplicate owner and bounds inside the declared gross thoracic envelope. All existing thoracic structures and the candidates form the comparison set: 123 box-near pairs, at most 128 deterministic vertices per direction measured against every comparison triangle, with finite segment/point fallback for existing degenerate faces. No pair shares an exact position triangle or reaches the flag threshold of 25% sampled vertices within 0.25 mm in either direction. Median mutual distances are 6.93/7.19 mm for the oesophageal pair and 10.84/22.03 mm for the bronchial pair. Engineering inference: the samples do not suggest near-coincident alternatives. This does **not** prove non-intersection, attachments, vascular continuity or clinical accuracy.

No source is welded, stretched, thickened, bridged or relabelled as ordinary anatomy. Conversion uses the existing millimetre-to-scene transform, indexing and display normals/materials. Explode/arrangement changes display translations only; cutaways are exterior-surface clipping, not tissue interiors or scan slices.

The refreshed small muscle/visceral name query now contains only FMA46622, which reuses held middle-constrictor components FMA46633/FMA46634 and remains withheld. That bounded query is exhausted, **not** all unused anatomy: the wider inventory still has 844 unused-available definitions requiring separate review. All earlier source/registration holds remain.

## Commercial and clinical gates

The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), rechecked 6 September 2026, remains CC BY 4.0. Preserve **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, the licence link and adaptation notices. Anatomy/source-derived evidence is not relicensed as MIT. No new dependency, font, texture, paid API, generated anatomy or copied diagram is added. Short original draft notes cite [TTUHSC thoracic arterial facts](https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html), without redistributing its protected figures or authored tables. Existing hosting terms remain; no perpetual free-hosting guarantee is made.

Specialists must assess identities, normal/variant semantics, grouped branches, origins/endpoints, organ/airway relationships, extent, calibre, lumen, continuity and missing branches. Perfusion, anastomoses, normal prevalence and surgical planes are not established. Every added surface and note remains unvalidated. CT/MRI/US tabs disclose absent studies; stable IDs and selection hooks are not acquired scans, a modality adapter or patient registration. Hands-on browser, touch, keyboard, accessibility and educator acceptance remain pending.

## Verification and next work

`npm run thoracic:test` runs **9,574 assertions** from committed evidence without Site Git history: exact prior preservation, names/aliases/ownership, finite audit diagnostics, original coordinate transform, draft content, all side filters, precise window/focus membership, remove/restore/Undo, focused practice, imaging identities and old-link compatibility. Optional `node scripts/validate-thoracic.mjs --raw-source` also verifies cached source bytes/fingerprints and transformed vertex bounds; **9,606 assertions** passed. Re-running retrieval requires pinned source history/cache/network.

All historical source suites pass, as do 3,426 dissection plus 8,352 camera checks, 86,866 workbench, 54,646 practice, 17,366 saved-view, 45,138 imaging, 93,335 navigation, 206,887 link, 34,836 library (including 24 server-rendered markup cases), 1,152,679 inspection, 12,885,737 arrangement and 537,628 explode-pair checks. Dedicated shoulder and 189 review safeguards remain intact. These are numerical/software results, not clinical or hands-on acceptance. Type checks, lint, licence audit and production build are required before private publication.

Next inspect the wider unused inventory beyond this exhausted lexical query, ranking genuinely distinct regional tissue definitions against aggregate/alias semantics before retrieval. Continue regional dissection guidance and selection/loading resilience, retaining current source IDs and curriculum. Do not reopen holds without new evidence. The broader goal stays active; real imaging requires the user's adapter and rights-cleared, de-identified studies.

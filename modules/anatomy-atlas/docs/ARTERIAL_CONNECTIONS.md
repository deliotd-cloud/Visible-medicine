# Abdominal and limb arterial connections

Select a participating artery and open **Arterial connections** in its information panel. The section starts collapsed and is absent for unrelated structures and exam mode. No additional global toolbar, diagram or permanent list.

## What the learner can do

- Follow available upstream, downstream and communicating arteries using their actual source selections. A hidden neighbour is restored through the existing selection handler.
- Show the current artery, its available neighbouring selections and regional bone context in one reversible dissection step. Both sides remain in the visibility mask so side switching works. Existing selection is retained; camera, separation, cutaway and ghosted removals are reset.
- Open an out-of-region neighbour in the whole-body atlas through the existing source-bound study link. This intentionally opens a new study; it is not a promise to preserve the old camera/removal state across routes.
- Read an explicit distinction between branch, continuation, anastomosis and a route through a segment not separately modelled. No flow direction is assigned to anastomoses.

## Lower-limb scope

**29 existing arterial selections, 15 concepts, 30 paired/midline relationships**; 60 reciprocal neighbour rows are two views of the same relationships, not 60 separate pathways. The abdominal aorta is midline; fourteen concepts are paired. The bounded map covers common/external/internal iliac, femoral/deep femoral, popliteal, anterior/posterior tibial, dorsalis pedis, medial/lateral plantar, deep plantar, superficial medial plantar and plantar arch selections.

This is not a complete arterial tree. In particular:

- The tibioperoneal trunk is not independently selectable. The popliteal–posterior tibial relation is explicitly **via an unmodelled segment**, not a direct branch. The fibular artery is also missing as a separate root selection; do not interpret it as anatomically absent.
- The femoral source is not divided into common and superficial femoral selections. Deep femoral is a branch, whereas the popliteal name begins at the adductor hiatus.
- Deep femoral source records are two-component `partof` aggregates per side, not invented individually labelled circumflex or perforating branches. Their complete official memberships are retained.
- Medial plantar is not made the usual principal contributor to the deep plantar arch. The lateral plantar continuation and deep plantar communication stay distinct. Source-labelled plantar arches retain their existing arterial classification.
- Pelvic, genicular, circumflex, digital and other unlisted branches/variants remain outside this limited map. No downstream row does not imply an anatomical end.

## Upper-limb extension

**52 additional existing selections, 26 concepts, 56 bilateral relationships** (112 reciprocal rows). Four relationships are alternative dorsal-scapular origin routes; they are not simultaneous connections in a donor. Both limb maps together cover 81 selections / 41 concepts / 86 relationships, not a complete body arterial tree.

The map spans supplied subclavian/axillary/brachial selections, deep brachial and humeral/scapular branches, the thoracoacromial trunk and three named branches, radial/ulnar and supplied interosseous selections, both palmar arches, grouped palmar metacarpals, princeps pollicis and radialis indicis. Thyrocervical, costocervical, dorsal scapular and suprascapular selections provide limited shoulder inflow context. Use the same collapsed panel in shoulder/arm, forearm, hand or another regional view containing a participating selection.

- Subclavian–axillary and axillary–brachial are continuations, not side branches. Unpaired aortic-arch/brachiocephalic origins are outside this map; right and left proximal origins are not made symmetrical.
- Circumflex scapular and thoracodorsal routes explicitly pass through a **missing independently selectable subscapular artery**. Common-to-recurrent interosseous passes through the missing **posterior interosseous trunk**; the recurrent surface is not a replacement for that trunk.
- Radial/deep-arch and ulnar/superficial-arch principal contributions stay distinct from communicating contributions. The deep ulnar and superficial radial palmar branches are not separately supplied. Surface completeness, collateral adequacy and joined lumina are not established; no flow direction is assigned to communications.
- Dorsal scapular may have a direct subclavian origin or a transverse-cervical route. The latter is labelled via an unmodelled segment, not a direct thyrocervical branch. **Alternative origins** has its own section. Isolation may display alternatives for comparison but does not assert simultaneous inflow.
- Thumb/index origins vary; the radial-system teaching relationship is not proof of the source junction. Source-numbered common/proper digital selections are deliberately not wired into this map without adjudicated identities. Unlisted branches are not anatomically absent.
- All 52 source identities use the official `isa` membership. Posterior circumflex humeral, princeps pollicis and radialis indicis each have two official component rows per side. These remain grouped, with all six paired selections' complete memberships checked; no component becomes an invented new branch.

`content/upper-limb-arterial-pins.json` binds all 52 complete arterial records and 64 existing skeletal-context records to their source frame/licence/bundles. Context bones are limited to the pinned shoulder/arm, forearm and hand sets and the current regional crop; head/neck or thorax crops may contain arteries without that bone context. Outside neighbours use explicit whole-body links. Lower-limb admissions remain separate and unchanged.

The shared `lib/regional-arterial.ts` engine enforces both sets' complete bindings. `lib/limb-arterial.ts` dispatches only between disjoint admitted identities; it does not substitute one dataset for a failed binding. Variant rows are neither ordinary downstream branches nor anastomotic flow statements.

Upper-limb references, factual synthesis only:

- [Texas Tech upper-limb arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html): branch identities and palmar contributions. Indexed text was available when the direct fetch timed out.
- [UAMS upper-limb arteries](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/): naming landmarks, subscapular parent and shoulder inflow distinctions.
- [Relative frequency of a subclavian vs. a transverse cervical origin for the dorsal scapular artery](https://pubmed.ncbi.nlm.nih.gov/8808401/): alternative origin routes; no frequency adopted or assigned to the donor.
- [Superficial palmar arch: an arterial diameter study](https://pubmed.ncbi.nlm.nih.gov/15061757/): arch and radial-side variation. Indexed abstract/figure descriptions support the caution; no figure, measurement or text imported. Study percentages are not generalised.

## Abdominal extension

**28 source selections / 27 concepts / 32 relationships** add visceral and renal routes. One aortic selection is shared with the lower-limb map, giving **108 unique selections / 67 concepts / 118 relationships** across all three maps. Reciprocal rows are not extra anatomical connections. No extra global control or permanent panel.

The compact section covers celiac, common/proper hepatic, gastroduodenal, splenic, left gastric, renal, superior/inferior mesenteric, selected colic and pancreatic routes. Anterior/posterior pancreaticoduodenal arcades stay distinct from inferior pancreatic supply. Marginal-colic communications do not establish a complete arcade, flow direction or adequate collateral supply. Appendicular origin is unresolved: direct ileocolic and indirect cecal routes are not a confirmed direct junction. The ambiguous ascending ileocolic subdivision and missing sigmoid, hepatic, gastric and intestinal branches are not assigned guessed parents.

`content/abdominal-arterial-pins.json` binds 28 arterial records and five lumbar-bone context records to exact frame, licence, bundles and component memberships. Celiac and superior mesenteric each have two official components; splenic has four. All other admissions have one. No component becomes an invented branch identity.

The factory keeps its default same-side rule for limbs. The abdominal map uses explicit concepts: left gastric and right/left colic names are not mirrored branch pairs. Visibility still follows the main viewer's side filter, including midline/unpaired/unspecified categories; no source laterality changes. Use Both sides for the complete mapped abdominal set. Single-side views still exclude catalogue-labelled contralateral selections.

`lib/arterial.ts` is the main-view dispatcher. At the shared aorta, both abdominal and lower-limb bindings must pass. Neighbours and bone context combine in one reversible action; neither map silently substitutes for a stale other map. Non-shared selections retain separate admission rules. The old limb API is preserved.

Reading references: [UAMS abdominal arteries](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/), [Texas Tech abdominal arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html), [celiac/hepatic variation in 5,002 patients](https://pubmed.ncbi.nlm.nih.gov/20308464/), [dorsal pancreatic origin review](https://pubmed.ncbi.nlm.nih.gov/35177332/) and [right-colic origin review](https://pubmed.ncbi.nlm.nih.gov/29196959/). The last two were indexed while direct PubMed pages challenged access; no prevalence or additional unverified variants were adopted. No publisher prose, table, figure, scan or diagnostic protocol is imported. Relationship metadata and source-limit notes are original; existing mesh attribution stays unchanged.

Run **both** `npm run abdominal-arterial:test` and the existing `npm run arterial-connections:test`. The new suite covers 160 regional/side plans, 30 cross-region links, 78 altered/duplicate-source rejections, 56 actual component renders and 56 real parent-handler cases. It checks official component memberships, reciprocal labels, side switching, exact visibility, one-step Undo/Redo, idempotence, shared-aorta failure handling and exam guards. Existing limb tests now inject the real new parent dispatcher while still checking unchanged limb contracts. No browser/device/clinical validation is inferred.

## Geometry, identity and interactions

Relationships are original teaching metadata, never inferred from source endpoints, proximity or colours. No new mesh, linking tube, repaired lumen, centreline, flow, stenosis, oxygenation, branch calibre, surgical plane or scan registration is generated. Typical branching is not a finding in this source donor and requires specialist review.

`content/lower-limb-arterial-pins.json` retains 29 complete arterial and 65 skeletal-context records with exact source frame, licence and relevant bundle identities. The runtime rejects missing, duplicate or modified pinned records, altered frame/units and changed or duplicate bundles. Paired vessels cannot connect across sides; the midline aorta can connect to either allowed side. Unsupported IDs/regions/sides and exam mode yield no action.

One `load-view` action reuses existing dissection Undo/Redo. Undo restores layers/removals, not camera or system switches. Regional views only show members of their current scope; outside neighbours use a validated link. The Show action retains selection and sends no imaging event. Selecting another actual artery uses the existing identity-only selection synchronization; that does not load a patient scan or authorize access to a lecture.

Existing 9,198 root teaching topics, dedicated shoulder material and every dissection recipe are unchanged. Review renderer fingerprints regenerate normally; no clinical approval is manufactured or carried forward.

## References, rights and limitations

- [Texas Tech lower-limb artery teaching](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html): anatomical names, continuations and plantar connections. No table, prose or diagram copied into the product.
- [Posterior tibial anatomy](https://www.ncbi.nlm.nih.gov/books/NBK536981/): typical tibioperoneal branching and distinctions from source selection boundaries. No acquisition/intervention recommendations adopted.
- [Day and Orme, angiographic branching study](https://pubmed.ncbi.nlm.nih.gov/16843754/): variants exist; no study frequency is treated as a universal rule or donor finding. Indexed/abstract evidence, not imported images.

New code and original metadata/prose are MIT. References are optional reading links, not runtime services or included third-party assets. No new dependency, font, model, texture, paid API or subscription. Existing BodyParts3D CC BY 4.0 credit and modification notices remain required; no source asset is relicensed. Publicly readable medical material is not automatically a commercial image licence.

## Verification and remaining requirements

Run `npm run arterial-connections:test`. It checks the complete official `isa`/`partof` memberships, all bilateral relationships and inverse labels, regional/side visibility, actual dissection reducer/history, source-bound link round trips, malformed catalogues, unchanged existing teaching and actual component rendering. The real parent handler is exercised without an imaging-event function; exam mode produces no changes. Static rendering is not browser/GPU/device validation.

Independent anatomist/vascular specialist review of source interfaces, branching, limits and educational usefulness remains required. Real touch/keyboard/mobile and screen-reader acceptance is still outstanding. Missing source segments need separately cleared and spatially validated assets. Patient US/CTA/MRA integration needs verified patient/series/side/frame mappings and rights-cleared resources; a typical relation graph is not that mapping. Atlas and paid-lecture entitlements must be enforced separately on the server when those resources are connected; this feature does not implement a paid lecture service. No procedure planning, diagnostic or treatment use is established.

This closes one interaction gap, not the vascular atlas. Continue substantive anatomical/function work elsewhere; do not repeat this map or expand routine oral detail.

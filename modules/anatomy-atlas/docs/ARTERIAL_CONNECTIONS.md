# Lower-limb arterial connections

Select a participating artery and open **Arterial connections** in its information panel. The section starts collapsed and is absent for unrelated structures and exam mode. No additional global toolbar, diagram or permanent list.

## What the learner can do

- Follow available upstream, downstream and communicating arteries using their actual source selections. A hidden neighbour is restored through the existing selection handler.
- Show the current artery, its available neighbouring selections and regional bone context in one reversible dissection step. Both sides remain in the visibility mask so side switching works. Existing selection is retained; camera, separation, cutaway and ghosted removals are reset.
- Open an out-of-region neighbour in the whole-body atlas through the existing source-bound study link. This intentionally opens a new study; it is not a promise to preserve the old camera/removal state across routes.
- Read an explicit distinction between branch, continuation, anastomosis and a route through a segment not separately modelled. No flow direction is assigned to anastomoses.

## Anatomical scope

**29 existing arterial selections, 15 concepts, 30 paired/midline relationships**; 60 reciprocal neighbour rows are two views of the same relationships, not 60 separate pathways. The abdominal aorta is midline; fourteen concepts are paired. The bounded map covers common/external/internal iliac, femoral/deep femoral, popliteal, anterior/posterior tibial, dorsalis pedis, medial/lateral plantar, deep plantar, superficial medial plantar and plantar arch selections.

This is not a complete arterial tree. In particular:

- The tibioperoneal trunk is not independently selectable. The popliteal–posterior tibial relation is explicitly **via an unmodelled segment**, not a direct branch. The fibular artery is also missing as a separate root selection; do not interpret it as anatomically absent.
- The femoral source is not divided into common and superficial femoral selections. Deep femoral is a branch, whereas the popliteal name begins at the adductor hiatus.
- Deep femoral source records are two-component `partof` aggregates per side, not invented individually labelled circumflex or perforating branches. Their complete official memberships are retained.
- Medial plantar is not made the usual principal contributor to the deep plantar arch. The lateral plantar continuation and deep plantar communication stay distinct. Source-labelled plantar arches retain their existing arterial classification.
- Pelvic, genicular, circumflex, digital and other unlisted branches/variants remain outside this limited map. No downstream row does not imply an anatomical end.

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

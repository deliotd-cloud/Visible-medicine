export type ForearmArterialModality = 'ct' | 'mri' | 'ultrasound';
export type ForearmArterialGroup = 'radial' | 'ulnar' | 'anterior-interosseous' | 'common-interosseous' | 'recurrent-interosseous';
export const forearmArterialReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
  cta: 'https://pubmed.ncbi.nlm.nih.gov/29089685/',
  mra: 'https://pubmed.ncbi.nlm.nih.gov/1945792/',
  doppler: 'https://pubmed.ncbi.nlm.nih.gov/8349968/',
  interosseousCta: 'https://pubmed.ncbi.nlm.nih.gov/41952244/',
  interosseousUs: 'https://pubmed.ncbi.nlm.nih.gov/40605325/',
  upperExtremityCta: 'https://pubmed.ncbi.nlm.nih.gov/39745868/',
};
type Ref = keyof typeof forearmArterialReferences;
type Topic = { body: string; bullets: string[]; references: Ref[] };
export const forearmArterialSelections: {fmas: string[]; group: ForearmArterialGroup; topics: ForearmArterialModality[]; landmark: string; limit: string; references: Ref[]}[] = [
  {fmas:['FMA22733','FMA22734'],group:'radial',topics:['ct','mri','ultrasound'],landmark:'The radial artery usually arises near the elbow from the brachial artery and contributes predominantly to the deep palmar arch. A higher origin can occur.',limit:'Each side is one source surface, not a complete palmar arch, validated lumen or collateral-sufficiency test.',references:['anatomy']},
  {fmas:['FMA22797','FMA22798'],group:'ulnar',topics:['ct','mri','ultrasound'],landmark:'The ulnar artery gives rise to the common interosseous artery and contributes predominantly to the superficial palmar arch.',limit:'Forearm/hand membership does not establish every distal connection. This surface cannot confirm arch completeness or adequate hand perfusion.',references:['anatomy']},
  {fmas:['FMA22812','FMA22813'],group:'anterior-interosseous',topics:['ct','ultrasound'],landmark:'The anterior interosseous artery branches from the common interosseous route and supplies deep anterior forearm muscles.',limit:'This is the anterior interosseous selection, not the common or recurrent branch, a supplied posterior trunk, or a complete collateral network.',references:['anatomy']},
  {fmas:['FMA22807','FMA22808'],group:'common-interosseous',topics:['ct'],landmark:'The common interosseous artery is a short proximal branch of the ulnar artery; it ordinarily divides into anterior and posterior interosseous branches.',limit:'This source-labelled common segment does not reconstruct the full branch tree or establish a joined lumen to the separately supplied anterior segment. The posterior trunk is not independently supplied.',references:['anatomy','upperExtremityCta']},
  {fmas:['FMA268667','FMA268669'],group:'recurrent-interosseous',topics:['ct'],landmark:'The recurrent interosseous artery is a branch of the posterior interosseous artery near the proximal posterior forearm.',limit:'This is the recurrent branch, not the absent complete posterior interosseous trunk. Neither its origin nor its elbow connections or flow are validated by the source surface.',references:['anatomy']},
];
// Original factual summaries. Links are references, not licences for publisher media.
export const forearmArterialTopics: Record<ForearmArterialGroup,Partial<Record<ForearmArterialModality,Topic>>> = {
  radial: {
    ct:{body:'Forearm CTA can depict radial arterial course, variant origin and calcification. A preoperative study also reported radial occlusion; these are acquired findings rather than properties encoded by a red atlas surface.',bullets:['Dense calcification can limit evaluation of a segment. A smooth mesh cannot establish a normal lumen or suitability as a vascular conduit.'],references:['cta']},
    mri:{body:'An early phase-contrast MRA study depicted radial and ulnar arteries in healthy volunteers. Dedicated angiography is distinct from simply locating a vessel on routine forearm MRI.',bullets:['That small study also included dialysis-shunt patients. It does not supply universal diagnostic accuracy, an acquisition prescription or MR signal for this model.'],references:['mra']},
    ultrasound:{body:'Colour Doppler research measured radial and ulnar diameters and flow at wrist and hand levels. Relative arterial dominance varied between volunteers.',bullets:['An acquired waveform and anatomical identity are different information. Mesh calibre, colour and apparent connections cannot determine radial dominance, patency or collateral adequacy.'],references:['doppler']},
  },
  ulnar: {
    ct:{body:'CTA can distinguish the ulnar route from the radial artery and show acquired calcification or variant arterial patterns. The cited study examined patients being assessed for coronary bypass conduits.',bullets:['Its findings are not a normal-population template. The atlas supplies neither contrast enhancement nor a validated distal runoff or palmar-arch map.'],references:['cta']},
    mri:{body:'Phase-contrast forearm MRA has depicted the ulnar artery along with the radial artery and superficial veins. Vessel identification still depends on the acquired series, not the atlas colour.',bullets:['The cited feasibility study is not evidence that every small branch is visible on routine MRI or that this source is registered to a scan.'],references:['mra']},
    ultrasound:{body:'Ultrasound can acquire ulnar arterial calibre and blood-flow information. Volunteer Doppler measurements showed that the ulnar artery was not invariably the dominant vessel.',bullets:['Do not convert this static surface into an Allen test or a prediction of hand viability. No waveform, physiologic challenge or patient flow measurement is supplied.'],references:['doppler']},
  },
  'anterior-interosseous': {
    ct:{body:'A CTA study measured the anterior interosseous artery alongside radial and ulnar arteries at mid and distal forearm levels in patients with traumatic hand or finger defects.',bullets:['Its smaller mean calibre is a study observation, not a measurement of this donor. The source cannot select a recipient vessel or predict reconstruction success.'],references:['interosseousCta']},
    ultrasound:{body:'A study of patients with radial artery occlusion assessed anterior interosseous and ulnar arterial flow using ultrasound. Acquired flow direction helped characterize the remaining circulation.',bullets:['This is an altered-circulation population, not a normal-donor flow template. The atlas has no measured velocities or proof of the collateral routes assessed in that study.'],references:['interosseousUs']},
  },
  'common-interosseous': {
    ct:{body:'Upper-extremity CTA can provide an arterial map of the forearm. The cited review describes the usual ulnar-to-common-interosseous branching pattern and labels an interosseous artery on a lower-arm CTA; this atlas selection serves as a proximal orientation landmark.',bullets:['The review does not establish that this exact short branch is visible in every CT acquisition. Image quality and arterial opacification matter; a source mesh does not show a patient lumen or continuity.'],references:['upperExtremityCta']},
  },
  'recurrent-interosseous': {
    ct:{body:'Use this labelled recurrent segment to orient to the proximal posterior forearm when considering a patient CTA. The cited CTA review discusses upper-extremity arterial anatomy but does not demonstrate reliable depiction of this specific small recurrent branch.',bullets:['Do not read a missing or indistinct branch on CT as proof of absence, injury or occlusion. This mesh cannot show its parent trunk, collateral connections, perfusion or procedural suitability.'],references:['upperExtremityCta']},
  },
};

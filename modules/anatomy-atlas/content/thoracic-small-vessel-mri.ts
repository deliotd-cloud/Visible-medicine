// Original source-bound MRI teaching. References are reading links, not image assets.
export const thoracicSmallVesselMriReferences = {
  thoracicArteries: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html',
  thoracicVeins: 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html',
  bronchialMri: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10052726/',
  coronaryVenousMri: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2731087/',
} as const;
type Reference = keyof typeof thoracicSmallVesselMriReferences;
type Group = {fmaId:string;laterality:'midline'|'unspecified';body:string;pitfall:string;references:readonly Reference[]};
export const thoracicSmallVesselMriGroups:Record<string,Group> = {
  'esophageal-artery': {
    fmaId:'FMA4149',laterality:'midline',
    body:'Use the oesophagus and descending thoracic aorta as orientation landmarks on an actual MR study. The cited anatomy identifies oesophageal arterial supply; it does not establish that this tiny named artery is visible on MRI.',
    pitfall:'Do not assign an MR signal near the oesophagus to this artery without demonstrable arterial continuity. The cited material supplies no MRI detection performance for oesophageal arteries.',
    references:['thoracicArteries'],
  },
  'variant-bronchial-artery': {
    fmaId:'FMA10704',laterality:'midline',
    body:'In a cystic-fibrosis MRI study, contrast-enhanced chest MRI detected pathologically dilated bronchial arteries. If an artery is resolved on the actual study, establish its origin before calling it variant.',
    pitfall:'That study targeted dilated arteries and acknowledged lower spatial resolution than CT or catheter angiography. It does not validate MRI detection of this retained variant-labelled source identity or its exact origin.',
    references:['bronchialMri','thoracicArteries'],
  },
  'bronchial-artery': {
    fmaId:'FMA68109',laterality:'midline',
    body:'A published cystic-fibrosis series detected bronchial artery dilatation with contrast-enhanced chest MRI. Use source images to distinguish any resolved systemic arterial course from the pulmonary vessels.',
    pitfall:'Detection of enlarged vessels in that selected population does not imply routine MRI delineates a normal bronchial artery, every branch, its calibre, or spinal connections.',
    references:['bronchialMri','thoracicArteries'],
  },
  'esophageal-branches': {
    fmaId:'FMA71537',laterality:'midline',
    body:'The thoracic aorta and oesophagus can orient review of their anatomical relationship on an MR study. The cited anatomy describes aortic oesophageal branches; it provides no evidence that MRI resolves this grouped set.',
    pitfall:'Do not count arterial branches or infer continuity from this grouped donor selection or from unconfirmed MR signal. No cited MRI study validates its completeness or detectability.',
    references:['thoracicArteries'],
  },
  'anterior-cardiac-vein': {
    fmaId:'FMA76767',laterality:'unspecified',
    body:'Anterior cardiac veins drain the anterior right-ventricular surface toward the right atrium. A coronary venous MR study demonstrated selected larger veins, but did not establish visibility of this anterior cardiac vein source group.',
    pitfall:'The anterior interventricular vein reported in that study is a different vessel. Do not use its detection rate to claim MRI visibility, drainage ostia, or patent lumens for these two donor components.',
    references:['thoracicVeins','coronaryVenousMri'],
  },
};

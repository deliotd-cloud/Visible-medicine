// Original orientation drafts; reference URLs are reading links, not imported assets.
export const shoulderGirdleImagingReferences = {
  upperArteries: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
  thoracicArteries: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html',
  axilla: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html',
  posteriorNeck: 'https://anatomy.ttuhscep.edu/nervous_system/postneck_tables.html',
  dorsalVariation: 'https://pubmed.ncbi.nlm.nih.gov/37179441/',
  neckVariation: 'https://pubmed.ncbi.nlm.nih.gov/16187318/',
  suprascapularVeinVariation: 'https://pubmed.ncbi.nlm.nih.gov/7940081/',
  cta: 'https://www.radiologyinfo.org/en/info/angioct',
  mra: 'https://www.radiologyinfo.org/en/info/angiomr',
} as const;

type Reference = keyof typeof shoulderGirdleImagingReferences;
type Group = { body: string; pitfall: string; references: readonly Reference[] };
export const shoulderGirdleImagingGroups: Record<string, Group> = {
  'thyrocervical-trunk': {
    body: 'Where the vessel is resolved, orient this short proximal subclavian branch in the lower neck against the first rib and anterior scalene. Follow its actual branches on source sections before assigning a named branch.',
    pitfall: 'Thyrocervical branching varies; proximity to a dorsal scapular or suprascapular artery does not establish a shared origin or continuity in this donor.',
    references: ['upperArteries', 'neckVariation', 'cta', 'mra'],
  },
  'costocervical-trunk': {
    body: 'Where resolved, look posterior to the subclavian region near the first rib for the short costocervical course towards deep cervical and upper intercostal territories.',
    pitfall: 'Its side-specific origin and short branches require confirmation on actual sections; a projected crossing over the pleural apex does not establish a junction.',
    references: ['thoracicArteries', 'posteriorNeck', 'cta', 'mra'],
  },
  'dorsal-scapular-artery': {
    body: 'Where resolved, orient the vessel along the medial scapular border and nearby rhomboid region, then trace proximally to the origin visible in the study.',
    pitfall: 'The dorsal scapular artery can arise directly from the subclavian or from a transverse cervical pathway. The selected donor cannot settle a universal origin or its brachial-plexus relationship.',
    references: ['posteriorNeck', 'dorsalVariation', 'neckVariation', 'cta', 'mra'],
  },
  'suprascapular-vein': {
    body: 'Where venous contrast or signal resolves it, orient this vein in the suprascapular region separately from the adjacent artery and compare its course on consecutive source sections.',
    pitfall: 'An arterial landmark does not prove venous drainage or a terminal confluence. This retained vein is not a complete map of scapular venous tributaries.',
    references: ['suprascapularVeinVariation', 'cta', 'mra'],
  },
  'thoraco-acromial-trunk': {
    body: 'Where resolved, relate this short trunk to the second part of the axillary artery deep to the pectoral region and follow each visible branch independently.',
    pitfall: 'The branch pattern and exact bifurcations cannot be read from a static overlap; this selected trunk does not validate all four named thoraco-acromial branches.',
    references: ['upperArteries', 'thoracicArteries', 'axilla', 'cta', 'mra'],
  },
  'pectoral-branch': {
    body: 'Where resolved, orient the pectoral branch in the anterior chest wall towards the pectoral muscle region, using adjacent muscle and axillary artery as landmarks.',
    pitfall: 'An apparent link to the thoraco-acromial trunk must be confirmed on source sections; this donor surface does not establish every pectoral twig or muscular perfusion.',
    references: ['thoracicArteries', 'axilla', 'cta', 'mra'],
  },
  'acromial-branch': {
    body: 'Where resolved, follow the acromial-directed branch laterally towards the acromion, checking its course against the clavicle and shoulder surface on source sections.',
    pitfall: 'A projected crossing at the acromion is not proof of anastomosis or precise branch origin; short superficial branches may be indistinct.',
    references: ['thoracicArteries', 'axilla', 'cta', 'mra'],
  },
  'deltoid-branch': {
    body: 'Where resolved, use the deltopectoral region and deltoid muscle to orient the deltoid-directed branch, then inspect its actual proximal course on source sections.',
    pitfall: 'Do not infer a complete deltoid supply or continuity with neighbouring arteries from this isolated donor branch.',
    references: ['thoracicArteries', 'axilla', 'cta', 'mra'],
  },
};

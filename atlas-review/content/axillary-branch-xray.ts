// Original teaching text; cited publications are reading context, not image assets.
export const axillaryBranchXrayReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
  axilla: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html',
  hue: 'https://pubmed.ncbi.nlm.nih.gov/9706673/',
  reidTaylor: 'https://pubmed.ncbi.nlm.nih.gov/6201224/',
  bonczar: 'https://pubmed.ncbi.nlm.nih.gov/36094609/',
  variantCta: 'https://pubmed.ncbi.nlm.nih.gov/34998174/',
  pan: 'https://pubmed.ncbi.nlm.nih.gov/39568746/',
} as const;

export const axillaryBranchXrayTopics = {
  anteriorCircumflexHumeral: {
    body: 'The usual anterior circumflex humeral artery leaves distal axillary artery and curves toward the humeral surgical neck anteriorly.',
    study: 'Hué and colleagues examined 40 injected cadaveric shoulders, including 15 radiographic observations; these were not normal plain films or living DSA.',
    citations: ['anatomy', 'hue'],
  },
  posteriorCircumflexHumeral: {
    body: 'The usual posterior circumflex humeral artery passes behind the humeral neck through quadrangular space beside the axillary nerve.',
    study: 'Hué and colleagues examined 40 injected cadaveric shoulders, including 15 radiographic observations; these were not normal plain films or living DSA.',
    citations: ['anatomy', 'axilla', 'hue'],
  },
  circumflexScapular: {
    body: 'The usual circumflex scapular branch turns posteriorly from subscapular artery toward the scapular region, where other scapular vessels may overlap.',
    study: 'A CTA study of 100 adults and 200 arterial systems found 25 without a common subscapular trunk; the circumflex scapular origin can differ from the usual diagram.',
    citations: ['anatomy', 'variantCta'],
  },
  thoracodorsal: {
    body: 'The usual thoracodorsal artery descends from the subscapular system toward latissimus dorsi along the posterior axillary wall.',
    study: 'A CTA study of 100 adults and 200 arterial systems found 25 without a common subscapular trunk; branch origin needs demonstration in the acquired examination.',
    citations: ['anatomy', 'variantCta'],
  },
  subscapular: {
    body: 'The usual subscapular artery arises from distal axillary artery and divides into circumflex scapular and thoracodorsal branches.',
    study: 'A CTA study of 100 adults and 200 arterial systems found 25 without a common subscapular trunk; this is not a DSA detection rate.',
    citations: ['anatomy', 'variantCta'],
  },
  trunk: {
    body: 'The usual thoracoacromial trunk leaves the second axillary segment near pectoralis minor and branches across the anterior shoulder region.',
    study: 'Bonczar and colleagues described 15 branching patterns in CTA of 55 patients. A separate six-case, mixed-region refractory-pain report compared DCE-MRA with procedural DSA; neither study establishes normal DSA visibility or a universal branch map.',
    citations: ['anatomy', 'bonczar', 'pan'],
  },
  pectoral: {
    body: 'The pectoral branch arises from the thoracoacromial system and courses toward pectoralis major and minor in the anterior chest.',
    study: 'Reid and Taylor used dissection, ink injection and barium radiography in 60 fresh cadavers and 50 fixed specimens; these do not establish living pectoral-branch detection or perfusion.',
    citations: ['anatomy', 'reidTaylor'],
  },
  acromial: {
    body: 'The acromial branch extends from the thoracoacromial system toward the acromion; projected overlap cannot identify its origin.',
    study: 'Bonczar and colleagues described 15 branching patterns in CTA of 55 patients; these CTA observations are not catheter DSA branch detection.',
    citations: ['anatomy', 'bonczar'],
  },
  deltoid: {
    body: 'The deltoid branch extends from the thoracoacromial system toward deltoid, distinct from circumflex humeral arteries near the shoulder.',
    study: 'Hué and colleagues examined 40 injected cadaveric shoulders, including 15 radiographic observations; those observations do not show living branch perfusion.',
    citations: ['anatomy', 'hue'],
  },
} as const;

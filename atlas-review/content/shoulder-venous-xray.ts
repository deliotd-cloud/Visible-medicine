// Original teaching text; references are reading links, not imported images or data.
export const shoulderVenousXrayReferences = {
  axilla: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html',
  upperVenography: 'https://pubmed.ncbi.nlm.nih.gov/3304791/',
  dynamicAxillary: 'https://pubmed.ncbi.nlm.nih.gov/17398059/',
  scapularInjection: 'https://pubmed.ncbi.nlm.nih.gov/11428774/',
  notchDoppler: 'https://doi.org/10.3390/jcm7120491',
} as const;

export const shoulderVenousXrayTopics = {
  axillary: {
    body: 'The axillary vein usually forms from the brachial and basilic venous routes and becomes the subclavian vein at the lateral border of the first rib. Its relationship to the axillary artery changes along its course. A projected vessel course needs demonstrated venous filling before it can be assigned to this vein.',
    study: 'Andrews and colleagues reported 74 digital-subtraction venograms covering upper extremity and mediastinal examinations in 69 selected patients. A separate dynamic venography series examined axillary compression in six selected patients; neither establishes a normal appearance in every shoulder position.',
    citations: ['axilla', 'upperVenography', 'dynamicAxillary'],
  },
  suprascapularVein: {
    body: 'Use the suprascapular region as an orientation landmark for this source-labelled vein, keeping it distinct from the adjacent artery. A projected crossing does not establish its drainage recipient or the side-specific venous course.',
    study: 'Imanishi and colleagues examined the scapular cutaneous vascular network in five fresh cadavers after arterial and venous radiopaque injection. That preparation does not demonstrate this named vein as a lumen on a living venogram. A separate healthy-volunteer Doppler study concerns ultrasound visibility at the suprascapular notch, not X-ray visibility.',
    citations: ['scapularInjection', 'notchDoppler'],
  },
  medialBrachial: {
    body: 'The supplied medial brachial vein is one deep arm vein on each side, distinct from the superficial basilic vein. Its source surface is not the complete brachial-vein bundle; a projected meeting with another line cannot verify an individual junction.',
    study: 'The Andrews upper-extremity and mediastinal digital-subtraction series comprised 74 venograms in 69 selected patients. Its cohort size does not establish visibility, anatomy or patency of every medial brachial channel.',
    citations: ['axilla', 'upperVenography'],
  },
} as const;

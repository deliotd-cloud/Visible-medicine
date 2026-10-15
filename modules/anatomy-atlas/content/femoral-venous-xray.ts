// Original educational drafts. Citations are reading links, not imported media.
export const femoralVenousXrayTopics = {
  'femoral-vein': {
    title: 'Femoral vein · contrast X-ray orientation',
    body: 'The femoral vein is a deep thigh vein. On an acquired lower-limb venogram, follow only a demonstrated contrast-filled course; a retrospective study of 808 thrombus-free limb venograms documented duplicated femoral channels, so one surface is not a universal pattern.',
    bullets: [
      'The term “superficial femoral vein” is misleading: the femoral vein belongs to the deep venous system, unlike the great saphenous vein.',
      'Keep the femoral route separate from the deep femoral (profunda femoris) vein. The bilateral femoral selections do not define separate common-femoral and femoral segments.',
      'An apparent second line or crossing in a projection is not proof of a communicating channel. Confirm the actual course in the acquired images.',
    ],
    citations: [
      'https://www.radiologyinfo.org/en/info/venography',
      'https://pubmed.ncbi.nlm.nih.gov/12821771/',
      'https://pubmed.ncbi.nlm.nih.gov/7563535/',
    ],
  },
  'deep-femoral-vein': {
    title: 'Deep femoral vein · contrast X-ray orientation',
    body: 'The deep femoral (profunda femoris) vein is a separate deep-thigh drainage route that meets the proximal femoral venous system. An ascending and descending phlebography study of selected limbs with deep-venous incompetence described differing profunda anatomical patterns; its observations do not prescribe a single junction for this source.',
    bullets: [
      'Identify an opacified profunda segment on the acquired venogram before comparing it with the femoral vein. Projected overlap alone cannot establish their confluence.',
      'The bilateral profunda selections do not validate the complete tributaries, junction, valves or lumen. The atlas supplies no contrast filling or reflux or patency measurement.',
    ],
    citations: [
      'https://www.radiologyinfo.org/en/info/venography',
      'https://pubmed.ncbi.nlm.nih.gov/2313828/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC11764913/',
    ],
  },
  'great-saphenous-vein': {
    title: 'Great saphenous vein · contrast X-ray orientation',
    body: 'The great saphenous vein follows a superficial medial lower-limb route toward the femoral venous system. If an acquired contrast venogram demonstrates it, trace the filled segment rather than assuming its entire course is visible; a study comparing venography with operative findings in 50 bypass candidates found that venography could miss vein presence or continuity.',
    bullets: [
      'Keep this superficial route distinct from the femoral and deep femoral veins. A cadaveric study of 75 limbs found variation in tributaries at the saphenofemoral junction.',
      'The bilateral surfaces do not separately map that junction, valve leaflets or every perforator. An apparent contact in projection cannot establish a connection.',
    ],
    citations: [
      'https://www.radiologyinfo.org/en/info/venography',
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-lower-limb/',
      'https://pubmed.ncbi.nlm.nih.gov/3526935/',
      'https://pubmed.ncbi.nlm.nih.gov/37160721/',
    ],
  },
} as const;

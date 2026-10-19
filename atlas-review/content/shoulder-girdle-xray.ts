// Original teaching text; cited publications are reading context, not image assets.
export const shoulderGirdleXrayReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
  thyrocervicalCta: 'https://pubmed.ncbi.nlm.nih.gov/36350499/',
  dorsalScapularOrigins: 'https://pubmed.ncbi.nlm.nih.gov/26920558/',
  carotidCollateral: 'https://pubmed.ncbi.nlm.nih.gov/31429719/',
  suprascapularCase: 'https://pubmed.ncbi.nlm.nih.gov/21686592/',
} as const;

export const shoulderGirdleXrayTopics = {
  thyrocervical: {
    body: 'The thyrocervical trunk usually arises from the first subclavian segment and gives branches toward the lower neck and scapular region; its branch pattern can vary.',
    study: 'A retrospective CTA series screened 55 patients and analyzed 82 trunks in 41 patients aged 15 to 82. It describes branching variation, not a normal plain-film visibility rate.',
    citations: ['anatomy', 'thyrocervicalCta'],
  },
  costocervical: {
    body: 'The costocervical trunk is a separate subclavian branch directed toward the deep neck and upper thoracic wall. Its origin can vary by side; it should not be assigned from proximity to the thyrocervical trunk.',
    study: 'A DSA/CTA collateral study selected 16 patients with unilateral common carotid occlusion and patent ipsilateral internal and external carotid arteries. Costocervical participation there does not establish ordinary branch flow.',
    citations: ['anatomy', 'carotidCollateral'],
  },
  dorsalScapular: {
    body: 'The dorsal scapular artery commonly arises from the subclavian artery and runs toward the medial scapular border; an origin through the transverse cervical system also occurs.',
    study: 'Ikka and colleagues separately studied 50 fresh-cadaver dissections and 93 arteriographies from 47 patients, finding variable origins. These samples do not establish normal plain-film detection.',
    citations: ['anatomy', 'dorsalScapularOrigins'],
  },
  suprascapular: {
    body: 'The suprascapular artery usually branches from the thyrocervical trunk and travels toward the superior scapula, contributing to the scapular arterial network.',
    study: 'A single aneurysmal case showed direct subclavian origin on CTA and selective arteriography. It demonstrates a possible variant, not its frequency or normal visibility.',
    citations: ['anatomy', 'suprascapularCase'],
  },
} as const;

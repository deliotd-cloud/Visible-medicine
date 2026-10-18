// Original factual summaries; no source images, tables or patient data reproduced.
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const cta = 'https://www.radiologyinfo.org/en/info/angioct';
const variants = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8926423/';
export type ShoulderArterialCtGroup = 'anteriorHumeral' | 'posteriorHumeral' | 'scapular' | 'thoracodorsal';
export const shoulderArterialCtTopics: Record<ShoulderArterialCtGroup, { title: string; body: string; bullets: string[]; citations: string[] }> = {
  anteriorHumeral: {
    title: 'CT/CTA: orienting around the proximal humerus',
    body: 'Usually an axillary third-part branch, this artery joins the posterior circumflex humeral circulation near the surgical neck.',
    bullets: [
      'Use the assembled atlas to orient the selected surface beside the humerus. This selection is not a contrast-filled vessel or a patient-specific arterial map.',
      'The model cannot establish humeral-head perfusion, collateral adequacy or traumatic vascular injury. Its appearance is not evidence that a branch is visible on a particular CT study.',
    ],
    citations: [anatomy, cta],
  },
  posteriorHumeral: {
    title: 'CT/CTA: quadrangular-space orientation',
    body: 'Usually from the third axillary segment, this artery accompanies the axillary nerve through the quadrangular space.',
    bullets: [
      'Both official source components belong to one selected artery. A gap or overlap between surface components is not arterial discontinuity or an anastomosis demonstrated by CTA.',
      'This static surface does not simulate positional compression, nerve injury or arterial flow. Do not diagnose quadrangular-space disease from separation, colour or apparent narrowing in this atlas.',
    ],
    citations: [anatomy, cta],
  },
  scapular: {
    title: 'CT/CTA: distinguishing a reference branch from a variant',
    body: 'Usually a subscapular branch, the circumflex scapular artery participates in scapular connections with suprascapular and dorsal scapular arteries.',
    bullets: [
      'Barrett et al. reviewed 200 arterial systems on chest CTA. Some lacked a common subscapular trunk; circumflex scapular origins varied. Check the actual side rather than assuming the illustrated branching pattern.',
      'The atlas does not supply a patient-specific collateral map, measured pedicle or flap-planning study. Apparent mesh connections do not prove continuity or functional collateral supply.',
    ],
    citations: [anatomy, cta, variants],
  },
  thoracodorsal: {
    title: 'CT/CTA: proximal origin and distal-course limits',
    body: 'Usually a subscapular branch, this artery supplies latissimus dorsi and travels with the thoracodorsal nerve.',
    bullets: [
      'The CTA series by Barrett et al. found direct axillary origins when the subscapular trunk was absent. Distal thoracodorsal length was not consistently measurable because of its small, circuitous course and contrast limitations.',
      'Treat this surface as a named orientation aid, not a perforator inventory or surgical suitability assessment. Neither its scale nor its endpoints provide patient pedicle dimensions.',
    ],
    citations: [anatomy, cta, variants],
  },
};
export const shoulderArterialCtAcquisition = 'CTA acquires CT images during intravenous contrast passage. This atlas contains no such acquisition.';

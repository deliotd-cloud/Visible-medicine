// Original summaries of primary research; no figures, scan pixels or contours copied.
const cine = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3679544/';
const dissection = 'https://pubmed.ncbi.nlm.nih.gov/9290650/';
const note = 'Research-context teaching draft; revision-bound radiologist review pending. These reference surfaces do not identify a muscle in the open scan or establish patient-space registration. Atlas and imaging access remain independent.';

export const paratubalCtTopics = {
  levator: {
    body: 'Dedicated cine CT research labels levator veli palatini near the pharyngeal auditory tube. A separate cadaver dissection describes the muscle below, and approximately parallel to, the tube on its course toward the soft palate.',
    bullets: [
      'The CT study included ten participants and used tube-oriented dynamic acquisitions. Its illustrated structures are labelled on one side for clarity; this is not a bilateral segmentation accuracy study.',
      'Do not assume that routine head CT separates the complete muscle. The study does not validate the Atlas boundary or show contraction in a static scan.',
    ],
    citations: [cine, dissection], note,
  },
  tensor: {
    body: 'Tensor veli palatini is also labelled in the dedicated cine CT study. Cadaver dissection describes its axis as oblique to the auditory tube, a useful distinction from the approximately parallel levator.',
    bullets: [
      'This is research imaging of tubal ventilation, not a routine CT visibility standard. A labelled example does not establish a complete contour or reliable separation on every examination.',
      'The proposed sequence of muscle recruitment is a hypothesis. It is not a diagnostic test or patient-specific functional measurement provided by this model.',
    ],
    citations: [cine, dissection], note,
  },
} as const;

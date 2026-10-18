// Original anatomical orientation summaries. References are links only; no
// source images, measurements, figures, wording or scan data are imported.
export const thoracoacromialUltrasoundReferences = [
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC9649491/', // CTA trunk and branching variation
  'https://pubmed.ncbi.nlm.nih.gov/9706673/', // injected cadaver deltoid supply
  'https://pubmed.ncbi.nlm.nih.gov/15622236/', // sonography of pectoral branch only
  'https://pubmed.ncbi.nlm.nih.gov/24613440/', // cadaver ligament ultrasound limitation
] as const;

export const thoracoacromialUltrasoundFacts = {
  trunk: {
    body: 'The thoracoacromial trunk usually arises from the second part of the axillary artery near pectoralis minor. CTA describes a short trunk and variable branch origins. This relationship gives anatomic context for an ultrasound study, but the cited CTA does not establish routine sonographic visibility of the named trunk.',
    distinction: 'The trunk is the proximal common segment, distinct from its pectoral, deltoid and acromial branches. The source model does not prove that every branch arises directly from it in a patient.',
  },
  acromial: {
    body: 'An injected-cadaver study described the acromial branch deep to the anterior deltoid near the clavicle and acromion. This is an anatomic orientation for the named branch; the cited study did not test its identification on live ultrasound.',
    distinction: 'Keep the acromial course near the clavicle and acromion separate from the deltoid branch near the deltopectoral line. Branch origin and course can vary.',
  },
  deltoid: {
    body: 'An injected-cadaver study described a deltoid branch supplying the anterior deltoid near the deltopectoral line. This course is an anatomic reference, not evidence that the branch can be separately identified on routine live ultrasound.',
    distinction: 'The deltoid branch relates to the anterior deltoid and deltopectoral line; the acromial branch was described deeper near the clavicle and acromion. The two named branches should not be treated as one fixed vessel.',
  },
} as const;

export const thoracoacromialUltrasoundLimitations = [
  'Routine live-ultrasound visibility of the named trunk, acromial branch and deltoid branch is not established by these references. A pectoral-branch Doppler study cannot be extended to them; a cadaver ligament study also reported limited artery localization without Doppler.',
  'The Atlas surface is static source anatomy, not an acquired ultrasound image, flow measurement or patient-to-model registration. It establishes no individual vessel course, patency, diagnostic finding or procedural route.',
] as const;

export const commonInterosseousUsReference = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8630952/';
export const commonInterosseousUsGroups = { common: ['FMA22807', 'FMA22808'] } as const;
export type CommonInterosseousUsGroup = keyof typeof commonInterosseousUsGroups;
export const commonInterosseousUsTopics = {
  common: {
    body: 'High-resolution ultrasound with Doppler can identify the common interosseous origin from the proximal ulnar artery and its division into anterior and posterior interosseous arteries. Keep this short common segment distinct from either daughter artery and from the recurrent interosseous branch. The posterior interosseous trunk is not independently supplied in this atlas.',
  },
} as const;
export const commonInterosseousUsEvidenceLimit = 'The reference is a volunteer-image anatomical pictorial review, not a prospective diagnostic-accuracy study or validation of the source mesh.';

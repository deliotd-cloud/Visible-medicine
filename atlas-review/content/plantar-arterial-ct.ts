// Original orientation drafts; references are reading links, not reusable images.
export const plantarArterialCtGroups = {
  medial: ['FMA43929', 'FMA43930'],
  lateral: ['FMA43931', 'FMA43932'],
  arch: ['FMA43943', 'FMA43944'],
  deep: ['FMA69514', 'FMA69515'],
  superficial: ['FMA43937', 'FMA43938'],
} as const;
export type PlantarArterialCtGroup = keyof typeof plantarArterialCtGroups;
export const plantarArterialCtReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  arch: 'https://pubmed.ncbi.nlm.nih.gov/11694970/',
  deep: 'https://pubmed.ncbi.nlm.nih.gov/9787393/',
  cta: 'https://pubmed.ncbi.nlm.nih.gov/21611062/',
} as const;
export const sharedImaging = 'One CTA case illustrates plantar-arch reconstructions, not reliable individual-branch detection.';
type Topic = { body: string; bullets: string[]; references: (keyof typeof plantarArterialCtReferences)[] };
export const plantarArterialCtTopics: Record<PlantarArterialCtGroup, Topic> = {
  medial: {
    body: 'The medial plantar artery arises from posterior tibial and supplies the medial sole; it is distinct from the lateral plantar continuation.',
    bullets: ['On a future CTA comparison, identify the posterior tibial parent and medial-foot course before using this source label. The selected mesh does not certify a visible branch on that scan.'],
    references: ['anatomy'],
  },
  lateral: {
    body: 'The lateral plantar artery branches from posterior tibial and continues into the plantar arterial arch. Keep the parent and arch selections distinct.',
    bullets: ['Follow the actual acquired sections between these landmarks. An endpoint gap after separation is a display effect, not proof of occlusion or an absent connection.'],
    references: ['anatomy'],
  },
  arch: {
    body: 'Cadaveric work describes the deep plantar arch joining deep plantar and lateral plantar contributions, with variable relative contributions. This specimen is not a universal branching template.',
    bullets: ['This source-labelled arch encodes neither a complete circulation nor diagnostic accuracy; a single CTA case cannot validate it.'],
    references: ['arch'],
  },
  deep: {
    body: 'The deep plantar artery connects dorsalis pedis with the plantar arch through the first intermetatarsal space. A dissection series found it in 16 of 20 specimens, not universally.',
    bullets: ['Use the dorsal-to-plantar relationship as orientation only. This source cannot establish the branch in a particular patient or validate a bypass target, lumen or safe intervention route.'],
    references: ['deep'],
  },
  superficial: {
    body: 'This selection is the source-labelled superficial medial plantar branch, separate from its parent medial plantar selection. It is not the deep plantar artery.',
    bullets: ['CTA visibility of this individual branch is unproven. Do not equate a catalogue label with a confirmed scan finding.'],
    references: ['anatomy'],
  },
};

export const plantarArterialUsReference = 'https://doi.org/10.1590/1677-5449.200068';
export const plantarArterialUsGroups = {
  medial: ['FMA43929', 'FMA43930'], lateral: ['FMA43931', 'FMA43932'], arch: ['FMA43943', 'FMA43944'],
} as const;
export type PlantarArterialUsGroup = keyof typeof plantarArterialUsGroups;
// Original shortened orientation summaries of Takahashi et al. (2020), CC BY4.0.
export const plantarArterialUsTopics = {
  medial: {
    body: 'On duplex ultrasound, the posterior tibial division below the medial malleolus helps identify the medial plantar artery. Its medial-sole course points toward the great toe; distinguish this parent vessel from a superficial medial plantar branch.',
  },
  lateral: {
    body: 'The lateral plantar artery is the lateral branch of the posterior tibial division. Its course toward the fifth metatarsal base provides orientation before the plantar arch; keep the parent artery and arch selections distinct.',
  },
  arch: {
    body: 'The plantar arch can be oriented from the lateral plantar artery toward the first intermetatarsal space. In a plantar ultrasound view it lies deeper relative to the plantar fascia than the lateral plantar artery. This arch selection is not the separate deep plantar connecting artery.',
  },
} as const;
export const plantarArterialUsEvidenceLimit = 'The reference is an illustrated anatomy/technique review, not a prospective diagnostic-accuracy study or validation of these meshes.';

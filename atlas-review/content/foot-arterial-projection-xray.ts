// Original source-bound orientation drafts. Reading links convey no image rights.
export const footArterialProjectionXrayReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/schemes/leg_tables.html',
  calcification: 'https://pubmed.ncbi.nlm.nih.gov/20041296/',
  angiography: 'https://pubmed.ncbi.nlm.nih.gov/9810995/',
  arch: 'https://pubmed.ncbi.nlm.nih.gov/11694970/',
  deep: 'https://pubmed.ncbi.nlm.nih.gov/9787393/',
} as const;
export const footArterialProjectionXrayShared = [
  'Plain foot radiographs can show arterial-wall calcification; this is not a contrast-filled lumen examination or validation that this individual source-labelled branch is visible.',
  'For a future cleared contrast-angiography comparison, confirm the patient, side, projection and opacified channel. A static mesh cannot establish patency, arch completeness, collateral flow or a treatment target.',
] as const;
export const footArterialProjectionXrayTopics = {
  dorsal: {
    body: 'Use this dorsalis pedis selection as dorsal-foot orientation, distinct from its deep plantar connecting branch. A possible calcified outline on a plain film is not direct depiction of the arterial lumen.',
    references: ['anatomy', 'angiography'],
  },
  medial: {
    body: 'Keep the medial plantar parent selection separate from its source-labelled superficial branch and from the lateral plantar artery. The parent label does not identify every smaller channel on an acquired projection.',
    references: ['anatomy'],
  },
  lateral: {
    body: 'The lateral plantar selection provides context for the plantar arch. Separate the parent artery from the arch selection; an exploded gap between their surfaces is not an angiographic occlusion.',
    references: ['anatomy', 'arch'],
  },
  arch: {
    body: 'Cadaveric work describes variable deep plantar and lateral plantar contributions to the arch. Use this source-labelled surface for orientation, not as a universal complete pedal circulation or proof that an acquired angiogram shows the same configuration.',
    references: ['arch', 'angiography'],
  },
  deep: {
    body: 'The deep plantar connection passes between the dorsal system and plantar arch through the first intermetatarsal space. Its presence in this source is not proof of the corresponding channel in a patient or of radiographic branch visibility.',
    references: ['deep'],
  },
  superficial: {
    body: 'This source labels a superficial medial plantar branch, not the separate deep plantar connection from dorsalis pedis. Do not transfer that name to an indistinct vascular line on a plain film or infer an unseen connection.',
    references: ['anatomy', 'deep'],
  },
} as const;
export type FootArterialProjectionXrayGroup = keyof typeof footArterialProjectionXrayTopics;

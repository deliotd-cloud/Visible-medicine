// Original introductory teaching; no publisher image, table or patient data.
export const picaClinicalReferences = [
  'https://www.medsci.org/v17p3005.htm',
  'https://pubmed.ncbi.nlm.nih.gov/20557786/',
  'https://www.nhs.uk/conditions/stroke/symptoms/',
] as const;
export const picaClinicalTopics = {
  clinical: {
    title: 'Posterior circulation context',
    body: 'Lateral medullary syndrome may involve the vertebral artery or PICA; the syndrome alone does not identify an occluded PICA. Sudden imbalance, visual disturbance or other new neurological symptoms can accompany stroke. Suspected stroke requires emergency assessment: in the UK call 999, even if symptoms settle.',
    prompt: 'PICA origin and brainstem perforator contributions vary. Compare the represented side and neighbouring vertebral artery, but do not assign a variant or a supply territory from this surface.',
  },
  pathology: {
    title: 'Ischaemia and aneurysmal disease',
    body: 'PICA disease can cause ischaemic injury; PICA aneurysms can rupture with intracranial bleeding. Cerebellar infarction may produce swelling in the confined posterior fossa. These are distinct disease processes, not findings demonstrated by this reference model.',
    prompt: 'Gaps between the retained pieces are source fragmentation, not demonstrated occlusions. A normal-looking curve cannot exclude aneurysm, dissection or disease in an individual.',
  },
} as const;

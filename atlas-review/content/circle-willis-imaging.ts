// Original factual orientation; no reference prose, figures or patient images imported.
const anterior = 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html';
const posterior = 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html';
export const circleWillisRelationships = {
  acom: { body: 'The anterior communicating artery connects the paired anterior cerebral arteries. Use their meeting point to orient the assembled arterial model.', citations: [anterior] },
  aca: { body: 'The anterior cerebral artery arises from the internal carotid artery and supplies medial frontal and parietal regions. Orient this side against the paired anterior cerebral artery.', citations: [anterior] },
  pca: { body: 'The posterior cerebral arteries usually arise at the basilar bifurcation, but a carotid origin can occur. Their territory includes inferior temporal and occipital regions; the model shows selected source segments.', citations: [anterior, posterior] },
  pcom: { body: 'The posterior communicating artery links the internal carotid and posterior cerebral arteries. The paired communicating arteries can differ in size; an incomplete model does not establish an anatomical variant.', citations: [anterior] },
} as const;
export const circleWillisModalities = {
  ct: { title: 'CT angiographic orientation', body: 'Contrast-enhanced CT angiography depicts vessels. A noncontrast head CT is a different examination; this model contains neither.', bullets: ['CTA uses X-rays and intravenous contrast. The surface mesh provides orientation without CT attenuation or patient vessel detail.'], citations: ['https://www.radiologyinfo.org/en/info/angioct'] },
  mri: { title: 'MR angiographic orientation', body: 'Dedicated MR angiography depicts vessels and may use contrast or no contrast. Ordinary MRI and this mesh are not interchangeable with MRA.', bullets: ['Small vessels can be difficult to assess on MRA; motion and metal can limit images. The mesh supplies no MR signal or flow measurement.'], citations: ['https://www.radiologyinfo.org/en/info/angiomr'] },
} as const;

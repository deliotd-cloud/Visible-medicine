// Original short teaching; references are reading links, not imported assets.
export const cranialBoundaryTopics={
 tentorium:{
  clinical:{
   title:'Localise a lesion relative to the fold',
   body:'A tentorial lesion should be described by its attachment and its extension above, below or across the tentorium. A retrospective series of 32 operated tentorial meningiomas used CT and contrast MRI and distinguished lesions by their relationship to the free and peripheral tentorial edges.',
   bullets:['Use the selected fold as an orientation landmark, then assess the actual lesion and adjacent brain, vessels and venous drainage on patient imaging. This right-sided fragment does not map the complete tentorial notch or establish an operative corridor.'],
   citations:['https://link.springer.com/article/10.1186/s41983-021-00340-1'],
   credit:'Soffar et al. (2021), selected surgical case series. Not a population-frequency study or a treatment recommendation.',
  },
  pathology:{
   title:'Tentorial involvement: attachment is not enhancement',
   body:'Meningioma may arise at the tentorium or involve it from an adjacent site. In a retrospective MRI–surgery/pathology study of 31 posterior-fossa meningiomas, adjacent linear tentorial enhancement was not a reliable sign of tentorial involvement.',
   bullets:['Assess the lesion itself and its relationship to the dural fold; do not infer tentorial involvement from an enhancing line or from apparent contact with this reference surface alone. The cited historical series does not establish a current universal diagnostic rule.','No tumour, histology, enhancement or mass effect is represented by this model. An apparently absent margin may instead reflect incomplete source coverage.'],
   citations:['https://pubmed.ncbi.nlm.nih.gov/8636802/'],
   credit:'Helie et al. (1995), retrospective 31-case MRI–operative/pathological correlation; abstract consulted. Not all tumours in that cohort originated from the tentorium.',
  },
 },
 lamina:{
  clinical:{
   title:'Patient-specific anterior ventricular boundary',
   body:'The lamina terminalis is a useful anterior third-ventricular landmark, but one reference shape is not a patient-specific boundary. In a retrospective study of 160 adult MR examinations without ventricular pathology, its dimensions and angulation varied; angulation was associated with optic-chiasm position.',
   bullets:['Assess the lamina and neighbouring chiasm on the individual acquisition. Do not transfer the study averages or proposed angle classes to this mesh, infer the location of a nearby artery, or treat an exploded view as a safe operative route.','The cohort does not validate disease-specific appearances, hydrocephalus assessment, membrane patency or treatment. Pathology remains pending for appropriate structure-specific evidence.'],
   citations:['https://pubmed.ncbi.nlm.nih.gov/41952733/'],
   credit:'Hoz et al. (2026), retrospective radiological study; abstract consulted. No diagnostic thresholds or operative instructions reproduced.',
  },
 },
} as const;

// Original factual summaries and reference links; no publisher text or media imported.
const carotid='https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html';
const posterior='https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';
const variation='https://pubmed.ncbi.nlm.nih.gov/32166198/';

export const intracranialArterialXrayTopics={
  anteriorCerebral:{
    title:'ACA · Catheter angiographic orientation',
    body:'The ACA usually arises from the internal carotid artery and contributes to medial frontal and parietal supply. On an acquired angiogram, identify the selected side and its relationship to the opposite ACA through the anterior communicating artery.',
    bullets:[
      'Follow only the contrast-filled route demonstrated in the acquired projections. A crossing in one projection does not itself establish a junction or its depth.',
      'Source limit: A1/A2 segments, cortical branches and perforators are not separately selectable here. No arterial territory or lesion map is encoded in this selection.',
    ],citations:[carotid,catheter],
  },
  anteriorCommunicating:{
    title:'ACom · Catheter angiographic orientation',
    body:'The anterior communicating artery connects the paired ACAs. Compare this midline anatomical relationship with the connection actually demonstrated by an acquired contrast angiogram; a static donor surface cannot determine which way blood travels.',
    bullets:[
      'A retrospective DSA study of 274 angiography patients graded circle-of-Willis branches and found configuration varied with age. This referred cohort is not a normal-population prevalence estimate or a test of this donor model.',
      'Source limit: neither a complete donor circle nor collateral adequacy, flow direction or a patent lumen is established. Do not fill a source gap with an assumed communicating channel.',
    ],citations:[carotid,variation,catheter],
  },
  posteriorCerebral:{
    title:'PCA · Catheter angiographic orientation',
    body:'The PCA usually arises at the basilar termination; carotid-origin configurations also occur. Use the acquired angiogram to establish the demonstrated origin and side rather than assigning a variant from this grouped surface.',
    bullets:[
      'Distinguish the PCA route from the superior cerebellar artery and the posterior communicating connection by acquired continuity, not by projected overlap or the Atlas colour.',
      'Source limit: nine original parts remain one PCA selection. No independent segment labels, fetal-type configuration, lumen patency or perfusion territory is assigned to this donor.',
    ],citations:[carotid,posterior,catheter],
  },
  posteriorCommunicating:{
    title:'PCom · Catheter angiographic orientation',
    body:'The posterior communicating artery usually links the ipsilateral internal carotid and PCA routes. Its configuration varies; use an acquired angiographic examination to assess what is demonstrated, not the apparent thickness of the Atlas surface.',
    bullets:[
      'The 274-patient retrospective DSA study distinguished normal, hypoplastic and aplastic branches. Its classification is not a diagnosis of absence, occlusion or collateral function from an Atlas mesh or a single nonvisualized channel.',
      'Source limit: the selected surface establishes neither lumen patency nor the functional completeness of the circle of Willis. No flow or donor-specific variant is simulated.',
    ],citations:[carotid,variation,catheter],
  },
  middleCerebral:{
    title:'Right MCA · Catheter angiographic orientation',
    body:'The MCA usually arises from the internal carotid artery and distributes branches over the lateral cerebral surface. Use the acquired right-sided angiogram to follow the demonstrated branch pattern; the source group is not a complete arterial tree.',
    bullets:[
      'Check acquired side and continuity before naming a branch or projected bifurcation. This selection is not an M1/M2 segmentation or a perforator map.',
      'Source limit: three original PART-OF files form six components. Their gaps are retained; no left counterpart is reconstructed or mirrored from this right group. The separately sourced left MCA keeps its own teaching and identity.',
    ],citations:[carotid,catheter],
  },
  posteriorInferiorCerebellar:{
    title:'PICA · Catheter angiographic orientation',
    body:'PICA usually originates from the vertebral artery, with variation in its origin. Compare the acquired route around the medulla toward the inferior cerebellar surface with the selected side, without treating an archived gap as an occlusion.',
    bullets:[
      'Separate the demonstrated vertebral origin and cerebellar course from other posterior-circulation branches. Projection overlap alone cannot resolve the full three-dimensional relationship.',
      'Source limit: thirteen original files form fourteen components on each side. Disconnected pieces remain visible; neither a continuous lumen, complete perfusion territory nor patent junction is reconstructed.',
    ],citations:[posterior,catheter],
  },
  superiorCerebellar:{
    title:'SCA · Catheter angiographic orientation',
    body:'The superior cerebellar artery usually arises from the basilar artery near the pons–midbrain junction and contributes to superior cerebellar supply. Distinguish its demonstrated acquired course from the PCA route above it.',
    bullets:[
      'Use the acquired projections to establish the branch relationship. Apparent source proximity does not prove an open origin or patient-specific continuity.',
      'Source limit: a small proximal portion crosses the source midline. Source laterality is retained without reflection, repositioning or fitting; the named side does not certify a patient-space vessel path.',
    ],citations:[posterior,catheter],
  },
} as const;

export type IntracranialArterialXrayGroup=keyof typeof intracranialArterialXrayTopics;

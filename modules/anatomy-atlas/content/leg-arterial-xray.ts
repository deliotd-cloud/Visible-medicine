// Original educational drafts. Reading links confer no rights to article media.
const lowerLimbAnatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/';
const catheterAngiography='https://www.radiologyinfo.org/en/info/angiocath';
const kim='https://pubmed.ncbi.nlm.nih.gov/2589890/';
const kil='https://pubmed.ncbi.nlm.nih.gov/18982387/';
const genicularDsa='https://pubmed.ncbi.nlm.nih.gov/40640408/';
const grady='https://pubmed.ncbi.nlm.nih.gov/34657976/';
const middleCadavers='https://pubmed.ncbi.nlm.nih.gov/26130286/';

export const legArterialXrayTopics={
  'popliteal-artery':{
    title:'Popliteal arterial angiographic orientation',
    body:'On an acquired contrast catheter angiogram, locate the opacified popliteal artery behind the knee before tracing a demonstrated distal division. Its position is a regional landmark, not proof that the source surface shows a complete branching tree.',
    bullets:[
      'Kim and colleagues assessed popliteal branching in 605 of 1,000 femoral arteriograms; Kil and Jung studied 1,242 lower-extremity DSA examinations. Both documented variant distal branching, so identify the actual divisions in each examination.',
      'A crossing source surface cannot establish the anterior tibial origin, tibial-peroneal trunk or a continuous lumen in this selection.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,kim,kil],
  },
  'anterior-tibial-artery':{
    title:'Anterior tibial angiographic orientation',
    body:'When contrast images show a vessel passing from the popliteal region toward the anterior leg, use its demonstrated course to consider the anterior tibial artery. Separate that candidate from the posterior tibial route before naming a branch.',
    bullets:[
      'Kil and Jung observed variable anterior tibial origins and underdevelopment in their selected DSA series. A presumed first branch is not enough to identify this artery in another study.',
      'The selected source segment does not establish its exact popliteal origin, complete distal course or a junction with another retained surface.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,kil,kim],
  },
  'posterior-tibial-artery':{
    title:'Posterior tibial angiographic orientation',
    body:'On an acquired contrast study, distinguish a posterior tibial candidate along the posterior lower leg from the anterior tibial route. Follow actual filling toward the distal leg before assigning a named continuation.',
    bullets:[
      'Kim and colleagues found variant tibial patterns among assessable arteriograms, and Kil and Jung recorded posterior tibial variants in DSA. Neither makes a single proximal origin universal.',
      'This retained segment does not validate a tibial-peroneal junction, continuous distal lumen or matching anatomy on the opposite side.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,kim,kil],
  },
  'medial-superior-genicular-artery':{
    title:'Superior medial genicular angiographic orientation',
    body:'In contrast knee angiography, use a demonstrated branch directed toward the upper medial knee as a candidate superior medial genicular artery. Distinguish it from the inferior medial branch by level rather than by a projected crossing.',
    bullets:[
      'A selected osteoarthritis embolization DSA series reported variable genicular connections; cadaver and angiographic comparison also found shared superior medial and middle genicular origins. Neither establishes an origin or connection here.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,genicularDsa,grady],
  },
  'lateral-superior-genicular-artery':{
    title:'Superior lateral genicular angiographic orientation',
    body:'On a contrast knee study, orient an opacified upper lateral genicular branch relative to the lower lateral branch. Trace a visible origin before calling it the superior lateral genicular artery.',
    bullets:[
      'The selected osteoarthritis DSA cohort described lateral genicular connections; a cadaveric middle-genicular study found more than one origin pattern involving the superior lateral branch. These findings do not certify this source group’s junctions.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,genicularDsa,middleCadavers],
  },
  'inferior-medial-genicular-artery':{
    title:'Inferior medial genicular angiographic orientation',
    body:'In acquired contrast images, look for a demonstrated lower medial knee branch and distinguish it from the superior medial genicular artery. Its name gives an orientation cue, not a proven connection to the other displayed groups.',
    bullets:[
      'Connections involving the inferior medial branch were observed in a selected osteoarthritis embolization DSA cohort. That cohort does not establish a complete network or supply territory for this source selection.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,genicularDsa],
  },
  'inferior-lateral-genicular-artery':{
    title:'Inferior lateral genicular angiographic orientation',
    body:'On contrast knee angiography, use the lower lateral position to distinguish an inferior lateral genicular candidate from the superior lateral branch. Confirm the opacified branch itself before assigning the name.',
    bullets:[
      'The selected osteoarthritis DSA series showed variable connections involving this lower lateral branch and neighboring vessels. Projected proximity in the reference model cannot identify any one of those connections.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,genicularDsa],
  },
  'middle-genicular-artery':{
    title:'Middle genicular angiographic orientation',
    body:'A middle genicular candidate is sought posteriorly near the central knee on an acquired contrast study. Compare it with the superior medial and superior lateral branches by following a demonstrated origin, not a source-surface intersection.',
    bullets:[
      'Cadaveric dissection with injected-cadaver CT angiography found variable middle genicular origins and passage toward the posterior capsule; those observations are not live DSA of this source.',
      'Each retained middle-genicular group has two disconnected components. They are not two validated branches, and no junction between them is supplied.',
    ],citations:[lowerLimbAnatomy,catheterAngiography,middleCadavers,grady],
  },
} as const;

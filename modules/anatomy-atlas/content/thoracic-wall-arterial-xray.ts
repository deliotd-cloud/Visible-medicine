// Original factual orientation notes; reading references are not image licences.
const anatomy = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-thorax/';
const dissection = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4583587/';
const angiography = 'https://www.radiologyinfo.org/en/info/angiocath';
const collateralStudy = 'https://doi.org/10.1148/radiol.2423060220';

export const thoracicWallArterialXrayTopics = {
  'internal-thoracic-artery': {
    title: 'Internal thoracic angiographic orientation',
    body: 'The internal thoracic artery, also called the internal mammary artery, usually descends from the subclavian artery behind the anterior costal cartilages beside the sternum. On contrast X-ray angiography, follow the opacified vessel on the correct side before identifying any demonstrated distal branches.',
    bullets: [
      'The usual terminal routes are the superior epigastric artery toward the upper abdominal wall and the musculophrenic artery along the costal margin. A dissection study of 50 donors found variation in origins and terminal branching; its findings do not certify this donor surface or a patient angiogram.',
      'An acquired internal mammary graft angiogram depicts a surgically altered route. This native atlas segment is not a bypass graft, and its shape cannot establish graft patency, stenosis or a coronary anastomosis.',
    ],
    citations: [anatomy, dissection, angiography],
  },
  'musculophrenic-artery': {
    title: 'Musculophrenic angiographic orientation',
    body: 'The musculophrenic artery usually branches from the distal internal thoracic artery and turns along the costal margin toward the diaphragm. On an acquired contrast X-ray angiogram, distinguish a demonstrated lateral diaphragmatic route from the superior epigastric continuation into the upper abdominal wall.',
    bullets: [
      'Digital subtraction angiography (DSA) in a selected series of 97 patients with hepatocellular carcinoma demonstrated musculophrenic tumour feeders. These disease-selected observations are not a normal visibility rate or proof of a feeder in this model.',
      'Do not confuse this branch with the pericardiacophrenic or inferior phrenic artery. A projected crossing, absent contrast on one image or a separated atlas surface does not establish a connection, occlusion or treatment route.',
    ],
    citations: [anatomy, dissection, angiography, collateralStudy],
  },
  'superior-epigastric-artery': {
    title: 'Superior epigastric angiographic orientation',
    body: 'The superior epigastric artery is the usual downward continuation of the internal thoracic artery into the upper anterior abdominal wall and rectus region. On an acquired contrast X-ray angiogram, distinguish this route from the musculophrenic branch turning along the costal margin.',
    bullets: [
      'Digital subtraction angiography (DSA) in a selected series of 97 patients with hepatocellular carcinoma also demonstrated superior epigastric tumour feeders. That pathological collateral supply does not describe every normal examination or establish a feeder in this separate donor surface.',
      'This is not the inferior or superficial epigastric artery. The source retains thorax and abdomen membership, but its end points do not verify a patent anastomosis with the inferior epigastric artery or a complete perforator tree.',
    ],
    citations: [anatomy, dissection, angiography, collateralStudy],
  },
} as const;

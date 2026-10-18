// Original orientation teaching. References are reading links, not reusable media.
const arteries = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-thorax/';
const aorticEus = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4445183/';
const mediastinalEus = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4857566/';
const pleuralEus = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5592756/';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html';

export const thoracicMediastinalUltrasoundTopics = {
  'bronchial-artery': {
    title: 'Bronchial arterial EUS orientation',
    body: 'Bronchial arteries are systemic vessels supplying the lower trachea and bronchial tree. A published transoesophageal endoscopic ultrasound (EUS) illustration shows a bronchial artery entering the aortopulmonary window from beneath the aortic arch. That example gives a relationship to learn, not a promise that every bronchial artery can be seen in a routine examination.',
    bullets: [
      'Use the arch, descending aorta and left pulmonary artery as regional context. The illustrated vessel is one observed branch; neither its course nor this selected Atlas surface establishes the origin or number of branches in another person.',
      'This is an internal oesophageal ultrasound perspective, distinct from scanning through the chest wall. A visible aorta or a colour-coded model branch alone cannot establish a patent junction, arterial identity or flow in a patient.',
    ],
    citations: [arteries, mediastinalEus, aorticEus],
  },
  'variant-bronchial-artery': {
    title: 'Variant-labelled bronchial arterial EUS orientation',
    body: 'This retained source selection is labelled variant bronchial artery (FMA10704) and also carries the bronchial-branch-of-aortic-arch alias FMA14177. A transoesophageal EUS teaching image depicts a bronchial artery arising below the arch and entering the aortopulmonary window, showing why an arch-adjacent branch is a useful orientation example. It does not verify the exact connection of this Atlas component.',
    bullets: [
      'Keep the variant label and alias with this one selection; do not count the alias as another artery or treat the illustrated origin as a universal pattern.',
      'The EUS publication illustrates an individual branch, not a normal detection rate or a validation of this donor geometry. A complete acquired study would be needed to establish a particular patient vessel and its course.',
      'Chest-wall ultrasound and transoesophageal EUS have different windows. Apparent model contact with the arch does not supply a patient-space registration or a procedural route.',
    ],
    citations: [mediastinalEus, arteries, aorticEus],
  },
  'esophageal-artery': {
    title: 'Oesophageal arterial EUS orientation',
    body: 'The thoracic oesophagus receives small arterial branches from the descending thoracic aorta, with additional lower supply from the left gastric artery. Transoesophageal EUS can show the aorta as a major landmark, but its visibility does not establish that this individual source-labelled oesophageal artery will be resolved or identified in a routine scan.',
    bullets: [
      'The aortic EUS technique article addresses the aorta and selected first-order branches; it does not provide a routine normal visibility rate for each small oesophageal feeder.',
      'The source surface is an anatomical teaching selection, not a Doppler result. Do not infer a patient artery, calibre, patency, bleeding site or complete arterial supply from its colour or apparent contact with the aorta.',
      'This orientation concerns an internal transoesophageal view. A transthoracic or chest-wall window should not be assumed to provide the same view of a small mediastinal branch.',
    ],
    citations: [arteries, aorticEus],
  },
  'set-of-oesophageal-branches-of-thoracic-aorta': {
    title: 'Grouped thoracic-aortic oesophageal branches on EUS',
    body: 'This source label denotes a set of oesophageal branches of the thoracic aorta, retained as a group rather than split into invented named vessels. The descending aorta is a useful transoesophageal EUS landmark. Seeing that parent vessel does not mean its small oesophageal branches are separately visible or countable.',
    bullets: [
      'The anatomy table describes aortic oesophageal branches and additional lower supply from the left gastric artery; the group label cannot represent the entire oesophageal arterial network.',
      'The aortic EUS article is a landmark and selected-branch technique account, not a normal sensitivity study for this grouped set. It cannot validate the number, endings or continuity of these donor surfaces.',
      'Do not assign a branch seen in a patient to an individual member of this group from Atlas shape alone. Chest-wall ultrasound has a different acoustic route from transoesophageal EUS.',
    ],
    citations: [arteries, aorticEus],
  },
  'hemiazygos-vein': {
    title: 'Hemiazygos venous EUS orientation',
    body: 'The hemiazygos vein belongs to the variable azygos drainage system on the left side of the lower thorax. A transoesophageal EUS pleural anatomy account describes it beyond the aorta near the lower oesophagus, with the pulmonary ligament between the two in its illustrated view. This is a landmark example, not a measured rate of normal vein detection.',
    bullets: [
      'The venous anatomy table places the hemiazygos drainage into the azygos vein and notes variation in the levels drained. Keep it distinct from the accessory hemiazygos and oesophageal veins.',
      'The EUS account concerns pleural examination and includes views influenced by effusion. It does not establish that this entire vein or its crossover is routinely visible in an unaffected person.',
      'This is an internal oesophageal window, not a chest-wall scan. Model colour and apparent continuity cannot establish patient venous flow, patency or an exact junction.',
    ],
    citations: [veins, pleuralEus],
  },
} as const;

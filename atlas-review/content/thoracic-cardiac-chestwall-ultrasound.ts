// Original factual prose. Linked publications supply evidence, not media rights.
const thoracicArteries = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-thorax/';
const thoracicVeins = 'https://anatomy.ttuhscep.edu/cardiovascular_system/sup_med_tables.html';
const cardiacVeins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html';
const parentVesselUltrasound = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4255330/';

export const thoracicCardiacChestwallUltrasoundTopics = {
  'anterior-cardiac-vein': {
    title: 'Anterior cardiac veins: an anatomical group, not an echo count',
    body: 'The anterior cardiac veins drain the anterior right ventricle directly into the right atrium, separately from veins entering the coronary sinus. Orient the retained group on the right-ventricular surface; its source components do not establish distinct, individually named veins or their patent connections in a person.',
    bullets: [
      'The thoracic anatomy table describes these veins crossing superficial to the right coronary artery. That neighbour is an anatomical distinction, not an ultrasound identification rule or a statement about screen-side position.',
      'Reports of targeted great or middle cardiac vein echocardiography concern other veins. They do not establish routine visibility, a detection sensitivity, or a complete lumen map for the anterior cardiac vein group.',
      'A missing small venous signal on an acquired study cannot be read as absence of the anatomical group from this teaching model.',
    ],
    citations: [cardiacVeins, 'https://anatomy.ttuhscep.edu/cardiovascular_system/heart_tables.html', 'https://ifaa.unifr.ch/Public/TNAEntryPage/auto/part/LAEN/TAH40728%20P3%20EN.htm'],
  },
  'left-musculophrenic-artery': {
    title: 'Left musculophrenic artery at the internal thoracic bifurcation',
    body: 'The left musculophrenic artery is the lower, lateral terminal branch of the left internal thoracic artery; the superior epigastric artery is the other terminal branch. Its anatomical course toward the anterior diaphragm and lower anterior intercostal spaces gives orientation in the model, without assigning a sonographic screen side.',
    bullets: [
      'A published ultrasound communication describes recognition of the internal thoracic artery and adjacent veins near the sternum. That observation concerns the parent vessels, not a demonstrated detection rate for the smaller left musculophrenic branch.',
      'The artery and its neighbouring venous drainage are different structures. A visible parent artery alone does not confirm the branch, its full course, or a matching vein.',
      'No normal visibility, sensitivity, flow measurement or patient-specific correspondence is inferred for this retained branch.',
    ],
    citations: [thoracicArteries, parentVesselUltrasound, thoracicVeins],
  },
  'right-musculophrenic-artery': {
    title: 'Right musculophrenic artery at the internal thoracic bifurcation',
    body: 'The right musculophrenic artery branches from the right internal thoracic artery beside its superior epigastric terminal branch. It supplies the anterior diaphragm and lower anterior intercostal region; right here names the anatomical side, not a fixed position on an ultrasound display.',
    bullets: [
      'The internal thoracic artery has been described with ultrasound along the anterior chest wall. This parent-vessel observation does not show that the smaller right musculophrenic artery is routinely identifiable.',
      'Keep the arterial branch distinct from the associated musculophrenic vein and from the superior epigastric branch when reading the model.',
      'The cited anatomy does not supply an ultrasound sensitivity, normal flow range, or reliable full-course trace for this branch.',
    ],
    citations: [thoracicArteries, parentVesselUltrasound, thoracicVeins],
  },
  'left-musculophrenic-vein': {
    title: 'Left musculophrenic vein and internal thoracic drainage',
    body: 'The left musculophrenic vein belongs to the lower anterior chest-wall drainage that joins the left internal thoracic venous pathway with the superior epigastric vein. This venous relationship orients the named structure in the model; it does not prove a specific junction or lumen in an acquired image.',
    bullets: [
      'The internal thoracic veins have been described on ultrasound near the sternum. Their reported visibility cannot be transferred to the smaller left musculophrenic vein.',
      'Distinguish a putative venous branch from the left musculophrenic artery and from the parent internal thoracic vessels; their proximity alone does not identify the branch.',
      'No routine detection rate, absence rule, normal velocity or patient-space match is established for this vein.',
    ],
    citations: [thoracicVeins, parentVesselUltrasound],
  },
  'right-musculophrenic-vein': {
    title: 'Right musculophrenic vein and internal thoracic drainage',
    body: 'The right musculophrenic vein contributes to the right internal thoracic venous pathway alongside the superior epigastric vein. Use the side and drainage relationship for anatomical orientation only; image left and right depend on the acquired view.',
    bullets: [
      'Published ultrasound observations concern the internal thoracic parent veins, not a measured ability to find the right musculophrenic vein routinely.',
      'The nearby right musculophrenic artery is a separate branch of the internal thoracic artery. Seeing either parent vessel does not certify the smaller named venous branch or its complete course.',
      'No normal visibility, sensitivity, flow value or patient-specific venous connection is inferred from these sources.',
    ],
    citations: [thoracicVeins, parentVesselUltrasound],
  },
} as const;

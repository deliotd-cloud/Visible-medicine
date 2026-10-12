// Original factual prose. Linked publications supply evidence, not media rights.
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html';

export const cardiacVenousUltrasoundTopics = {
  'great-cardiac-vein': {
    title: 'Great cardiac vein in targeted Doppler echocardiography',
    body: 'The great cardiac vein accompanies the anterior interventricular artery and joins the coronary-sinus pathway. Use that anatomical relationship to distinguish the venous target from its neighbouring artery; the reference surface is not an ultrasound image or a measured flow signal.',
    bullets: [
      'Watanabe and colleagues reported clear great cardiac vein Doppler envelopes in 21 of 23 human volunteers using targeted transthoracic Doppler echocardiography. This selected study does not guarantee visibility on a routine examination or establish a population-wide detection rate.',
      'The study compared pulsed Doppler with a Doppler guide wire experimentally in open-chest dogs. That experimental validation is separate from the human feasibility observations; it must not be presented as invasive validation in those volunteers.',
      'The indexed abstract does not specify the human acquisition plane. No transducer position, insonation angle, normal velocity range, diagnostic threshold or patient-specific acquisition protocol is inferred here.',
    ],
    citations: [anatomy, 'https://pubmed.ncbi.nlm.nih.gov/11875389/'],
  },
  'middle-cardiac-vein': {
    title: 'Middle cardiac vein as a selective adult TEE landmark',
    body: 'The middle cardiac vein accompanies the posterior interventricular artery and drains to the coronary sinus. Keep it distinct from that artery and from the great cardiac vein when comparing the assembled model with an acquired echocardiographic study.',
    bullets: [
      'Labriola and colleagues described possible visualization of the middle cardiac vein as a landmark for coronary sinus identification in a modified bicaval transesophageal echocardiography (TEE) view. This supports selective adult intraoperative landmark visibility, not depiction of the entire venous course.',
      'The report involved 70 cardiac surgical patients, not a healthy-volunteer screening cohort. Its coronary sinus and catheter success percentages are not middle cardiac vein detection rates; it supplies no separate visibility percentage for this vein or routine transthoracic guarantee.',
      'The retained selection has 14 source components, not 14 individually named veins. A TEE landmark does not validate their connectivity, the complete lumen or a safe catheter route. No catheter-placement instructions or procedural simulation are provided.',
    ],
    citations: [anatomy, 'https://pubmed.ncbi.nlm.nih.gov/26009286/', 'https://doi.org/10.1053/j.jvca.2015.01.035'],
  },
} as const;

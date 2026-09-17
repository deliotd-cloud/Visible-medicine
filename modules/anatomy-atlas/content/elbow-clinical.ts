// Original concise teaching; no case details, figures, scans or procedures.
export const elbowClinicalReferences = [
  'https://doi.org/10.1007/s11678-022-00686-9',
  'https://doi.org/10.23750/abm.v91i14-S.8507',
  'https://creativecommons.org/licenses/by/4.0/',
] as const;

export const elbowClinicalCredit = 'Clinical context adapted from Habarta J et al. (2022), traumatic elbow dislocation with brachial artery disruption, and Goretti C et al. (2020), brachial injury accompanying closed elbow dislocation. Both articles: CC BY 4.0; original abbreviated teaching, no endorsement. No publication media, patient cases or treatment protocols included.';

export const elbowClinicalTopics = {
  inferiorUlnarCollateral: {
    clinical: {
      title: 'Brachial contribution to the medial elbow',
      body: 'Identify this brachial branch separately from the anterior ulnar recurrent artery. Their usual communication links an arm-side collateral with a forearm-side recurrent route. This comparison is useful when orienting to medial elbow trauma; neither a visible branch nor a conceptual connection establishes distal perfusion.',
      prompt: 'Compare the two named ends in Arterial connections. Can you distinguish their different parents without treating the connecting guide as a measured lumen?',
    },
    pathology: {
      title: 'Collateral injury alongside main-vessel injury',
      body: 'An elbow injury can damage the brachial artery and surrounding collateral pathways together. The inferior ulnar collateral and anterior ulnar recurrent relationship illustrates why an alternative route must not be assumed intact merely because it is named in an atlas.',
      prompt: 'A separated or hidden model segment is not a torn artery. Confirm suspected injury and actual downstream perfusion using clinical and acquired imaging evidence, not this display.',
    },
  },
  superiorUlnarCollateral: {
    clinical: {
      title: 'Medial neurovascular neighbourhood',
      body: 'The superior ulnar collateral belongs to the brachial system and accompanies the ulnar nerve. Its typical partner is the posterior ulnar recurrent artery. Keep the arterial route and the neighbouring nerve conceptually separate when reviewing medial elbow anatomy.',
      prompt: 'Which finding would describe a vessel and which would describe a nerve? The selected arterial surface supplies no nerve examination or nerve-path measurement.',
    },
    pathology: {
      title: 'Vascular and neurological findings are different',
      body: 'In medial elbow trauma, evidence about an adjacent nerve is not a test of arterial integrity. Likewise, identifying this collateral cannot exclude a brachial injury. Vascular and neurological findings should remain separately described rather than inferred from a shared anatomical neighbourhood.',
      prompt: 'The atlas does not diagnose ulnar neuropathy, arterial rupture or ischaemia. Its source label is an anatomical identity, not a patient finding.',
    },
  },
  radialCollateral: {
    clinical: {
      title: 'Deep-brachial route on the lateral side',
      body: 'This collateral comes from the deep brachial system, not directly from the radial artery. Its radial-nerve neighbourhood and usual communication with the radial recurrent artery help distinguish the arm-side route from the forearm-side route.',
      prompt: 'Use the parent label as well as the name: radial collateral and radial recurrent are not synonyms. Separation changes their display positions, not their parentage.',
    },
    pathology: {
      title: 'An upstream route is not a perfusion guarantee',
      body: 'A lateral collateral pathway does not establish that the main brachial artery is intact after elbow trauma. Residual distal flow can coexist with important arterial damage. Reviewing this branch is an orientation task, not a way to rule out upstream injury.',
      prompt: 'Do not score a patent collateral from the presence or colour of this mesh. Vessel continuity, lumen and downstream perfusion require patient-specific evidence.',
    },
  },
  middleCollateral: {
    clinical: {
      title: 'Posterior elbow network comparison',
      body: 'Compare the middle collateral, another deep-brachial branch, with the interosseous recurrent route. This is a different named communication from the radial collateral–radial recurrent pair. Rotating the reference anatomy helps distinguish the posterior network without inventing an extra connection.',
      prompt: 'Find its conceptual partner before selecting the radial collateral. A similar parent does not make two named branches interchangeable.',
    },
    pathology: {
      title: 'A partial network cannot establish protection',
      body: 'The posterior elbow route is part of a wider arterial network. An incomplete set of visible surfaces cannot show whether that network remains functional after trauma, or whether a local injury has also disrupted collateral supply.',
      prompt: 'A source gap is not an occlusion and a touching surface is not an anastomosis. No injury simulation, collateral reserve or protective territory is calculated.',
    },
  },
  radialRecurrent: {
    clinical: {
      title: 'Forearm-to-elbow recurrent route',
      body: 'The radial recurrent artery is the forearm-side route ascending towards the lateral elbow. Compare its usual radial parent with the deep-brachial parent of the radial collateral. The word recurrent describes the anatomical course, not reverse flow measured in a patient.',
      prompt: 'Which part of the route is being named: the parent vessel or its returning branch? Do not infer Doppler direction from the model orientation.',
    },
    pathology: {
      title: 'A distal pulse does not exclude arterial injury',
      body: 'Residual collateral circulation can complicate recognition of brachial arterial injury after elbow trauma. A palpable distal radial pulse does not by itself exclude arterial damage; identifying the radial recurrent artery in this atlas provides no equivalent clinical evidence.',
      prompt: 'A radial pulse is not a direct test of this particular recurrent branch. No pulse, Doppler signal or angiographic filling is generated by selecting it.',
    },
  },
  anteriorUlnarRecurrent: {
    clinical: {
      title: 'Anterior recurrent versus collateral identity',
      body: 'This recurrent route belongs to the ulnar system and is compared with the inferior ulnar collateral. Distinguish it from the posterior ulnar recurrent selection even where a shared origin may occur. Naming two branches does not establish two independent inflow sources.',
      prompt: 'Use the same-side identity and parent comparison in either the forearm or upper-arm workspace; a regional tab does not change the source vessel.',
    },
    pathology: {
      title: 'An apparent alternative route may also be injured',
      body: 'The anterior recurrent–inferior collateral pathway should not be treated as a guaranteed bypass around elbow injury. Damage can involve both the main brachial route and its surrounding network. The clinical question is which pathways actually remain intact, not how many branches are displayed.',
      prompt: 'Hiding the brachial artery does not test compensation. This view has no perfusion calculation, injury grading or reconstructed postoperative circulation.',
    },
  },
  posteriorUlnarRecurrent: {
    clinical: {
      title: 'Posterior member of the medial recurrent pair',
      body: 'Compare this ulnar-system branch with the superior ulnar collateral, rather than substituting the anterior recurrent partner. The anterior and posterior labels distinguish routes around the elbow; they do not establish source completeness or patient-specific branching symmetry.',
      prompt: 'Compare both recurrent selections on one side before switching sides. The left and right models are separate identities, not proof of identical branching in a patient.',
    },
    pathology: {
      title: 'Patency and vessel absence are separate questions',
      body: 'A posterior recurrent branch that is not visible in a reference view cannot be labelled thrombosed or absent in a patient. After elbow trauma, assessment of arterial injury depends on clinical findings and acquired vascular evidence, including the wider inflow and collateral network.',
      prompt: 'Check visibility, selection and source coverage before interpreting the illustration. Restoring a hidden structure is a display operation, not restoration of blood flow.',
    },
  },
} as const;

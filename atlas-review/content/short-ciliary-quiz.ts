// Original questions. Sources support facts, not reuse of publisher text/media.
const hamel='https://pubmed.ncbi.nlm.nih.gov/23076729/';
const zhou='https://www.jstage.jst.go.jp/article/ofaj/94/3/94_119/_pdf';
const dissector='https://anatomy.ttuhscep.edu/schemes/eye_ans.html';
const source='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html';
export const shortCiliaryQuizQuestions = [
  {
    key:'mixed-fibres',
    body:'Which description best fits the usual fibre content of short ciliary nerves?',
    choices:['Parasympathetic fibres only','Sympathetic fibres only','Parasympathetic, sympathetic and sensory fibres','Somatic motor fibres to the rectus muscles only'],
    correctAnswer:'Parasympathetic, sympathetic and sensory fibres',
    explanation:'These nerves carry mixed fibre types. The parasympathetic component has already relayed in the ciliary ganglion. A coloured source surface does not identify those fibres or demonstrate their physiological activity.',
    references:[hamel,dissector],
  },
  {
    key:'sensory-synapse',
    body:'How do sensory fibres arriving from the nasociliary nerve relate to the ciliary ganglion?',
    choices:['They all become parasympathetic fibres','They traverse the ganglion without a synapse there','They supply lateral rectus as somatic motor fibres','They must synapse there before reaching the eye'],
    correctAnswer:'They traverse the ganglion without a synapse there',
    explanation:'The usual parasympathetic relay must not be applied to the sensory connection. Preganglionic parasympathetic fibres arriving through the oculomotor route synapse in the ganglion; sensory fibres pass through. Mesh contact cannot demonstrate either a synapse or fibre continuity.',
    references:[dissector,zhou],
  },
  {
    key:'accommodation',
    body:'Which action is associated with the parasympathetic pathway carried in short ciliary nerves?',
    choices:['Ciliary muscle contraction reduces zonular tension for accommodation','Ciliary muscle contraction tightens the zonular fibres','Direct somatic motor supply to lateral rectus','Pupillary constriction through the trochlear nerve'],
    correctAnswer:'Ciliary muscle contraction reduces zonular tension for accommodation',
    explanation:'The pathway reaches ciliary muscle as well as the pupillary sphincter. Ciliary muscle contraction relaxes the zonular pull during accommodation. This static model does not measure lens shape, accommodation or pupil responses.',
    references:[zhou],
  },
  {
    key:'source-components',
    body:'Each retained short-ciliary source file has two topological components. What can be concluded from that alone?',
    choices:['Every person has exactly two short ciliary nerves per eye','Each component has one exclusive fibre type','The files establish a complete intact autonomic circuit','Mesh separation alone does not establish an individual nerve count'],
    correctAnswer:'Mesh separation alone does not establish an individual nerve count',
    explanation:'Connected components describe the mesh, not validated individual nerves. Human dissection reports variable efferents; that does not validate this model. Keep the single unsided FMA7041 group and its display-side parts distinct from separately reviewed anatomical identities.',
    references:[hamel,source],
  },
] as const;

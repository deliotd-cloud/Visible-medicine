import type { NestedConcept } from './nested-teaching';

// Original summaries; references are links, not redistributed figures or text.
export const hippocampalTeachingReferences = {
  hippocampalTopography: {
    title: 'UTHealth · Subcortical structures of the limbic system',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/L11/Lab11p05_index.html',
  },
  hippocampalMemory: {
    title: 'UTHealth · Limbic system: hippocampus',
    url: 'https://nba.uth.tmc.edu/neuroscience/s4/chapter05.html',
  },
  hippocampalLearning: {
    title: 'UTHealth · Learning and memory',
    url: 'https://nba.uth.tmc.edu/neuroscience/s4/chapter07.html',
  },
  hippocampalMRI: {
    title: 'ILAE · Structural MRI in epilepsy: Neuroimaging Task Force consensus (2019)',
    url: 'https://www.ilae.org/files/ilaeGuideline/RecommendationsForUseOf-StructuralMRI-Bernasconi_et_al-2019-Epilepsia.pdf',
  },
};

const draft = (body: string, ...references: string[]) => ({ body, references, readiness: 'draft' as const });

export const hippocampalConcepts: NestedConcept[] = [{
  id: 'cerebral-hippocampus',
  study: 'cerebral',
  fmaIds: ['FMA72714', 'FMA72713'],
  sections: {
    anatomy: draft('Locate the hippocampus in the medial temporal lobe, along the floor of the temporal horn. Anteriorly, the amygdala is a useful neighbouring landmark. Fibres collect over the hippocampal surface as the alveus and converge into the fimbria, continuing towards the fornix. The selected left or right surface does not separately delineate these fibre layers.', 'hippocampalTopography'),
    function: draft('The hippocampal system contributes to forming new declarative memories. Entorhinal connections bring cortical information into this network; hippocampal outputs reach cortical and subcortical targets, including through the fornix. This is a network function, not a memory store that can be assessed from the size or colour of an atlas mesh.', 'hippocampalMemory', 'hippocampalLearning'),
    clinical: draft('Relate each hippocampus to the wider memory network rather than treating it as an isolated organ. Medial temporal injury can impair acquisition of new facts and events while leaving some skill learning relatively preserved. A learning model cannot test memory or determine which side is responsible for an individual patient’s symptoms; clinical assessment and acquired imaging remain separate.', 'hippocampalLearning'),
    pathology: draft('Hippocampal sclerosis involves neuronal loss and gliosis. MRI assessment considers reduced volume, abnormal T2 signal and disrupted internal architecture together. Shape variation alone is not proof of sclerosis or epileptogenicity. This atlas contains no pathological hippocampal specimen or patient-specific diagnostic finding.', 'hippocampalMRI'),
  },
  imaging: {
    mri: draft('Compare both hippocampi along their head, body and tail. The ILAE HARNESS approach includes high-resolution coronal T2 images perpendicular to the hippocampal long axis, alongside 3D T1 and FLAIR imaging. Assess volume, signal and internal structure together. The coarse surface cannot show subfields, MR signal or an acquired slice position.', 'hippocampalMRI'),
    ct: draft('CT can identify some acute structural causes of seizures, such as haemorrhage or a large mass. MRI is the appropriate structural technique for detailed assessment of hippocampal sclerosis; a reassuring CT does not replace that assessment. No CT attenuation or registered scan correspondence is encoded in this model.', 'hippocampalMRI'),
  },
  modelLimit: 'Two source-labelled coarse surfaces, not separately validated hippocampal subfields or the complete hippocampal formation. No dentate/subicular boundary, alveus/fimbria segmentation, microscopic architecture, pathology, normative volumetry or patient-image registration is established. X-ray and ultrasound lessons remain pending.',
  quiz: {
    question: 'The hippocampus lies along the floor of which part of the lateral ventricle?',
    answer: 'The temporal (inferior) horn of the lateral ventricle.',
    references: ['hippocampalTopography'],
    basis: 'primary-reference',
  },
}];

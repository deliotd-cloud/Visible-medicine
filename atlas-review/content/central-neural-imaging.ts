// Original teaching drafts. References are links, not imported figures or datasets.
export const centralNeuralImagingReferences = {
  ct: 'https://www.radiologyinfo.org/en/info/headct',
  mri: 'https://www.radiologyinfo.org/en/info/mri-brain',
  capsule: 'https://www.ncbi.nlm.nih.gov/books/NBK542181/',
  subcortex: 'https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2022.894606/full',
  fornix: 'https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L02P19.html',
  geniculate: 'https://www.ajnr.org/content/ajnr/36/9/1669.full.pdf',
  commissures: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3725361/',
  fornicealCommissure: 'https://pubmed.ncbi.nlm.nih.gov/35879431/',
  stria: 'https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2018.00039/full',
  lamina: 'https://www.ajnr.org/content/ajnr/30/1/199.full.pdf',
  septum: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10607410/',
  choroid: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6379459/',
  limbic: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10569190/',
} as const;
export type CentralImagingReference = keyof typeof centralNeuralImagingReferences;
export type CentralImagingModality = 'ct' | 'mri';
export type CentralImagingFact = {text: string; references: readonly CentralImagingReference[]};
const fact = (text: string, ...references: CentralImagingReference[]): CentralImagingFact => ({text, references});
export const centralNeuralImagingModes: Record<CentralImagingModality, CentralImagingFact> = {
  ct: fact('CT provides cross-sectional brain and skull information. Read the actual window settings and contrast status: this reference surface has no attenuation, blood products, enhancement or patient-specific margins.', 'ct'),
  mri: fact('MRI depicts brain soft tissues using sequence-dependent contrast. Check the actual sequence and orientation; atlas colours are not T1/T2 signal, diffusion restriction or contrast enhancement.', 'mri'),
};
const limitedCT = fact('Use this as an anatomical locator, not a CT segmentation boundary. Routine head CT does not establish the complete course or fine internal divisions of this small structure.', 'ct');
const limitedMR = fact('MR visibility depends on resolution and tissue contrast. A coloured surface must not be treated as proof that every border is distinguishable in the selected patient sequence.', 'mri');
const geniculateMR = fact('Dedicated 3T research sequences improved geniculate-boundary visibility over several conventional sequences; this does not guarantee equivalent delineation on a routine brain study.', 'geniculate');
type Group = {
  fmaIds: readonly string[];
  landmark: CentralImagingFact;
  focus: Record<CentralImagingModality, CentralImagingFact>;
  limitation: string;
};
export const centralNeuralImagingGroups = {
  brain: {
    fmaIds: ['FMA50801'],
    landmark: fact('Start with the cerebral hemispheres, brainstem and cerebellum, then compare the ventricular spaces and surrounding skull.', 'ct'),
    focus: {
      ct: fact('CT can assess haemorrhage, ventricular enlargement and mass effect. These are image findings to assess in the real study, not features supplied by this model.', 'ct'),
      mri: fact('MRI can assess brain tissue in several planes. Use the acquired series for lesion assessment; a surface model cannot establish whether a scan or structure is normal.', 'mri'),
    },
    limitation: 'This is the existing 59-component brain aggregate, not 59 named or validated scan regions. Its midline catalogue identity does not imply symmetric anatomy. No separate cerebellar or midbrain mask is changed here.',
  },
  caudate: {
    fmaIds: ['FMA72826', 'FMA72827'],
    landmark: fact('The caudate head borders the frontal horn; the anterior internal capsule separates it from the lentiform nucleus.', 'capsule'),
    focus: {
      ct: fact('At basal-ganglia level, orient from frontal horn to caudate head, anterior internal capsule and lentiform nucleus.', 'capsule'),
      mri: fact('Follow the head and body beside the lateral ventricle. The thin tail can be difficult to delineate even in high-resolution segmentation work.', 'subcortex'),
    },
    limitation: 'The complete donor surface is not evidence that the tail is fully visible on this scan. No patient volume, atrophy threshold or vascular-territory assignment is supplied.',
  },
  putamen: {
    fmaIds: ['FMA72828', 'FMA72829'],
    landmark: fact('The putamen forms the lateral portion of the lentiform nucleus, lateral to the globus pallidus.', 'capsule'),
    focus: {
      ct: fact('Distinguish the lentiform nucleus from the caudate across the anterior internal capsule; do not label the entire lentiform contour as putamen.', 'capsule'),
      mri: fact('Check the lateral border against the external capsule and claustrum; high-resolution imaging can improve their separation.', 'subcortex'),
    },
    limitation: 'The model does not separate functional putaminal territories or demonstrate a lacune, haemorrhage, mineral deposition or disease-specific signal pattern.',
  },
  pallidum: {
    fmaIds: ['FMA72830', 'FMA72831'],
    landmark: fact('The globus pallidus is medial to putamen and lateral to the internal capsule.', 'capsule'),
    focus: {
      ct: fact('Use the medial lentiform position for orientation. Keep the adjacent internal capsule distinct from the selected pallidal surface.', 'capsule'),
      mri: limitedMR,
    },
    limitation: 'The source is the whole pallidal selection, not independently reviewed internal/external segments. Do not infer calcification, iron concentration or a surgical target from its colour.',
  },
  amygdala: {
    fmaIds: ['FMA72832', 'FMA72833'],
    landmark: fact('The amygdala occupies the anterior medial temporal region; posteriorly, the hippocampal formation and temporal horn lie below it.', 'subcortex'),
    focus: {
      ct: limitedCT,
      mri: fact('Use coronal images with sagittal and axial cross-checks at the hippocampal interface; not every nuclear border is an intensity-defined boundary.', 'subcortex'),
    },
    limitation: 'The amygdala is not the hippocampus. This aggregate mesh does not resolve its nuclei, identify an epileptogenic focus or measure patient-specific enlargement.',
  },
  thalamus: {
    fmaIds: ['FMA258714', 'FMA258716'],
    landmark: fact('The thalamus lies beside the third ventricle and medial to the posterior internal capsule.', 'capsule'),
    focus: {
      ct: fact('At thalamic level, compare third ventricle, thalamus, posterior internal capsule and lentiform nucleus in that order.', 'capsule'),
      mri: fact('Locate the whole thalamus beside the third ventricle. Gross segmentation does not delineate all thalamic nuclei or establish their individual boundaries.', 'subcortex'),
    },
    limitation: 'The separately selectable geniculate bodies remain distinct source records. No perforator territory, thalamic subnucleus, patient lesion or validated stimulation coordinate is assigned.',
  },
  lateralGeniculate: {
    fmaIds: ['FMA73303', 'FMA73304'],
    landmark: fact('Locate the lateral geniculate body in the posterior-inferior thalamic region, associated with the visual pathway.', 'geniculate'),
    focus: {ct: limitedCT, mri: geniculateMR},
    limitation: 'A visible gross landmark is not a segmentation of the six microscopic layers or proof of a visual-field deficit. The generic surface is not registered to optic radiations.',
  },
  medialGeniculate: {
    fmaIds: ['FMA73309', 'FMA73310'],
    landmark: fact('The medial geniculate body is the auditory thalamic relay, medial to the lateral geniculate body near the midbrain.', 'geniculate'),
    focus: {ct: limitedCT, mri: geniculateMR},
    limitation: 'Do not confuse it with the lateral visual relay or the inferior colliculus. This selection does not include a validated auditory pathway or establish hearing function.',
  },
  fornix: {
    fmaIds: ['FMA72924', 'FMA72925'],
    landmark: fact('The fornix curves beneath the corpus callosum; its columns descend towards the mammillary region.', 'fornix'),
    focus: {
      ct: limitedCT,
      mri: fact('Cross-check body, crura and columns in several planes. Seeing a macroscopic fornix is not the same as proving its axonal connections by tractography.', 'fornicealCommissure'),
    },
    limitation: 'Left and right are exact supplied surfaces, not inferred mirror copies. Do not infer an intact memory circuit, individual axons or a patient disconnection from this geometry.',
  },
  anteriorCommissure: {
    fmaIds: ['FMA61961'],
    landmark: fact('The anterior commissure crosses the midline near the anterior third-ventricular region and the descending fornical columns.', 'commissures'),
    focus: {
      ct: limitedCT,
      mri: fact('Identify the compact midline commissure before extending a label laterally. Conventional MRI may show a landmark without resolving the full fibre bundle.', 'commissures'),
    },
    limitation: 'The AC-PC line is an orientation convention, not evidence that this donor and a patient share coordinates. The Atlas supplies no stereotactic target or inferred registration.',
  },
  posteriorCommissure: {
    fmaIds: ['FMA62072'],
    landmark: fact('Find the posterior commissural region below the pineal recess near the upper cerebral aqueduct.', 'commissures'),
    focus: {
      ct: limitedCT,
      mri: fact('A midsagittal view helps locate the posterior commissure; distinguish its contour from adjacent recesses rather than marking an arbitrary posterior third-ventricular point.', 'commissures'),
    },
    limitation: 'This is not the habenular commissure or the adjacent pretectal nuclei. A selected source boundary does not establish a gaze-pathway lesion or correct the separate CT-head midbrain mask.',
  },
  fornicealCommissure: {
    fmaIds: ['FMA61970'],
    landmark: fact('The source-labelled forniceal commissure lies between the fornical crura beneath the splenium; its human anatomy is unusually delicate.', 'fornicealCommissure'),
    focus: {
      ct: limitedCT,
      mri: fact('A multimodal human study found delicate commissural fibres histologically but no corresponding interhemispheric tractography connection. Do not portray this source as a reliably visible routine-MRI tract.', 'fornicealCommissure'),
    },
    limitation: 'Imaging orientation is draft; disputed functional teaching remains pending. This entry does not adjudicate the donor identity, establish hippocampal connectivity or justify enlarging the source surface.',
  },
  callosum: {
    fmaIds: ['FMA86464'],
    landmark: fact('The corpus callosum arches above the fornix and joins the cerebral hemispheres.', 'fornix'),
    focus: {
      ct: fact('Use a sagittal reformat, when available, to orient the callosal arch above the ventricular roof; inspect attenuation in the actual CT study.', 'fornix', 'ct'),
      mri: fact('Trace the callosal arch on a midline sagittal view and cross-check laterally. Its relation to the fornix is a landmark, not a tract-by-tract connectivity map.', 'fornix'),
    },
    limitation: 'Only the whole existing callosal surface is selected. No independent genu/body/splenium segmentation, patient dysgenesis assessment or diffusion abnormality is supplied.',
  },
  choroid: {
    fmaIds: ['FMA61934'],
    landmark: fact('Locate the cerebral-hemisphere choroid plexus within the lateral ventricular system, not in the surrounding brain parenchyma.', 'choroid'),
    focus: {
      ct: fact('Choroid plexus may calcify with age. Assess the actual distribution and context; a dense ventricular focus is not automatically haemorrhage or automatically benign.', 'choroid'),
      mri: fact('Choroid plexus normally enhances with conventional contrast agents. Enhancement alone does not turn this structure into a tumour or demonstrate barrier failure.', 'choroid'),
    },
    limitation: 'This one catalogue selection contains two source components. It is not a complete all-ventricle plexus map, a pair of independently approved labels or a measured CSF-production model.',
  },
  mammillary: {
    fmaIds: ['FMA74877'],
    landmark: fact('The mammillary bodies are paired inferior hypothalamic landmarks related to the descending fornical columns.', 'limbic'),
    focus: {
      ct: limitedCT,
      mri: fact('Use thin multiplanar images to compare the paired mammillary contours and surrounding CSF. Delineating a contour does not resolve the mammillary nuclei or prove pathway integrity.', 'limbic'),
    },
    limitation: 'The singular catalogue name contains two source pieces. Do not interpret its midline identity as a single unpaired body, or use donor size to diagnose patient atrophy.',
  },
  striaMedullaris: {
    fmaIds: ['FMA73413', 'FMA73414'],
    landmark: fact('The stria medullaris follows the dorsal-medial thalamic region towards the habenula; it is distinct from the stria terminalis.', 'stria'),
    focus: {
      ct: limitedCT,
      mri: fact('Research tractography requires deliberate reconstruction and anatomical checking; reported streamlines can be shorter than the anatomical tract. A routine structural image does not establish the entire course.', 'stria'),
    },
    limitation: 'The supplied surface is not tractography. It neither verifies axonal continuity nor supplies an individual habenular connection, treatment target or patient functional measurement.',
  },
  laminaTerminalis: {
    fmaIds: ['FMA61975'],
    landmark: fact('The lamina terminalis is a thin anterior third-ventricular boundary above the optic chiasm, distinct from the nearby septum pellucidum.', 'lamina'),
    focus: {
      ct: limitedCT,
      mri: fact('Midsagittal high-resolution cine MRI has demonstrated lamina motion in volunteers. Ordinary static images and this stationary mesh cannot quantify pulsation or CSF dynamics.', 'lamina'),
    },
    limitation: 'The two-piece source selection does not establish membrane thickness, patency, a surgical fenestration or the separate patient segmentation boundary.',
  },
  septum: {
    fmaIds: ['FMA61842'],
    landmark: fact('For orientation, the septum pellucidum lies between the lateral ventricles, below the corpus callosum and above the fornix.', 'septum'),
    focus: {
      ct: fact('Inspect the midline ventricular partition and any intervening CSF space. A cavum between septal leaflets must not be mistaken for septal tissue.', 'septum'),
      mri: fact('Coronal and sagittal images help distinguish septal leaflets, fornix and callosal roof. A cavum can be an anatomical variant; clinical interpretation needs the rest of the study.', 'septum'),
    },
    limitation: 'The source is labelled septum of telencephalon, a broader identity than an independently verified septum pellucidum. These orientation notes do not relabel it or establish septal nuclei/leaflet boundaries; that source distinction still needs review.',
  },
} as const satisfies Record<string, Group>;
export type CentralNeuralImagingGroup = keyof typeof centralNeuralImagingGroups;

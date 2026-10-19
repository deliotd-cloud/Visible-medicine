// Original introductory teaching. References are not imported media or datasets.
const anatomyReference = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-head-and-neck/';
const emergencyReference = 'https://www.nhs.uk/conditions/stroke/symptoms/';
export const scaMcaClinicalReferences = {
  sca: [anatomyReference, 'https://pubmed.ncbi.nlm.nih.gov/8418555/', emergencyReference],
  mca: [anatomyReference, 'https://www.stroke.org/en/about-stroke/effects-of-stroke/cognitive-effects/spatial-neglect', 'https://www.stroke.org/en/about-stroke/types-of-stroke/ischemic-stroke-clots', emergencyReference],
} as const;
export const scaMcaClinicalTopics = {
  sca: {
    clinical: {
      title: 'Superior cerebellar circulation',
      body: 'The superior cerebellar artery usually arises from the basilar artery and supplies the upper cerebellum. Infarction in this circulation can present with gait disturbance; presentations vary, and symptoms alone do not establish an isolated SCA lesion. Suspected stroke requires emergency assessment: in the UK call 999, even if symptoms settle.',
      prompt: 'Compare the selected side with the basilar artery and cerebellum. More than one SCA may arise on a side, but this source does not demonstrate the range of anatomical variants.',
    },
    pathology: {
      title: 'Infarction and posterior fossa swelling',
      body: 'SCA-territory infarction may have an embolic mechanism. Cerebellar swelling can cause mass effect, obstructive hydrocephalus and brainstem compression; the clinical course must not be assumed benign. A reference surface cannot establish the cause, extent or severity of an infarct.',
      prompt: 'Distinguish the artery from the injured tissue: a surface mesh is not a perfusion map, an infarct boundary or evidence of a patent lumen. Source midline crossing is not proof of a vascular anomaly.',
    },
  },
  mca: {
    clinical: {
      title: 'Right hemispheric clinical context',
      body: 'The middle cerebral artery arises from the internal carotid artery and supplies much of the lateral frontal, parietal and temporal cortex. Right-hemisphere stroke can cause left-sided spatial neglect: reduced awareness of the left side is a clinical finding, not a property visible in this artery model. Symptoms alone do not prove which arterial branch is affected.',
      prompt: 'Relate the right-sided source to the lateral cerebral surface without treating it as a complete cortical or deep supply map. Language dominance and individual functional localisation are not encoded in the mesh.',
    },
    pathology: {
      title: 'Arterial obstruction and ischaemia',
      body: 'An ischaemic stroke can follow arterial blockage by a clot formed locally or material carried from elsewhere. In the MCA circulation, the location of the obstruction and the tissue affected must be evaluated clinically and on appropriate imaging. The gaps in this model are disconnected source pieces, not demonstrated thrombus or stenosis.',
      prompt: 'Do not interpret the three source files as three angiographic segments or use their surfaces to grade narrowing. No patient-specific occlusion, collateral circulation, perfusion deficit or treatment eligibility is established.',
    },
  },
} as const;

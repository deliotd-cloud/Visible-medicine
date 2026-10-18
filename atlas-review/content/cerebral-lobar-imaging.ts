import type { NestedSection } from './nested-teaching';

// Original educational prose; linked references are not redistributed assets.
export const cerebralLobarReferences = {
  cerebralLobarCT: {
    title: 'Graham Lloyd-Jones · CT brain anatomy: parenchyma and lobes',
    url: 'https://www.radiologymasterclass.co.uk/tutorials/ct/ct_brain_anatomy/ct_brain_anatomy_lobes',
  },
  cerebralLobarMRI: {
    title: 'ESR / Laura Oleaga · CNS anatomy: cerebral sulci on MRI (pp. 11–14)',
    url: 'https://www.myesr.org/app/uploads/2026/08/ESR_Modern_eBook_09_v02.pdf',
  },
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body, references, readiness: 'draft',
});

export const cerebralLobarImaging = {
  frontal: {
    ct: draft(
      'On upper axial CT, locate the central sulcus: frontal cortex lies anteriorly. Lower down, anterior frontal lobes occupy the anterior cranial fossae. Skull-bone names are not exact lobar boundaries. These four grouped source gyri are not a complete frontal-lobe segmentation or a CT attenuation map.',
      'cerebralLobarCT',
    ),
    mri: draft(
      'On axial T1-weighted MRI, identify the precentral gyrus immediately anterior to the central sulcus. Follow the sulcus across adjacent images instead of equating an atlas colour edge with the patient’s boundary. The grouped frontal surface does not independently label the motor hand area, establish language dominance or provide functional MRI mapping.',
      'cerebralLobarMRI',
    ),
  },
  parietal: {
    ct: draft(
      'Start with the central sulcus on upper axial CT and inspect the parietal region behind it. Its transitions toward temporal and occipital regions may not be sharply delineated on CT. Do not draw a precise patient boundary from this combined source surface; it supplies neither an attenuation measurement nor a patient-specific segmentation.',
      'cerebralLobarCT',
    ),
    mri: draft(
      'On axial T1-weighted MRI, distinguish the postcentral gyrus behind the central sulcus from the precentral gyrus in front. On medial sagittal images, use the parieto-occipital sulcus as a posterior landmark. The combined parietal selection does not separate its component gyri or map a patient’s sensory representation.',
      'cerebralLobarMRI',
    ),
  },
  temporal: {
    ct: draft(
      'On lower CT sections, orient to the temporal lobes in the middle cranial fossae; distinguish this location from the posterior fossa containing cerebellum and brainstem. The model’s main temporal compound omits separately selectable superior temporal parts and does not include the separate hippocampal selection. It is not a whole-lobe CT mask.',
      'cerebralLobarCT',
    ),
    mri: draft(
      'On parasagittal T1-weighted MRI, locate the Sylvian fissure between inferior frontal and superior temporal cortex. Relate that landmark to the separately selectable superior temporal parts, rather than treating the main temporal compound as complete. No patient registration, language map or hippocampal volume measurement is supplied by these surfaces.',
      'cerebralLobarMRI',
    ),
  },
  occipital: {
    ct: draft(
      'Inspect the posterior cerebral region on CT without assuming that its transition to the parietal region forms a crisp visible border. Use neighbouring anatomy across sections rather than copying the model’s colour boundary. This occipital surface contains no lesion, attenuation data, visual-field map or validated CT correspondence.',
      'cerebralLobarCT',
    ),
    mri: draft(
      'On medial parasagittal T1-weighted MRI, distinguish the parieto-occipital sulcus at the lobar boundary from the calcarine sulcus within the occipital region. The atlas has one occipital surface per side, not separately labelled calcarine banks or retinotopic subdivisions. This is an orientation exercise, not patient-specific visual-pathway localisation.',
      'cerebralLobarMRI',
    ),
  },
};

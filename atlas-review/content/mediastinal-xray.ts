// Original short teaching; cited pages are factual references, not licensed media.
const contours = 'https://www.radiologymasterclass.co.uk/tutorials/chest/chest_home_anatomy/chest_anatomy_page9';
const unfolding = 'https://www.radiologymasterclass.co.uk/gallery/chest/mediastinum_hilum/unfolded_aorta';
const venous = 'https://radiologyassistant.nl/chest/chest-x-ray/heart-failure';
const basic = 'https://radiologyassistant.nl/chest/chest-x-ray/basic-interpretation';
export const mediastinalXrayGeneralReference = 'https://www.radiologyinfo.org/en/info/chestrad';

export const mediastinalXrayTopics = {
  FMA3736: {
    body: 'Use the ascending aorta to understand how elongation can change the mediastinal outline. Age-related aortic unfolding is not synonymous with an aneurysm; a projected contour is not a cross-sectional vessel measurement.',
    cue: 'Distinguish this ascending segment from the arch and descending segment. The reference surface does not depict a patient aneurysm, dissection flap or calcified wall.',
    references: [unfolding],
  },
  FMA3768: {
    body: 'The aortic knuckle corresponds to the left outer contour of the arch as it curves posteriorly over the left main bronchus. Find this landmark before following the descending aortic contour inferiorly.',
    cue: 'The aortopulmonary window lies below the arch, above the left pulmonary artery. It is a region between structures, not the lumen of this selected vessel.',
    references: [contours],
  },
  FMA87217: {
    body: 'Follow the descending thoracic aortic contour down from the knuckle. This visible interface is not a separate view of the entire circumference, lumen or wall.',
    cue: 'Loss or displacement of the contour can arise from aortic disease or adjacent lung disease. Correlate with the rest of the study rather than assigning a diagnosis from one border.',
    references: [contours],
  },
  FMA4720: {
    body: 'The superior vena cava contributes the right border of the vascular pedicle. Use it to orient the upper mediastinal venous pathway, not to infer a complete visible SVC lumen.',
    cue: 'AP projection and patient rotation can increase apparent pedicle width. Compare technique before interpreting a difference between serial films; this atlas cannot measure patient fluid status.',
    references: [venous],
  },
  FMA4838: {
    body: 'Orient the azygos arch separately from the longer azygos venous course. Its radiographic prominence varies with positioning and venous pressure; it is not a stand-alone diagnosis of heart failure.',
    cue: 'An azygos fissure is a variant pleural fold associated with an unusual azygos course. The azygo-oesophageal line below the arch is a mediastinal interface, not an outline of the whole vein.',
    references: [venous, basic],
  },
} as const;

export const mediastinalXrayShared = [
  'A chest radiograph superimposes structures. Check patient side, projection and positioning on the acquired image; screen-left is not patient-left.',
  'Return separation to zero before comparing anatomy. This reference model supplies no radiograph, patient measurement or 3D-to-image registration.',
] as const;

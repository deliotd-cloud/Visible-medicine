// Original orientation prose; references supply facts, never embedded media.
export const hilarVesselXrayReferences = {
  hilarAnatomy: 'https://www.radiologymasterclass.co.uk/tutorials/chest/chest_home_anatomy/chest_anatomy_page2',
  hilarVessels: 'https://radiologyassistant.nl/chest/chest-x-ray/basic-interpretation',
} as const;

const veinBody = 'Pulmonary veins tend toward a more horizontal course toward the left atrium; lower-lobe arteries tend to run more vertically.';
const veinCue = 'The selected side and superior/inferior name identify this source surface. They do not establish a separately traceable radiographic vein or a drainage territory.';

export const hilarVesselXrayTopics = {
  FMA50872: {
    body: 'The right pulmonary artery passes in front of the right main bronchus. Use that relationship when orienting the right hilum.',
    cue: 'A hilar point can be indistinct. A single projected edge does not delineate the whole selected artery.',
    references: [hilarVesselXrayReferences.hilarAnatomy],
  },
  FMA50873: {
    body: 'The left pulmonary artery curves over the left main bronchus. The left hilum commonly lies higher than the right.',
    cue: 'This relationship supports orientation; hilum height alone does not establish normality or disease.',
    references: [hilarVesselXrayReferences.hilarAnatomy],
  },
  FMA49914: {body: veinBody, cue: veinCue, references: [hilarVesselXrayReferences.hilarVessels]},
  FMA49916: {body: veinBody, cue: veinCue, references: [hilarVesselXrayReferences.hilarVessels]},
  FMA49911: {body: veinBody, cue: veinCue, references: [hilarVesselXrayReferences.hilarVessels]},
  FMA49913: {body: veinBody, cue: veinCue, references: [hilarVesselXrayReferences.hilarVessels]},
} as const;

export const hilarVesselXrayVascularCue = 'Hilar shadows largely reflect overlapping arteries and veins. A vessel visible on a lateral view is not automatically a lymph node.';
export const hilarVesselXrayShared = [
  hilarVesselXrayVascularCue,
  'Check patient side and projection on the acquired image; screen-left is not patient-left. The lesson title identifies the selected named source vessel.',
  'Reassemble to 0% separation before comparison. This reference model is not a radiograph and supplies no patient measurement or patient-to-model registration.',
] as const;

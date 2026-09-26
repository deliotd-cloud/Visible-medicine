export type LowerArterialModality = 'ct' | 'mri' | 'ultrasound';
export type LowerArterialImagingGroup = 'thigh' | 'knee' | 'distal';
export const lowerArterialImagingGroups: Record<LowerArterialImagingGroup, string[]> = {
  thigh: ['FMA70249', 'FMA70250', 'FMA20796', 'FMA20797'],
  knee: ['FMA77380', 'FMA77381'],
  distal: ['FMA43896', 'FMA43897', 'FMA43898', 'FMA43899', 'FMA43916', 'FMA43917'],
};
export const lowerArterialImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  cta: 'https://www.radiologyinfo.org/en/info/angioct',
  mra: 'https://www.radiologyinfo.org/en/info/angiomr',
  ultrasound: 'https://www.radiologyinfo.org/en/info/vascularus',
  lowerLimb: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9876734/',
};
type Ref = keyof typeof lowerArterialImagingReferences;
type Topic = { body: string; bullets: string[]; references: Ref[] };
// Original concise synthesis; references are links, not imported text or images.
export const lowerArterialImagingTopics: Record<LowerArterialImagingGroup, Record<LowerArterialModality, Topic>> = {
  thigh: {
    ct: {
      body: 'CTA evaluates contrast-filled arteries and surrounding tissues. In the thigh, distinguish the femoral continuation from the deep femoral branch before following the distal course.',
      bullets: ['Review acquired images for narrowing, obstruction or injury; the atlas contains no contrast bolus, plaque or perfused lumen.'],
      references: ['cta'],
    },
    mri: {
      body: 'MRA is a vascular acquisition, with or without contrast, rather than any routine thigh MRI. Confirm the series and distinguish the main femoral course from profunda femoris.',
      bullets: ['Movement or metal can degrade the image. A clean atlas outline cannot establish that the corresponding patient artery is patent.'],
      references: ['mra'],
    },
    ultrasound: {
      body: 'Duplex combines vessel imaging with Doppler information. Identify the actual femoral artery and its deep branch before interpreting the acquired flow assessment.',
      bullets: ['Deeper vessels can be less accessible to ultrasound. Removing muscles in this viewer does not create an acoustic window or a Doppler trace.'],
      references: ['ultrasound'],
    },
  },
  knee: {
    ct: {
      body: 'The popliteal selection supplies posterior-knee orientation for CTA review. The acquired examination can evaluate vessel injury, aneurysm or obstruction; the source surface depicts none of these conditions.',
      bullets: ['A source endpoint is not a measured branch origin, and a mesh gap is not an arterial occlusion.'],
      references: ['cta'],
    },
    mri: {
      body: 'Use the actual vascular acquisition when assessing the popliteal artery. Routine knee MRI and MRA answer different imaging questions; neither is reproduced by a coloured mesh.',
      bullets: ['Metal and motion can obscure vessels. The fixed source anatomy cannot demonstrate dynamic entrapment, an abnormal waveform or a patient-specific aneurysm.'],
      references: ['mra'],
    },
    ultrasound: {
      body: 'Vascular ultrasound can assess a vessel and its blood flow in real time. The popliteal atlas surface is a location reference, not a sonographic measurement.',
      bullets: ['No diameter, thrombus, flow velocity or compression response is encoded. Artificial separation cannot demonstrate a dynamic vascular disorder.'],
      references: ['ultrasound'],
    },
  },
  distal: {
    ct: {
      body: 'On tibial CTA, dense arterial calcium can obscure the lumen. Acquisition too early may under-opacify an artery; delayed acquisition may mix arterial and venous enhancement.',
      bullets: ['Follow the acquired series and its timing before interpreting an apparently absent vessel. The supplied surfaces are not a complete three-vessel runoff assessment.'],
      references: ['lowerLimb'],
    },
    mri: {
      body: 'Small distal arteries can be difficult to resolve on MRA, and separating arteries from veins may be challenging. Inspect the acquisition rather than assuming atlas detail predicts MR visibility.',
      bullets: ['A sharply rendered vessel supplies no MR signal, validated distal runoff or foot perfusion measurement.'],
      references: ['mra'],
    },
    ultrasound: {
      body: 'Small calibre and greater depth can limit vascular ultrasound; arterial calcification may block the ultrasound beam. Nonvisualisation alone is not proof that a vessel is anatomically absent.',
      bullets: ['This viewer has no probe orientation, Doppler angle, waveform or velocity threshold. The displayed vessel colour is not measured flow.'],
      references: ['ultrasound'],
    },
  },
};
export const lowerArterialImagingSelectionNotes = [
  { fmaIds: ['FMA70249', 'FMA70250'], note: 'Femoral artery: the source is one selection, not separate common and superficial femoral segments. Its continuation becomes popliteal at the adductor hiatus.' },
  { fmaIds: ['FMA20796', 'FMA20797'], note: 'Deep femoral artery (profunda femoris): a branch of the femoral artery, not its continuation into the knee. The mesh does not establish a complete perforator tree.' },
  { fmaIds: ['FMA77380', 'FMA77381'], note: 'Popliteal artery: follow the posterior knee. A separate tibioperoneal trunk and fibular root selection are unavailable here; these omissions do not represent normal absence.' },
  { fmaIds: ['FMA43896', 'FMA43897'], note: 'Anterior tibial artery: orient to the anterior leg and its continuation as dorsalis pedis at the ankle. The two names are not independent inflows.' },
  { fmaIds: ['FMA43898', 'FMA43899'], note: 'Posterior tibial artery: follow the posterior leg towards the medial ankle and plantar circulation. The unsegmented tibioperoneal trunk prevents a complete selectable branching sequence.' },
  { fmaIds: ['FMA43916', 'FMA43917'], note: 'Dorsalis pedis: continuation of anterior tibial onto the dorsal foot. The limited source network cannot establish a complete pedal arch or digital perfusion.' },
];

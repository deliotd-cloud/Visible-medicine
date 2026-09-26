// Original teaching drafts. References are reading links, not imported image assets.
export const thoracicBoneImagingGroups = {
  first: ['FMA7857', 'FMA7987'],
  second: ['FMA7882', 'FMA8012'],
  middle: ['FMA7909', 'FMA8039', 'FMA7957', 'FMA8148', 'FMA8066', 'FMA8093', 'FMA8175', 'FMA8202', 'FMA8229', 'FMA8256'],
  costalMargin: ['FMA8283', 'FMA8310', 'FMA8364', 'FMA8391', 'FMA8445', 'FMA8472'],
  floating: ['FMA8531', 'FMA8532', 'FMA8533', 'FMA8534'],
  manubrium: ['FMA7486'], body: ['FMA7487'], xiphoid: ['FMA7488'],
} as const;
export type ThoracicBoneImagingGroup = keyof typeof thoracicBoneImagingGroups;
export type ThoracicBoneImagingModality = 'xray' | 'ct' | 'mri' | 'ultrasound';
export const thoracicBoneImagingReferences = {
  landmarks: 'https://anatomy.ttuhscep.edu/anatomytables/bones_thorax.html',
  wall: 'https://pubs.rsna.org/doi/full/10.1148/rg.210095',
  sternum: 'https://pubs.rsna.org/doi/full/10.1148/rg.293055136',
  ultrasound: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11558486/',
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  mri: 'https://www.ncbi.nlm.nih.gov/books/NBK621648/',
} as const;
export const thoracicBoneImagingLandmarks: Record<ThoracicBoneImagingGroup, string> = {
  first: 'The first rib is broad and flattened. Its superior scalene tubercle lies between the subclavian vessel grooves; these are landmarks, not separate selections.',
  second: 'Follow the second rib to its costal cartilage at the manubriosternal angle. The bony rib and its anterior cartilage are different tissues.',
  middle: 'For ribs 3–7, orient the posterior head, neck and tubercle before following the shaft anteriorly. Each reaches the sternum through its own costal cartilage.',
  costalMargin: 'Ribs 8–10 connect anteriorly through the costal-cartilage margin rather than directly to the sternum. Do not extend their selected bony surfaces to the midline.',
  floating: 'Ribs 11 and 12 have free anterior ends with short cartilages, without a sternal or upper-cartilage connection. “Floating” does not mean unattached posteriorly.',
  manubrium: 'Identify the superior jugular notch between the clavicular notches. The manubriosternal angle below marks the second costal-cartilage level.',
  body: 'The sternal body lies between manubrium and xiphoid. Its lateral borders receive the costal cartilages of ribs 2–7.',
  xiphoid: 'The inferior xiphoid varies in shape, size and ossification. This specimen is one configuration, not a universal normal template.',
};
type Topic = { body: string; bullets: [string, string]; references: (keyof typeof thoracicBoneImagingReferences)[] };
// Shared modality explanations are intentionally not counted as separate left/right lessons.
export const thoracicBoneImagingTopics: Record<'rib' | 'sternum', Record<ThoracicBoneImagingModality, Topic>> = {
  rib: {
    xray: { body: 'On a radiograph, follow one rib through overlapping chest structures. Radiography can show osseous or calcified chest-wall findings, but it provides limited soft-tissue assessment.', bullets: [
      'Verify side and rib number on the acquired examination; screen-left is not automatically patient-left.',
      'The atlas is a surface rendering, not a calibrated X-ray projection or a means of excluding an occult injury.',
    ], references: ['wall'] },
    ct: { body: 'CT provides cross-sectional bone and soft-tissue detail, with images reformatted in multiple planes. Follow the selected rib through the acquired volume rather than only its 3D surface.', bullets: [
      'Identify the posterior vertebral end before tracing the curved shaft. One axial section may show several different rib levels.',
      'A selected outer surface contains no attenuation values or validated internal cortex/marrow segmentation.',
    ], references: ['ct'] },
    mri: { body: 'MRI contributes soft-tissue contrast around a rib and can help assess adjacent nerve, vessel and pleural involvement. Surface shape alone cannot provide this information.', bullets: [
      'Localise the selected rib and check actual series coverage before comparing surrounding tissues.',
      'Atlas colour does not represent marrow signal, oedema, enhancement or tumour extension.',
    ], references: ['wall'] },
    ultrasound: { body: 'The accessible rib cortex appears as a bright interface with acoustic shadowing deep to it. Ultrasound does not reliably assess the hidden cortex or marrow through intact bone.', bullets: [
      'Keep a local sonographic view distinct from this whole-rib selection; seeing one surface does not examine its full length.',
      'Neither atlas transparency nor separation simulates an acoustic window or a measured pleural finding.',
    ], references: ['ultrasound'] },
  },
  sternum: {
    xray: { body: 'A lateral chest radiograph profiles the sternum; its appearance differs from the overlap on a frontal view. Relate the selected part to the other two sternal parts.', bullets: [
      'Use acquired images to distinguish contour variation from a suspected abnormality.',
      'The reference is not a calibrated projection, fracture classification or deformity measurement.',
    ], references: ['sternum'] },
    ct: { body: 'CT reformations separate the manubrium, sternal body and xiphoid spatially. Developmental clefts or a sternal foramen may be present; a defect is not automatically a fracture.', bullets: [
      'Inspect the actual source sections and surrounding tissues before interpreting a gap.',
      'Exploding these three selections creates artificial spaces; these are not joints measured on CT.',
    ], references: ['sternum'] },
    mri: { body: 'MRI can characterise chest-wall soft tissues and their relationship to adjacent structures. Keep the selected sternal part localised while evaluating the acquired signal information.', bullets: [
      'A bony outline alone does not establish marrow normality or retrosternal disease extent.',
      'This surface model has no MRI sequence, signal or enhancement data.',
    ], references: ['mri'] },
    ultrasound: { body: 'Ultrasound can assess the accessible superficial sternal cortex and overlying tissues. Acoustic shadowing limits assessment of deeper bone; a superficial view is not a complete sternal examination.', bullets: [
      'Locate the selected part and its junctions before comparing a local image.',
      'The static atlas cannot demonstrate sternal instability, respiratory movement or a dynamic ultrasound result.',
    ], references: ['ultrasound'] },
  },
};
export const thoracicBoneImagingFamily = (group: ThoracicBoneImagingGroup) =>
  group === 'manubrium' || group === 'body' || group === 'xiphoid' ? 'sternum' : 'rib';

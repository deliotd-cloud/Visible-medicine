// Original brief notes. Reading references do not import publisher assets.
const followUp='https://link.springer.com/article/10.1007/s10140-022-02066-w';
const caseSeries='https://pubmed.ncbi.nlm.nih.gov/11159088/';
export const costalCartilageImagingTopics={
 ct:{
  title:'CT: follow cartilage as well as bone',
  body:'Trace the selected costal cartilage separately from its neighbouring bony rib. In an eight-patient series with 15 cartilage fractures, CT demonstrated low-attenuation clefts; some clefts contained gas and older injuries had surrounding calcification.',
  bullets:['Review consecutive sections and multiplanar reconstructions for the cartilage contour and displacement. The follow-up study used CT alongside MRI and ultrasound, not as an infallible rule-out test.','A smooth atlas surface contains no CT attenuation or fracture line. Its source margin is not a validated costochondral or sternocostal joint boundary.'],
  citations:[caseSeries,followUp],credit:'Malghem et al. (2001), small case series; Nummela et al. (2022), selected follow-up cohort.',
 },
 mri:{
  title:'MRI: cartilage and surrounding tissue',
  body:'In a prospective follow-up study of 21 adults with previously CT-diagnosed cartilage fractures, MRI assessed the fracture site and surrounding tissue. Fat-suppressed T2-weighted images demonstrated persistent oedema in some patients.',
  bullets:['Interpret signal with the acquired sequence, anatomical location and clinical history. Oedema alone is not a motion test or proof of unstable union.','The coloured reference surface does not encode MR signal, mineralisation, oedema or soft-tissue injury. Removing covering anatomy does not reproduce an acquired MRI slice.'],
  citations:[followUp],credit:'Nummela et al. (2022), long-term follow-up of selected blunt-trauma patients; not acute screening accuracy.',
 },
 ultrasound:{
  title:'Ultrasound: surface and dynamic assessment',
  body:'Costal cartilage fracture may appear as a break in the normally smooth anterior contour on ultrasound. In the follow-up cohort, targeted dynamic assessment could reveal movement at a fracture site.',
  bullets:['This is an examination-dependent observation, not evidence that every fracture or unstable junction is visible. Correlate the actual images with clinical findings.','Explode, rotation and cutaway controls move reference surfaces for learning; they do not simulate breathing, palpation, acoustic access or fracture instability.'],
  citations:[caseSeries,followUp],credit:'Malghem et al. (2001) and Nummela et al. (2022); no scanning manoeuvre, diagnostic threshold or intervention protocol supplied.',
 },
 xray:{
  title:'X-ray: a visibility limitation',
  body:'Non-calcified costal cartilage is poorly assessed on projection radiographs. The CT/sonography series describes why cartilage fractures may be missed unless the cartilage is densely calcified. A normal-looking bony rib does not exclude adjacent cartilage injury.',
  bullets:['Do not expect every brightly coloured atlas cartilage to have an equivalent outline on a chest radiograph. This selection contains no patient-specific calcification or projected X-ray density.','The absence of a visible fracture is not a diagnosis; further assessment depends on the clinical question and actual patient imaging.'],
  citations:[caseSeries],credit:'Malghem et al. (2001); descriptive findings, not a sensitivity estimate or a universal imaging pathway.',
 },
} as const;

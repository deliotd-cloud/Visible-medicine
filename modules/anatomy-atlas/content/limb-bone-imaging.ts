// Original orientation drafts. References are reading links, not reusable images.
export const limbBoneImagingGroups = {
  radius: ['FMA23464', 'FMA23465'], ulna: ['FMA23467', 'FMA23468'],
  fibula: ['FMA24480', 'FMA24481'], femur: ['FMA24474', 'FMA24475'],
  tibia: ['FMA24477', 'FMA24478'], patella: ['FMA24486', 'FMA24487'],
} as const;
export type LimbBoneImagingGroup = keyof typeof limbBoneImagingGroups;
export type LimbBoneImagingModality = 'xray' | 'ct' | 'mri';
export const limbBoneImagingReferences = {
  upper: 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html',
  lower: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
  forearm: 'https://www.orthoinfo.org/diseases--conditions/adult-forearm-fractures/',
  radius: 'https://www.orthoinfo.org/diseases--conditions/distal-radius-fractures-broken-wrist/',
  olecranon: 'https://www.orthoinfo.org/diseases--conditions/elbow-olecranon-fractures/',
  ankle: 'https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/',
  femur: 'https://www.orthoinfo.org/diseases--conditions/distal-femur-thighbone-fractures-of-the-knee/',
  tibia: 'https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/',
  patella: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/patella/further-reading/patient-examination',
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
} as const;
export const limbBoneImagingLandmarks: Record<LimbBoneImagingGroup, {note:string; reference:'upper'|'lower'}> = {
  radius: { note: 'Follow the proximal radial head and neck to the broader distal radius and radial styloid. The radial head is at the elbow; the ulnar head is at the wrist.', reference:'upper' },
  ulna: { note: 'At the elbow, distinguish the posterior olecranon from the anterior coronoid process around the trochlear notch. Follow the shaft to the smaller distal head and styloid.', reference:'upper' },
  fibula: { note: 'Follow the fibular head beside the proximal tibia to the lateral malleolus beside the talus. The medial and posterior malleoli belong to the tibia, not the fibula.', reference:'lower' },
  femur: { note: 'This knee lesson concerns the distal end of the whole femur: the two condyles and anterior patellar surface, not the femoral head at the hip.', reference:'lower' },
  tibia: { note: 'This knee lesson concerns the proximal tibia: the medial and lateral plateaus, intercondylar eminence and anterior tuberosity. The ankle end remains part of the same selection.', reference:'lower' },
  patella: { note: 'The patella lies anterior to the distal femur. Its posterior articular surface faces the femur; the kneecap is not an extension of the tibial plateau.', reference:'lower' },
};
type Topic = { body:string; bullets:[string,string]; references:(keyof typeof limbBoneImagingReferences)[] };
export const limbBoneImagingTopics: Record<LimbBoneImagingGroup, Partial<Record<LimbBoneImagingModality,Topic>>> = {
  radius: {
    xray: { body:'Trace the radius separately from the ulna, from elbow to wrist. Forearm rotation changes their projected relationship; rotating the atlas camera does not pronate or supinate these fixed bones.', bullets:[
      'Forearm fractures may involve both bones or accompany injury at a neighbouring joint. A single selected shaft is not a complete assessment.',
      'Compare acquired views with the assembled reference. Apparent overlap or separation in this model is not a measured deformity.',
    ], references:['forearm'] },
    ct: { body:'At the wrist, distinguish the distal radius from the adjacent ulnar head and carpal bones. CT can add bony detail in selected distal radial injuries.', bullets:[
      'Localise any fracture extension using the acquired sections and reformations, not only a 3D reconstruction.',
      'No articular step, radial height, tilt or operative plan can be measured from this generic surface.',
    ], references:['radius'] },
    mri: { body:'On an acquired examination, distinguish the radius from its marrow and surrounding tendons or ligaments. MRI provides tissue information that the outer bone surface lacks.', bullets:[
      'The radial head and distal radial end belong to different joint examinations; a whole-bone selection does not guarantee either is covered by a scan.',
      'Highlight colour does not encode marrow oedema, fracture or cartilage integrity.',
    ], references:['mri'] },
  },
  ulna: {
    xray: { body:'The olecranon forms the posterior bony point of the elbow. An injury involving it may extend into the elbow joint; relate it to the distal humerus and radial head.', bullets:[
      'Continue along the ulna to the wrist rather than mistaking its small distal head for the proximal radial head.',
      'The selected bone does not establish triceps continuity, elbow stability or whether another injury is present.',
    ], references:['olecranon'] },
    ct: { body:'Cross-sectional CT can display bone in planes through the elbow or wrist. Keep the proximal trochlear notch and distal ulnar head distinct when using this whole-ulna reference.', bullets:[
      'Follow consecutive source sections through the relevant end; the atlas cutaway exposes no acquired internal bone data.',
      'No fracture fragments, articular gaps or implant trajectories are encoded by this intact reference surface.',
    ], references:['ct'] },
    mri: { body:'Use the ulna to orient the acquired field of view, then assess nearby soft tissues on the actual MRI. Bone appearance alone cannot establish tendon or ligament integrity.', bullets:[
      'Distinguish the elbow end from the distal radioulnar region; a lesson about one does not assess the other.',
      'No marrow signal or validated triangular fibrocartilage or ligament segmentation is supplied by this selection.',
    ], references:['mri'] },
  },
  fibula: {
    xray: { body:'At the ankle, identify the fibular lateral malleolus separately from the tibial malleoli and talus. Fracture location and adjacent joint findings matter beyond naming the injured bone.', bullets:[
      'The whole fibula remains selected, including its proximal head; an ankle-focused view may not include that region.',
      'This fixed, unloaded atlas cannot demonstrate a stress examination or syndesmotic instability.',
    ], references:['ankle'] },
    ct: { body:'Ankle CT can clarify bony injury extent. Trace the distal fibula beside the tibia and talus through the acquired sections.', bullets:[
      'Keep fibular and tibial fragments separately localised; a reconstructed surface is only one display of the scan.',
      'No patient-specific displacement or joint congruence is established by this reference model.',
    ], references:['ankle'] },
    mri: { body:'MRI may assess associated ankle ligament injury, but is not routinely needed for ankle fractures. The fibula is a localisation landmark, not a substitute for those tissues.', bullets:[
      'Confirm which part of the whole bone is included in the actual series.',
      'Neither bone colour nor the space between separated meshes establishes syndesmotic or lateral-ligament integrity.',
    ], references:['ankle'] },
  },
  femur: { xray: { body:'Radiographs can localise a distal femoral fracture and show its pattern. Relate the condyles to the tibia and the patella before isolating the femur.', bullets:[
    'The whole femur spans two joints. A knee-focused comparison is not a review of the femoral neck or hip.',
    'No fracture classification, calibrated projection or normal alignment measurement is supplied by rotating the intact model.',
  ], references:['femur'] } },
  tibia: { xray: { body:'Localise a proximal tibial finding relative to the plateau rather than the shaft or ankle. Radiographs show bone injury, but some suspected plateau injuries are not visible on initial X-rays.', bullets:[
    'Distinguish the joint surface from the anterior tuberosity using the assembled reference.',
    'The intact atlas does not exclude occult injury, plateau depression or associated meniscal and ligament damage.',
  ], references:['tibia'] } },
  patella: { xray: { body:'AP, lateral and axial/skyline views provide complementary patellar information. A cursory review can underestimate fracture complexity.', bullets:[
    'Relate the kneecap to the femur behind it. Its appearance on a lateral image differs from the patellofemoral profile on an axial view.',
    'The orbit camera is not a prescribed projection. Separating the patella does not simulate a fracture, tracking test or extensor-mechanism examination.',
  ], references:['patella'] } },
};

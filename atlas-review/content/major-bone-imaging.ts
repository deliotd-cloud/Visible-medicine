// Original orientation teaching. References are links, not licensed image assets.
const upper='https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html';
const lower='https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const ct='https://www.radiologyinfo.org/en/info/bodyct';
const mri='https://www.radiologyinfo.org/en/info/muscmr';
const xray='https://www.radiologyinfo.org/en/info/bonerad';
export type MajorBoneImagingTopic={title:string;body:string;bullets:readonly string[];citations:readonly string[]};
export const majorBoneImagingTopics:Record<string,Partial<Record<'ct'|'mri'|'xray',MajorBoneImagingTopic>>>={
 hip:{
  ct:{title:'CT: follow the hip bone through the pelvis',
   body:'Use the acetabulum to connect the ilium, ischium and pubis conceptually. On cross-sectional CT and its reformats, follow this bone beyond the socket rather than treating one acetabular slice as the entire hip bone.',
   bullets:['Orient to the iliac crest superiorly, pubic rami anteriorly and ischial tuberosity posteroinferiorly. The sacrum and opposite hip bone provide the wider pelvic context.','This is one whole-bone surface, not separate acetabular columns, walls or a fracture map. Atlas cutaways do not reveal CT density; an isolated bone cannot assess the complete pelvic ring.'],citations:[lower,ct]},
  mri:{title:'MRI: distinguish the socket from its soft tissues',
   body:'Use the acetabulum as a spatial reference when correlating a hip MRI with the atlas. MRI provides soft-tissue context, including assessment of the hip labrum; that information is not contained in this bone surface.',
   bullets:['Check the actual examination coverage before relating a finding to the wider pelvis. A whole hip bone in the atlas does not mean the entire bone or pelvic ring was included in a focused study.','The selected mesh does not separately represent labrum, articular cartilage or internal marrow signal. Do not interpret its colour or apparent smoothness as an MR finding.'],citations:[lower,mri]},
  xray:{title:'X-ray: read the pelvis as a projection',
   body:'Relate the iliac wings, acetabula and obturator foramina to the projected pelvic image. A radiograph superimposes anatomy; rotating this solid model helps spatial orientation but does not generate a diagnostic radiograph.',
   bullets:['Review both sides and the posterior pelvic context on the actual images rather than judging the selected hip bone in isolation. Confirm image-side markers independently of the atlas camera.','Radiographs support assessment of bone and alignment, but provide limited soft-tissue information. This model supplies neither projection-calibrated lines nor a validated fracture-exclusion test.'],citations:[lower,xray]},
 },
 clavicle:{
  ct:{title:'CT: trace the clavicle between its two ends',
   body:'Follow the clavicle from its medial sternal end to its lateral acromial end. CT reformats help relate this curved bone to the scan planes; the atlas is a separate spatial reference, not a reconstruction of the patient.',
   bullets:['Keep the sternoclavicular and acromioclavicular ends distinct when describing location. A single view of the shaft does not display both articulations equally.','No joint space, fracture displacement or cortical defect is measured by this whole-bone selection. Surface detail is not evidence of patient-specific joint alignment.'],citations:[upper,ct]},
  mri:{title:'MRI: identify which clavicular region is covered',
   body:'Use the medial and lateral ends as location anchors when correlating an MR examination. MRI can examine joints and surrounding soft tissues, but the atlas selection alone does not specify the region or tissues included in the study.',
   bullets:['Confirm examination coverage on the actual images; do not infer that a shoulder study includes the whole clavicle and its medial articulation.','This mesh contains no MR signal or separately validated ligament, capsule or joint-disc boundaries. A normal-looking atlas surface cannot establish that adjacent soft tissues are normal.'],citations:[upper,mri]},
 },
 humerus:{
  ct:{title:'CT: separate proximal, shaft and distal landmarks',
   body:'Orient proximally with the head, neck and tubercles, then follow the shaft to the distal capitulum and trochlea. Use CT sections and reformats to check location instead of transferring an atlas camera angle directly to a scan plane.',
   bullets:['The posterior olecranon fossa helps distinguish the distal posterior surface. Confirm patient side and level on the images before linking a finding to the atlas.','Landmarks described here are not independently segmented fracture fragments. This whole-bone mesh does not encode cortical thickness, CT attenuation or internal trabecular detail.'],citations:[upper,ct]},
  mri:{title:'MRI: match the bone segment to the examination',
   body:'The atlas humerus spans the shoulder, arm and elbow. When correlating MRI, first identify which part is actually covered; joint and soft-tissue assessment requires the examination itself, not merely selecting the whole bone.',
   bullets:['A proximal landmark and a distal landmark should not be assumed to appear in the same focused examination. Keep the anatomical location and the scan coverage separate.','No internal marrow signal, tendon tear or cartilage defect is simulated. The bone colour is only a display convention, not a sequence-dependent tissue appearance.'],citations:[upper,mri]},
 },
 scapula:{
  ct:{title:'CT: use the spine and glenoid for orientation',
   body:'The scapular spine leads laterally to the acromion; distinguish these from the anteriorly projecting coracoid and the glenoid. Relate these anchors to CT reformats without assuming an atlas view is aligned to the patient.',
   bullets:['The spine separates the supraspinous and infraspinous fossae. Follow the blade as well as the lateral processes when checking where a finding lies.','This selection is a whole scapula, not independently delineated glenoid rims or fracture fragments. No patient-specific version, bone loss or implant-planning measurement is provided.'],citations:[upper,ct]},
  mri:{title:'MRI: keep the scapula and periarticular tissues distinct',
   body:'Use the glenoid and acromion to orient the shoulder region. MRI provides joint and soft-tissue information, including rotator-cuff and labral assessment, that cannot be inferred from this selected scapular surface.',
   bullets:['Check the coverage of the actual study before extending a local shoulder observation to the scapular blade or surrounding chest. The atlas displays anatomy beyond a focused field of view.','The mesh does not separately delineate glenoid cartilage, labrum or tendon insertion footprints. Exploding the model changes display positions, not patient anatomy or MR slice coordinates.'],citations:[upper,mri]},
 },
};

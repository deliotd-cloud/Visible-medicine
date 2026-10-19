export type MetatarsalSurfaceGroup = 'first' | 'central' | 'fifth';
export type MetatarsalSurfaceTopic = 'xray' | 'ultrasound';
export const metatarsalSurfaceReferences = {
  radiographs: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/metatarsals/further-reading/patient-examination',
  midfoot: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/further-reading/patient-assessment',
  ultrasound: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10668940/',
  stressStudy: 'https://pubmed.ncbi.nlm.nih.gov/19567620/',
  fifthStudy: 'https://pubmed.ncbi.nlm.nih.gov/24342871/',
};
export type MetatarsalSurfaceRef = keyof typeof metatarsalSurfaceReferences;
type Topic = {body:string;bullets:string[];references:MetatarsalSurfaceRef[]};
type Selection = {fmaId:string;file:string;group:MetatarsalSurfaceGroup;topics:MetatarsalSurfaceTopic[]};
export const metatarsalSurfaceSelections:Selection[] = [
  {fmaId:'FMA24507',file:'FJ3351',group:'first',topics:['xray','ultrasound']},
  {fmaId:'FMA24508',file:'FJ3241',group:'first',topics:['xray','ultrasound']},
  {fmaId:'FMA24509',file:'FJ3353',group:'central',topics:['xray','ultrasound']},
  {fmaId:'FMA24510',file:'FJ3244',group:'central',topics:['xray','ultrasound']},
  {fmaId:'FMA24511',file:'FJ3355',group:'central',topics:['xray','ultrasound']},
  {fmaId:'FMA24512',file:'FJ3247',group:'central',topics:['xray','ultrasound']},
  {fmaId:'FMA24513',file:'FJ3357',group:'central',topics:['xray','ultrasound']},
  {fmaId:'FMA24514',file:'FJ3250',group:'central',topics:['xray','ultrasound']},
  {fmaId:'FMA24515',file:'FJ3359',group:'fifth',topics:['xray','ultrasound']},
  {fmaId:'FMA24516',file:'FJ3253',group:'fifth',topics:['xray','ultrasound']},
];

// Original factual synthesis only. No publisher image, table or prose is imported.
export const metatarsalSurfaceTopics:Record<MetatarsalSurfaceGroup,Record<MetatarsalSurfaceTopic,Topic>> = {
  first:{
    xray:{
      body:'Follow the first metatarsal from its tarsometatarsal base to the first MTP head on acquired AP, oblique and lateral views. Include the joints at both ends rather than inspecting the shaft alone.',
      bullets:['The 3D camera is not an X-ray projection: overlap, loading and positioning must be assessed on the actual radiographs. This bone selection does not assign identities to the separate grouped sesamoid surfaces.'],
      references:['radiographs'],
    },
    ultrasound:{
      body:'Use the first metatarsal as an orientation landmark when examining accessible cortex and nearby first-MTP soft tissues. Ultrasound does not provide an assessment of the bone marrow or the entire internal joint.',
      bullets:['Keep the cortical surface separate from adjacent tendon, capsule and plantar supporting tissues. Their position and integrity are not established by selecting this whole-bone mesh.'],
      references:['ultrasound'],
    },
  },
  central:{
    xray:{
      body:'Identify the selected ray and trace its base, shaft, neck and head across acquired AP, oblique and lateral views. Review neighbouring tarsometatarsal alignment as well as the named bone.',
      bullets:['The second-metatarsal/intermediate-cuneiform alignment is assessed on AP views; the fourth-metatarsal/cuboid relationship is assessed on oblique views. These are different landmarks, not interchangeable rules for every ray.'],
      references:['radiographs','midfoot'],
    },
    ultrasound:{
      body:'Accessible shaft cortex and surrounding superficial tissues can be examined with ultrasound when correlating focal metatarsal pain. Marrow abnormalities require a different imaging assessment.',
      bullets:['A small study of radiograph-negative metatarsal pain compared ultrasound with MRI and found imperfect detection. A normal ultrasound or radiograph does not exclude a bone stress injury.'],
      references:['ultrasound','stressStudy'],
    },
  },
  fifth:{
    xray:{
      body:'Keep the fifth-metatarsal base, shaft and distal head distinct while comparing the acquired AP, oblique and lateral views. Include the neighbouring joints and do not infer articular extension from one projection.',
      bullets:['The named whole-bone surface is an orientation reference, not a fracture-zone segmentation or an acquired weight-bearing study.'],
      references:['radiographs'],
    },
    ultrasound:{
      body:'The superficial fifth metatarsal is accessible for targeted cortical ultrasound assessment. Separate the base from the shaft when correlating a surface finding with the site of symptoms.',
      bullets:['A clinical study of acute fifth-metatarsal injuries included a radiographic fracture missed by ultrasound. Ultrasound findings are not a stand-alone exclusion test, and the atlas supplies no echogenic cortex, marrow signal or diagnostic result.'],
      references:['fifthStudy'],
    },
  },
};
export const metatarsalSurfaceScopeNote = 'Draft orientation for revision-bound radiologist review. No radiograph, ultrasound examination, patient registration or clinical approval is loaded. Atlas, imaging-case and paid-lecture access remain independent.';

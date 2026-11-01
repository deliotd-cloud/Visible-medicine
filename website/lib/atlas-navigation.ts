/** Navigation describes availability, not access or clinical approval. */
export const atlasAvailabilitySummary = 'Explore 3D anatomy and the integrated CT/MRI head viewers. Use configured local scans or compatible teaching folders; ultrasound supports local still-image teaching folders. Hosted scan delivery, published ultrasound studies, X-ray and other imaging regions remain in preparation.';
export const atlasImagingScope = 'CT and MRI head viewers offer native slices, structure search, labels and practice. Selected structures link to the existing 3D Atlas by anatomical concept; these are separate subjects, not spatially registered scans. Local scan folders are not uploaded by these viewers. Teaching remains draft pending clinical review.';
export const atlasModalities = [
  { id:'3d', label:'3D', href:'/atlas/3d', title:'3D anatomy', overview:"Start with Whole body or a region. Rotate, dissect and isolate structures, with linked draft teaching notes.", description:'Rotate, dissect and explore anatomical structures.', status:'Interactive · review pending', image:'/media/atlas/3d-detail-preview.jpg', alt:'Source-based shoulder anatomy in the Visible Medicine 3D viewer', caption:'From the 3D viewer' },
  { id:'ct', label:'CT', href:'/atlas/ct', title:'CT anatomy', overview:"Scroll native head slices, search structures, practise identification and compare mapped anatomy with MRI and the 3D Atlas. Automatic loading in the configured local preview; approved folder selection elsewhere. Separate subjects, not spatially registered.", description:'Head atlas · slices, search and linked structure practice.', status:'Integrated viewer · local scans', image:'/media/atlas/ct-preview.png', alt:'Representative axial CT image of the brain', caption:'Reference image · not the loaded study' },
  { id:'mri', label:'MRI', href:'/atlas/mri', title:'MRI anatomy', overview:"Explore native head planes, labels and structure practice, with mapped CT and 3D comparisons. Automatic loading in the configured local preview; approved folder selection elsewhere. Separate subjects, not spatially registered.", description:'Head atlas · planes, labels and linked structure practice.', status:'Integrated viewer · local scans', image:'/media/atlas/mri-preview.png', alt:'Representative sagittal MRI of an ex vivo human brain', caption:'Ex vivo reference · not the loaded study' },
  { id:'ultrasound', label:'Ultrasound', href:'/atlas/ultrasound', title:'Ultrasound anatomy', overview:"Open a prepared local still-image teaching folder to search annotations, practise identification and compare exact draft 3D references. Published studies remain in preparation; this abdominal-wall preview shows diastasis recti.", description:'Local teaching images, annotations and structure practice.', status:'Local folders · review pending', image:'/media/atlas/ultrasound-preview.jpg', alt:'Representative abdominal-wall ultrasound showing diastasis recti', caption:'Reference image · abdominal wall' },
  { id:'x-ray', label:'X-ray', href:'/atlas/x-ray', title:'X-ray anatomy', overview:"Understand overlapping structures and alignment on projection radiographs. Regional X-ray atlases are being developed; the preview is a chest radiograph.", description:'Explore anatomy on projection radiographs.', status:'In preparation', image:'/media/atlas/xray-preview.png', alt:'Representative chest radiograph', caption:'Reference image · chest' },
] as const;
export type AtlasModalityId = typeof atlasModalities[number]['id'];
export type AtlasRegionLink = { id:string; label:string; href:string; planned?:boolean };
/** Root selections, not a claim of complete anatomical coverage. Export-checked. */
export const atlasBodyRegions = [
  { id:'whole-body', label:'Whole body', href:'/atlas/3d', structures:1104 },
  { id:'head-neck', label:'Head & neck', href:'/atlas/head-neck-3d', structures:291 },
  { id:'spine', label:'Spine & back', href:'/atlas/spine-3d', structures:115 },
  { id:'thorax', label:'Thorax', href:'/atlas/thorax-3d', structures:158 },
  { id:'abdomen', label:'Abdomen', href:'/atlas/abdomen-3d', structures:106 },
  { id:'pelvis', label:'Pelvis', href:'/atlas/pelvis-3d', structures:82 },
  { id:'shoulder-arm', label:'Shoulder & arm', href:'/atlas/3d?region=shoulder-arm', structures:115 },
  { id:'forearm', label:'Elbow & forearm', href:'/atlas/3d?region=forearm', structures:86 },
  { id:'hand', label:'Wrist & hand', href:'/atlas/3d?region=hand', structures:124 },
  { id:'thigh', label:'Hip & thigh', href:'/atlas/3d?region=thigh', structures:95 },
  { id:'leg', label:'Knee & leg', href:'/atlas/3d?region=leg', structures:76 },
  { id:'foot', label:'Ankle & foot', href:'/atlas/3d?region=foot', structures:122 },
] as const;
export function selectedBodyRegion(requested?:string|string[]){
  return atlasBodyRegions.find(region=>region.id===(requested===undefined?'whole-body':requested))??null;
}
const regions3d: AtlasRegionLink[] = [
  ...atlasBodyRegions,
  { id:'shoulder', label:'Shoulder detail', href:'/atlas/shoulder-3d' },
  { id:'lower-limb', label:'Lower limb reference', href:'/atlas/lower-limb-3d' },
  { id:'female-pelvis', label:'Female pelvis reference', href:'/atlas/female-pelvis-3d' },
];
const imagingRegions = [
  ['head-neck','Head & neck'], ['spine','Spine'], ['thorax','Thorax'], ['abdomen','Abdomen'],
  ['pelvis','Pelvis'], ['shoulder','Shoulder'], ['knee','Knee'], ['ankle-foot','Ankle & foot'],
] as const;
const imagingTo3dRegions = [
  ['head-neck','head-neck'], ['spine','spine'], ['thorax','thorax'], ['abdomen','abdomen'],
  ['pelvis','pelvis'], ['shoulder','shoulder'], ['knee','leg'], ['ankle-foot','foot'],
] as const;
/** Navigation only: a region match is not an image-to-model registration. */
export function atlas3dReturnRegionForImaging(imagingRegion:string):AtlasRegionLink|null {
  const mapped=imagingTo3dRegions.find(([id])=>id===imagingRegion)?.[1];
  return mapped ? regions3d.find(region=>region.id===mapped)??null : null;
}
export function atlasRegionLinks(modality:AtlasModalityId):AtlasRegionLink[] {
  if(modality==='3d') return regions3d;
  return imagingRegions.map(([id,label])=>({
    id, label, planned:!((modality==='ct'||modality==='mri')&&id==='head-neck'),
    href:(modality==='ct'||modality==='mri')&&id==='head-neck'?`/atlas/${modality==='ct'?'ct':'mri'}-head`:`/atlas/${modality}?region=${id}`,
  }));
}
export function selectedImagingRegion(modality:AtlasModalityId,requested?:string|string[]){
  const regions=atlasRegionLinks(modality);
  const id=requested===undefined?(modality==='ultrasound'?'abdomen':modality==='x-ray'?'thorax':'head-neck'):requested;
  return regions.find(region=>region.id===id)??null;
}
/** Preserve old filter bookmarks without arbitrary redirects. */
export function legacyModalityHref(value?:string|string[]){
  if(typeof value!=='string')return null;
  const aliases:Record<string,string>={us:'ultrasound',xray:'x-ray'};
  const key=value.toLowerCase();
  return atlasModalities.find(modality=>modality.id===(aliases[key]??key))?.href??null;
}

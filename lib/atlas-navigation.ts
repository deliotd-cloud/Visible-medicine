/** Navigation describes availability, not access or clinical approval. */
export const atlasModalities = [
  { id:'3d', label:'3D', href:'/atlas/3d', title:'3D anatomy', description:'Rotate, dissect and explore anatomical structures.', status:'Interactive · review pending', image:'/media/atlas/3d-preview.png', alt:'Source-based shoulder anatomy in the Visible Medicine 3D viewer', caption:'From the 3D viewer' },
  { id:'ct', label:'CT', href:'/atlas/ct', title:'CT anatomy', description:'Explore anatomy in cross-section.', status:'Demonstration available', image:'/media/atlas/ct-preview.png', alt:'Representative axial CT image of the brain', caption:'Reference image · not the demonstration' },
  { id:'mri', label:'MRI', href:'/atlas/mri', title:'MRI anatomy', description:'Study anatomy across planes and sequences.', status:'In preparation', image:'/media/atlas/mri-preview.png', alt:'Representative sagittal MRI of an ex vivo human brain', caption:'Ex vivo reference image' },
  { id:'ultrasound', label:'Ultrasound', href:'/atlas/ultrasound', title:'Ultrasound anatomy', description:'Connect probe position with anatomical views.', status:'In preparation', image:'/media/atlas/ultrasound-preview.jpg', alt:'Representative abdominal-wall ultrasound showing diastasis recti', caption:'Reference image · abdominal wall' },
  { id:'x-ray', label:'X-ray', href:'/atlas/x-ray', title:'X-ray anatomy', description:'Explore anatomy on projection radiographs.', status:'In preparation', image:'/media/atlas/xray-preview.png', alt:'Representative chest radiograph', caption:'Reference image · chest' },
] as const;
export type AtlasModalityId = typeof atlasModalities[number]['id'];
export type AtlasRegionLink = { id:string; label:string; href:string; planned?:boolean };
/** Root selections, not a claim of complete anatomical coverage. Export-checked. */
export const atlasBodyRegions = [
  { id:'whole-body', label:'Whole body', href:'/atlas/3d', structures:1101 },
  { id:'head-neck', label:'Head & neck', href:'/atlas/head-neck-3d', structures:290 },
  { id:'spine', label:'Spine & back', href:'/atlas/spine-3d', structures:115 },
  { id:'thorax', label:'Thorax', href:'/atlas/thorax-3d', structures:157 },
  { id:'abdomen', label:'Abdomen', href:'/atlas/abdomen-3d', structures:106 },
  { id:'pelvis', label:'Pelvis', href:'/atlas/pelvis-3d', structures:81 },
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
export function atlasRegionLinks(modality:AtlasModalityId):AtlasRegionLink[] {
  if(modality==='3d') return regions3d;
  return imagingRegions.map(([id,label])=>({
    id, label, planned:!(modality==='ct'&&id==='head-neck'),
    href:modality==='ct'&&id==='head-neck'?'/atlas/ct-head':`/atlas/${modality}?region=${id}`,
  }));
}
export function selectedImagingRegion(modality:AtlasModalityId,requested?:string|string[]){
  const regions=atlasRegionLinks(modality);
  return regions.find(region=>region.id===requested)??regions.find(region=>region.id===(modality==='mri'?'knee':modality==='ultrasound'?'abdomen':modality==='x-ray'?'thorax':'head-neck'))!;
}
/** Preserve old filter bookmarks without arbitrary redirects. */
export function legacyModalityHref(value?:string|string[]){
  if(typeof value!=='string')return null;
  const aliases:Record<string,string>={us:'ultrasound',xray:'x-ray'};
  const key=value.toLowerCase();
  return atlasModalities.find(modality=>modality.id===(aliases[key]??key))?.href??null;
}

// Unitless, source-scoped draft. Deliberately not a BodyCatalog/metric frame.
export const fdaShoulderSpecimenId='fda-shoulder-fc9f3e56' as const;
export const fdaShoulderSourceCommit='fc9f3e56b104c06759750495be1f8dd5d53c1741' as const;
export const fdaReferenceCatalogueSha256='56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44';
export const fdaReferenceCanonicalSha256='c31f38ad5b30d02a0df582f45cec17af81780797343449f3511c91007554e553';
export type FdaSourcePoint=[number,number,number];
export type FdaReferenceStructure={
 id:string;slug:string;sourcePart:string;sourceInstance:string;name:string;
 tissue:'bone'|'cartilage'|'labrum'|'ligament';provenance:string;nodeName:string;
 fmaId:null;laterality:null;coverage:'source-part-only';
 bounds:{min:number[];max:number[]};center:number[];vertices:number;triangles:number;
 sourceObjSha256:string;sourceMapSha256:string;
 validation:{anatomicalReview:false;clinicalApproval:false;orientationVerified:false;unitCalibration:false;registeredToBodyParts3D:false;imagingRegistration:null};
};
export type FdaShoulderReference={
 schema:'vm-fda-shoulder-reference/1';specimenId:typeof fdaShoulderSpecimenId;status:'draft-independent-reference';
 source:{repository:string;commit:string;file:string;sha256:string;license:'CC0-1.0';licenseSha256:string;credit:string;publicationURL:string;publisherReportedSide:'right';anatomicalSideIndependentlyVerified:false};
 display:{kind:'unitless-normalized-source-assembly';sourceCenter:number[];uniformScale:number;sourceToDisplayColumnMajor:number[];unitsPerMillimetre:null;anatomicalAxesVerified:false;normalizedLongestExtent:8};
 structures:FdaReferenceStructure[];
 held:Array<{sourcePart:'Gcart';name:string;reason:string;sourceNodeIds:number[]}>;
 bundle:{id:'fda-shoulder-draft';url:'/models/fda-shoulder-draft/reference.glb';bytes:number;sha256:string;structures:6};
 measurementEnabled:false;anatomicalPresetsEnabled:false;registeredToBodyParts3D:false;imagingRegistration:null;clinicalApproval:false;
};
const expected=[['ac-ligament','AC_Lig','ligament','Acromioclavicular ligament'],['humeral-cartilage','Hcart','cartilage','Constructed humeral cartilage'],['labrum','Labrum','labrum','Labrum'],['clavicle','CLAVICLE','bone','Clavicle'],['humerus-source','Humerus','bone','Humerus (source extent unvalidated)'],['scapula','SCAPULA','bone','Scapula']];
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const sha=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const point=(v:unknown):v is number[]=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n));
/** Metadata guard, not a replacement for source/GLB byte readback or approval. */
export function isFdaShoulderReference(value:unknown):value is FdaShoulderReference{
 if(!object(value)||value.schema!=='vm-fda-shoulder-reference/1'||value.specimenId!==fdaShoulderSpecimenId||value.status!=='draft-independent-reference')return false;
 for(const k of ['measurementEnabled','anatomicalPresetsEnabled','registeredToBodyParts3D','clinicalApproval'])if(value[k]!==false)return false;
 if(value.imagingRegistration!==null||!object(value.source)||!object(value.display)||!object(value.bundle))return false;
 const source=value.source,d=value.display,b=value.bundle;
 if(source.repository!=='https://github.com/OSEL-DAM/ShoulderFiniteElementModel'||source.commit!==fdaShoulderSourceCommit||source.file!=='Male-Shoulder.inp'||source.sha256!=='547de9cff23a4ae98d5a297ba32d8b01fe042739160c4b7144dfe7066d08c70a'||source.license!=='CC0-1.0'||source.licenseSha256!=='a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499'||source.publisherReportedSide!=='right'||source.anatomicalSideIndependentlyVerified!==false||typeof source.credit!=='string'||!source.credit.trim()||source.publicationURL!=='https://pubmed.ncbi.nlm.nih.gov/35882682/')return false;
 if(d.kind!=='unitless-normalized-source-assembly'||!point(d.sourceCenter)||typeof d.uniformScale!=='number'||!Number.isFinite(d.uniformScale)||d.uniformScale<=0||d.unitsPerMillimetre!==null||d.anatomicalAxesVerified!==false||d.normalizedLongestExtent!==8)return false;
 const m=d.sourceToDisplayColumnMajor,scale=d.uniformScale;
 if(!Array.isArray(m)||m.length!==16||!m.every(n=>typeof n==='number'&&Number.isFinite(n)))return false;
 const wanted=[scale,0,0,0,0,scale,0,0,0,0,scale,0,...d.sourceCenter.map(n=>-n*scale),1];
 if(m.some((n,i)=>n!==wanted[i]))return false; // No reflection, rotation or per-part fitting.
 if(b.id!=='fda-shoulder-draft'||b.url!=='/models/fda-shoulder-draft/reference.glb'||!sha(b.sha256)||typeof b.bytes!=='number'||!Number.isSafeInteger(b.bytes)||b.bytes<=28||b.bytes>32*1024*1024||b.structures!==6)return false;
 if(!Array.isArray(value.structures)||value.structures.length!==6)return false;
 for(const [slug,part,tissue,name]of expected){
  const entries=value.structures.filter(v=>object(v)&&v.sourcePart===part);if(entries.length!==1)return false;const s=entries[0];
  if(!object(s)||s.id!==`vm:reference:${fdaShoulderSpecimenId}:${slug}`||s.slug!==slug||s.sourceInstance!==part+'-1'||s.nodeName!=='fda_'+part||s.tissue!==tissue||s.fmaId!==null||s.laterality!==null||s.coverage!=='source-part-only'||typeof s.name!=='string'||!s.name.trim()||s.provenance!==(part==='Hcart'?'publisher-reported-offset-constructed':'publisher-reported-CT-segmentation'))return false;
  if(s.name!==name)return false;
  if(!point(s.center)||!object(s.bounds)||!point(s.bounds.min)||!point(s.bounds.max))return false;
  const min=s.bounds.min,max=s.bounds.max;
  if(min.some((n,i)=>n>max[i])||s.center.some((n,i)=>n<min[i]||n>max[i]))return false;
  if(![s.vertices,s.triangles].every(n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0)||!sha(s.sourceObjSha256)||!sha(s.sourceMapSha256)||!object(s.validation))return false;
  for(const k of ['anatomicalReview','clinicalApproval','orientationVerified','unitCalibration','registeredToBodyParts3D'])if(s.validation[k]!==false)return false;
  if(s.validation.imagingRegistration!==null)return false;
 }
 if(!Array.isArray(value.held)||value.held.length!==1||!object(value.held[0]))return false;
 const held=value.held[0];if(held.sourcePart!=='Gcart'||held.name!=='Constructed glenoid cartilage'||held.reason!=='Source topology hold: two nonmanifold edges and three vertices'||!Array.isArray(held.sourceNodeIds)||held.sourceNodeIds.join(',')!=='2798,4501,37871')return false;
 if(Object.keys(held).some(k=>!['sourcePart','name','reason','sourceNodeIds'].includes(k)))return false;
 return true;
}
export function filterFdaReference(catalogue:FdaShoulderReference,query:string){
 const q=query.trim().toLowerCase();if(q.startsWith('vm:'))return catalogue.structures.filter(s=>s.id.toLowerCase()===q);
 const words=q.split(/\s+/).filter(Boolean);return catalogue.structures.filter(s=>words.every(w=>[s.name,s.sourcePart,s.tissue,s.slug].join(' ').toLowerCase().includes(w)));
}
export function fdaReferenceSourceNotice(catalogue:FdaShoulderReference){
 return `${catalogue.source.credit}. ${catalogue.source.license}. Separate draft source; publisher-reported right shoulder. Physical units, anatomical axes and bone extent remain unvalidated. No body/scan registration, physical measurements or transferred approvals. Constructed glenoid cartilage remains held and is not loaded.`;
}
export function fdaReferenceAssetUrl(assetBase=''){
 if(assetBase!==''&&!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*$/.test(assetBase))throw new Error('Invalid same-origin reference asset base');
 return assetBase.replace(/\/$/,'')+'/models/fda-shoulder-draft/reference.glb';
}
export function canonicalFdaReference(value:unknown):string{
 const sort=(v:unknown):unknown=>Array.isArray(v)?v.map(sort):object(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
 return JSON.stringify(sort(value));
}
export async function fdaReferenceDigest(bytes:Uint8Array):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes));
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function assertPinnedFdaCatalogue(value:unknown):Promise<FdaShoulderReference>{
 if(!isFdaShoulderReference(value)||await fdaReferenceDigest(new TextEncoder().encode(canonicalFdaReference(value)))!==fdaReferenceCanonicalSha256)throw new Error('Reference catalogue does not match the pinned draft revision');
 return value;
}

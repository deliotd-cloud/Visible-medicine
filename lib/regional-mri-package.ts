import {createNativeVolumeGeometry,flattenKJI,maskCropIndexForIJK,type NativeGeometry,type Vec3} from './head-atlas-geometry.mjs';

/** Private Education transport, not the head release, clinical PACS or an approval authority. */
export type RegionalGrid={shape_kji:number[];ijk_to_ras:number[][]};
export type RegionalScalarType='uint8'|'int8'|'uint16'|'int16'|'uint32'|'int32'|'float32'|'float64';
export type RegionalScalars=Uint8Array|Int8Array|Uint16Array|Int16Array|Uint32Array|Int32Array|Float32Array|Float64Array;
export type RegionalImage=RegionalGrid&{file:string;sha256:string;dtype:RegionalScalarType};
export type RegionalMask={kind:'mask';file:string;sha256:string;shape_kji:number[];offset_kji:number[];grid:RegionalGrid;
  gridKind:'source-native'|'derived-source-ras';mappingRevision:string};
export type RegionalMarkup={kind:'points'|'curve';points_ras_mm:number[][]};
export type RegionalAnnotation={id:string;anatomyId:string;label:string;seriesId:string;sourceImageSha256:string;
  laterality:'left'|'right'|'midline'|'bilateral';coverage:'partial'|'complete'|'not-assessed';
  review:{status:'accepted-scoped'|'provisional'|'deferred';revision:string;scope:string};
  geometry:RegionalMask|RegionalMarkup|{kind:'none'}};
export type RegionalMriSeries={id:string;label:string;image:RegionalImage;annotations:RegionalAnnotation[]};
export type RegionalMriManifest={schema:'visible-medicine.regional-mri/1';version:'1.0.0';byteOrder:'little';
  region:string;laterality:'left'|'right'|'midline'|'bilateral';coordinateSystem:'per-series-RAS-mm';registration:'none';
  release:'local-private-draft';series:RegionalMriSeries[]};
export type RegionalAsset={size:number;arrayBuffer(signal?:AbortSignal):Promise<ArrayBuffer>};
export type RegionalMriPackage={readonly manifest:RegionalMriManifest;readonly revision:string};
export type RegionalLoadedSeries={readonly series:RegionalMriSeries;readonly data:RegionalScalars;readonly geometry:NativeGeometry;readonly range:readonly[number,number]};
export type RegionalLoadedAnnotation={readonly annotation:RegionalAnnotation;readonly purpose:'scoped-display'|'provisional-inspection';readonly mask?:Uint8Array;readonly geometry?:NativeGeometry;readonly focus?:readonly number[]};

const HASH=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z][a-zA-Z0-9:._-]{0,199}$/;
const bytesPerScalar:Record<RegionalScalarType,number>={uint8:1,int8:1,uint16:2,int16:2,uint32:4,int32:4,float32:4,float64:8};
const MAX_ASSET=268435456,MAX_PACKAGE=1073741824,MAX_MANIFEST=8388608;
const regions=new Set(['knee','head-neck','shoulder','shoulder-arm','forearm','hand','thorax','abdomen','pelvis','thigh','leg','foot','spine']);
const packages=new WeakMap<RegionalMriPackage,Map<string,RegionalAsset>>();
const studies=new WeakMap<RegionalLoadedSeries,RegionalMriPackage>();
const overlays=new WeakMap<RegionalLoadedAnnotation,{study:RegionalLoadedSeries;mask?:Uint8Array}>();
function fail(message:string):never{throw new Error(message);}
function abort(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');}
function object(value:unknown,keys:string[],name:string):asserts value is Record<string,any>{
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail(`Unsupported ${name} fields.`);
}
function text(value:unknown,limit:number,name:string){if(typeof value!=='string'||!value.trim()||value.length>limit||/[\u0000-\u001f\u007f]/.test(value))fail(`Invalid ${name}.`);}
function id(value:unknown){if(typeof value!=='string'||!ID.test(value))fail('Invalid local identity.');}
function hash(value:unknown){if(typeof value!=='string'||!HASH.test(value))fail('Missing exact revision checksum.');}
function count(shape:unknown):number{
  if(!Array.isArray(shape)||shape.length!==3||shape.some(n=>!Number.isSafeInteger(n)||n<1||n>4096))fail('Unsupported native dimensions.');
  const result=shape.reduce((a,b)=>a*b,1);if(result>134217728)fail('Native volume exceeds the memory limit.');return result;
}
function grid(value:unknown):asserts value is RegionalGrid{
  object(value,['shape_kji','ijk_to_ras'],'grid');count(value.shape_kji);
  createNativeVolumeGeometry(value as RegionalGrid);
  if(value.ijk_to_ras.some((row:number[])=>row.some(n=>Math.abs(n)>100000)))fail('Grid coordinates exceed supported bounds.');
}
export function safeRegionalPackagePath(value:unknown):string{
  if(typeof value!=='string'||value.length>240||!value||value.split('/').some(p=>!p||p==='.'||p==='..'||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(p)||p.endsWith('.')||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))fail('Unsafe regional package path.');
  return value;
}
function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
async function digest(bytes:ArrayBuffer,signal?:AbortSignal){abort(signal);const result=await crypto.subtle.digest('SHA-256',bytes);abort(signal);return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');}
function same(a:unknown,b:unknown){return JSON.stringify(a)===JSON.stringify(b);}

function validate(value:unknown):{manifest:RegionalMriManifest;assets:Map<string,number>}{
  object(value,['schema','version','byteOrder','region','laterality','coordinateSystem','registration','release','series'],'manifest');
  if(value.schema!=='visible-medicine.regional-mri/1'||value.version!=='1.0.0'||value.byteOrder!=='little'||
    value.coordinateSystem!=='per-series-RAS-mm'||value.registration!=='none'||value.release!=='local-private-draft'||!regions.has(value.region)||
    !['left','right','midline','bilateral'].includes(value.laterality)||!Array.isArray(value.series)||value.series.length<1||value.series.length>32)fail('Unsupported regional MRI package.');
  const assets=new Map<string,number>(),seriesIds=new Set<string>();let total=0,annotationCount=0;
  function asset(file:unknown,checksum:unknown,size:number){
    const path=safeRegionalPackagePath(file);hash(checksum);
    if(path.toLowerCase()==='manifest.json'||[...assets.keys()].some(p=>p.toLowerCase()===path.toLowerCase()))fail('Duplicate regional asset identity.');
    if(!Number.isSafeInteger(size)||size<1||size>MAX_ASSET)fail('Asset exceeds the memory limit.');
    total+=size;if(total>MAX_PACKAGE)fail('Regional package exceeds the memory limit.');assets.set(path,size);
  }
  for(const series of value.series){
    object(series,['id','label','image','annotations'],'series');id(series.id);text(series.label,160,'sequence label');
    if(seriesIds.has(series.id))fail('Duplicate sequence identity.');seriesIds.add(series.id);
    object(series.image,['file','sha256','dtype','shape_kji','ijk_to_ras'],'image');
    const image=series.image as RegionalImage;grid({shape_kji:image.shape_kji,ijk_to_ras:image.ijk_to_ras});
    if(!Object.hasOwn(bytesPerScalar,image.dtype))fail('Unsupported scalar data type.');
    asset(image.file,image.sha256,count(image.shape_kji)*bytesPerScalar[image.dtype]);
    if(!Array.isArray(series.annotations)||series.annotations.length>5000||(annotationCount+=series.annotations.length)>10000)fail('Unsupported annotation inventory.');
    const annotationIds=new Set<string>();
    for(const annotation of series.annotations){
      object(annotation,['id','anatomyId','label','seriesId','sourceImageSha256','laterality','coverage','review','geometry'],'annotation');
      id(annotation.id);id(annotation.anatomyId);text(annotation.label,160,'annotation label');hash(annotation.sourceImageSha256);
      if(annotationIds.has(annotation.id))fail('Duplicate annotation identity.');annotationIds.add(annotation.id);
      if(annotation.seriesId!==series.id||annotation.sourceImageSha256!==image.sha256)fail('Annotation belongs to a different source sequence.');
      if(!['left','right','midline','bilateral'].includes(annotation.laterality)||
        (value.laterality!=='bilateral'&&annotation.laterality!==value.laterality&&annotation.laterality!=='midline')||
        !['partial','complete','not-assessed'].includes(annotation.coverage))fail('Invalid annotation scope.');
      object(annotation.review,['status','revision','scope'],'review');hash(annotation.review.revision);text(annotation.review.scope,2000,'review scope');
      if(!['accepted-scoped','provisional','deferred'].includes(annotation.review.status))fail('Unsupported review status.');
      const geometry=annotation.geometry;
      if(geometry?.kind==='mask'){
        object(geometry,['kind','file','sha256','shape_kji','offset_kji','grid','gridKind','mappingRevision'],'mask');
        grid(geometry.grid);count(geometry.shape_kji);hash(geometry.mappingRevision);
        if(!Array.isArray(geometry.offset_kji)||geometry.offset_kji.length!==3||geometry.offset_kji.some((n:number,i:number)=>
          !Number.isSafeInteger(n)||n<0||n+geometry.shape_kji[i]>geometry.grid.shape_kji[i]))fail('Mask crop exceeds its declared grid.');
        if(!['source-native','derived-source-ras'].includes(geometry.gridKind))fail('Unsupported mask grid kind.');
        if(geometry.gridKind==='source-native'&&(!same(geometry.grid.shape_kji,image.shape_kji)||!same(geometry.grid.ijk_to_ras,image.ijk_to_ras)))fail('Native mask and source image grid differ.');
        asset(geometry.file,geometry.sha256,count(geometry.shape_kji));
      }else if(geometry?.kind==='points'||geometry?.kind==='curve'){
        object(geometry,['kind','points_ras_mm'],'markup');
        if(!Array.isArray(geometry.points_ras_mm)||geometry.points_ras_mm.length<(geometry.kind==='curve'?2:1)||geometry.points_ras_mm.length>100000||
          geometry.points_ras_mm.some((p:unknown)=>!Array.isArray(p)||p.length!==3||p.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>100000)))fail('Invalid source-space markup.');
      }else {object(geometry,['kind'],'empty geometry');if(geometry.kind!=='none')fail('Unsupported annotation geometry.');}
      if(annotation.review.status==='deferred'&&geometry.kind!=='none')fail('Deferred anatomy cannot supply a display geometry.');
    }
  }
  return {manifest:freeze(value as RegionalMriManifest),assets};
}

/** expectedRevision must come from a separately checked source handoff, not this folder's own claim. */
export async function openRegionalMriPackage(manifestBytes:ArrayBuffer,files:ReadonlyMap<string,RegionalAsset>,expectedRevision:string,signal?:AbortSignal):Promise<RegionalMriPackage>{
  abort(signal);hash(expectedRevision);
  if(!(manifestBytes instanceof ArrayBuffer)||manifestBytes.byteLength>MAX_MANIFEST)fail('Unsupported manifest size.');
  const owned=manifestBytes.slice(0);if(await digest(owned,signal)!==expectedRevision)fail('Regional source revision mismatch.');
  const {manifest,assets}=validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(owned)));
  const local=new Map<string,RegionalAsset>(),names=new Set<string>();
  for(const[path,file]of files){safeRegionalPackagePath(path);const lower=path.toLowerCase();
    if(names.has(lower))fail('Duplicate package path.');names.add(lower);
    if(!file||!Number.isSafeInteger(file.size)||file.size<0||typeof file.arrayBuffer!=='function')fail('Unsupported local asset.');
    if(path==='manifest.json'){
      if(file.size!==owned.byteLength)fail('Manifest size mismatch.');
      const mapped=await file.arrayBuffer(signal);abort(signal);
      if(!(mapped instanceof ArrayBuffer)||mapped.byteLength!==owned.byteLength||await digest(mapped.slice(0),signal)!==expectedRevision)fail('Mapped manifest differs from the pinned manifest.');
      continue;
    }
    if(!assets.has(path)||file.size!==assets.get(path))fail('Missing, extra or wrong-size regional asset.');local.set(path,file);
  }
  if(local.size!==assets.size)fail('Required regional assets are missing.');abort(signal);
  const pkg=Object.freeze({manifest,revision:expectedRevision});packages.set(pkg,local);return pkg;
}
export async function openLocalRegionalMriPackage(files:FileList|File[],expectedRevision:string,signal?:AbortSignal):Promise<RegionalMriPackage>{
  abort(signal);hash(expectedRevision);if(files.length<2||files.length>10000)fail('Choose the complete regional education folder.');
  const local=new Map<string,RegionalAsset>(),names=new Set<string>();let root:string|undefined;
  for(const file of Array.from(files)){
    const relative=file.webkitRelativePath,split=relative?.indexOf('/');if(typeof relative!=='string'||split<1)fail('Choose one complete folder, not individual files.');
    const folder=relative.slice(0,split);if(root&&root!==folder)fail('Files belong to different folders.');root=folder;
    const path=safeRegionalPackagePath(relative.slice(split+1)),lower=path.toLowerCase();if(names.has(lower))fail('Duplicate package path.');names.add(lower);local.set(path,file);
  }
  const manifest=local.get('manifest.json');if(!manifest||manifest.size>MAX_MANIFEST)fail('Prepared regional manifest not found.');
  const bytes=await manifest.arrayBuffer(signal);abort(signal);return openRegionalMriPackage(bytes,local,expectedRevision,signal);
}
async function checked(pkg:RegionalMriPackage,file:string,checksum:string,size:number,signal?:AbortSignal){
  abort(signal);const source=packages.get(pkg)?.get(file);if(!source||source.size!==size)fail('Regional asset is unavailable.');
  const received=await source.arrayBuffer(signal);abort(signal);
  if(!(received instanceof ArrayBuffer)||received.byteLength!==size)fail('Regional asset byte count mismatch.');
  const owned=received.slice(0);if(await digest(owned,signal)!==checksum)fail('Regional asset checksum mismatch.');return owned;
}
function scalars(bytes:ArrayBuffer,type:RegionalScalarType):RegionalScalars{
  if(new Uint8Array(new Uint16Array([1]).buffer)[0]!==1)fail('Little-endian browser required.');
  switch(type){case'uint8':return new Uint8Array(bytes);case'int8':return new Int8Array(bytes);case'uint16':return new Uint16Array(bytes);case'int16':return new Int16Array(bytes);case'uint32':return new Uint32Array(bytes);case'int32':return new Int32Array(bytes);case'float32':return new Float32Array(bytes);case'float64':return new Float64Array(bytes);}
}
async function scan(data:RegionalScalars,binary:boolean,signal?:AbortSignal):Promise<{range:[number,number];first:number}>{
  let min=Infinity,max=-Infinity,first=-1;
  for(let i=0;i<data.length;i++){
    if(i%262144===0){abort(signal);if(i)await new Promise<void>(r=>setTimeout(r,0));abort(signal);}
    const value=data[i];if(!Number.isFinite(value)||binary&&value!==0&&value!==1)fail(binary?'Mask contains nonbinary values.':'Image contains nonfinite values.');
    if(value<min)min=value;if(value>max)max=value;if(binary&&value===1&&first<0)first=i;
  }
  abort(signal);return {range:[min,max],first};
}
export async function loadRegionalMriSeries(pkg:RegionalMriPackage,seriesId:string,signal?:AbortSignal):Promise<RegionalLoadedSeries>{
  abort(signal);if(!packages.has(pkg))fail('Unknown regional package.');const series=pkg.manifest.series.find(s=>s.id===seriesId);if(!series)fail('Unknown MRI sequence.');
  const image=series.image,bytes=await checked(pkg,image.file,image.sha256,count(image.shape_kji)*bytesPerScalar[image.dtype],signal),data=scalars(bytes,image.dtype);
  const {range}=await scan(data,false,signal);const loaded=Object.freeze({series,data,geometry:createNativeVolumeGeometry(image),range:Object.freeze(range)});
  studies.set(loaded,pkg);return loaded;
}
export async function loadRegionalMriAnnotation(pkg:RegionalMriPackage,study:RegionalLoadedSeries,annotation:RegionalAnnotation,signal?:AbortSignal,options?:{inspectProvisional?:true}):Promise<RegionalLoadedAnnotation>{
  abort(signal);if(studies.get(study)!==pkg||!study.series.annotations.includes(annotation))fail('Annotation is not owned by this source sequence.');
  if(annotation.review.status==='deferred'||annotation.geometry.kind==='none')fail('No display geometry is available for this annotation.');
  if(annotation.review.status==='provisional'&&!options?.inspectProvisional)fail('Provisional annotation requires explicit inspection-only mode.');
  const representation=annotation.geometry;let mask:Uint8Array|undefined,geometry:NativeGeometry|undefined,focus:Vec3|undefined;
  if(representation.kind==='mask'){
    mask=new Uint8Array(await checked(pkg,representation.file,representation.sha256,count(representation.shape_kji),signal));
    const {first}=await scan(mask,true,signal);geometry=createNativeVolumeGeometry(representation.grid);
    if(first>=0){const [,J,I]=representation.shape_kji;focus=geometry.ijkToRas([first%I+representation.offset_kji[2],Math.floor(first/I)%J+representation.offset_kji[1],Math.floor(first/(I*J))+representation.offset_kji[0]]);}
  }else focus=[...representation.points_ras_mm[0]] as Vec3;
  const purpose:RegionalLoadedAnnotation['purpose']=annotation.review.status==='provisional'?'provisional-inspection':'scoped-display';
  abort(signal);const loaded=Object.freeze({annotation,purpose,mask:mask?.slice(),geometry,focus:focus&&Object.freeze(focus)});
  overlays.set(loaded,{study,mask});return loaded;
}
/** Nearest-voxel lookup only within this source sequence. A derived grid remains visibly derived. */
export function regionalMaskAtImageIJK(study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,ijk:Vec3):number|null{
  const verified=overlays.get(overlay);
  if(verified?.study!==study||!verified.mask||!overlay.geometry||overlay.annotation.geometry.kind!=='mask')fail('Mask is not owned by this source sequence.');
  flattenKJI(ijk,study.series.image.shape_kji);
  const representation=overlay.annotation.geometry;
  const maskIJK=representation.gridKind==='source-native'?ijk:overlay.geometry.rasToIjk(study.geometry.ijkToRas(ijk)).map(Math.round) as Vec3;
  const index=maskCropIndexForIJK(maskIJK,representation);return index===null?null:verified.mask[index];
}

/** Display consumers must retain the loader's exact source and overlay objects. */
export function assertRegionalMriOwnership(study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation|null=null):void{
  if(!studies.has(study))fail('MRI sequence is not a verified loaded source.');
  if(overlay&&overlays.get(overlay)?.study!==study)fail('Selected geometry belongs to a different source sequence or is not owned by the loader.');
}

/** Cross-product consumers must retain the exact verified package and source objects. */
export function assertRegionalMriPackageOwnership(pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation|null=null):void{
  if(!packages.has(pkg)||studies.get(study)!==pkg)fail('MRI sequence is not owned by this verified package.');
  assertRegionalMriOwnership(study,overlay);
}

/** Small private review context. Source-declared status is not clinical approval. */
export type RegionalMriReviewRow=Readonly<{
  id:string;anatomyId:string;label:string;laterality:RegionalAnnotation['laterality'];coverage:RegionalAnnotation['coverage'];
  reviewStatus:RegionalAnnotation['review']['status'];reviewRevision:string;reviewScope:string;
  geometryKind:RegionalAnnotation['geometry']['kind'];gridKind:RegionalMask['gridKind']|null;
  geometryMappingRevision:string|null;geometrySourceSha256:string|null;
}>;
export type RegionalMriReviewProjection=Readonly<{
  schema:'visible-medicine.regional-mri-review-context/1';sourceRevision:string;region:string;
  laterality:RegionalMriManifest['laterality'];registration:'none';release:'local-private-draft';
  series:ReadonlyArray<Readonly<{id:string;label:string;imageSha256:string;annotations:ReadonlyArray<RegionalMriReviewRow>}>>;
  projectionRevision:string;
}>;

/** Admit independently pinned manifest bytes, then discard all spatial/file material. */
export async function regionalMriReviewProjection(manifestBytes:ArrayBuffer,expectedRevision:string,signal?:AbortSignal):Promise<RegionalMriReviewProjection>{
  abort(signal);hash(expectedRevision);
  if(!(manifestBytes instanceof ArrayBuffer)||manifestBytes.byteLength>MAX_MANIFEST)fail('Unsupported manifest size.');
  const owned=manifestBytes.slice(0);
  if(await digest(owned,signal)!==expectedRevision)fail('Regional source revision mismatch.');
  const {manifest}=validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(owned)));
  abort(signal);
  const payload={schema:'visible-medicine.regional-mri-review-context/1' as const,sourceRevision:expectedRevision,
    region:manifest.region,laterality:manifest.laterality,registration:manifest.registration,release:manifest.release,
    series:manifest.series.map(series=>({id:series.id,label:series.label,imageSha256:series.image.sha256,
      annotations:series.annotations.map(annotation=>({id:annotation.id,anatomyId:annotation.anatomyId,label:annotation.label,
        laterality:annotation.laterality,coverage:annotation.coverage,reviewStatus:annotation.review.status,
        reviewRevision:annotation.review.revision,reviewScope:annotation.review.scope,geometryKind:annotation.geometry.kind,
        gridKind:annotation.geometry.kind==='mask'?annotation.geometry.gridKind:null,
        geometryMappingRevision:annotation.geometry.kind==='mask'?annotation.geometry.mappingRevision:null,
        geometrySourceSha256:annotation.geometry.kind==='mask'?annotation.geometry.sha256:null}))}))};
  const projectionBytes=new TextEncoder().encode(JSON.stringify(payload));
  const projectionRevision=await digest(projectionBytes.buffer as ArrayBuffer,signal);
  abort(signal);
  return freeze({...payload,projectionRevision});
}

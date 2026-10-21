import runtimeManifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};
import indexJson from './lecture-body-catalog.json' with {type:'json'};

export type LectureBodyReference={
  kind:'body-structure-v1';structureId:string;region:string;side:'both'|'left'|'right';
  sourceSha256:string;atlasRevision:string;atlasTarget:string;
};
export type ResolvedLectureBodyReference={
  label:string;atlasHref:string;scopeNote:string;structureId:string;region:string;
  side:'both'|'left'|'right';atlasRevision:string;
};
type BodyRow=[string,string,string,string,number,'both'|'left'|'right',number,string[],string];
type BodyIndex={schema:string;sourceCommit:string;catalogSha256:string;
  regions:[string,string][];bundles:string[];rows:BodyRow[]};
const index=indexJson as unknown as BodyIndex;
const fields=['kind','structureId','region','side','sourceSha256','atlasRevision','atlasTarget'] as const;
const hex64=/^[a-f0-9]{64}$/;
const hex40=/^[a-f0-9]{40}$/;
const identity=/^[a-zA-Z0-9:_-]{1,240}$/;
const regionId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const targetPrefix='/atlas/3d?';
const scope='Source-based 3D anatomy reference; anatomical review pending. No image registration or clinical approval.';
const rowById=new Map<string,BodyRow>(index.rows.map(row=>[row[0],row]));
const validIndex=index.schema==='vm-lecture-body-catalog-v1'&&hex40.test(index.sourceCommit)&&
  hex64.test(index.catalogSha256)&&Array.isArray(index.regions)&&index.regions.length>0&&
  index.regions.every(region=>Array.isArray(region)&&region.length===2&&
    typeof region[0]==='string'&&regionId.test(region[0])&&
    typeof region[1]==='string'&&region[1].length>0)&&
  new Set(index.regions.map(region=>region[0])).size===index.regions.length&&
  Array.isArray(index.bundles)&&index.bundles.length>0&&
  index.bundles.every(bundle=>typeof bundle==='string'&&hex64.test(bundle))&&
  Array.isArray(index.rows)&&index.rows.length>0&&
  index.rows.every(row=>Array.isArray(row)&&row.length===9&&
    typeof row[0]==='string'&&identity.test(row[0])&&
    typeof row[1]==='string'&&row[1].length>0&&
    typeof row[2]==='string'&&typeof row[3]==='string'&&
    Number.isInteger(row[4])&&row[4]>=0&&row[4]<index.regions.length&&
    ['both','left','right'].includes(row[5])&&
    Number.isInteger(row[6])&&row[6]>=0&&row[6]<index.bundles.length&&
    Array.isArray(row[7])&&row[7].every(alias=>typeof alias==='string')&&
    typeof row[8]==='string')&&rowById.size===index.rows.length;

function current():boolean{
  const file=runtimeManifest.files.find(item=>item.path==='models/bodyparts3d/full-body/catalog.json');
  return validIndex&&runtimeManifest.sourceCommit===index.sourceCommit&&
    file?.sha256===index.catalogSha256;
}
function href(row:BodyRow):string{
  const [structureId,, , ,regionIndex,side,bundleIndex]=row;
  return targetPrefix+new URLSearchParams({region:index.regions[regionIndex][0],
    atlasRevision:index.sourceCommit,study:'1',structure:structureId,side,
    source:index.bundles[bundleIndex]}).toString();
}
function fromRow(row:BodyRow):LectureBodyReference{
  return {kind:'body-structure-v1',structureId:row[0],region:index.regions[row[4]][0],
    side:row[5],sourceSha256:index.bundles[row[6]],atlasRevision:index.sourceCommit,
    atlasTarget:href(row)};
}
function validTarget(value:unknown):value is string{
  return typeof value==='string'&&value.length>targetPrefix.length&&value.length<=2048&&
    value.startsWith(targetPrefix)&&!/[\u0000-\u0020\u007f-\u009f\\#]/.test(value);
}
/** Saved snapshots remain parseable when their source is stale. Never navigate from this alone. */
export function validateLectureBodyReference(value:unknown):LectureBodyReference{
  if(!value||typeof value!=='object'||Array.isArray(value)||
    (Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null))
    throw new Error('Invalid lecture body reference');
  const keys=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);
  if(keys.length!==fields.length||keys.some(key=>!fields.includes(key as never))||
    fields.some(key=>!descriptors[key]||!Object.hasOwn(descriptors[key],'value')))
    throw new Error('Invalid lecture body reference fields');
  const result=Object.fromEntries(fields.map(key=>[key,descriptors[key].value])) as LectureBodyReference;
  if(result.kind!=='body-structure-v1'||typeof result.structureId!=='string'||!identity.test(result.structureId)||
    typeof result.region!=='string'||!regionId.test(result.region)||
    typeof result.side!=='string'||!['both','left','right'].includes(result.side)||
    typeof result.sourceSha256!=='string'||!hex64.test(result.sourceSha256)||
    typeof result.atlasRevision!=='string'||!hex40.test(result.atlasRevision)||
    !validTarget(result.atlasTarget))throw new Error('Invalid lecture body reference value');
  return result;
}
/** One to six saved pins, with exact duplicates refused and input cloned. */
export function validateLectureBodyReferences(value:unknown):LectureBodyReference[]{
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||
    value.length<1||value.length>6)throw new Error('Invalid lecture body references');
  const keys=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);
  if(keys.length!==value.length+1||keys.some(key=>key!=='length'&&
    (typeof key!=='string'||!/^(?:0|[1-9]\d*)$/.test(key)||Number(key)>=value.length)))
    throw new Error('Invalid lecture body references');
  const seen=new Set<string>(),result:LectureBodyReference[]=[];
  for(let i=0;i<value.length;i++){
    if(!descriptors[i]||!Object.hasOwn(descriptors[i],'value'))throw new Error('Invalid lecture body references');
    const reference=validateLectureBodyReference(descriptors[i].value);
    const key=JSON.stringify(fields.map(field=>reference[field]));
    if(seen.has(key))throw new Error('Duplicate lecture body reference');
    seen.add(key);result.push(reference);
  }
  return result;
}
/** Malformed saved body collections have no navigation fallback. */
export function lectureSlideBodyReferences(slide:unknown):LectureBodyReference[]{
  if(!slide||typeof slide!=='object'||Array.isArray(slide))return [];
  try{
    const descriptor=Object.getOwnPropertyDescriptor(slide,'bodyAnatomyReferences');
    return descriptor&&Object.hasOwn(descriptor,'value')
      ?validateLectureBodyReferences(descriptor.value):[];
  }catch{return [];}
}
export function createLectureBodyReference(id:string):LectureBodyReference|null{
  if(typeof id!=='string'||!current())return null;
  const row=rowById.get(id);
  return row?fromRow(row):null;
}
/** Recompute every identity field and the canonical destination from the current public source. */
export function resolveLectureBodyReference(value:unknown):ResolvedLectureBodyReference|null{
  let saved:LectureBodyReference;
  try{saved=validateLectureBodyReference(value);}catch{return null;}
  if(!current())return null;
  const row=rowById.get(saved.structureId);
  if(!row)return null;
  const fresh=fromRow(row);
  if(fields.some(field=>saved[field]!==fresh[field]))return null;
  return {label:row[1],atlasHref:fresh.atlasTarget,
    scopeNote:row[8]?`Partial source representation. ${row[8]} ${scope}`:scope,
    structureId:saved.structureId,region:saved.region,side:saved.side,atlasRevision:saved.atlasRevision};
}
export const lectureBodyRegions=index.regions.map(([id,label])=>({id,label}));
const words=/[\p{L}\p{N}]+/gu;
function normalized(value:string):string{return (value.normalize('NFKC').toLowerCase().match(words)??[]).join(' ');}
function matchRank(row:BodyRow,query:string):number|null{
  const requestedSide=query.startsWith('left ')?'left':query.startsWith('right ')?'right':null;
  if(requestedSide&&row[5]!==requestedSide)return null;
  const bareQuery=requestedSide?query.slice(requestedSide.length+1):query;
  const fieldsToSearch=[row[1],row[0],row[3],...row[7],row[2]];
  const normalizedFields=fieldsToSearch.map(normalized);
  if(normalizedFields[0]===query)return 0;
  if(normalizedFields[1]===query||normalizedFields[2]===query)return 1;
  if(normalizedFields.slice(3,-1).includes(query)||
    (requestedSide&&normalizedFields.slice(3,-1).includes(bareQuery)))return 2;
  if(normalizedFields[0].startsWith(query))return 3;
  const words=query.split(' ');
  if(words.every(word=>normalizedFields[0].split(' ').includes(word)))return 4;
  if(normalizedFields.slice(1).some(field=>[query,bareQuery].some(candidate=>
    field===candidate||field.startsWith(candidate)||
    candidate.split(' ').every(word=>field.split(' ').includes(word)))))return 5;
  return null;
}
/** Explicit picker candidates only; text never creates a slide pin automatically. */
export function lectureBodyOptions(query:unknown,region='all'):{reference:LectureBodyReference;label:string;scopeNote:string;region:string}[]{
  if(typeof query!=='string'||query.length>80||/[\p{C}%_*<>]/u.test(query)||
    (region!=='all'&&!lectureBodyRegions.some(item=>item.id===region))||!current())return [];
  const normalizedQuery=normalized(query);
  if(normalizedQuery&&normalizedQuery.replaceAll(' ','').length<2)return [];
  if(!normalizedQuery&&region==='all')return [];
  const ranked=index.rows.flatMap(row=>{
    const rowRegion=index.regions[row[4]][0];
    if(region!=='all'&&rowRegion!==region)return [];
    const rank=normalizedQuery?matchRank(row,normalizedQuery):0;
    return rank===null?[]:[{row,rank}];
  }).sort((a,b)=>a.rank-b.rank||a.row[1].localeCompare(b.row[1],'en')||a.row[0].localeCompare(b.row[0],'en'));
  return ranked.slice(0,12).map(({row})=>({reference:fromRow(row),label:row[1],
    scopeNote:row[8]?`Partial source representation. ${row[8]} ${scope}`:scope,
    region:index.regions[row[4]][0]}));
}

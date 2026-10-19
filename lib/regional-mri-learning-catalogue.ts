import raw from '../atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import review from '../atlas-review/manifest.json';
import {bodyDisplayCatalog} from '../atlas-review/lib/body-display-catalog';
import {bodyTeachingLoader} from '../atlas-review/lib/body-teaching-loader';
import {kneeDefinition} from '../atlas-review/lib/um-limb-studies';
import {specimenTeachingFor} from '../atlas-review/lib/um-limb-teaching';
import {specimenClinicalReferences} from '../atlas-review/content/um-limb-clinical';
import {parseStudyLink,resolveStudyLink} from '../atlas-review/lib/study-links';
import {parseSpecimenLink} from '../atlas-review/lib/specimen-links';
import {resolveSpecimenLink} from '../atlas-review/lib/um-limb-navigation';
import type {BodyCatalog} from '../atlas-review/app/body-types';
import {kneeReferenceSpecs,kneeBodyReferenceId,kneeReferencePin} from './regional-knee-3d-mappings';
import type {Regional3dCatalogue,Regional3dTarget} from './regional-mri-3d-comparison';
import {regionalLearningTopics,regionalLearningLabels,regionalLearningRevision,regionalLearningEntryValid,
 type RegionalLearningCatalogue,type RegionalLearningEntry,type RegionalLearningReference,type RegionalLearningSection} from './regional-mri-learning';

const canonical=bodyDisplayCatalog(raw as unknown as BodyCatalog);
const structures=new Map(canonical.structures.map(s=>[s.id,JSON.stringify(s)]));
const bundles=new Map(canonical.bundles.map(b=>[b.id,JSON.stringify(b)]));
const hash=/^[a-f0-9]{64}$/;
const pending=(id:typeof regionalLearningTopics[number]):RegionalLearningSection=>({id,title:regionalLearningLabels[id],body:'Pending source-bound teaching.',bullets:[],note:null,readiness:'pending',references:[]});
const referenceTitles=new Map(Object.values(specimenClinicalReferences).map(ref=>[ref.url,ref.title]));
function references(urls:readonly string[]|undefined):RegionalLearningReference[]{
 return [...new Set((urls??[]).filter(url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname!=='localhost';}catch{return false;}}))]
  .map(url=>({url,title:referenceTitles.get(url)??url}));
}
function targetMatches(target:Regional3dTarget,row:Regional3dCatalogue['entries'][number],catalog:BodyCatalog):boolean{
 const spec=kneeReferenceSpecs.find(s=>s.anatomyId===row.anatomyId&&s.kind===target.kind&&s.relation===target.relation);
 if(!spec||target.region!==spec.region||target.relation!==spec.relation||!hash.test(target.sourceHash)||target.label!==kneeReferencePin(spec,row.sourceSide).label||
  target.sourceHash!==kneeReferencePin(spec,row.sourceSide).sourceHash||target.specimenRevision!==kneeReferencePin(spec,row.sourceSide).specimenRevision)return false;
 const url=new URL(target.href,'https://visible-medicine.invalid'),keys=[...url.searchParams.keys()];
 if(!target.href.startsWith('/atlas/')||url.origin!=='https://visible-medicine.invalid'||url.username||url.password||url.hash||new Set(keys).size!==keys.length)return false;
 if(spec.kind==='body'){
  const matches=catalog.structures.filter(s=>s.id===target.id),s=matches[0];
  if(matches.length!==1||target.id!==kneeBodyReferenceId(spec,row.sourceSide)||target.side!==row.sourceSide||target.specimenRevision!==null||
   !s||structures.get(s.id)!==JSON.stringify(s)||s.laterality!==row.sourceSide)return false;
  const found=catalog.bundles.filter(b=>b.id===s.bundle),b=found[0];
  if(found.length!==1||!b||bundles.get(b.id)!==JSON.stringify(b)||b.sha256!==target.sourceHash||s.name!==target.label)return false;
  if(url.pathname!=='/atlas/3d'||keys.length!==6||url.searchParams.get('region')!==spec.region||url.searchParams.get('study')!=='1'||
   url.searchParams.get('structure')!==target.id||url.searchParams.get('side')!==target.side||url.searchParams.get('source')!==target.sourceHash||
   url.searchParams.get('atlasRevision')!==review.revision)return false;
  return resolveStudyLink(catalog,spec.region,parseStudyLink(Object.fromEntries(url.searchParams))).status==='ready';
 }
 const surface=kneeDefinition.surfaces.find(s=>s.slug===spec.slug);
 if(!surface||target.id!==surface.id||target.side!=='right'||surface.laterality!=='right-source-report'||
  url.pathname!=='/atlas/lower-limb-3d'||keys.length!==7||url.searchParams.get('atlasRevision')!==review.revision)return false;
 const parsed=parseSpecimenLink(Object.fromEntries(url.searchParams));
 return parsed.status==='requested'&&parsed.request.scope==='knee'&&resolveSpecimenLink(parsed).status==='ready'&&parsed.request.structureId===surface.id&&
  parsed.request.sourceHash===target.sourceHash&&parsed.request.revision===target.specimenRevision&&surface.name===target.label&&
  url.searchParams.get('specimenView')==='anterior';
}
async function project(target:Regional3dTarget,catalog:BodyCatalog,atlasRevision:string,mappingRevision:string):Promise<RegionalLearningEntry|null>{
 const targetIdentity={id:target.id,kind:target.kind,label:target.label,side:target.side,sourceHash:target.sourceHash,
  specimenRevision:target.specimenRevision,relation:target.relation};
 let topics:RegionalLearningSection[]=[],limitations:string[]=[],reflection:RegionalLearningEntry['reflection']=null;
 if(target.kind==='specimen'){
  const surface=kneeDefinition.surfaces.find(s=>s.id===target.id);
  if(!surface)return null;
  const lesson=specimenTeachingFor(kneeDefinition,surface);
  if(!lesson)return null;
  topics=regionalLearningTopics.map(id=>{
   if(id==='anatomy'||id==='function')return {id,title:regionalLearningLabels[id],body:lesson[id],bullets:[],note:null,readiness:'draft',references:references(lesson.references)};
   const draft=lesson.extended?.topics[id];
   return draft?.readiness==='draft'?{id,title:regionalLearningLabels[id],body:draft.body,bullets:[],note:null,readiness:'draft',references:references(draft.references)}:pending(id);
  });
  limitations=[kneeDefinition.limitations,...(lesson.extended?.modelLimit?[lesson.extended.modelLimit]:[])];
  const check=lesson.extended?.selfCheck;
  if(check?.question&&check.answer)reflection={question:check.question,answer:check.answer,references:references(check.references)};
 }else{
  const s=catalog.structures.find(s=>s.id===target.id);
  if(!s)return null;
  const reader=await bodyTeachingLoader.load(s);
  if(!reader.accepts(s))return null;
  topics=regionalLearningTopics.map(id=>{
   const lesson=reader.bodyLesson(s,id);
   if(lesson.readiness!=='draft')return pending(id);
   return {id,title:lesson.title,body:lesson.body,bullets:lesson.bullets??[],note:lesson.note??null,readiness:'draft',references:references(lesson.citations)};
  });
  limitations=s.coverageNote?[s.coverageNote]:[];
  const quiz=reader.bodyLesson(s,'quiz');
  if(quiz.readiness==='draft'&&quiz.body&&quiz.correctAnswer&&quiz.explanation)
   reflection={question:quiz.body,answer:quiz.correctAnswer+' — '+quiz.explanation,references:references(quiz.citations)};
 }
 const content={target:targetIdentity,topics,limitations,reflection};
 const entry={...content,revision:await regionalLearningRevision(atlasRevision,mappingRevision,content)};
 return regionalLearningEntryValid(entry)?entry:null;
}

/** Server-only public teaching projection. Missing source binding omits the entry. */
export async function buildRegionalLearningCatalogue(base:Regional3dCatalogue,catalog:BodyCatalog=canonical):Promise<RegionalLearningCatalogue|null>{
 try{
  if(base.schema!=='visible-medicine.regional-mri-3d/1'||base.atlasRevision!==review.revision||!hash.test(base.mriRevision)||
   !hash.test(base.mappingRevision)||!Array.isArray(base.entries)||base.entries.length>200)return null;
  const bytes=new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:base.atlasRevision,entries:base.entries}));
  const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(actual!==base.mappingRevision)return null;
  const entries:RegionalLearningEntry[]=[],seen=new Set<string>(),rows=new Set<string>();
  for(const row of base.entries){
   const rowKey=row.anatomyId+'|'+row.sourceSide;
   if(rows.has(rowKey)||!['left','right'].includes(row.sourceSide)||!kneeReferenceSpecs.some(s=>s.anatomyId===row.anatomyId)||
    !Array.isArray(row.targets)||!row.targets.length||row.targets.length>3)return null;
   rows.add(rowKey);
   for(const target of row.targets){
    if(!targetMatches(target,row,catalog))return null;
    const key=target.id+'|'+target.relation;
    if(seen.has(key))continue;
    seen.add(key);
    if(seen.size>100)return null;
    const entry=await project(target,catalog,base.atlasRevision,base.mappingRevision);
    if(entry)entries.push(entry);
   }
  }
  return {schema:'visible-medicine.regional-reference-learning/1',atlasRevision:base.atlasRevision,mappingRevision:base.mappingRevision,entries};
 }catch{return null;}
}

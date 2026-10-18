import {regionalMri3dComparison,type Regional3dCatalogue,type Regional3dTarget} from './regional-mri-3d-comparison.ts';
import type {RegionalMriPackage,RegionalLoadedSeries,RegionalLoadedAnnotation} from './regional-mri-package.ts';

export const regionalLearningTopics=['anatomy','function','mri','ct','xray','ultrasound','pathology','clinical'] as const;
export type RegionalLearningTopic=typeof regionalLearningTopics[number];
export const regionalLearningLabels:Record<RegionalLearningTopic,string>={anatomy:'Anatomy',function:'Function',mri:'MRI',ct:'CT',xray:'X-ray',ultrasound:'Ultrasound',pathology:'Pathology',clinical:'Clinical'};
export type RegionalLearningReference={url:string;title:string};
export type RegionalLearningSection={id:RegionalLearningTopic;title:string;body:string;bullets:string[];note:string|null;readiness:'draft'|'pending'|'identity-only';references:RegionalLearningReference[]};
export type RegionalLearningTarget=Pick<Regional3dTarget,'id'|'kind'|'label'|'side'|'sourceHash'|'specimenRevision'|'relation'>;
export type RegionalLearningEntry={target:RegionalLearningTarget;revision:string;topics:RegionalLearningSection[];limitations:string[];reflection:{question:string;answer:string;references:RegionalLearningReference[]}|null};
export type RegionalLearningCatalogue={schema:'visible-medicine.regional-reference-learning/1';atlasRevision:string;mappingRevision:string;entries:RegionalLearningEntry[]};
export type RegionalMriLearning={key:string;atlasRevision:string;mappingRevision:string;entry:Readonly<RegionalLearningEntry>;target:Readonly<Regional3dTarget&{oppositeSide:boolean}>};
const owned=new WeakSet<object>(),hash=/^[a-f0-9]{64}$/;
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...keys].sort().join('|');
const text=(v:unknown,max=12000):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const strings=(v:unknown,max=32):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(s=>text(s));
function references(v:unknown):v is RegionalLearningReference[]{
 return Array.isArray(v)&&v.length<=32&&v.every(r=>{
  if(!exact(r,['url','title'])||!text(r.title,600)||!r.title||!text(r.url,2000))return false;
  try{const u=new URL(r.url);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!u.hostname.endsWith('.localhost')&&!u.hostname.endsWith('.local')&&!/^(?:[\d.]+|\[.*\])$/.test(u.hostname);}catch{return false;}
 });
}
export function regionalLearningEntryValid(v:unknown):v is RegionalLearningEntry{
 if(!exact(v,['target','revision','topics','limitations','reflection'])||typeof v.revision!=='string'||!hash.test(v.revision)||
  !exact(v.target,['id','kind','label','side','sourceHash','specimenRevision','relation'])||!strings(v.limitations,16)||
  !Array.isArray(v.topics)||v.topics.length!==regionalLearningTopics.length)return false;
 const t=v.target;
 if(!text(t.id,240)||!t.id||!text(t.label,600)||!t.label||!['body','specimen'].includes(String(t.kind))||!['left','right'].includes(String(t.side))||
  typeof t.sourceHash!=='string'||!hash.test(t.sourceHash)||!(t.specimenRevision===null||typeof t.specimenRevision==='string'&&hash.test(t.specimenRevision))||
  !['same-structure','parent-reference','group-reference'].includes(String(t.relation)))return false;
 if(new Set(v.topics.map(s=>s?.id)).size!==regionalLearningTopics.length)return false;
 for(const s of v.topics){if(!exact(s,['id','title','body','bullets','note','readiness','references'])||!regionalLearningTopics.includes(s.id as RegionalLearningTopic)||
  !text(s.title,600)||!s.title||!text(s.body)||!s.body||!strings(s.bullets)||!(s.note===null||text(s.note,6000))||
  !['draft','pending','identity-only'].includes(String(s.readiness))||!references(s.references))return false;}
 return v.reflection===null||exact(v.reflection,['question','answer','references'])&&text(v.reflection.question)&&!!v.reflection.question&&text(v.reflection.answer)&&!!v.reflection.answer&&references(v.reflection.references);
}
const canonical=(v:unknown):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}':JSON.stringify(v);
/** Content integrity only, never authorization, clinical acceptance or registration. */
export async function regionalLearningRevision(atlasRevision:string,mappingRevision:string,entry:Omit<RegionalLearningEntry,'revision'>):Promise<string>{
 const bytes=new TextEncoder().encode(canonical({schema:'visible-medicine.regional-reference-learning/1',atlasRevision,mappingRevision,entry}));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
}
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v);}return v;}
export function isRegionalMriLearning(v:unknown):v is RegionalMriLearning{return !!v&&typeof v==='object'&&owned.has(v);}
/** Verified local MRI geometry and explicit current public mapping precede teaching. */
export async function resolveRegionalMriLearning(source:{revision:string;region:string},catalogue:Regional3dCatalogue|null,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,targetId:string):Promise<RegionalMriLearning|null>{
 try{
  const sourceRevision=source.revision;
  const comparison=regionalMri3dComparison(source,catalogue,pkg,study,overlay),learning=catalogue?.learning;
  if(!comparison||comparison.provisional||overlay.purpose!=='scoped-display'||overlay.annotation.review.status!=='accepted-scoped'||
   !exact(learning,['schema','atlasRevision','mappingRevision','entries'])||learning.schema!=='visible-medicine.regional-reference-learning/1'||
   learning.atlasRevision!==comparison.atlasRevision||learning.mappingRevision!==comparison.mappingRevision||!Array.isArray(learning.entries)||learning.entries.length>100||
   JSON.stringify(learning).length>2000000)return null;
  const targets=comparison.targets.filter(t=>t.id===targetId);if(targets.length!==1)return null;const target=targets[0];
  const entries=learning.entries.filter(e=>e?.target?.id===targetId&&e?.target?.relation===target.relation);if(entries.length!==1||!regionalLearningEntryValid(entries[0]))return null;
  // Detach before the digest await; later mutation must not alter checked text.
  const entry=structuredClone(entries[0]);for(const k of Object.keys(entry.target) as (keyof RegionalLearningTarget)[])if(entry.target[k]!==target[k])return null;
  const {revision,...content}=entry;if(await regionalLearningRevision(comparison.atlasRevision,comparison.mappingRevision,content)!==revision)return null;
  const result=freeze({key:JSON.stringify([sourceRevision,study.series.id,study.series.image.sha256,overlay.annotation.id,overlay.annotation.review.revision,comparison.atlasRevision,comparison.mappingRevision,target.id,target.relation,revision]),atlasRevision:comparison.atlasRevision,mappingRevision:comparison.mappingRevision,entry,target:structuredClone(target)});
  owned.add(result);return result;
 }catch{return null;}
}

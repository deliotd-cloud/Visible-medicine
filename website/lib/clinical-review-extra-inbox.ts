import type {InboxDescriptor,InboxItem,InboxStatus} from './clinical-review-inbox-contract.ts';
import {nativeGuideInboxCatalog,nativeGuideInboxStatuses} from './regional-guide-review-inbox.ts';
import {prostateReviewInboxCatalog,prostateReviewInboxStatuses} from './prostate-review-inbox.ts';
import {facialReviewInboxCatalog,facialReviewInboxStatuses} from './head-ct-facial-review-inbox.ts';
import {HEAD_MANIFEST_SHA256} from './head-atlas-import.ts';
import {headTeachingDraftContext,type HeadTeachingDraftKind} from './head-teaching-review-contract.ts';
import {headMriDraftContext} from './head-mri-review-draft-contract.ts';
import {getHeadTeachingDrafts} from './head-teaching-review-api.ts';
import {getHeadMriDrafts} from './head-mri-review-draft-api.ts';
import {parseHeadTeachingHistory} from './head-teaching-review-client.ts';
import {parseHeadMriHistory} from './head-mri-review-draft-client.ts';
import {validatePlexusReviewContext,parseSavedPlexusReview,plexusReviewStale} from './plexus-review-decisions.ts';
import {getPlexusReviews} from './plexus-review-api.ts';
import plexus from './plexus-review-manifest.json' with {type:'json'};
import optic from './optic-comparison-manifest.json' with {type:'json'};
import disc from './disc-comparison-manifest.json' with {type:'json'};
import foot from './foot-comparison-manifest.json' with {type:'json'};
import {deliverPlexusReview} from './plexus-review-delivery.ts';
import {deliverOpticComparison} from './optic-comparison-delivery.ts';
import {deliverDiscComparison} from './disc-comparison-delivery.ts';
import {deliverFootComparison} from './foot-comparison-delivery.ts';
import {plexusReviewAssets} from '../.local/plexus-review/assets.ts';
import {opticComparisonAssets} from '../.local/optic-review/assets.ts';
import {discComparisonAssets} from '../.local/disc-review/assets.ts';
import {footComparisonAssets} from '../.local/foot-review/assets.ts';
import {verifiedHeadAnatomyCheckRevision} from './head-anatomy-checks.ts';
import {verifiedHeadMriComparisonPacket} from './head-mri-comparison-review.ts';
import {verifiedHeadMriOnlyTeachingRevision} from './head-mri-only-teaching.ts';
import {verifiedHeadMriLearningRevision} from './head-mri-learning.ts';
import {verifiedHeadInsulaComparisonPacket} from './head-insula-comparison-review.ts';
import {verifiedHeadInsulaTeachingRevision} from './head-insula-teaching.ts';
import {verifiedHeadInsulaLearningRevision} from './head-insula-learning.ts';
import {verifiedHeadOrbitalComparisonPacket} from './head-orbital-comparison-review.ts';
import {verifiedHeadOrbitalTeachingRevision} from './head-orbital-teaching.ts';
import {verifiedHeadOrbitalLearningRevision} from './head-orbital-learning.ts';
import {verifiedHeadCtBoneComparisonPacket} from './head-ct-bone-comparison-review.ts';
import {verifiedHeadCtBoneTeachingRevision} from './head-ct-bone-teaching.ts';
import {verifiedHeadImageOnlyComparisonPacket} from './head-image-only-comparison-review.ts';
import {verifiedHeadCerebellarTeachingRevision} from './head-cerebellar-teaching.ts';
import {verifiedHeadCerebellarLearningRevision} from './head-cerebellar-learning.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from './head-atlas-learning.ts';
import {verifiedHeadCtBoneLearningRevision} from './head-ct-bone-learning.ts';
import {PAIRED_DECISION_CONCEPTS,IMAGE_ONLY_DECISION_CONCEPTS,pairedDecisionContext,pairedDecisionStale} from './head-paired-decision-contract.ts';
import {getPairedDecisions} from './head-paired-decision-api.ts';
import {parsePairedHistory} from './head-paired-decision-client.ts';
import {CT_ALL_BONE_DECISION_CONCEPTS,ctBoneDecisionContext,ctBoneDecisionStale} from './head-ct-bone-decision-contract.ts';
import {verifiedHeadCtFacialComparisonPacket} from './head-ct-facial-comparison-review.ts';
import {verifiedHeadCtFacialLearningRevision} from './head-ct-facial-learning.ts';
import {getCtBoneDecisions} from './head-ct-bone-decision-api.ts';
import {parseCtBoneHistory} from './head-ct-bone-decision-client.ts';
import {CT_BONE_TEACHING_DECISION_CONCEPTS,ctBoneTeachingDecisionContext,ctBoneTeachingDecisionStale} from './head-ct-bone-teaching-decision-contract.ts';
import {getCtBoneTeachingDecisions} from './head-ct-bone-teaching-decision-api.ts';
import {parseCtBoneTeachingHistory} from './head-ct-bone-teaching-decision-client.ts';

type Source=()=>Promise<unknown>;
type DecisionFamily='paired'|'ct-bone'|'ct-bone-teaching';
type Entry={key:string;title:string;anchor:string;track:string;capability:'corrections'|'decision'|'inspection-only';source:Source;kind?:HeadTeachingDraftKind|'mri-draft'|'plexus-topology'|'plexus-presentation';decision?:{family:DecisionFamily;concept:string};area?:'source-comparisons'};
const head=HEAD_MANIFEST_SHA256;
const digest=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),byte=>byte.toString(16).padStart(2,'0')).join('');
const verified=async(...values:unknown[])=>values.every(value=>value!==null&&value!==undefined&&value!==false)?digest([head,...values]):null;
const teaching=(kind:HeadTeachingDraftKind)=>async()=>headTeachingDraftContext(head,kind);
const headEntries:Entry[]=[
 ['anatomy','Head anatomy teaching','head-review-notes-title','Teaching corrections','anatomy'],
 ['brainstem-clinical','Brainstem clinical correlations','brainstem-clinical-review','Clinical corrections','brainstem-clinical'],
 ['ventricular-clinical','Ventricular clinical correlations','ventricular-clinical-review','Clinical corrections','ventricular-clinical'],
 ['cerebellar-clinical','Cerebellar clinical correlations','cerebellar-clinical-review','Clinical corrections','cerebellar-clinical'],
 ['deep-grey-clinical','Deep-grey clinical correlations','deep-grey-clinical-review','Clinical corrections','deep-grey-clinical'],
 ['lobar-clinical','Cerebral-lobe clinical correlations','lobar-clinical-review','Clinical corrections','lobar-clinical'],
 ['hippocampal-clinical','Hippocampal clinical correlations','hippocampal-clinical-review','Clinical corrections','hippocampal-clinical'],
 ['mri-only-clinical','MRI-only clinical correlations','mri-only-clinical-review','Clinical corrections','mri-only-clinical'],
 ['mri-anatomy-checks','MRI anatomy understanding checks','head-mri-anatomy-check-review','Question corrections','mri-anatomy-checks'],
].map(([key,title,anchor,track,kind])=>({key:`head:${key}`,title,anchor,track,capability:'corrections',kind:kind as HeadTeachingDraftKind,source:teaching(kind as HeadTeachingDraftKind)}));
headEntries.push({key:'head:mri-only-learning',title:'MRI-only learning corrections',anchor:'head-mri-review-notes-title',track:'MRI corrections',capability:'corrections',kind:'mri-draft',source:()=>headMriDraftContext(head)});
const inspection:Entry[]=[
 {key:'head:guided',title:'Head guided sequences',anchor:'head-guided-review',track:'Guided sequence inspection',source:async()=>{await headTeachingDraftContext(head);const packet=headLearningPacket();return await digest(packet)===HEAD_LEARNING_REVISION?HEAD_LEARNING_REVISION:null;},capability:'inspection-only'},
 {key:'head:anatomy-checks',title:'Head anatomy knowledge checks',anchor:'head-anatomy-check-review',track:'Question inspection',source:()=>verifiedHeadAnatomyCheckRevision(head),capability:'inspection-only'},
 {key:'head:mri-comparison',title:'MRI-only comparisons',anchor:'mri-only-comparisons',track:'Comparison inspection',source:()=>verifiedHeadMriComparisonPacket(head),capability:'inspection-only'},
 {key:'head:mri-teaching',title:'MRI-only teaching',anchor:'mri-only-comparisons',track:'Teaching inspection',source:()=>verifiedHeadMriOnlyTeachingRevision(head),capability:'inspection-only'},
 {key:'head:mri-learning',title:'MRI-only guided learning',anchor:'mri-only-comparisons',track:'Sequence inspection',source:()=>verifiedHeadMriLearningRevision(head),capability:'inspection-only'},
 {key:'head:insula-comparison',title:'Insula comparisons',anchor:'insula-comparisons',track:'Comparison inspection',source:()=>verifiedHeadInsulaComparisonPacket(head),capability:'inspection-only'},
 {key:'head:insula-teaching',title:'Insula teaching',anchor:'insula-comparisons',track:'Teaching inspection',source:()=>verifiedHeadInsulaTeachingRevision(head),capability:'inspection-only'},
 {key:'head:insula-learning',title:'Insula guided learning',anchor:'insula-comparisons',track:'Sequence inspection',source:()=>verifiedHeadInsulaLearningRevision(head),capability:'inspection-only'},
 {key:'head:orbital-comparison',title:'Globe comparisons',anchor:'orbital-comparisons',track:'Comparison inspection',source:()=>verifiedHeadOrbitalComparisonPacket(head),capability:'inspection-only'},
 {key:'head:orbital-teaching',title:'Globe teaching',anchor:'orbital-comparisons',track:'Teaching inspection',source:()=>verifiedHeadOrbitalTeachingRevision(head),capability:'inspection-only'},
 {key:'head:orbital-learning',title:'Orbital guided learning',anchor:'orbital-comparisons',track:'Sequence inspection',source:()=>verifiedHeadOrbitalLearningRevision(head),capability:'inspection-only'},
 {key:'head:ct-bone-comparison',title:'CT-only bone comparisons',anchor:'ct-bone-comparisons',track:'Comparison inspection',source:()=>verifiedHeadCtBoneComparisonPacket(head),capability:'inspection-only'},
 {key:'head:ct-facial-comparison',title:'CT-only facial bone comparisons',anchor:'ct-facial-bone-comparisons',track:'Independent comparison inspection',source:()=>verifiedHeadCtFacialComparisonPacket(head),capability:'inspection-only'},
 {key:'head:ct-bone-teaching',title:'CT-only bone teaching',anchor:'ct-bone-comparisons',track:'Teaching inspection',source:()=>verifiedHeadCtBoneTeachingRevision(head),capability:'inspection-only'},
 {key:'head:ct-bone-learning',title:'CT-only bone guided learning',anchor:'ct-bone-comparisons',track:'Sequence inspection',source:()=>verifiedHeadCtBoneLearningRevision(head),capability:'inspection-only'},
 {key:'head:ct-facial-learning',title:'CT facial bone guided learning',anchor:'ct-facial-learning',track:'Independent sequence inspection',source:()=>verifiedHeadCtFacialLearningRevision(head),capability:'inspection-only'},
 {key:'head:image-only-comparison',title:'Cerebellar CT/MRI image comparisons',anchor:'image-only-comparisons',track:'Comparison inspection',source:()=>verifiedHeadImageOnlyComparisonPacket(head),capability:'inspection-only'},
 {key:'head:cerebellar-teaching',title:'Cerebellar image teaching',anchor:'image-only-comparisons',track:'Teaching inspection',source:()=>verifiedHeadCerebellarTeachingRevision(head),capability:'inspection-only'},
 {key:'head:cerebellar-learning',title:'Cerebellar guided learning',anchor:'image-only-comparisons',track:'Sequence inspection',source:()=>verifiedHeadCerebellarLearningRevision(head),capability:'inspection-only'},
];
const decisions:Entry[]=[
 ...[...PAIRED_DECISION_CONCEPTS,...IMAGE_ONLY_DECISION_CONCEPTS].map(concept=>({key:`head:paired:${concept}`,title:`${concept.replaceAll('-',' ')} semantic comparison`,anchor:`${concept.startsWith('cortex-')?'head-insula-comparison':concept.startsWith('orbit-')?'head-orbital-comparison':'head-image-only-comparison'}-${concept}`,track:'Personal semantic decision',capability:'decision' as const,decision:{family:'paired' as const,concept},source:()=>pairedDecisionContext(head,concept)})),
 ...CT_ALL_BONE_DECISION_CONCEPTS.map(concept=>({key:`head:ct-bone:${concept}`,title:`${concept.replaceAll('-',' ')} semantic comparison`,anchor:`head-ct-bone-comparison-${concept}`,track:'Personal CT bone comparison decision',capability:'decision' as const,decision:{family:'ct-bone' as const,concept},source:()=>ctBoneDecisionContext(head,concept)})),
 ...CT_BONE_TEACHING_DECISION_CONCEPTS.map(concept=>({key:`head:ct-bone-teaching:${concept}`,title:`${concept.replaceAll('-',' ')} teaching`,anchor:`head-ct-bone-comparison-${concept}`,track:'Personal CT bone teaching decision',capability:'decision' as const,decision:{family:'ct-bone-teaching' as const,concept},source:()=>ctBoneTeachingDecisionContext(head,concept)})),
];
const assetRequest=(path:string,revision:string)=>new Request(`https://private.invalid/api/atlas-review/source-comparisons/${path}?revision=${revision}`,{method:'HEAD'});
async function verifiedAssets(packet:{files:{name:string}[];reportSha256?:string;revision?:string;context?:unknown},name:'plexus'|'optic'|'disc'|'foot'){
 const revision=name==='plexus'?validatePlexusReviewContext(packet.context).materialHash:name==='foot'?packet.revision:packet.reportSha256;
 if(!revision||!/^[a-f0-9]{64}$/.test(revision)||!Array.isArray(packet.files)||!packet.files.length)throw Error('Invalid held packet.');
 for(const file of packet.files){
  const response=name==='plexus'?await deliverPlexusReview(assetRequest(`${name}/${file.name}`,revision),plexus,plexusReviewAssets):name==='optic'?await deliverOpticComparison(assetRequest(`${name}/${file.name}`,revision),optic,opticComparisonAssets):name==='disc'?await deliverDiscComparison(assetRequest(`${name}/${file.name}`,revision),disc,discComparisonAssets):await deliverFootComparison(assetRequest(`${name}/${file.name}`,revision),foot,footComparisonAssets);
  if(!response.ok)throw Error('Held source comparison changed.');
 }
 return revision;
}
const held:Entry[]=[
 {key:'source:plexus-topology',title:'Original plexus schematic · topology',anchor:'',track:'Topology decision',area:'source-comparisons',capability:'decision',kind:'plexus-topology',source:()=>verifiedAssets(plexus,'plexus')},
 {key:'source:plexus-presentation',title:'Original plexus schematic · presentation',anchor:'',track:'Presentation decision',area:'source-comparisons',capability:'decision',kind:'plexus-presentation',source:()=>verifiedAssets(plexus,'plexus')},
 {key:'source:optic',title:'Held optic nerve alternatives',anchor:'',track:'Source inspection',area:'source-comparisons',capability:'inspection-only',source:()=>verifiedAssets(optic,'optic')},
 {key:'source:disc',title:'Held unresolved disc',anchor:'',track:'Source inspection',area:'source-comparisons',capability:'inspection-only',source:()=>verifiedAssets(disc,'disc')},
 {key:'source:foot',title:'Held foot interossei source specimen',anchor:'',track:'Source inspection',area:'source-comparisons',capability:'inspection-only',source:()=>verifiedAssets(foot,'foot')},
];
const entries=[...headEntries,...decisions,...inspection,...held];
const entryByKey=new Map(entries.map(entry=>[entry.key,entry]));
async function revision(entry:Entry){try{
 const source=await entry.source();
 if(source===null||source===undefined||source===false)return null;
 if(entry.kind==='plexus-topology'||entry.kind==='plexus-presentation')return validatePlexusReviewContext(plexus.context).revisions[entry.kind.slice(7) as 'topology'|'presentation'];
 if(entry.key==='source:optic'||entry.key==='source:disc'||entry.key==='source:foot')return source as string;
 return await verified(source);
 }catch{return null;}}
export async function extraInboxCatalog():Promise<InboxDescriptor[]>{
 const previous=await Promise.all(entries.map(async entry=>({key:entry.key,title:entry.title,area:entry.area??'head-learning' as const,scopeLabel:entry.area?'Held source comparison; no learner admission':entry.decision?'Personal educational decision; no clinical approval':'CT/MRI head learning; no clinical approval',href:entry.area?`/workspace/atlas-review/source-comparisons/${entry.key.startsWith('source:plexus')?'plexus':entry.key.slice(7)}`:`/workspace/atlas-review/head-learning#${entry.anchor}`,trackLabel:entry.track,revision:await revision(entry),capability:entry.capability})));
 return [...previous,...await nativeGuideInboxCatalog(),...await facialReviewInboxCatalog(),...await prostateReviewInboxCatalog()];
}
// Core GET handlers retain their server-injected identity. The adapter removes caller query parameters.
const cleanRequest=(request:Request,path:string,query='')=>new Request(new URL(path+query,request.url),{method:'GET',headers:request.headers});
function confirmedDb(db:Pick<D1Database,'prepare'>|undefined):Pick<D1Database,'prepare'>|undefined{
 if(!db)return undefined;
 return {prepare(sql:string){
  if(!/^\s*SELECT\b/i.test(sql))throw Error('Inbox is read-only.');
  const statement=db.prepare(sql);
  return {bind(...args:unknown[]){const bound=statement.bind(...args);return {async all(){const result=await bound.all();if(!result||result.success!==true||!Array.isArray(result.results))throw Error('Unconfirmed review history read.');return result;}};}} as ReturnType<D1Database['prepare']>;
 }};
}
async function historyStatus(request:Request,db:Pick<D1Database,'prepare'>|undefined,entry:Entry):Promise<InboxStatus>{
 const checked=confirmedDb(db);
 if(entry.decision){
  const {family,concept}=entry.decision;
  if(family==='paired'){
   const expected=await pairedDecisionContext(head,concept),response=await getPairedDecisions(cleanRequest(request,'/api/atlas-review/head-paired-comparisons',`?concept=${concept}`),checked,head);
   if(!response.ok)return 'unavailable';
   const latest=parsePairedHistory(await response.json(),expected).history[0];
   return !latest?'not-started':pairedDecisionStale(latest,expected)?'re-review':latest.decision.status==='accepted-semantic'?'approval-recorded':latest.decision.status==='changes-required'?'changes-required':'in-progress';
  }
  if(family==='ct-bone'){
   const expected=await ctBoneDecisionContext(head,concept),response=await getCtBoneDecisions(cleanRequest(request,'/api/atlas-review/head-ct-bone',`?concept=${concept}`),checked,head);
   if(!response.ok)return 'unavailable';
   const latest=parseCtBoneHistory(await response.json(),expected).history[0];
   return !latest?'not-started':ctBoneDecisionStale(latest,expected)?'re-review':latest.decision.status==='accepted-semantic'?'approval-recorded':latest.decision.status==='changes-required'?'changes-required':'in-progress';
  }
  const expected=await ctBoneTeachingDecisionContext(head,concept),response=await getCtBoneTeachingDecisions(cleanRequest(request,'/api/atlas-review/head-ct-bone-teaching',`?concept=${concept}`),checked,head);
  if(!response.ok)return 'unavailable';
  const latest=parseCtBoneTeachingHistory(await response.json(),expected).history[0];
  return !latest?'not-started':ctBoneTeachingDecisionStale(latest,expected)?'re-review':latest.decision.status==='accepted-teaching'?'approval-recorded':latest.decision.status==='changes-required'?'changes-required':'in-progress';
 }
 if(entry.kind==='mri-draft'){
  const expected=await headMriDraftContext(head),response=await getHeadMriDrafts(cleanRequest(request,'/api/atlas-review/head-mri-review'),checked,head);
  if(!response.ok)return 'unavailable';
  const parsed=parseHeadMriHistory(await response.json(),expected),latest=parsed.history[0];
  return !latest?'not-started':JSON.stringify(latest.context)!==JSON.stringify(expected)?'re-review':latest.draft.status==='changes-required'?'changes-required':'in-progress';
 }
 if(entry.kind==='plexus-topology'||entry.kind==='plexus-presentation'){
  const track=entry.kind.slice(7) as 'topology'|'presentation',context=validatePlexusReviewContext(plexus.context);
  const response=await getPlexusReviews(cleanRequest(request,'/api/atlas-review/plexus-review',`?track=${track}`),checked);
  if(!response.ok)return 'unavailable';
  const raw:unknown=await response.json();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid plexus history response.');
  const value=raw as Record<string,unknown>;
  if(value.scope!=='private-to-signed-in-user'||value.track!==track||JSON.stringify(value.context)!==JSON.stringify(context)||!Array.isArray(value.history))throw Error('Invalid plexus history response.');
  const history=value.history.map(parseSavedPlexusReview);
  if(history.length>20||value.nextBefore!==(history.length===20?history.at(-1)?.version:null)||history.some((record,index)=>record.track!==track||index>0&&record.version>=history[index-1].version))throw Error('Invalid plexus history order.');
  const latest=history[0];
  return !latest?'not-started':plexusReviewStale(latest,context)||JSON.stringify(latest.context)!==JSON.stringify(context)?'re-review':latest.status==='approved'?'approval-recorded':latest.status==='changes-required'?'changes-required':'in-progress';
 }
 const kind=entry.kind as HeadTeachingDraftKind,expected=await headTeachingDraftContext(head,kind);
 const response=await getHeadTeachingDrafts(cleanRequest(request,`/api/atlas-review/head-${kind}`),checked,head,kind);
 if(!response.ok)return 'unavailable';
 const parsed=parseHeadTeachingHistory(await response.json(),expected),latest=parsed.history[0];
 return !latest?'not-started':JSON.stringify(latest.context)!==JSON.stringify(expected)?'re-review':latest.draft.status==='changes-required'?'changes-required':'in-progress';
}
export async function extraInboxStatuses(request:Request,db:Pick<D1Database,'prepare'>|undefined,catalog:InboxDescriptor[]):Promise<InboxItem[]>{
 const output:InboxItem[]=[];
 const native=new Map((await nativeGuideInboxStatuses(request,confirmedDb(db),catalog.filter(d=>d.key.startsWith('native-guide:')))).map(d=>[d.key,d]));
 const facial=new Map((await facialReviewInboxStatuses(request,confirmedDb(db),catalog.filter(d=>d.key.startsWith('head:ct-facial-review:')))).map(d=>[d.key,d]));
 const prostate=new Map((await prostateReviewInboxStatuses(request,confirmedDb(db),catalog.filter(d=>d.key==='schematic:prostate-zones:inspection'))).map(d=>[d.key,d]));
 for(const descriptor of catalog){
  if(native.has(descriptor.key)){output.push(native.get(descriptor.key)!);continue;}
  if(facial.has(descriptor.key)){output.push(facial.get(descriptor.key)!);continue;}
  if(prostate.has(descriptor.key)){output.push(prostate.get(descriptor.key)!);continue;}
  const entry=entryByKey.get(descriptor.key);
  let status:InboxStatus='unavailable';
  if(entry&&descriptor.revision&&descriptor.revision===await revision(entry)){
   if(entry.kind||entry.decision)try{status=await historyStatus(request,db,entry);}catch{status='unavailable';}
   else status='inspection-required';
  }
  output.push({...descriptor,status});
 }
 return output;
}

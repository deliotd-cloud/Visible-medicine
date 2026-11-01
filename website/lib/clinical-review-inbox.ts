import manifest from '../atlas-review/manifest.json';
import renderer from '../atlas-review/content/body-renderer-revision.json';
import shoulderRevisions from '../atlas-review/content/review-revisions.json';
import {clinicalReviewEntries,findClinicalReviewEntries,type ClinicalReviewEntry} from '../atlas-review/lib/clinical-review-index';
import {getClinicalReviewQueueWithReasons} from '../atlas-review/lib/clinical-review-queue';
import {parseClinicalPriorityPage} from '../atlas-review/lib/clinical-review-priority';
import {bodyReviewContext} from '../atlas-review/lib/body-review-context';
import {nestedReviewMaterial} from '../atlas-review/lib/nested-review-material';
import {specimenReviewMaterial} from '../atlas-review/lib/specimen-review-material';
import {authenticatedReviewer,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http';
import {extraInboxCatalog,extraInboxStatuses} from './clinical-review-extra-inbox';
import {parseInboxBatch,type InboxBatch,type InboxItem} from './clinical-review-inbox-contract';

async function digest(value:unknown){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');}

/** Existing readers share a strict read-only facade. A failed all() result cannot
 * masquerade as empty history in a legacy reader that omitted success checks. */
export function inboxReadOnlyDatabase(binding:Pick<D1Database,'prepare'>):Pick<D1Database,'prepare'>{
 return {prepare(sql:string){
  if(!/^\s*SELECT\b/i.test(sql))throw Error('The review inbox is read-only.');
  const wrap=(statement:D1PreparedStatement):D1PreparedStatement=>new Proxy(statement,{get(target,property){
   if(property==='bind')return(...values:unknown[])=>wrap(target.bind(...values));
   if(property==='all')return async(...args:unknown[])=>{const result=await Reflect.apply(target.all,target,args);if(result.success!==true||!Array.isArray(result.results))throw Error('Review status could not be confirmed.');return result;};
   if(property==='run'||property==='raw')return()=>{throw Error('The review inbox permits verified reads only.');};
   const value=Reflect.get(target,property,target);return typeof value==='function'?value.bind(target):value;
  }});
  return wrap(binding.prepare(sql));
 }};
}

async function trackRevisions(entry:ClinicalReviewEntry):Promise<Record<'geometry'|'teaching',string|null>>{
 let revisions:Record<string,string|null>|undefined;
 if(entry.scope==='shoulder')revisions=(shoulderRevisions.revisions as Record<string,Record<string,string|null>>)[entry.id];
 else if(entry.scope==='body')revisions=(await bodyReviewContext(entry.id))?.revisions;
 else{
  const [sourceKey,id]=JSON.parse(entry.key.slice(entry.scope.length+1)) as [string,string];
  if(id!==entry.id)throw Error('Review selection changed.');
  revisions=(entry.scope==='nested'?await nestedReviewMaterial(sourceKey,id):await specimenReviewMaterial(sourceKey,id))?.context.revisions;
 }
 if(!revisions)throw Error('Review material is unavailable.');
 return {geometry:revisions.geometry,teaching:revisions.teaching};
}

/** Call only through runClinicalReview. Bounded pages, immutable catalogue
 * continuity and actual existing decision readers; never bulk approval. */
export async function getClinicalReviewInbox(request:Request,binding:Pick<D1Database,'prepare'>|undefined){
 try{
  authenticatedReviewer(request.headers);
  const params=new URL(request.url).searchParams;
  for(const key of params.keys())if(!['page','revision','batch'].includes(key)||params.getAll(key).length!==1)throw new ReviewHttpError(400,'Unexpected or duplicate inbox parameter.');
  const raw=params.get('page')??'1',revision=params.get('revision'),rawBatch=params.get('batch');
  if(!/^[1-9]\d{0,4}$/.test(raw)||revision!==null&&!/^[a-f0-9]{64}$/.test(revision))throw new ReviewHttpError(400,'Invalid inbox cursor.');
  if(rawBatch!==null&&rawBatch!=='1'&&rawBatch!=='2')throw new ReviewHttpError(400,'Invalid inbox batch.');
  const batchSize=rawBatch==='2'?2:1;
  const page=Number(raw);if(page>1&&revision===null)throw new ReviewHttpError(409,'Restart the inbox scan to bind the current catalogue.');
  if(!binding)throw new ReviewHttpError(503,'Saved review status is unavailable.');
  const extra=await extraInboxCatalog();
  if(extra.length>64||new Set(extra.map(item=>item.key)).size!==extra.length)throw Error('Invalid additional review catalogue.');
  const bodyPages=findClinicalReviewEntries().pageCount,pageCount=Math.ceil(bodyPages/batchSize)+1;
  if(page>pageCount)throw new ReviewHttpError(400,'Inbox page is outside the current catalogue.');
  const catalogRevision=await digest({schema:'vm-clinical-inbox-catalog-1',changeReasonPolicy:'vm-clinical-priority-1',entryTrackPolicy:'vm-clinical-entry-track-1',sourceCommit:manifest.revision,
   integration:manifest.websiteIntegrationSha256,renderer:renderer.sha256,shoulder:shoulderRevisions,
   selections:clinicalReviewEntries,extra,...(batchSize===2?{batchPolicy:'vm-clinical-inbox-two-queue-pages-1'}:{})});
  if(revision!==null&&revision!==catalogRevision)throw new ReviewHttpError(409,'Review material changed. Restart the status scan; no decisions have changed.');
  const db=inboxReadOnlyDatabase(binding);
  let items:InboxItem[];
  if(page===1){
   items=await extraInboxStatuses(request,db,extra);
   // A helper may summarize statuses, but cannot omit, substitute, reorder or
   // redirect the canonical discovery catalogue, nor pass private history through.
   if(items.length!==extra.length||items.some((item,index)=>{
    const {status:ignored,...descriptor}=item;void ignored;
    const expected=extra[index];
    return Object.keys(descriptor).length!==Object.keys(expected).length||
     Object.entries(expected).some(([key,value])=>descriptor[key as keyof typeof descriptor]!==value);
   }))throw Error('Additional review catalogue changed.');
  }
  else{
   const readBodyPage=async(bodyPage:number):Promise<InboxItem[]>=>{
   const selected=findClinicalReviewEntries({page:bodyPage});
   // Request-local hashes only: the queue remains the authoritative material
   // resolver and status reader. No saved decision or material is cached across
   // requests, accounts, pages or source revisions.
   const captured=new Map<string,Promise<Readonly<Record<'geometry'|'teaching',string|null>>|null>>();
   const captureKeys=new Set(selected.entries.filter(entry=>entry.scope!=='shoulder').map(entry=>entry.key));
   let captureFailed=false;
   const observeRevisions=(key:string,pending:Promise<Readonly<Record<'geometry'|'teaching',string|null>>|null>)=>{
    if(!captureKeys.has(key)||captured.has(key)){captureFailed=true;throw Error('Review material discovery changed.');}
    // Attach rejection handling immediately, including a fast source failure
    // while the queue is still awaiting a separate saved-history read.
    captured.set(key,Promise.resolve(pending).then(value=>value,()=>null));
   };
   const url=new URL(request.url);url.search='';url.searchParams.set('page',String(bodyPage));
   const adapted=new Request(url,{headers:request.headers});
   const response=await getClinicalReviewQueueWithReasons(adapted,db as D1Database,observeRevisions);
   if(!response.ok)throw new ReviewHttpError(response.status===401?401:503,'Saved review status is unavailable. Retry this page or restart the scan.');
   if(captureFailed)throw Error('Review material discovery changed.');
   const statuses=parseClinicalPriorityPage(await response.json(),selected.entries.map(entry=>entry.key));
   return(await Promise.all(selected.entries.map(async(entry,index)=>{
    let revisions:Readonly<Record<'geometry'|'teaching',string|null>>={geometry:null,teaching:null};
    try{
     // Shoulder uses cheap static hashes. A caller using the legacy two-argument
     // queue still resolves directly; a captured source failure never retries.
     const current=captured.has(entry.key)?await captured.get(entry.key):await trackRevisions(entry);
     if(!current)throw Error('Review material is unavailable.');
     revisions=current;
    }catch{/* Unavailable is never an empty history or old approval. */}
    return(['geometry','teaching'] as const).map(track=>{
     const current=revisions[track],valid=typeof current==='string'&&/^[a-f0-9]{64}$/.test(current);
     const state=valid?statuses[index][track]:'unavailable' as const,reason=statuses[index][`${track}Reason`];
     // Shoulder has no validated change-reason adapter. Never accept a helper's
     // reason for an unsupported family or silently remove injected metadata.
     if(entry.scope==='shoulder'&&reason!==null)throw Error('Unsupported review reason.');
     return {key:JSON.stringify([entry.key,track]),title:entry.name,area:'structures' as const,
      // A navigation preference only: retain the exact catalogue identity and
      // source query; Anatomy keeps its existing default destination.
      scopeLabel:entry.context+' · '+entry.laterality,href:track==='teaching'?entry.href+(entry.href.includes('?')?'&':'?')+'t=teaching':entry.href,
      trackLabel:track==='geometry'?'Anatomy':'Teaching',revision:valid?current:null,
      status:state,capability:'decision' as const,
      ...(valid&&state==='re-review'&&reason!==null?{changeReason:reason}:{})};
    });
   }))).flat();
   };
   items=[];
   const firstBodyPage=(page-2)*batchSize+1;
   for(let bodyPage=firstBodyPage;bodyPage<=Math.min(bodyPages,firstBodyPage+batchSize-1);bodyPage++)
    items.push(...await readBodyPage(bodyPage));
  }
  const batch:InboxBatch={schema:'vm-clinical-inbox-1',scope:'private-to-signed-in-account-and-institution',
   catalogRevision,page,pageCount,selectionTotal:clinicalReviewEntries.length+extra.length,
   nextPage:page<pageCount?page+1:null,items,approval:false};
  return reviewJson(parseInboxBatch(batch,page,catalogRevision));
 }catch(error){return reviewJson({error:error instanceof ReviewHttpError?error.message:'Review status could not be confirmed. Restart or retry without changing decisions.'},error instanceof ReviewHttpError?error.status:503);}
}

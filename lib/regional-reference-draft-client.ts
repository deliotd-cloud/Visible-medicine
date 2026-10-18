import {parseRegionalReferenceDraftContext,parseRegionalReferenceDraftEvent,sameRegionalReferenceDraftContext,validateRegionalReferenceDraft,type RegionalReferenceDraft,type RegionalReferenceDraftContext,type RegionalReferenceDraftEvent} from './regional-reference-draft-contract.ts';
const exact=(v:unknown,keys:string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export class RegionalReferenceSourceChangedError extends Error{}
export function regionalReferenceDraftHeaders(context:RegionalReferenceDraftContext,before?:number):Record<string,string>{
 const c=parseRegionalReferenceDraftContext(context);
 if(before!==undefined&&(!Number.isSafeInteger(before)||before<1||before>2147483648))throw Error('Invalid history cursor.');
 return {'X-Reference-Teaching-Target':c.target.id,'X-Reference-Teaching-Relation':c.target.relation,'X-Reference-Teaching-Atlas':c.atlasRevision,'X-Reference-Teaching-Mapping':c.mappingRevision,'X-Reference-Teaching-Revision':c.teachingRevision,...(before===undefined?{}:{'X-Reference-Teaching-Before':String(before)})};
}
export function parseRegionalReferenceDraftHistory(value:unknown,expected:RegionalReferenceDraftContext,before=2147483648){
 if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid saved history cursor. Keep your edits.');
 if(!exact(value,['context','history','latestVersion','nextBefore','scope'])||value.scope!=='private-to-signed-in-account-and-institution'||!Array.isArray(value.history)||value.history.length>20||!Number.isSafeInteger(value.latestVersion)||value.latestVersion<0||value.latestVersion>2147483647)throw Error('Invalid saved history. Keep your edits.');
 const context=parseRegionalReferenceDraftContext(value.context);
 if(!sameRegionalReferenceDraftContext(context,expected))throw new RegionalReferenceSourceChangedError('Reference teaching changed. Keep or export your edits and reload this page.');
 const history=value.history.map(parseRegionalReferenceDraftEvent) as RegionalReferenceDraftEvent[];
 if(history.some((record,index)=>!sameRegionalReferenceDraftContext(record.context,context)||record.version>=before||record.version>value.latestVersion||index>0&&record.version>=history[index-1].version)||
  before===2147483648&&value.latestVersion!==(history[0]?.version??0))throw Error('Invalid saved history order or revision. Keep your edits.');
 const nextBefore=history.length===20?history.at(-1)!.version:null;if(value.nextBefore!==nextBefore)throw Error('Invalid saved history cursor. Keep your edits.');
 return {context,history,latestVersion:value.latestVersion as number,nextBefore};
}
export function confirmRegionalReferenceDraftSave(value:unknown,context:RegionalReferenceDraftContext,expectedVersion:number,draft:RegionalReferenceDraft){
 if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0||expectedVersion>2147483646)throw Error('Invalid correction base version. Keep your edits.');
 if(!exact(value,['review']))throw Error('Save could not be confirmed. Keep your edits and compare history.');
 const record=parseRegionalReferenceDraftEvent(value.review);
 if(!sameRegionalReferenceDraftContext(record.context,context)||record.version!==expectedVersion+1||JSON.stringify(record.draft)!==JSON.stringify(validateRegionalReferenceDraft(draft)))throw Error('Saved correction does not match this exact draft. Keep your edits.');
 return record;
}
export function regionalReferenceWorkingCopy(context:RegionalReferenceDraftContext,draft:RegionalReferenceDraft,state:{baseVersion:number|null;unsavedChanges:boolean;saveUncertain:boolean}){
 if(!exact(state,['baseVersion','unsavedChanges','saveUncertain'])||!(state.baseVersion===null||Number.isSafeInteger(state.baseVersion)&&state.baseVersion>=0&&state.baseVersion<=2147483647)||typeof state.unsavedChanges!=='boolean'||typeof state.saveUncertain!=='boolean')throw Error('Invalid working copy state.');
 return {schema:'vm-regional-reference-teaching-working-copy-1',exportedAt:new Date().toISOString(),context:parseRegionalReferenceDraftContext(context),draft:validateRegionalReferenceDraft(draft),state:{...state},approval:false};
}
export function downloadRegionalReferenceWorkingCopy(packet:ReturnType<typeof regionalReferenceWorkingCopy>){
 const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'}));let link:HTMLAnchorElement|null=null;
 try{link=document.createElement('a');link.href=url;link.download='visible-medicine-teaching-working-copy.json';document.body.appendChild(link);link.click();}
 finally{link?.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}

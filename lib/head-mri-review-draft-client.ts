import {blankHeadMriDraft,headMriDraftStale,parseSavedHeadMriDraft,validateHeadMriDraft,type HeadMriDraft,type HeadMriDraftContext,type SavedHeadMriDraft} from './head-mri-review-draft-contract.ts';

const exact=(value:unknown,keys:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
export class HeadMriSourceChangedError extends Error{}
const nextVersion=(expected:number)=>{
  if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw Error('Invalid MRI draft version. Keep your edits.');
  return expected+1;
};
function checkedContext(value:unknown,expected:HeadMriDraftContext){
  const probe=parseSavedHeadMriDraft({eventSchema:'vm-head-mri-draft-event-1',context:value,version:1,savedAt:'2026-01-01T00:00:00.000Z',draft:blankHeadMriDraft(expected)});
  if(headMriDraftStale(probe,expected))throw new HeadMriSourceChangedError('An MRI packet, source or checklist changed. Keep your edits and reload before reviewing.');
  return probe.context;
}
export type HeadMriHistory={context:HeadMriDraftContext;history:SavedHeadMriDraft[];nextBefore:number|null};
/** Pure validation: a history refresh cannot itself discard or rebase an edit. */
export function parseHeadMriHistory(input:unknown,expected:HeadMriDraftContext,before=2147483648):HeadMriHistory{
  if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid MRI history cursor. Keep your edits.');
  if(!exact(input,['context','history','nextBefore','scope'])||input.scope!=='private-to-signed-in-account-and-institution'||!Array.isArray(input.history)||input.history.length>20)
    throw Error('Invalid MRI saved-history response. Keep your edits.');
  const context=checkedContext(input.context,expected),history=input.history.map(parseSavedHeadMriDraft);
  if(history.some((record,index)=>record.version>=before||(index>0&&record.version!==history[index-1].version-1)))
    throw Error('Invalid MRI saved-history order. Keep your edits.');
  const nextBefore=history.length===20?history.at(-1)!.version:null;
  if(input.nextBefore!==nextBefore)throw Error('Invalid MRI saved-history cursor. Keep your edits.');
  return {context,history,nextBefore};
}
/** Only the exact server-approved protocol fields leave the form. */
export function headMriDraftSavePayload(context:HeadMriDraftContext,expected:number,draft:HeadMriDraft){
  nextVersion(expected);
  const checked=checkedContext(context,context);
  return {catalogScope:checked.catalogScope,packetId:checked.packetId,headRevision:checked.headRevision,
    comparisonRevision:checked.comparisonRevision,teachingRevision:checked.teachingRevision,learningRevision:checked.learningRevision,
    checklistVersion:checked.checklistVersion,expectedVersion:expected,draft:validateHeadMriDraft(draft,checked)};
}
function comparableDraft(draft:HeadMriDraft,context:HeadMriDraftContext){
  const checked=validateHeadMriDraft(draft,context);
  return JSON.stringify({...checked,checks:context.checklist.map(item=>[item.id,checked.checks[item.id]])});
}
/** Never infer success from HTTP201 alone; malformed/lost responses stay uncertain. */
export function confirmHeadMriSave(input:unknown,context:HeadMriDraftContext,expected:number,draft:HeadMriDraft){
  const version=nextVersion(expected);
  if(!exact(input,['review']))throw Error('MRI save could not be confirmed. Keep your edits and compare history.');
  const saved=parseSavedHeadMriDraft(input.review);
  if(headMriDraftStale(saved,context)||saved.version!==version||comparableDraft(saved.draft,context)!==comparableDraft(draft,context))
    throw Error('MRI save did not match this draft and revision. Keep your edits and compare history.');
  return saved;
}

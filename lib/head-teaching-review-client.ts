import {blankHeadTeachingDraft,headTeachingDraftStale,parseSavedHeadTeachingDraft,validateHeadTeachingDraft,type HeadTeachingDraft,type HeadTeachingDraftContext,type SavedHeadTeachingDraft} from './head-teaching-review-contract.ts';

const exact=(value:unknown,keys:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
export class HeadTeachingSourceChangedError extends Error{}
export function parseHeadTeachingHistory(input:unknown,expected:HeadTeachingDraftContext,before=2147483648){
  if(!exact(input,['context','history','nextBefore','scope'])||input.scope!=='private-to-signed-in-account-and-institution'||!Array.isArray(input.history)||input.history.length>20)throw Error('Invalid saved-history response. Keep your edits.');
  const context=parseSavedHeadTeachingDraft({eventSchema:'vm-head-teaching-draft-event-1',context:input.context,version:1,savedAt:'2026-01-01T00:00:00.000Z',draft:blankHeadTeachingDraft(expected)}).context;
  const probe:SavedHeadTeachingDraft={eventSchema:'vm-head-teaching-draft-event-1',context,version:1,savedAt:'2026-01-01T00:00:00.000Z',draft:blankHeadTeachingDraft(expected)};
  if(headTeachingDraftStale(probe,expected))throw new HeadTeachingSourceChangedError('The packet or head source changed. Keep your edits and reload this page before reviewing.');
  const history=input.history.map(parseSavedHeadTeachingDraft);
  if(history.some(record=>record.context.packetId!==expected.packetId||record.context.catalogScope!==expected.catalogScope))throw Error('Saved history belongs to another teaching packet. Keep your edits.');
  if(history.some((record,index)=>record.version>=before||(index>0&&record.version>=history[index-1].version)))throw Error('Invalid saved-history order. Keep your edits.');
  const nextBefore=history.length===20?history.at(-1)!.version:null;
  if(input.nextBefore!==nextBefore)throw Error('Invalid saved-history cursor. Keep your edits.');
  return {context,history,nextBefore};
}
export function confirmHeadTeachingSave(input:unknown,context:HeadTeachingDraftContext,expected:number,draft:HeadTeachingDraft){
  if(!exact(input,['review']))throw Error('Save could not be confirmed. Keep your edits and compare history.');
  const saved=parseSavedHeadTeachingDraft(input.review);
  if(headTeachingDraftStale(saved,context)||saved.version!==expected+1||JSON.stringify(saved.draft)!==JSON.stringify(validateHeadTeachingDraft(draft,context)))throw Error('Save did not match this draft and revision. Keep your edits and compare history.');
  return saved;
}

import {facialDecisionStale,parseFacialDecisionContext,parseSavedFacialDecision,validateFacialDecision,type FacialDecision,type FacialDecisionContext} from './head-ct-facial-decision-contract.ts';
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export class FacialSourceChangedError extends Error{}
const nextVersion=(expected:number)=>{if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw Error('Invalid facial decision version. Keep your edits.');return expected+1;};
export function parseFacialHistory(input:unknown,expected:FacialDecisionContext,before=2147483648){
  if(!Number.isSafeInteger(before)||before<1||before>2147483648||!exact(input,['context','history','nextBefore','scope'])||input.scope!=='private-to-signed-in-account-and-institution'||!Array.isArray(input.history)||input.history.length>20)throw Error('Invalid saved history. Keep your edits.');
  const context=parseFacialDecisionContext(input.context);
  if(JSON.stringify(context)!==JSON.stringify(parseFacialDecisionContext(expected)))throw new FacialSourceChangedError('The facial source or checklist changed. Keep your edits and reload.');
  const history=input.history.map(parseSavedFacialDecision);
  if(history.some((r,i)=>r.context.conceptId!==context.conceptId||r.context.kind!==context.kind||r.version>=before||(i>0&&r.version!==history[i-1].version-1))||before!==2147483648&&history.length>0&&history[0].version!==before-1)throw Error('Invalid saved facial history order or family. Keep your edits.');
  const nextBefore=history.length===20?history.at(-1)!.version:null;
  if(nextBefore!==input.nextBefore)throw Error('Invalid history cursor. Keep your edits.');
  return {context,history,nextBefore};
}
export function facialSavePayload(context:FacialDecisionContext,expected:number,decision:FacialDecision){
  nextVersion(expected);const checked=parseFacialDecisionContext(context);
  return {context:checked,expectedVersion:expected,decision:validateFacialDecision(decision,checked)};
}
const comparable=(d:FacialDecision,c:FacialDecisionContext)=>{const checked=validateFacialDecision(d,c);return JSON.stringify({...checked,checks:c.checklist.map(item=>[item.id,checked.checks[item.id]])});};
export function confirmFacialSave(input:unknown,context:FacialDecisionContext,expected:number,decision:FacialDecision){
  const version=nextVersion(expected);if(!exact(input,['review']))throw Error('Save could not be confirmed. Preserve edits and compare history.');
  const saved=parseSavedFacialDecision(input.review);
  if(facialDecisionStale(saved,context)||saved.version!==version||comparable(saved.decision,context)!==comparable(decision,context))throw Error('Save did not match this decision and revision. Preserve edits and compare history.');
  return saved;
}

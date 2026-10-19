import {ctBoneDecisionStale,parseCtBoneDecisionContext,parseSavedCtBoneDecision,validateCtBoneDecision,type CtBoneDecision,type CtBoneDecisionContext} from './head-ct-bone-decision-contract.ts';
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export class CtBoneSourceChangedError extends Error{}
const nextVersion=(expected:number)=>{if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw Error('Invalid comparison version. Keep your edits.');return expected+1;};
export function parseCtBoneHistory(input:unknown,expected:CtBoneDecisionContext,before=2147483648){
  if(!Number.isSafeInteger(before)||before<1||before>2147483648||!exact(input,['context','history','nextBefore','scope'])||input.scope!=='private-to-signed-in-account-and-institution'||!Array.isArray(input.history)||input.history.length>20)throw Error('Invalid saved history. Keep your edits.');
  const context=parseCtBoneDecisionContext(input.context);
  if(JSON.stringify(context)!==JSON.stringify(parseCtBoneDecisionContext(expected)))throw new CtBoneSourceChangedError('The comparison source or checklist changed. Keep your edits and reload.');
  const history=input.history.map(parseSavedCtBoneDecision);
  if(history.some((r,i)=>r.context.conceptId!==context.conceptId||r.version>=before||(i>0&&r.version!==history[i-1].version-1))||before!==2147483648&&history.length>0&&history[0].version!==before-1)throw Error('Invalid saved history order or comparison. Keep your edits.');
  const nextBefore=history.length===20?history.at(-1)!.version:null;
  if(nextBefore!==input.nextBefore)throw Error('Invalid history cursor. Keep your edits.');
  return {context,history,nextBefore};
}
export function ctBoneSavePayload(context:CtBoneDecisionContext,expected:number,decision:CtBoneDecision){
  nextVersion(expected);const checked=parseCtBoneDecisionContext(context);
  return {context:checked,expectedVersion:expected,decision:validateCtBoneDecision(decision,checked)};
}
const comparable=(d:CtBoneDecision,c:CtBoneDecisionContext)=>{const checked=validateCtBoneDecision(d,c);return JSON.stringify({...checked,checks:c.checklist.map(item=>[item.id,checked.checks[item.id]])});};
export function confirmCtBoneSave(input:unknown,context:CtBoneDecisionContext,expected:number,decision:CtBoneDecision){
  const version=nextVersion(expected);if(!exact(input,['review']))throw Error('Save could not be confirmed. Preserve edits and compare history.');
  const saved=parseSavedCtBoneDecision(input.review);
  if(ctBoneDecisionStale(saved,context)||saved.version!==version||comparable(saved.decision,context)!==comparable(decision,context))throw Error('Save did not match this decision and revision. Preserve edits and compare history.');
  return saved;
}

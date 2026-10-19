import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft,validateHeadTeachingDraft,parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';
import {headMriDraftContext,blankHeadMriDraft,validateHeadMriDraft,parseSavedHeadMriDraft} from '../lib/head-mri-review-draft-contract.ts';
import {headTeachingWorkingCopy,headMriWorkingCopy,downloadHeadWorkingCopy,type HeadWorkingCopyState} from '../lib/head-review-working-copy.ts';

const createdAt='2026-10-08T16:00:00.000Z';
const editState:HeadWorkingCopyState={baseVersion:3,unsavedChanges:true,saveUncertain:true,reloadRequired:true};
const teaching=await headTeachingDraftContext(HEAD_LINK_REVISION),mri=await headMriDraftContext(HEAD_LINK_REVISION);

test('working copies preserve incomplete corrections, all source revisions and exact whitespace without becoming saved events',()=>{
  const td={...blankHeadTeachingDraft(teaching),status:'changes-required' as const,reviewer:'  Reader  ',notes:' x\n '};
  const md={...blankHeadMriDraft(mri),status:'changes-required' as const,reviewer:'  Reader  ',notes:' x\n '};
  assert.throws(()=>validateHeadTeachingDraft(td,teaching));assert.throws(()=>validateHeadMriDraft(md,mri));
  for(const value of [headTeachingWorkingCopy(teaching,td,editState,createdAt),headMriWorkingCopy(mri,md,editState,createdAt)]){
    assert.equal(value.schema,'vm-head-review-working-copy-1');assert.equal(value.createdAt,createdAt);
    assert.deepEqual(value.editState,editState);assert.equal(value.workingDraft.notes,' x\n ');assert.equal(value.workingDraft.reviewer,'  Reader  ');
    assert.equal(value.workingDraft.status,'changes-required');assert.equal(value.localOnly,true);
    for(const key of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(value[key],false);
    assert.match(value.warning,/not a saved review event/);assert.match(value.warning,/Restore text manually/);
    assert.throws(()=>parseSavedHeadTeachingDraft(value));assert.throws(()=>parseSavedHeadMriDraft(value));
    const original=value.kind==='head-teaching'?teaching:mri;assert.deepEqual(value.context,original);
    value.context.checklist[0].label='mutated copy';value.workingDraft.notes='mutated copy';value.editState.baseVersion=99;
    assert.notEqual(original.checklist[0].label,'mutated copy');assert.equal(editState.baseVersion,3);
  }
  assert.equal(td.notes,' x\n ');assert.equal(md.notes,' x\n ');
});

test('unknown base version is explicit; invalid contexts, status, fields and approval flags are refused',()=>{
  assert.equal(headTeachingWorkingCopy(teaching,blankHeadTeachingDraft(teaching),{...editState,baseVersion:null},createdAt).editState.baseVersion,null);
  assert.equal(headMriWorkingCopy(mri,blankHeadMriDraft(mri),{...editState,baseVersion:0},createdAt).editState.baseVersion,0);
  for(const [context,blank,make] of [[teaching,blankHeadTeachingDraft(teaching),headTeachingWorkingCopy],[mri,blankHeadMriDraft(mri),headMriWorkingCopy]] as const){
    const create=make as (c:any,d:any,s:any,t?:string)=>unknown;
    for(const changed of [{...blank,status:'approved'},{...blank,attested:true},{...blank,extra:'private'},{...blank,notes:'x'.repeat(8001)},{...blank,checks:{}}])assert.throws(()=>create(context,changed,editState,createdAt));
    for(const changed of [{...context,clinicalApproval:true},{...context,headRevision:'not-a-hash'},{...context,conceptIds:['foreign']},{...context,extra:true}])assert.throws(()=>create(changed,blank,editState,createdAt));
    for(const changed of [{...editState,baseVersion:-1},{...editState,baseVersion:0.5},{...editState,baseVersion:2147483648},{...editState,unsavedChanges:'true'},{...editState,extra:true}])assert.throws(()=>create(context,blank,changed,createdAt));
    assert.throws(()=>create(context,blank,editState,'2026-02-30T00:00:00.000Z'));
    assert.throws(()=>create(context,blank,editState,'2026-10-08'));
  }
  assert.throws(()=>headTeachingWorkingCopy(mri as never,blankHeadTeachingDraft(teaching),editState,createdAt));
  assert.throws(()=>headMriWorkingCopy(teaching as never,blankHeadMriDraft(mri),editState,createdAt));
});

test('download creates only a local JSON blob, cleans up, uses no personal filename and never confirms server save',async()=>{
  const originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,originalTimeout=globalThis.setTimeout;
  const blobs:Blob[]=[],revoked:string[]=[],callbacks:Array<()=>void>=[];
  const anchor={href:'',download:'',hidden:false,clicks:0,removed:0,click(){this.clicks++;},remove(){this.removed++;}};
  let fail=false;
  try{
    Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement(name:string){assert.equal(name,'a');if(fail)throw Error('blocked');return anchor;},body:{appendChild(value:unknown){assert.equal(value,anchor);}}}});
    URL.createObjectURL=((blob:Blob)=>{blobs.push(blob);return 'blob:local-copy';}) as typeof URL.createObjectURL;
    URL.revokeObjectURL=url=>{revoked.push(url);};
    globalThis.setTimeout=((callback:()=>void,delay:number)=>{assert.equal(delay,1000);callbacks.push(callback);return 1;}) as unknown as typeof setTimeout;
    const draft={...blankHeadMriDraft(mri),reviewer:'Private Reviewer',notes:'<script>Text is data</script>\n'};
    const value=headMriWorkingCopy(mri,draft,editState,createdAt);downloadHeadWorkingCopy(value);
    assert.equal(blobs.length,1);assert.equal(blobs[0].type,'application/json');assert.deepEqual(JSON.parse(await blobs[0].text()),value);
    assert.equal(anchor.clicks,1);assert.equal(anchor.removed,1);assert.equal(anchor.hidden,true);
    assert.equal(anchor.download,'visible-medicine-head-mri-only-working-copy-2026-10-08T16-00-00.000Z.json');
    assert(!anchor.download.includes(draft.reviewer));assert.deepEqual(revoked,[]);callbacks[0]();assert.deepEqual(revoked,['blob:local-copy']);
    fail=true;assert.throws(()=>downloadHeadWorkingCopy(value));assert.equal(revoked.length,2,'creation failure also releases blob');
  }finally{
    if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else Reflect.deleteProperty(globalThis,'document');
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;globalThis.setTimeout=originalTimeout;
  }
});

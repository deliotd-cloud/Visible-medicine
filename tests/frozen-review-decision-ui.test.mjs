/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from 'esbuild';

const require=createRequire(import.meta.url),React=require('react');
let slots=[],cursor=0,view,calls=[],disposers=[],exports=[],dirtySignals=[];
const id='vm:anatomy:body:synthetic',candidateId='a'.repeat(64),materialHash='b'.repeat(64),contextHash='c'.repeat(64);
const revisions={geometry:'d'.repeat(64),teaching:'e'.repeat(64),imaging:null};
const tracks=['geometry','teaching','imaging'];
const context={catalogScope:'body-display-catalog',candidateId,structureId:id,materialHash,contextHash,
  rendererHash:'f'.repeat(64),sourceHash:'1'.repeat(64),teachingHash:'2'.repeat(64),
  checklistVersion:'synthetic-1',revisions,teachingTabs:['anatomy'],
  checklists:Object.fromEntries(tracks.map(track=>[track,[{id:`${track}-check`,label:`Synthetic ${track} check`}]])),
  blockers:{geometry:[],teaching:[],imaging:['No acquired image or validated registration.']}};
const blank=(c,t)=>({status:'draft',reviewer:'',qualification:'',scope:'',notes:'',checks:{[c.checklists[t][0].id]:false},evidence:[],issues:[],attested:false});
const validate=(draft,checks)=>({...draft,checks:Object.fromEntries(checks.map(check=>[check.id,!!draft.checks[check.id]]))});
const canonical=value=>JSON.stringify(value);
const eventFor=(draft,c,t,version,now)=>({schema:'vm-frozen-body-review-event-1',candidateId:c.candidateId,contextHash:c.contextHash,
  review:{...draft,eventSchema:'vm-body-review-event-1',catalogScope:c.catalogScope,structureId:c.structureId,track:t,version,
    savedAt:now,reviewedAt:null,revisionHash:c.revisions[t],checklistVersion:c.checklistVersion,checklist:c.checklists[t],
    material:{sourceHash:c.sourceHash,teachingHash:c.teachingHash,rendererHash:c.rendererHash,materialHash:c.materialHash,teachingTabs:c.teachingTabs}}});
const shim={...React,
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;
    return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
  useEffect(fn,deps){const i=cursor++,prior=slots[i];if(!prior||!deps||deps.some((value,index)=>!Object.is(value,prior.deps?.[index]))){prior?.dispose?.();
    const dispose=fn();slots[i]={deps,dispose};disposers.push(dispose);}},
};
const modules={
  '../../lib/clinical-review-fetch':`export const clinicalReviewFetch=(url,options)=>globalThis.__transport(url,options);`,
  '../../lib/clinical-review-candidate':`export const canonicalCandidateJson=value=>globalThis.__canonical(value);`,
  '../../lib/frozen-review-contract':`export const parseFrozenDecisionPage=(raw)=>Promise.resolve(raw);
    export const parseFrozenReviewEvent=event=>event;
    export const validateFrozenReviewEvent=event=>event;
    export const makeFrozenReviewEvent=(draft,context,track,version,now)=>globalThis.__eventFor(draft,context,track,version,now);`,
  '../../atlas-review/lib/body-review-decisions':`export const bodyReviewTracks=['geometry','teaching','imaging'];
    export const blankBodyReview=(context,track)=>globalThis.__blank(context,track);
    export const validateBodyReviewDraft=(draft,checks)=>globalThis.__validate(draft,checks);
    export const bodyApprovalProblems=(draft,context,track)=>context.blockers[track];`,
};
const built=await build({entryPoints:['scripts/clinical-review-candidate/decisions.tsx'],bundle:true,write:false,
  platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},plugins:[{name:'synthetic-dependencies',setup(api){
    api.onResolve({filter:/^(\.\.\/\.\.\/lib\/(clinical-review-fetch|clinical-review-candidate|frozen-review-contract)|\.\.\/\.\.\/atlas-review\/lib\/body-review-decisions)$/},args=>({path:args.path,namespace:'synthetic'}));
    api.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:modules[args.path],loader:'js'}));
  }}]});
const document={createElement(tag){assert.equal(tag,'a');return {click(){exports.push({href:this.href,download:this.download});}};}};
const urls={...URL,createObjectURL(blob){exports.push({blob});return 'blob:synthetic';},revokeObjectURL(){}};
const window={addEventListener(){},removeEventListener(){}};
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require:name=>name==='react'?shim:require(name),
  AbortController,URL:urls,URLSearchParams,Blob,document,window,setTimeout:()=>0,structuredClone,
  __transport:(url,options)=>new Promise((resolve,reject)=>calls.push({url,options,resolve,reject})),
  __canonical:canonical,__blank:blank,__validate:validate,__eventFor:eventFor,
});
const {FrozenDecisionEditor}=scope.exports;
const walk=(node,predicate,out=[])=>{if(React.isValidElement(node)){if(predicate(node))out.push(node);
  React.Children.forEach(node.props.children,child=>walk(child,predicate,out));}return out;};
const words=node=>typeof node==='string'||typeof node==='number'?String(node):!node?'':Array.isArray(node)?node.map(words).join(''):words(node.props?.children);
const render=()=>{cursor=0;view=FrozenDecisionEditor({candidateId,id,materialHash,onDirty:dirty=>dirtySignals.push(dirty)});return view;};
const button=label=>walk(view,node=>node.type==='button'&&words(node).startsWith(label))[0];
const control=label=>{const parent=walk(view,node=>node.type==='label'&&words(node).startsWith(label))[0];assert(parent,`control ${label}`);
  return walk(parent,node=>node.type==='input'||node.type==='textarea'||node.type==='select')[0];};
const change=(label,value)=>{control(label).props.onChange({target:{value,checked:value}});render();};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const reply=(call,body,status=200)=>call.resolve({ok:status>=200&&status<300,status,json:async()=>body});
const page=(track='geometry',reviews=[])=>({schema:'vm-frozen-body-decision-page-1',scope:'private-to-signed-in-account-and-institution',
  candidate:{id:candidateId},context,reviews,history:[],track,nextBefore:null});
const start=async()=>{for(const dispose of disposers)dispose?.();disposers=[];slots=[];calls=[];exports=[];dirtySignals=[];
  render();assert.equal(calls.length,1);assert.equal(calls[0].options.cache,'no-store');
  reply(calls[0],page());await tick();render();assert(button('Save private review'));};
const selectTrack=label=>{button(label).props.onClick();render();};
const latestSave=()=>calls.at(-1);

test('track drafts survive navigation and a confirmed save clears only its own dirty flag',async()=>{
  await start();change('Reviewer name','Geometry reviewer');change('Notes / corrections','Geometry note');
  selectTrack('Teaching copy');change('Notes / corrections','Teaching note');
  selectTrack('3D anatomy');assert.equal(control('Notes / corrections').props.value,'Geometry note');
  assert.equal(control('Reviewer name').props.value,'Geometry reviewer');
  // The submitted identity and optimistic version come from the exact loaded candidate/context.
  button('Save private review').props.onClick();const request=latestSave();
  assert.equal(request.options.method,'POST');
  const submitted=JSON.parse(request.options.body);
  assert.deepEqual({candidateId:submitted.candidateId,structureId:submitted.structureId,track:submitted.track,
    expectedVersion:submitted.expectedVersion,contextHash:submitted.contextHash,revisionHash:submitted.revisionHash,
    materialHash:submitted.materialHash},{candidateId,structureId:id,track:'geometry',expectedVersion:0,
    contextHash,revisionHash:revisions.geometry,materialHash});
  assert.equal(submitted.draft.notes,'Geometry note');
  const event=eventFor(submitted.draft,context,'geometry',1,'2026-10-18T12:01:00.000Z');
  reply(request,{schema:'vm-frozen-body-review-saved-1',candidateId,contextHash,event});await tick();render();
  assert.equal(button('Save private review').props.disabled,true);
  selectTrack('Teaching copy');assert.equal(control('Notes / corrections').props.value,'Teaching note');
  assert.equal(button('Save private review').props.disabled,false);
  assert(dirtySignals.includes(true));
});

test('unconfirmed response, network loss and 409 retain text until refresh and explicit comparison',async()=>{
  for(const failure of ['unconfirmed','network','409']){
    await start();change('Notes / corrections',`Keep ${failure}`);button('Save private review').props.onClick();
    const request=latestSave();if(failure==='network')request.reject(Error('Connection lost'));
    else if(failure==='unconfirmed')reply(request,{schema:'vm-frozen-body-review-saved-1',candidateId,contextHash,event:{wrong:true}});
    else reply(request,{error:'Another save won'},409);
    await tick();render();assert.equal(control('Notes / corrections').props.value,`Keep ${failure}`);
    assert.equal(button('Save private review').props.disabled,true);
    button('Refresh saved records').props.onClick();reply(latestSave(),page());await tick();render();
    assert.equal(control('Notes / corrections').props.value,`Keep ${failure}`);
    assert.equal(button('Save private review').props.disabled,true);
    const keep=button('Keep written draft after comparison');assert(keep);
    keep.props.onClick();render();assert.equal(control('Notes / corrections').props.value,`Keep ${failure}`);
    assert.equal(button('Save private review').props.disabled,false);
  }
});

test('edits clear attestation, export is explicit, and imaging approval stays unavailable',async()=>{
  await start();assert.equal(exports.length,0);
  control('I personally inspected').props.onChange({target:{checked:true}});render();
  assert.equal(control('I personally inspected').props.checked,true);
  change('Notes / corrections','Later edit');assert.equal(control('I personally inspected').props.checked,false);
  button('Export local draft').props.onClick();assert.equal(exports.length,2);
  const payload=JSON.parse(await exports[0].blob.text());
  assert.equal(payload.schema,'vm-frozen-local-draft-export-1');assert.equal(payload.drafts.geometry.notes,'Later edit');
  assert.equal(exports[1].download,'visible-medicine-private-review-draft.json');
  selectTrack('Imaging');assert.equal(control('Decision').props.value,'draft');
  const approval=walk(control('Decision'),node=>node.type==='option'&&node.props.value==='approved')[0];
  assert.equal(approval.props.disabled,true);
});

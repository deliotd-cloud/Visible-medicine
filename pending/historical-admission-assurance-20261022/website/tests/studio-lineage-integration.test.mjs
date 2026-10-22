import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ts=createRequire(join(root,'package.json'))('typescript');
const {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}=
 await import(pathToFileURL(join(root,'tests/current-atlas-delivery.mjs')).href);
const {checkedAtlasHistoryRepo}=
 await import(pathToFileURL(join(root,'tests/atlas-source-repo.mjs')).href);

function bodies(source){const ast=ts.createSourceFile('test.ts',source,ts.ScriptTarget.Latest,true),out=[];
 function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='test')out.push(n.getText(ast));ts.forEachChild(n,visit);}visit(ast);return out;}
function exact(text,from,to,count=1){assert.equal(text.split(from).length-1,count,`Declared seam count: ${from.slice(0,75)}`);return text.replaceAll(from,to);}

const contextCounts={0:1,2:1,3:1,6:3,7:1,9:2,10:1,11:1,12:2,13:4,14:1,15:1};
const waits={
 'lecture-request-lifecycle.test.ts':{
  0:["reload();await tick();assert.equal(requests.length,1)","reload();assert.equal(requests.length,1)"],
  2:["form.props.onSubmit(event);form.props.onSubmit(event);await tick();assert.equal(calls,1)","form.props.onSubmit(event);form.props.onSubmit(event);assert.equal(calls,1)"],
  3:["h.button('Save').props.onClick();await tick();if(kind==='json')","h.button('Save').props.onClick();if(kind==='json')"],
  4:["h.replayEffects();save();h.flush();await tick();assert.equal(calls,2)","h.replayEffects();save();h.flush();assert.equal(calls,2)"],
  5:["await tick();await tick();h.flush()","await tick();h.flush()",2],
 },
 'lecture-anatomy-matches-ui.test.ts':{
  5:["h.flush();assert.equal(h.picker().props.value,'');await tick();assert.equal(Object.hasOwn",
     "h.flush();assert.equal(h.picker().props.value,'');assert.equal(Object.hasOwn"],
 },
 'lecture-multi-anatomy-ui.test.ts':{
  3:["h.flush();\n    await tick();assert.deepEqual(payload.slides,view.slides);",
     "h.flush();\n    assert.deepEqual(payload.slides,view.slides);"],
 },
};
function inverse(name,index,body){
 if(name==='lecture-editor.test.ts'){
  const count=contextCounts[index];
  if(count===undefined)return body;
  assert.equal((body.match(/, ?expectedStudioContext/g)??[]).length,count,`${name}:${index}: scoped context additions`);
  return body.replaceAll(/, ?expectedStudioContext/g,'');
 }
 const seam=waits[name]?.[index];
 return seam?exact(body,seam[0],seam[1],seam[2]??1):body;
}
function verifyBody(name,index,current,frozen){assert.equal(inverse(name,index,current),frozen,`${name}:${index}: original body outside declared seams`);}

test('all 40 original lecture test bodies and frozen source bytes survive exact context/async seams',()=>{
 const archive='tests/fixtures/lineage-legacy-before-20261016';
 const manifestBytes=read(archive+'/manifest.json');
 assert.equal(sha(manifestBytes),'d0a9573788743aa6df59a184aa9fd5eaf217a76e2ddaa20b3138a6d78a80c4b8');
 const manifest=JSON.parse(manifestBytes);
 assert.equal(manifest.schema,'vm-lineage-legacy-frozen-1');assert.equal(manifest.records.length,4);
 let cases=0,changed=0;
 for(const f of manifest.records){
  assert(f.frozenPath.startsWith(archive+'/')&&f.frozenPath.endsWith('.txt'));
  const bytes=read(f.frozenPath);assert.equal(sha(bytes),f.sha256);
  const frozen=bodies(bytes.toString()),current=bodies(read(f.path).toString());
  assert.equal(frozen.length,f.testCases);assert.equal(current.length,f.testCases);
  const name=f.path.split('/').at(-1);
  for(let i=0;i<f.testCases;i++){
   verifyBody(name,i,current[i],frozen[i]);
   if(current[i]!==frozen[i])changed++;
  }
  cases+=f.testCases;
 }
 assert.equal(cases,40);assert.equal(changed,19);
});

test('historical 7b and pre-bind e440 witnesses stay distinct from validated current delivery',()=>{
 const oldBytes=read('tests/fixtures/current-atlas-delivery-7b3e678a.json');
 assert.equal(sha(oldBytes),'1a9a62e5ec6998ccc0f68c083dcd50ef03c6f89bc8cc46a7036e6c3ba39466cf');
 const old=JSON.parse(oldBytes);
 assert.equal(old.source,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
 assert.equal(old.sourceTree,'de883b9d6bccb3b4403256e42fabc7471e0ea8c9');
 assert.equal(old.reviewIntegration,'245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37');
 assert.equal(old.reviewSourceFiles,1520);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),'Historical delivery cannot admit current documents');
 const preBindBytes=read('tests/fixtures/current-atlas-delivery-pre-bind-e440.json');
 assert.equal(sha(preBindBytes),'7554a31f1d43b3a99619e25e0a76ef9e131d92e2ad60d867a9edc741446f4246');
 const preBind=JSON.parse(preBindBytes);
 assert.equal(preBind.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');
 assert.equal(preBind.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');
 assert.equal(preBind.reviewIntegration,'322db172c7fc0ca7697ca6f6dd67547a1fb8892b107ce48f1fd1b5ae7341d65b');
 assert.equal(preBind.reviewSourceFiles,1543);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:preBind}),'Exact pre-bind fixture cannot admit rebound Review documents');
 const pinBytes=read('tests/fixtures/current-atlas-delivery.json');
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.deepEqual(JSON.parse(pinBytes),pin,'Current fixture is the validated actual producer binding');
 assert.notEqual(sha(pinBytes),sha(preBindBytes),'Rebound fixture is distinct from the historical pre-bind snapshot');
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 assert.equal(pin.reviewSourceFiles,1562);
 const inputsBytes=read('atlas-review/integration-inputs.json');
 const reviewBytes=read('atlas-review/manifest.json');
 assert.equal(sha(inputsBytes),pin.documents['atlas-review/integration-inputs.json']);
 assert.equal(sha(reviewBytes),pin.documents['atlas-review/manifest.json']);
 const inputs=JSON.parse(inputsBytes),review=JSON.parse(reviewBytes);
 assert.equal(inputs.sha256,pin.reviewIntegration);
 assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(review.files.length,pin.reviewSourceFiles);
 const history=checkedAtlasHistoryRepo(old.source);
 assert.equal(history,sourceRoot);
 const git=(...args)=>execFileSync('git',args,{cwd:history,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(git('rev-parse',old.source+'^{tree}'),old.sourceTree);
 assert.equal(git('rev-parse','HEAD^{tree}'),pin.sourceTree);
 execFileSync('git',['merge-base','--is-ancestor',old.source,pin.source],{cwd:history,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
});

test('mutated legacy refusal, foreign Studio context and altered timing fail the exact body proof',()=>{
 const archive='tests/fixtures/lineage-legacy-before-20261016/';
 function pair(name,index){return [bodies(read('tests/'+name).toString())[index],bodies(read(archive+name+'.txt').toString())[index]];}
 const [save,oldSave]=pair('lecture-editor.test.ts',9);
 assert.throws(()=>verifyBody('lecture-editor.test.ts',9,save.replace('expectedVersion: 4','expectedVersion: 5'),oldSave));
 assert.throws(()=>verifyBody('lecture-editor.test.ts',9,save.replace('expectedStudioContext','foreignStudioContext'),oldSave));
 const [async,oldAsync]=pair('lecture-request-lifecycle.test.ts',0);
 assert.throws(()=>verifyBody('lecture-request-lifecycle.test.ts',0,async.replace('requests.length,1','requests.length,0'),oldAsync));
 assert.throws(()=>verifyBody('lecture-request-lifecycle.test.ts',0,async.replace('reload();await tick();','reload();'),oldAsync));
});

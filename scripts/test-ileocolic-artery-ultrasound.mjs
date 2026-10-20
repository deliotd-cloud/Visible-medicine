import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';

const baseline='bd5465ee3b94c66c3d5701e7749099d07e8f40d3';
const id='vm:anatomy:body:abdomen:unspecified:vessel:ileocolic-artery';
const sha=b=>createHash('sha256').update(b).digest('hex');
const gitBytes=p=>execFileSync('git',['show',`${baseline}:${p}`],{
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,maxBuffer:16e6,
});
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const catalogBytes=await readFile(catalogPath);
assert.equal(sha(catalogBytes),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
assert.deepEqual(catalogBytes,gitBytes(catalogPath));
assert.deepEqual(await readFile('public/models/bodyparts3d/manifest.json'),gitBytes('public/models/bodyparts3d/manifest.json'));
const beforeDispatch=gitBytes('app/body-content.ts').toString();
const dispatch=(await readFile('app/body-content.ts','utf8')).replaceAll('\r\n','\n');
const importLine="import { ileocolicArteryUltrasoundLesson } from '../lib/ileocolic-artery-ultrasound';\n";
const branch='  const ileocolicUltrasound = ileocolicArteryUltrasoundLesson(s, tab);\n  if (ileocolicUltrasound) return ileocolicUltrasound;\n';
assert.equal(dispatch.split(importLine).length,2);
assert.equal(dispatch.split(branch).length,2);
assert.equal(dispatch.replace(importLine,'').replace(branch,'').replaceAll('\r\n','\n'),beforeDispatch.replaceAll('\r\n','\n'));
assert(dispatch.indexOf('if(arterialEvidenceLimit)return arterialEvidenceLimit;')<dispatch.indexOf(branch),'Existing source evidence holds remain earlier');

const context=await contentContext(),api=context.api;
const old=await exactSourceHistoryApi(baseline,'display-review');
const display=api.bodyDisplayCatalog(context.catalog);
assert.deepEqual(display,old.bodyDisplayCatalog(context.catalog));
assert.equal(display.structures.length,1104);
assert.deepEqual(api.contentTabs,old.contentTabs);
assert.deepEqual(api.structures,old.structures);
assert.deepEqual(api.dissectionProfiles,old.dissectionProfiles);
const compiled=await build({stdin:{contents:"export {ileocolicArteryUltrasoundLesson as lesson} from './lib/ileocolic-artery-ultrasound';export {parseBodyReviewResponse} from './lib/body-review-response';export {bodyReviewContext} from './lib/body-review-context';export {postBodyDecision} from './lib/body-review-api';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {lesson,parseBodyReviewResponse,bodyReviewContext,postBodyDecision}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const matches=display.structures.filter(s=>s.id===id);assert.equal(matches.length,1);
const target=matches[0];assert.equal(target.fmaId,'FMA14815');
assert.deepEqual(target.sources,[{file:'FJ3439',sha256:'a0e7715dace7a22773b5e976f415b6049fe84eeb8e91f01cb6a4582c31ced81a'}]);
const currentRecords=api.bodyContentRecords(display),priorRecords=old.bodyContentRecords(display);
const registry=new Map([...context.shoulder,...currentRecords].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
let changed=0,unchanged=0,changedPackets=0,unchangedPackets=0;
const totals={before:{},after:{}};
for(let i=0;i<display.structures.length;i++){
  const s=display.structures[i],current=currentRecords[i],prior=priorRecords[i];
  assert.equal(current.id,s.id);assert.equal(prior.id,s.id);assert(validate(current));
  const expected=structuredClone(prior);
  for(const tab of api.contentTabs){
    const before=old.bodyLesson(s,tab),after=api.bodyLesson(s,tab);
    totals.before[before.readiness]=(totals.before[before.readiness]??0)+1;
    totals.after[after.readiness]=(totals.after[after.readiness]??0)+1;
    if(s.id!==id||tab!=='ultrasound'){
      assert.deepEqual(after,before,s.id+'|'+tab);assert.equal(lesson(s,tab),undefined);unchanged++;continue;
    }
    assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
    assert.deepEqual(after,lesson(s,tab));assert.deepEqual(current.content[tab],after);
    const {readiness,...shown}=after;assert.deepEqual(api.bodyContent(s,tab),shown);
    assert.match(after.body,/one healthy child/);assert.match(after.body,/not evidence/);
    assert.match(after.note,/radiologist review pending/);assert.match(after.note,/No article image/);
    assert.equal(after.citations.length,2);expected.content[tab]=after;changed++;
  }
  assert.deepEqual(current,expected,s.id+' exported record changed outside target topic');
  assert.equal(current.validation.clinicalApproval,'not-included');assert.equal(current.validation.materialRevisions.imaging,null);
  const previousPacket=await old.bodyReviewMaterial(s.id),packet=await api.bodyReviewMaterial(s.id);
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  if(s.id!==id){assert.deepEqual(packet,previousPacket,s.id+' unrelated review packet');unchangedPackets++;continue;}
  const expectedPacket=structuredClone(previousPacket);
  expectedPacket.topics=packet.topics;expectedPacket.fingerprints.teaching=packet.fingerprints.teaching;expectedPacket.materialHash=packet.materialHash;
  assert.notEqual(packet.fingerprints.teaching,previousPacket.fingerprints.teaching);
  assert.notEqual(packet.materialHash,previousPacket.materialHash);assert.deepEqual(packet,expectedPacket);
  assert.deepEqual(packet.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...api.bodyLesson(s,'ultrasound')});
  assert.deepEqual(await parseBodyReviewResponse(packet,s.id),packet);
  assert.equal(await parseBodyReviewResponse(previousPacket,s.id),null,'Old teaching cannot carry approval into new draft');
  for(const mutate of [v=>{v.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},v=>{v.approval=true;},v=>{v.topics.find(t=>t.tab==='ultrasound').citations[0]='https://invalid.example/';}]){
    const bad=structuredClone(packet);mutate(bad);assert.equal(await parseBodyReviewResponse(bad,s.id),null);
  }
  // Display parsing checks evidence, not a claimed save-time hash. Exercise
  // the REAL in-process server gate, with no network, account or DB writes.
  const clientHashOnly=structuredClone(packet);clientHashOnly.materialHash='0'.repeat(64);
  assert.equal((await parseBodyReviewResponse(clientHashOnly,s.id))?.approval,false);
  const trusted=await bodyReviewContext(s.id);assert.equal(trusted.materialHash,packet.materialHash);
  for(const patch of [{materialHash:previousPacket.materialHash},{materialHash:'0'.repeat(64)},{revisionHash:'0'.repeat(64)}]){
    const input={catalogScope:trusted.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:trusted.materialHash,revisionHash:trusted.revisions.teaching,checklistVersion:trusted.checklistVersion,...patch};
    const request=new Request('https://unit-test.invalid/api/body-review/decisions',{method:'POST',headers:{'oai-authenticated-user-id':'unit-test-only',origin:'https://unit-test.invalid','content-type':'application/json'},body:JSON.stringify(input)});
    const response=await postBodyDecision(request,{prepare(){throw Error('Invalid revision must not reach storage');}});
    assert.equal(response.status,409);assert.match((await response.json()).error,/material or checklist changed/);
  }
  changedPackets++;
}
assert.equal(changed,1);assert.equal(unchanged,9935);assert.equal(changedPackets,1);assert.equal(unchangedPackets,1103);
assert.deepEqual(totals.before,{draft:9337,pending:560,'generated-identification':39});
assert.deepEqual(totals.after,{draft:9338,pending:559,'generated-identification':39});

const leaves=(v,path=[])=>v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,p])=>leaves(p,[...path,k]));
let refusals=0;
for(const path of leaves(target)){
  const bad=structuredClone(target);let part=bad;
  for(const key of path.slice(0,-1))part=part[key];
  const key=path.at(-1),value=part[key];part[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
  assert.equal(lesson(bad,'ultrasound'),undefined,path.join('.'));refusals++;
}
for(const mutate of [s=>{delete s.sources;},s=>{s.sources=[];},s=>{s.sources.push({...s.sources[0]});},s=>{s.regions.push('pelvis');},s=>{delete s.bounds;},s=>{s.validation.anatomicalReview=true;}]){
  const bad=structuredClone(target);mutate(bad);assert.equal(lesson(bad,'ultrasound'),undefined);refusals++;
}
const pristine=lesson(target,'ultrasound'),detached=lesson(target,'ultrasound');
detached.bullets.push('foreign');detached.citations[0]='https://invalid.example/';assert.deepEqual(lesson(target,'ultrasound'),pristine);
const held=display.structures.find(s=>s.id.endsWith(':superficial-perineal-muscle'));assert(held);
for(const tab of api.contentTabs)assert.equal(lesson(held,tab),undefined);

// Render the actual body explorer note callback with its installed components.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {ComponentImagingNotes} from './app/component-imaging-notes';export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
const code=ts.transpile(`(${callback})('ultrasound')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
const html=render(runInNewContext(code,{React,...scope.exports,ScanLine:require('lucide-react').ScanLine,catalog:display,side:'both',exam:false,openNested:()=>{throw Error('Rendering must not navigate');},selected:target,bodyContent:api.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children)}));
assert(html.includes(render(React.createElement('p',null,pristine.body))));
for(const text of pristine.bullets)assert(html.includes(render(React.createElement('li',null,text))));
for(const url of pristine.citations)assert(html.includes(`href="${url}"`));
assert(html.includes('radiologist review pending'));
console.log(JSON.stringify({baseline,changedTopics:changed,unchangedTopics:unchanged,changedReviewPackets:changedPackets,unchangedReviewPackets:unchangedPackets,validatedRecords:currentRecords.length,identityRefusals:refusals,staleReviewRefused:true,tamperedReviewRefused:3,serverRevisionRefusals:3,actualNoteCallbackRenders:1,totals,clinicalApproval:false,patientRegistration:false,imagesImported:false}));

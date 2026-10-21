import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {contentValidator} from './content-contract-tools.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';

assert.equal(process.argv.length,2,'No test-mode or source override arguments');
const baseline='fa1bf9a233c6989fef42b533bbbac9d6ab034311';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const pinsPath='content/abdominal-branch-imaging-pins.json';
const bytes=path=>readFileSync(path);
const gitBytes=path=>execFileSync('git',['show',`${baseline}:${path}`],{
  windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const normalized=buffer=>buffer.toString('utf8').replaceAll('\r\n','\n');
const expected=[
  ['vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery','FMA14810','midline','FJ3542','b77b34cda312ffba8034c41a5457a0ad052d28439efd228ef90724ec3c4adce4'],
  ['vm:anatomy:body:abdomen:right:vessel:right-colic-artery','FMA14811','right','FJ3590','d4099403f391139ea5716f10f441489d1f8abaa7b39a0e21596efe5457bddbd0'],
];
const targetIds=new Set(expected.map(row=>row[0]));
const compiled=await build({stdin:{contents:
  "export {colicArteryUltrasoundLesson as lesson} from './lib/colic-artery-ultrasound';"+
  "export {colicArteryUltrasoundTopics as topics} from './content/colic-artery-ultrasound';"+
  "export {bodyLesson,bodyContent} from './app/body-content';"+
  "export {bodyContentRecords} from './lib/content-export';"+
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';"+
  "export {contentTabs} from './lib/content-types';"+
  "export {structures} from './app/anatomy-data';"+
  "export {dissectionProfiles} from './app/dissection-data';"+
  "export {regionalTours} from './lib/regional-tours';"+
  "export * from './lib/body-review-material';export * from './lib/body-review-context';"+
  "export * from './lib/body-review-response';export * from './lib/body-review-api';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const previous=await exactSourceHistoryApi(baseline,'display-review');
const raw=JSON.parse(bytes(catalogPath)),display=api.bodyDisplayCatalog(raw);
const targets=display.structures.filter(s=>targetIds.has(s.id));
const records=api.bodyContentRecords(display),oldRecords=previous.bodyContentRecords(display);
const registry=new Map(records.map(record=>[record.representationScope+'|'+record.id,record]));
const validate=await contentValidator(registry);

test('two explicit source roots; complete dispatch inverse and unrelated source data retained',()=>{
  assert.equal(targets.length,2);
  assert.equal(sha(bytes(catalogPath)),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
  for(const path of [catalogPath,pinsPath,'public/models/bodyparts3d/manifest.json',
    'app/body-explorer.tsx','app/body-explorer.css','app/body-scene.tsx',
    'lib/regional-tours.ts','lib/arterial-evidence-limits.ts','content/arterial-evidence-limits.ts',
    'content/review-revisions.json'])
    assert.deepEqual(bytes(path),gitBytes(path),path);
  assert.deepEqual(display,previous.bodyDisplayCatalog(raw));
  assert.equal(display.structures.length,1104);
  assert.deepEqual(api.contentTabs,previous.contentTabs);
  assert.deepEqual(api.structures,previous.structures);
  assert.deepEqual(api.dissectionProfiles,previous.dissectionProfiles);
  assert.deepEqual(api.regionalTours,previous.regionalTours);
  const source=normalized(bytes('app/body-content.ts'));
  const importLine="import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\n";
  const dispatch='  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\n  if (colicUltrasound) return colicUltrasound;\n';
  assert.equal(source.split(importLine).length,2);assert.equal(source.split(dispatch).length,2);
  assert.equal(source.replace(importLine,'').replace(dispatch,''),normalized(gitBytes('app/body-content.ts')));
  assert(source.indexOf('if(arterialEvidenceLimit)return arterialEvidenceLimit;')<source.indexOf(dispatch));
  const pins=JSON.parse(bytes(pinsPath));
  for(const [id,fma,side,file,hash] of expected){
    const s=targets.find(s=>s.id===id);
    assert.deepEqual(s,pins.entries.find(entry=>entry.identity.id===id).identity);
    assert.equal(s.fmaId,fma);assert.equal(s.nodeName,fma);assert.equal(s.laterality,side);
    assert.deepEqual(s.sources,[{file,sha256:hash}]);
    assert.equal(s.validation.anatomicalReview,false);assert.equal(s.validation.status,'unvalidated');
  }
});

test('exactly two of9936 placements change; left colic and all other topics remain unchanged',()=>{
  let changed=0,preserved=0;
  const totals={before:{},after:{}};
  for(let i=0;i<display.structures.length;i++){
    const s=display.structures[i],oldRecord=oldRecords[i],record=records[i],wanted=structuredClone(oldRecord);
    assert.equal(oldRecord.id,s.id);assert.equal(record.id,s.id);assert(validate(record));
    for(const tab of api.contentTabs){
      const before=previous.bodyLesson(s,tab),after=api.bodyLesson(s,tab);
      totals.before[before.readiness]=(totals.before[before.readiness]??0)+1;
      totals.after[after.readiness]=(totals.after[after.readiness]??0)+1;
      if(targetIds.has(s.id)&&tab==='ultrasound'){
        assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
        assert.deepEqual(after,api.lesson(s,tab));
        const {readiness,...shown}=after;assert.deepEqual(api.bodyContent(s,tab),shown);
        assert.match(after.note,/radiologist review pending/);
        assert.match(after.note,/No routine transabdominal visibility is guaranteed/);
        assert.match(after.note,/entitlements remain separate/);
        assert.match(after.note,/No published imagery or text/);
        wanted.content[tab]=after;changed++;
      }else{
        assert.deepEqual(after,before,s.id+'|'+tab);assert.equal(api.lesson(s,tab),undefined);preserved++;
      }
    }
    assert.deepEqual(record,wanted,s.id+' exported content or source changed outside two lessons');
    assert.equal(record.validation.clinicalApproval,'not-included');
    assert.equal(record.validation.materialRevisions.imaging,null);
  }
  assert.equal(changed,2);assert.equal(preserved,9934);
  assert.deepEqual(totals.before,{draft:9375,pending:530,'generated-identification':31});
  assert.deepEqual(totals.after,{draft:9377,pending:528,'generated-identification':31});
  const left=display.structures.find(s=>s.fmaId==='FMA14826');assert(left);
  assert.equal(api.lesson(left,'ultrasound'),undefined);assert.equal(api.bodyLesson(left,'ultrasound').readiness,'pending');
});

test('complete source-identity mutations, foreign roots and other modalities are refused',()=>{
  const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]
    :Object.entries(value).flatMap(([key,next])=>leaves(next,[...path,key]));
  let refused=0;
  for(const s of targets){
    for(const path of leaves(s)){
      const bad=structuredClone(s);let part=bad;
      for(const key of path.slice(0,-1))part=part[key];
      const key=path.at(-1),v=part[key];
      part[key]=typeof v==='number'?v+.01:typeof v==='boolean'?!v:String(v)+'-foreign';
      assert.equal(api.lesson(bad,'ultrasound'),undefined,s.id+':'+path.join('.'));refused++;
    }
    for(const mutate of [s=>{s.sources=[];},s=>{s.sources.push({...s.sources[0]});},
      s=>{delete s.bounds;},s=>{delete s.anchor;},s=>{s.regions.push('pelvis');},
      s=>{s.validation.anatomicalReview=true;},s=>{s.partId='foreign';}]){
      const bad=structuredClone(s);mutate(bad);assert.equal(api.lesson(bad,'ultrasound'),undefined);refused++;
    }
    for(const tab of api.contentTabs.filter(tab=>tab!=='ultrasound'))assert.equal(api.lesson(s,tab),undefined);
  }
  // Both complete source records have33scalar leaves; also refuse7structural
  // mutations per root. This checks every actual field, not an invented count.
  assert.equal(refused,80);
  for(const s of display.structures.filter(s=>!targetIds.has(s.id)))assert.equal(api.lesson(s,'ultrasound'),undefined);
  console.log(JSON.stringify({identityRefusals:refused,otherRootRefusals:1102}));
});

test('acquisition-specific draft text, primary references and detached arrays never imply approval',()=>{
  const middle=targets.find(s=>s.fmaId==='FMA14810'),right=targets.find(s=>s.fmaId==='FMA14811');
  const m=api.lesson(middle,'ultrasound'),r=api.lesson(right,'ultrasound');
  assert.match(m.title,/Linear endoscopic ultrasound \(EUS\)/);assert.match(m.body,/illustrative views/);
  assert.match(m.bullets.join(' '),/not routine transabdominal/);
  assert.deepEqual(m.citations,['https://pubmed.ncbi.nlm.nih.gov/31134898/']);
  assert.match(r.title,/Intraoperative ultrasound \(IOUS\)/);assert.match(r.body,/19-operation/);
  assert.match(r.body,/selected surgical setting/);
  assert.deepEqual(r.citations,['https://pubmed.ncbi.nlm.nih.gov/34095976/','https://pubmed.ncbi.nlm.nih.gov/27502338/']);
  assert.deepEqual(Object.keys(api.topics).sort(),['FMA14810','FMA14811']);
  for(const s of targets){
    const before=api.lesson(s,'ultrasound'),detached=api.lesson(s,'ultrasound');
    detached.bullets.push('foreign');detached.citations[0]='https://invalid.example/';
    assert.deepEqual(api.lesson(s,'ultrasound'),before);
    assert.equal(before.readiness,'draft');assert(!Object.hasOwn(before,'correctAnswer'));
    assert.match(before.note,/not an acquired ultrasound view/);
    assert.match(before.note,/registration, flow or patency measurement/);
  }
});

test('regional teaching, display pins and renderer metadata reflect only the declared source transition',()=>{
  const regionalPath='content/regional-teaching/abdomen.json';
  const oldRegional=JSON.parse(gitBytes(regionalPath)),regional=JSON.parse(bytes(regionalPath));
  const wanted=structuredClone(oldRegional);let changed=0;
  for(const entry of wanted.entries){
    const id=JSON.parse(entry.identity).id;
    if(targetIds.has(id)){entry.lessons.ultrasound=api.lesson(targets.find(s=>s.id===id),'ultrasound');changed++;}
  }
  assert.equal(changed,2);assert.deepEqual(regional,wanted);
  const pinsPath='content/body-review-display-pins.json';
  const oldPins=JSON.parse(gitBytes(pinsPath)),pins=JSON.parse(bytes(pinsPath));
  const wantedPins=structuredClone(oldPins);let changedPins=0;
  assert.equal(pins.pins.length,1104);
  for(const pin of wantedPins.pins)if(targetIds.has(pin.structureId)){
    const current=pins.pins.find(p=>p.structureId===pin.structureId);
    assert.notEqual(current.sha256,pin.sha256);pin.sha256=current.sha256;changedPins++;
  }
  assert.equal(changedPins,2);assert.deepEqual(pins,wantedPins);
  const reportPath='content/body-renderer-revision.json';
  const oldRenderer=JSON.parse(gitBytes(reportPath)),renderer=JSON.parse(bytes(reportPath));
  const newPaths=['content/colic-artery-ultrasound.ts','lib/colic-artery-ultrasound.ts'];
  const changedPaths=['app/body-content.ts',pinsPath,regionalPath];
  const dependencies=[...oldRenderer.dependencies.map(row=>changedPaths.includes(row.path)
    ?{...row,sha256:sha(Buffer.from(normalized(bytes(row.path))))}:row),
    ...newPaths.map(path=>({path,sha256:sha(Buffer.from(normalized(bytes(path))))}))]
    .sort((a,b)=>a.path.localeCompare(b.path));
  assert.deepEqual(renderer,{...oldRenderer,dependencies,sha256:sha(JSON.stringify(dependencies))});
  assert.notEqual(renderer.sha256,oldRenderer.sha256);
});

test('only two review packets change and stale or tampered teaching cannot carry a decision',async()=>{
  let changed=0,preserved=0,storageCalls=0;
  for(const s of display.structures){
    const before=await previous.bodyReviewMaterial(s.id),after=await api.bodyReviewMaterial(s.id);
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!targetIds.has(s.id)){assert.deepEqual(after,before,s.id);preserved++;continue;}
    const wanted=structuredClone(before);
    wanted.topics=after.topics;wanted.fingerprints.teaching=after.fingerprints.teaching;wanted.materialHash=after.materialHash;
    assert.deepEqual(after,wanted);assert.notEqual(after.materialHash,before.materialHash);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.deepEqual(await api.parseBodyReviewResponse(after,s.id),after);
    assert.equal(await api.parseBodyReviewResponse(before,s.id),null);
    for(const mutate of [v=>{v.approval=true;},v=>{v.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},
      v=>{v.topics.find(t=>t.tab==='ultrasound').citations[0]='https://invalid.example/';}]){
      const bad=structuredClone(after);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,s.id),null);
    }
    const trusted=await api.bodyReviewContext(s.id);assert.equal(trusted.materialHash,after.materialHash);
    for(const patch of [{materialHash:before.materialHash},{materialHash:'0'.repeat(64)},{revisionHash:'0'.repeat(64)}]){
      const input={catalogScope:trusted.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
        materialHash:trusted.materialHash,revisionHash:trusted.revisions.teaching,checklistVersion:trusted.checklistVersion,...patch};
      const request=new Request('https://unit-test.invalid/api/body-review/decisions',{method:'POST',
        headers:{'oai-authenticated-user-id':'unit-test-only',origin:'https://unit-test.invalid','content-type':'application/json'},body:JSON.stringify(input)});
      const response=await api.postBodyDecision(request,{prepare(){storageCalls++;throw Error('Stale teaching must not reach storage');}});
      assert.equal(response.status,409);assert.match((await response.json()).error,/material or checklist changed/);
    }
    changed++;
  }
  assert.equal(changed,2);assert.equal(preserved,1102);assert.equal(storageCalls,0);
});

test('the real explorer note callback renders both scoped lessons and reading links without images',async()=>{
  const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
  const component=await componentBuild({stdin:{contents:
    "export {SourceDisplayNotes} from './app/source-display-notes';export {ComponentImagingNotes} from './app/component-imaging-notes';"+
    "export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},
    bundle:true,platform:'node',format:'cjs',write:false});
  const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
  const callback=bodyNoteRenderCallback(bytes('app/body-explorer.tsx').toString('utf8'));
  const code=ts.transpile(`(${callback})('ultrasound')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
  for(const selected of targets){
    const note=api.lesson(selected,'ultrasound');
    const html=render(runInNewContext(code,{React,...scope.exports,ScanLine:require('lucide-react').ScanLine,
      catalog:display,side:'both',exam:false,openNested:()=>{throw Error('Rendering must not navigate');},selected,
      bodyContent:api.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children)}));
    assert(html.includes(render(React.createElement('p',null,note.body))));
    for(const bullet of note.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
    for(const url of note.citations)assert(html.includes(`href="${url}"`));
    assert(html.includes('radiologist review pending'));assert(!html.includes('<img'));
  }
});

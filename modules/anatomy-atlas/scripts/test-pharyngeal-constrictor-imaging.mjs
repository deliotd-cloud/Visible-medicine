import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/pharyngeal-muscle-teaching-pins.json' with {type:'json'};

const parent='12ae0c258cdf64fb7449385b0a8cd7918e97edeb';
const {api,catalog}=await contentContext();
const before=await exactSourceHistoryApi(parent,'display-review');
// Preserve this transition at its completed epoch; the lower-limb quiz suite
// checks current non-target preservation. Current pharyngeal checks stay live.
const completed=await exactSourceHistoryApi('f205199ee2501ddee1b2caca4d90ab28e6dc5e87','display-review');
const display=api.bodyDisplayCatalog(catalog);
assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
for(const key of ['structures','dissectionProfiles'])assert.deepEqual(api[key],before[key]);
const compiled=await build({stdin:{contents:"export {pharyngealConstrictorImagingLesson as lesson} from './lib/pharyngeal-constrictor-imaging';export {parseBodyReviewResponse} from './lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {lesson,parseBodyReviewResponse}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const entries=pins.entries.filter(e=>e.family==='superior'||e.family==='inferior');
assert.equal(entries.length,4);
assert.deepEqual(entries.map(e=>e.identity.fmaId).sort(),['FMA46631','FMA46632','FMA46635','FMA46636']);
const ids=new Set(entries.map(e=>e.identity.id));
let changed=0,preserved=0,refused=0;
for(const structure of display.structures)for(const tab of api.contentTabs){
  const old=before.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab);
  if(ids.has(structure.id)&&(tab==='ct'||tab==='mri')){
    assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');
    assert.deepEqual(now,lesson(structure,tab));
    const {readiness,...shown}=now;assert.deepEqual(api.bodyContent(structure,tab),shown);
    assert(now.citations.length>0);assert.equal(new Set(now.citations).size,now.citations.length);
    assert.match(now.note,/review pending/i);
    assert.match(JSON.stringify(now),/middle constrictor/i);
    assert.match(JSON.stringify(now),/registration/i);
    changed++;
  }else{
    assert.deepEqual(completed.bodyLesson(structure,tab),old,structure.id+'|'+tab);assert.equal(lesson(structure,tab),undefined);preserved++;
  }
}
assert.equal(changed,8);assert.equal(preserved,9928);
for(const {identity}of entries){
  assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
  for(const tab of ['ct','mri']){
    const fresh=lesson(identity,tab),original=structuredClone(fresh);
    fresh.bullets.push('foreign');fresh.citations.push('foreign');
    assert.deepEqual(lesson(identity,tab),original);
    for(const mutate of [s=>s.sources[0].sha256='0'.repeat(64),s=>s.sources=[],s=>s.id+='-foreign',s=>s.fmaId='foreign',s=>s.laterality='foreign',s=>s.bundle='foreign',s=>s.validation.anatomicalReview=true,s=>s.unexpected=true]){
      const invalid=structuredClone(identity);mutate(invalid);assert.equal(lesson(invalid,tab),undefined);refused++;
    }
  }
  const packet=await api.bodyReviewMaterial(identity.id),old=await before.bodyReviewMaterial(identity.id);
  assert.equal(packet.approval,false);assert.deepEqual(packet.source,old.source);
  assert.deepEqual(packet.guidedTours,old.guidedTours);assert.deepEqual(packet.reasoning,old.reasoning);
  assert.notEqual(packet.fingerprints.teaching,old.fingerprints.teaching);
  assert.deepEqual(await parseBodyReviewResponse(packet,identity.id),packet);
  assert.equal(await parseBodyReviewResponse(old,identity.id),null);
  for(const tab of ['ct','mri']){
    assert.deepEqual(packet.topics.find(t=>t.tab===tab),{tab,...lesson(identity,tab)});
    const forged=structuredClone(packet);forged.topics.find(t=>t.tab===tab).body='foreign';
    assert.equal(await parseBodyReviewResponse(forged,identity.id),null);
  }
}
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {ComponentImagingNotes} from './app/component-imaging-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};
runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
let renders=0;
for(const {identity}of entries)for(const tab of ['ct','mri']){
  const actual=api.bodyLesson(identity,tab),code=ts.transpile(`(${callback})('${tab}')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
  const html=render(runInNewContext(code,{React,...scope.exports,ScanLine:require('lucide-react').ScanLine,catalog:display,side:'both',exam:false,openNested:()=>{throw Error('Render cannot navigate');},selected:identity,bodyContent:api.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children)}));
  assert(html.includes(render(React.createElement('p',null,actual.body))));
  for(const bullet of actual.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of actual.citations)assert(html.includes(`href="${url}"`));
  assert(html.includes('review pending'));renders++;
}
console.log(JSON.stringify({changed,preserved,sourceRefusals:refused,reviewPackets:4,renders,clinicalApproval:false,sourceOnly:true}));

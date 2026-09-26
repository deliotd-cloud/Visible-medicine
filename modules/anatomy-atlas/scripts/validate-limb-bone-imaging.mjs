import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeLimbBoneImaging,limbBoneContentHash as hash} from './limb-bone-imaging-history.mjs';
import {limbBoneImagingReferences,limbBoneImagingLandmarks} from '../content/limb-bone-imaging.ts';
import {beforeLimbBoneUltrasound} from './limb-bone-ultrasound-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-component-test-build.mjs';
const context=await contentContext(),api=beforeLimbBoneUltrasound(context.api),catalog=api.bodyDisplayCatalog(context.catalog);
const limbBoneImagingTopics=api.limbBoneImagingTopics;
const originalCatalog=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/limb-bone-imaging-pins.json'));
const originalAfter='1ddc0732fd882bf3380310ad6b3f673bf014fb5f';
const gitText=(commit,path)=>execFileSync('git',['show',commit+':'+path],{encoding:'utf8',maxBuffer:16e6});
assert.deepEqual(pins,JSON.parse(gitText(originalAfter,'content/limb-bone-imaging-pins.json')));
assert.deepEqual(JSON.parse(await readFile('content/limb-bone-imaging.transition.json')),JSON.parse(gitText(originalAfter,'content/limb-bone-imaging.transition.json')));
const before=await exactSourceHistoryApi(pins.sourceCommit),afterLimb=await exactSourceHistoryApi(originalAfter);
const rawHistorical=JSON.parse(gitText(pins.sourceCommit,'public/models/bodyparts3d/full-body/catalog.json'));
const historicalCatalog=before.bodyDisplayCatalog(rawHistorical);
assert.deepEqual(historicalCatalog,afterLimb.bodyDisplayCatalog(rawHistorical));
assert.equal(hash({body:historicalCatalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(before.contentTabs.map(t=>[t,before.bodyLesson(s,t)]))})),shoulder:before.structures,recipes:before.dissectionProfiles}),pins.previousAllLessonsAndRecipesHash,'Original all-teaching snapshot preserved');
assert.deepEqual(before.structures,afterLimb.structures);assert.deepEqual(before.dissectionProfiles,afterLimb.dissectionProfiles);
let historicalUnchanged=0;
for(const s of historicalCatalog.structures)for(const t of before.contentTabs){
  const e=pins.entries.find(e=>e.identity.id===s.id);
  if(!e?.topics.includes(t)){assert.deepEqual(afterLimb.bodyLesson(s,t),before.bodyLesson(s,t));historicalUnchanged++;}
}
assert.equal(historicalUnchanged,historicalCatalog.structures.length*9-24);
const rows=(await readFile('../work/bodyparts3d/isa_element_parts.txt','utf8')).trim().split(/\r?\n/).map(r=>r.split('\t'));
assert.equal(pins.entries.length,12); assert.equal(pins.entries.filter(e=>e.identity.laterality==='left').length,6);
for(const e of pins.entries)assert.deepEqual(rows.filter(r=>r[0]===e.identity.fmaId).map(r=>[r[1],r[2]]),[[e.identity.sourceName,e.identity.sources.map(p=>p.file).join(',')]]);
assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
for(const b of pins.bundles) {
  assert.deepEqual(catalog.bundles.find(x=>x.id===b.id),b);
  assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
}
const records=api.bodyContentRecords(catalog),registry=new Map(records.map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
let placements=0,unchanged=0,rejected=0;
for(const s of catalog.structures) {
  const e=pins.entries.find(e=>e.identity.id===s.id),record=records.find(r=>r.id===s.id);assert(validate(record));
  for(const t of api.contentTabs) {
    const lesson=api.limbBoneImagingLesson(s,t);
    if(!e?.topics.includes(t)) {assert.equal(lesson,undefined);unchanged++;continue;}
    placements++;assert.equal(before.bodyLesson(s,t).readiness,'pending');assert.equal(lesson.readiness,'draft');
    assert.deepEqual(api.bodyLesson(s,t),lesson);assert.deepEqual(record.content[t],lesson);
    assert.deepEqual(lesson,afterLimb.bodyLesson(s,t),'Current original 24 topics retain exact authored content');
    assert.match(lesson.note,/review pending/);assert.match(lesson.note,/No patient images/);assert.match(lesson.note,/paid-lecture access/);
    assert.equal(record.validation.clinicalApproval,'not-included');
    const copy=structuredClone(lesson);lesson.bullets.length=0;lesson.citations.push('changed');assert.deepEqual(api.limbBoneImagingLesson(s,t),copy);
  }
}
assert.equal(placements,24);assert.equal(unchanged,catalog.structures.length*9-24);
for(const {identity:s,topics} of pins.entries) for(const mutate of [
  s=>s.id+='foreign',s=>s.name+=' changed',s=>s.fmaId='FMA000',s=>s.laterality='midline',s=>s.region='head-neck',
  s=>s.sources[0].sha256='changed',s=>s.sources[0].file='foreign',s=>s.bundle='foreign',s=>s.nodeName='foreign',
  s=>s.anchor[0]+=0.1,s=>s.bounds.min[0]+=0.1,s=>s.validation.anatomicalReview=true,
]) {const bad=structuredClone(s);mutate(bad);for(const t of topics){assert.equal(api.limbBoneImagingLesson(bad,t),undefined);assert.equal(api.bodyLesson(bad,t).readiness,'pending');rejected++;}}
assert.throws(()=>authoringBeforeLimbBoneImaging({catalog,api:{...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===pins.entries[0].identity.id&&t==='xray'?{...v,body:'unrecorded'}:v;}}}),/Unrecorded limb-bone imaging change/);
assert.equal(JSON.stringify(catalog),originalCatalog);
const wordCount=s=>s.match(/\S+/g)?.length||0,budgets={};
for(const {note,reference} of Object.values(limbBoneImagingLandmarks))budgets[reference]=(budgets[reference]||0)+wordCount(note);
for(const group of Object.values(limbBoneImagingTopics))for(const topic of Object.values(group))for(const ref of topic.references)budgets[ref]=(budgets[ref]||0)+wordCount([topic.body,...topic.bullets].join(' '));
for(const [key,count] of Object.entries(budgets)){assert(count<=200,key+': '+count);assert.equal(new URL(limbBoneImagingReferences[key]).protocol,'https:');}
// Exercise the existing real notes callback without a browser or replacement UI.
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const noteBuild=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const noteScope={exports:{}};runInNewContext(noteBuild.outputFiles[0].text,{module:noteScope,exports:noteScope.exports,require});
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;function visit(n){if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='GroupedAnatomyNotes')callback=n.children.find(c=>ts.isJsxExpression(c))?.expression?.getText(ast);ts.forEachChild(n,visit);}visit(ast);assert(callback);
const js=ts.transpile('('+callback+')(topic)',{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022});let renders=0;
for(const {identity:selected,topics} of pins.entries)for(const topic of topics){
  const html=renderToStaticMarkup(runInNewContext(js,{React,selected,topic,bodyContent:api.bodyContent,catalog,side:'both',exam:false,ScanLine:()=>null,SourceDisplayNotes:noteScope.exports.SourceDisplayNotes,
    WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:props=>{assert.equal(props.parentId,selected.id);assert.equal(props.topic,topic);return null;},
    openNested:()=>{throw Error('Reading must not open a specimen');}}));
  assert(html.includes(selected.name));assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const href of api.limbBoneImagingLesson(selected,topic).citations)assert(html.includes(href));renders++;
}
const preserved=['app/body-explorer.tsx','app/body-scene.tsx','app/dissection-data.ts','app/anatomy-data.ts','lib/knee-imaging.ts','lib/um-limb-teaching.ts','package-lock.json','public/models/bodyparts3d/full-body/catalog.json','drizzle/0002_specimen_review_events.sql'];
// Preserve the original milestone's exact-byte guarantee at its own revisions.
// Later valid source/display/UI changes are not rolled back to fit this snapshot.
for(const path of preserved)assert.equal(gitText(originalAfter,path).replaceAll('\r\n','\n'),gitText(pins.sourceCommit,path).replaceAll('\r\n','\n'),path+' historically preserved');
const report={selections:12,distinctConcepts:6,distinctTopicTexts:12,placements,modalities:{xray:12,ct:6,mri:6},currentUntargetedSections:unchanged,historicalUnchangedSections:historicalUnchanged,historicalBefore:pins.sourceCommit,historicalAfter:originalAfter,rejectedBindings:rejected,sourceRows:12,modelHashes:pins.bundles.length,actualNoteRenders:renders,sourceWordCounts:budgets,historicallyPreservedPaths:preserved,clinicalApproval:false,browserTesting:false,realImaging:false};
await writeFile('docs/limb-bone-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

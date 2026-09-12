import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeThoracicBoneImaging,thoracicBoneContentHash as hash} from './thoracic-bone-imaging-history.mjs';
import {thoracicBoneImagingTopics,thoracicBoneImagingReferences,thoracicBoneImagingLandmarks} from '../content/thoracic-bone-imaging.ts';
import {authoringBeforeAbdominalOrganImaging} from './abdominal-organ-imaging-history.mjs';
const context=await contentContext(),{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const originalCatalog=JSON.stringify(catalog),before=authoringBeforeThoracicBoneImaging({api,catalog});
const afterThoracic=authoringBeforeAbdominalOrganImaging({api,catalog});
const pins=JSON.parse(await readFile('content/thoracic-bone-imaging-pins.json'));
assert.equal(hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,before.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles}),pins.previousAllLessonsAndRecipesHash,'All preceding teaching and recipes preserved');
const rows=(await readFile('../work/bodyparts3d/isa_element_parts.txt','utf8')).trim().split(/\r?\n/).map(r=>r.split('\t'));
assert.equal(pins.entries.length,27); assert.equal(pins.entries.filter(e=>e.identity.laterality==='left').length,12);
assert.equal(pins.entries.filter(e=>e.identity.laterality==='right').length,12);
assert.equal(pins.entries.filter(e=>e.identity.laterality==='midline').length,3);
const groupNames={first:/^(Left|Right) first rib$/,second:/^(Left|Right) second rib$/,middle:/^(Left|Right) (third|fourth|fifth|sixth|seventh) rib$/,costalMargin:/^(Left|Right) (eighth|ninth|tenth) rib$/,floating:/^(Left|Right) (eleventh|twelfth) rib$/,manubrium:/^Manubrium$/,body:/^Body of sternum$/,xiphoid:/^Xiphoid process$/};
for(const e of pins.entries)assert.match(e.identity.name,groupNames[e.group],'Source level must match its landmark teaching');
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
    const lesson=api.thoracicBoneImagingLesson(s,t);
    if(!e?.topics.includes(t)) {assert.equal(lesson,undefined);assert.deepEqual(afterThoracic.bodyLesson(s,t),before.bodyLesson(s,t));unchanged++;continue;}
    placements++;assert.equal(before.bodyLesson(s,t).readiness,'pending');assert.equal(lesson.readiness,'draft');
    assert.deepEqual(api.bodyLesson(s,t),lesson);assert.deepEqual(record.content[t],lesson);
    assert.match(lesson.note,/review pending/);assert.match(lesson.note,/No patient images/);assert.match(lesson.note,/paid-lecture access/);
    assert.equal(record.validation.clinicalApproval,'not-included');
    const copy=structuredClone(lesson);lesson.bullets.length=0;lesson.citations.push('changed');assert.deepEqual(api.thoracicBoneImagingLesson(s,t),copy);
  }
}
assert.equal(placements,108);assert.equal(unchanged,catalog.structures.length*9-108);
for(const {identity:s,topics} of pins.entries) for(const mutate of [
  s=>s.id+='foreign',s=>s.name+=' changed',s=>s.fmaId='FMA000',s=>s.laterality=s.laterality==='midline'?'left':'midline',s=>s.region='head-neck',
  s=>s.sources[0].sha256='changed',s=>s.sources[0].file='foreign',s=>s.bundle='foreign',s=>s.nodeName='foreign',
  s=>s.anchor[0]+=0.1,s=>s.bounds.min[0]+=0.1,s=>s.validation.anatomicalReview=true,
]) {const bad=structuredClone(s);mutate(bad);for(const t of topics){assert.equal(api.thoracicBoneImagingLesson(bad,t),undefined);assert.equal(api.bodyLesson(bad,t).readiness,'pending');rejected++;}}
assert.throws(()=>authoringBeforeThoracicBoneImaging({catalog,api:{...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===pins.entries[0].identity.id&&t==='xray'?{...v,body:'unrecorded'}:v;}}}),/Unrecorded thoracic-bone imaging change/);
assert.equal(JSON.stringify(catalog),originalCatalog);
const wordCount=s=>s.match(/\S+/g)?.length||0,budgets={};
budgets.landmarks=Object.values(thoracicBoneImagingLandmarks).reduce((n,note)=>n+wordCount(note),0);
for(const group of Object.values(thoracicBoneImagingTopics))for(const topic of Object.values(group))for(const ref of topic.references)budgets[ref]=(budgets[ref]||0)+wordCount([topic.body,...topic.bullets].join(' '));
for(const [key,count] of Object.entries(budgets)){assert(count<=200,key+': '+count);assert.equal(new URL(thoracicBoneImagingReferences[key]).protocol,'https:');}
// Exercise the existing real notes callback without a browser or replacement UI.
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;function visit(n){if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='GroupedAnatomyNotes')callback=n.children.find(c=>ts.isJsxExpression(c))?.expression?.getText(ast);ts.forEachChild(n,visit);}visit(ast);assert(callback);
const js=ts.transpile('('+callback+')(topic)',{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022});let renders=0;
for(const {identity:selected,topics} of pins.entries)for(const topic of topics){
  const html=renderToStaticMarkup(runInNewContext(js,{React,selected,topic,bodyContent:api.bodyContent,catalog,side:'both',exam:false,ScanLine:()=>null,
    WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:props=>{assert.equal(props.parentId,selected.id);assert.equal(props.topic,topic);return null;},
    openNested:()=>{throw Error('Reading must not open a specimen');}}));
  assert(html.includes(selected.name));assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const href of api.thoracicBoneImagingLesson(selected,topic).citations)assert(html.includes(href));renders++;
}
const preserved=['app/body-explorer.tsx','app/body-scene.tsx','app/dissection-data.ts','app/anatomy-data.ts','lib/knee-imaging.ts','lib/um-limb-teaching.ts','package-lock.json','public/models/bodyparts3d/full-body/catalog.json','drizzle/0002_specimen_review_events.sql'];
for(const path of preserved)assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),execFileSync('git',['show',pins.sourceCommit+':'+path],{encoding:'utf8',maxBuffer:16e6}).replaceAll('\r\n','\n'),path+' preserved');
const report={selections:27,landmarkGroups:8,distinctTopicTexts:8,placements,modalities:{xray:27,ct:27,mri:27,ultrasound:27},unchangedSections:unchanged,rejectedBindings:rejected,sourceRows:27,modelHashes:pins.bundles.length,actualNoteRenders:renders,sourceWordCounts:budgets,preservedPaths:preserved,clinicalApproval:false,browserTesting:false,realImaging:false};
await writeFile('docs/thoracic-bone-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

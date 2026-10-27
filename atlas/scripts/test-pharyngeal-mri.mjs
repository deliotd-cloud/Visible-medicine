import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const native=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire(native+'/package.json');
const {build}=req('esbuild');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const load=async entry=>{
  const output=await build({stdin:{contents:entry,resolveDir:native,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{
    name:'source-helper',setup(b){b.onResolve({filter:/^\.\/body-source-additions$/},()=>({path:native+'/lib/body-source-additions.ts'}));},
  }]});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
};
const current=await load(`export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson,bodyContent} from './app/body-content'; export {contentTabs} from './lib/content-types'; export {structures} from './app/anatomy-data'; export {dissectionProfiles} from './app/dissection-data'; export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot'; export {pharyngealMriLesson} from './lib/pharyngeal-mri'; export {pharyngealMriTopics} from './content/pharyngeal-mri';`);
const pins=JSON.parse(readFileSync(native+'/content/pharyngeal-mri-pins.json'));
const raw=JSON.parse(readFileSync(native+'/public/models/bodyparts3d/full-body/catalog.json'));
const display=current.bodyDisplayCatalog(raw);
assert.equal(pins.parentCommit,'a28d03acf07da97a927073d4794abf3b5ce907f7');
assert.equal(execFileSync('git',['-C',native,'merge-base',pins.parentCommit,'HEAD'],{encoding:'utf8',windowsHide:true}).trim(),pins.parentCommit);
assert.equal(pins.sourceVersion,display.sourceVersion);
assert.equal(pins.license,display.license);
assert.deepEqual(pins.coordinateSystem,display.coordinateSystem);
assert.deepEqual(pins.bundles,[display.bundles.find(b=>b.id==='head-neck-muscles')]);
const expected=new Map([
  ['FMA46729',['left','FJ2741','levator']],['FMA46728',['right','FJ2753','levator']],
  ['FMA46732',['left','FJ2748','tensor']],['FMA46731',['right','FJ2760','tensor']],
  ['FMA46672',['left','FJ2743','palatopharyngeus']],['FMA46671',['right','FJ2755','palatopharyngeus']],
  ['FMA46668',['left','FJ2746','stylopharyngeus']],['FMA46667',['right','FJ2758','stylopharyngeus']],
  ['FMA46733',['midline','FJ2762','uvular']],
]);
assert.equal(pins.entries.length,9);
assert.deepEqual(pins.entries.map(e=>e.identity.fmaId).sort(),[...expected.keys()].sort());
assert.deepEqual(Object.keys(current.pharyngealMriTopics).sort(),['levator','palatopharyngeus','stylopharyngeus','tensor','uvular']);
const parent=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const priorReaders=new Map();
for(const region of new Set(display.structures.map(s=>s.region))){
  const snapshot=JSON.parse(execFileSync('git',['-C',native,'show',pins.parentCommit+':content/regional-teaching/'+region+'.json'],{encoding:'utf8',maxBuffer:32000000,windowsHide:true}));
  priorReaders.set(region,current.decodeRegionalTeachingSnapshot(snapshot,region));
}
const priorLesson=(s,tab)=>priorReaders.get(s.region).bodyLesson(s,tab);
const ids=new Set();
for(const entry of pins.entries){
  const s=display.structures.find(s=>s.id===entry.identity.id);
  assert.deepEqual(entry.identity,s);
  const [side,file,group]=expected.get(s.fmaId);
  assert.equal(s.laterality,side);assert.equal(s.sources[0].file,file);assert.equal(entry.group,group);
  assert.equal(s.bundle,'head-neck-muscles');assert.equal(s.nodeName,s.fmaId);assert.equal(s.region,'head-neck');assert.equal(s.category,'muscle');
  assert.equal(s.sources.length,1);assert.equal(s.provenance.sourceVersion,'4.0');assert.equal(s.provenance.license,'CC-BY-4.0');
  ids.add(s.id);
  assert.equal(priorLesson(s,'mri').readiness,'pending');
  assert.deepEqual(priorLesson(s,'mri'),parent.bodyLesson(s,'mri'));
  const lesson=current.pharyngealMriLesson(s,'mri');
  assert.deepEqual(current.bodyLesson(s,'mri'),lesson,'Actual resolver includes MRI draft');
  const {readiness,...shown}=lesson;assert.deepEqual(current.bodyContent(s,'mri'),shown);
  assert.equal(readiness,'draft');assert.equal(lesson.title.startsWith(s.name),true);
  assert.equal(lesson.body,current.pharyngealMriTopics[group].body);
  assert.deepEqual(lesson.citations,current.pharyngealMriTopics[group].citations);
  assert.match(lesson.note,/revision-bound radiologist review/i);
  lesson.bullets.push('changed');lesson.citations.push('changed');
  assert.equal(current.pharyngealMriLesson(s,'mri').bullets.includes('changed'),false);
  assert.equal(current.pharyngealMriLesson(s,'mri').citations.includes('changed'),false);
  for(const change of [
    x=>x.sources[0].sha256='wrong',x=>x.sources[0].file='wrong',x=>x.laterality=side==='left'?'right':'left',
    x=>x.fmaId='FMA00000',x=>x.bundle='wrong',x=>x.bounds.min[0]+=0.01,x=>x.center[0]+=0.01,x=>x.anchor[0]+=0.01,
    x=>x.name+=' changed',x=>x.sourceName+=' changed',x=>x.region='wrong',x=>x.regions[0]='wrong',
    x=>x.category='organ',x=>x.system='organs',x=>x.nodeName='FMA00000',x=>x.id+='-foreign',
    x=>x.validation.anatomicalReview=true,x=>x.unexpected=true,
  ]){const forged=structuredClone(s);change(forged);assert.equal(current.pharyngealMriLesson(forged,'mri'),undefined);}
  for(const tab of current.contentTabs.filter(t=>t!=='mri'))assert.equal(current.pharyngealMriLesson(s,tab),undefined);
  assert.deepEqual(current.bodyLesson(s,'ct'),priorLesson(s,'ct'));
  assert.equal(current.pharyngealMriLesson(s,'ct'),undefined);
}
assert.equal(ids.size,9);
for(const s of display.structures.filter(s=>!ids.has(s.id)))assert.equal(current.pharyngealMriLesson(s,'mri'),undefined);
for(const [group,topic] of Object.entries(current.pharyngealMriTopics)){
  const prose=[topic.body,...topic.bullets,topic.note].join(' ');
  assert.equal(topic.citations.length,1);assert.match(prose,/routine|research|study/i,group);
  assert.match(topic.note,/do not identify a structure in the open scan|not.*register/i);
  assert.doesNotMatch(prose,/validated bilateral imaging|all participants bilateral|confirmed both sides/i);
  assert.ok(prose.split(/\s+/).length<190,group);
}
for(const group of ['palatopharyngeus','stylopharyngeus'])assert.match([current.pharyngealMriTopics[group].body,...current.pharyngealMriTopics[group].bullets].join(' '),/right-sided muscles only|right-sided muscles were segmented/i);
assert.equal(display.structures.length,1104);assert.equal(current.contentTabs.length,9);
const original={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(current.contentTabs.map(t=>[t,priorLesson(s,t)]))})),shoulder:current.structures,recipes:current.dissectionProfiles};
const parentOriginal={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(current.contentTabs.map(t=>[t,parent.bodyLesson(s,t)]))})),shoulder:parent.structures,recipes:parent.dissectionProfiles};
assert.deepEqual(original,parentOriginal);
const previousAllLessonsAndRecipesHash=hash(parentOriginal);
let preserved=0;
for(const s of display.structures)for(const tab of current.contentTabs){
  if(ids.has(s.id)&&tab==='mri')continue;
  assert.deepEqual(current.bodyLesson(s,tab),priorLesson(s,tab),s.id+'/'+tab);preserved++;
}
assert.equal(preserved,9927);
console.log(JSON.stringify({status:'pass',parent:pins.parentCommit,displayedStructures:display.structures.length,baselineLessons:display.structures.length*current.contentTabs.length,pendingTargets:9,proposedDrafts:9,preserved,previousAllLessonsAndRecipesHash,proposalPinsHash:hash(pins)}));

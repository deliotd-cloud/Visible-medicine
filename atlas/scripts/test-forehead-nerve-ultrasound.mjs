import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const proposal=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const native=proposal;
const req=createRequire(native+'/package.json');
const {build}=req('esbuild');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const load=async entry=>{
  const output=await build({stdin:{contents:entry,resolveDir:native,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{
    name:'proposal-source-helper',setup(b){b.onResolve({filter:/^\.\/body-source-additions$/},()=>({path:native+'/lib/body-source-additions.ts'}));},
  }]});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
};
const baseline=await load(`export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {contentTabs} from './lib/content-types'; export {structures} from './app/anatomy-data'; export {dissectionProfiles} from './app/dissection-data'; export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot';`);
const proposed=await load(`export {foreheadNerveUltrasoundLesson} from '${(proposal+'/lib/forehead-nerve-ultrasound.ts').replaceAll('\\','/')}'; export {foreheadNerveUltrasoundTopics} from '${(proposal+'/content/forehead-nerve-ultrasound.ts').replaceAll('\\','/')}';`);
const pins=JSON.parse(readFileSync(proposal+'/content/forehead-nerve-ultrasound-pins.json'));
const raw=JSON.parse(readFileSync(native+'/public/models/bodyparts3d/full-body/catalog.json'));
const display=baseline.bodyDisplayCatalog(raw);
assert.equal(execFileSync('git',['-C',native,'merge-base',pins.parentCommit,'HEAD'],{encoding:'utf8',windowsHide:true}).trim(),pins.parentCommit);
const priorReaders=new Map();for(const region of new Set(display.structures.map(s=>s.region))){const snapshot=JSON.parse(execFileSync('git',['-C',native,'show',pins.parentCommit+':content/regional-teaching/'+region+'.json'],{encoding:'utf8',maxBuffer:32000000,windowsHide:true}));priorReaders.set(region,baseline.decodeRegionalTeachingSnapshot(snapshot,region));}
const priorLesson=(structure,tab)=>priorReaders.get(structure.region).bodyLesson(structure,tab);
assert.equal(pins.sourceVersion,display.sourceVersion);
assert.equal(pins.license,display.license);
assert.deepEqual(pins.coordinateSystem,display.coordinateSystem);
assert.deepEqual(pins.bundles,[display.bundles.find(b=>b.id==='head-neck-nerves')]);
assert.equal(pins.entries.length,4);
assert.deepEqual(pins.entries.map(e=>e.group).sort(),['supraorbital','supraorbital','supratrochlear','supratrochlear']);
const expected=new Map([['FMA52656',['right','FJ1376','supraorbital']],['FMA52657',['left','FJ1325','supraorbital']],['FMA52643',['right','FJ1377','supratrochlear']],['FMA52644',['left','FJ1326','supratrochlear']]]);
const ids=new Set();
for(const entry of pins.entries){
  const s=display.structures.find(s=>s.id===entry.identity.id);
  assert.deepEqual(entry.identity,s);
  const [side,file,group]=expected.get(s.fmaId)??[];
  assert.equal(s.laterality,side);assert.equal(s.sources[0].file,file);assert.equal(entry.group,group);
  assert.equal(s.bundle,'head-neck-nerves');assert.equal(s.nodeName,s.fmaId);assert.equal(s.region,'head-neck');assert.equal(s.category,'nerve');
  assert.equal(s.sources.length,1);assert.equal(s.provenance.sourceVersion,'4.0');assert.equal(s.provenance.license,'CC-BY-4.0');
  ids.add(s.id);
  const prior=priorLesson(s,'ultrasound');assert.equal(prior.readiness,'pending');
  assert.deepEqual(baseline.bodyLesson(s,'ultrasound'),proposed.foreheadNerveUltrasoundLesson(s,'ultrasound'),'Actual resolver includes the admitted draft');
  const lesson=proposed.foreheadNerveUltrasoundLesson(s,'ultrasound');
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.title.startsWith(s.name),true);
  assert.equal(lesson.body,proposed.foreheadNerveUltrasoundTopics[group].body);
  assert.deepEqual(lesson.citations,['https://pmc.ncbi.nlm.nih.gov/articles/PMC10566885/','https://pubmed.ncbi.nlm.nih.gov/28712884/']);
  assert.match(lesson.note,/revision-bound radiologist sign-off remains pending/i);
  lesson.bullets.push('changed');lesson.citations.push('changed');
  assert.equal(proposed.foreheadNerveUltrasoundLesson(s,'ultrasound').bullets.includes('changed'),false);
  assert.equal(proposed.foreheadNerveUltrasoundLesson(s,'ultrasound').citations.includes('changed'),false);
  const mutate=[
    x=>x.sources[0].sha256='wrong',x=>x.sources[0].file='wrong',x=>x.laterality=side==='left'?'right':'left',
    x=>x.fmaId='FMA00000',x=>x.bundle='wrong',x=>x.bounds.min[0]+=0.01,x=>x.center[0]+=0.01,x=>x.anchor[0]+=0.01,
    x=>x.name+=' changed',x=>x.sourceName+=' changed',x=>x.region='wrong',x=>x.regions[0]='wrong',
    x=>x.category='organ',x=>x.system='organs',x=>x.nodeName='FMA00000',x=>x.id+='-foreign',
  ];
  for(const change of mutate){const forged=structuredClone(s);change(forged);assert.equal(proposed.foreheadNerveUltrasoundLesson(forged,'ultrasound'),undefined);}
  for(const tab of baseline.contentTabs.filter(t=>t!=='ultrasound'))assert.equal(proposed.foreheadNerveUltrasoundLesson(s,tab),undefined);
}
assert.equal(ids.size,4);
for(const s of display.structures.filter(s=>!ids.has(s.id)))assert.equal(proposed.foreheadNerveUltrasoundLesson(s,'ultrasound'),undefined);
for(const [group,topic] of Object.entries(proposed.foreheadNerveUltrasoundTopics)){
  const text=[topic.body,...topic.bullets].join(' ');
  assert.equal(topic.citations.length,2);assert.equal(/diagnostic threshold|registration|whole|entire/i.test(text),true);
  assert.equal(/injection|dose|block technique/i.test(text),false);
  assert.equal(/validates|confirmed each|all participants bilateral/i.test(text),false);
  assert.ok(text.split(/\s+/).length<150,group);
}
assert.equal(display.structures.length,1104);
assert.equal(baseline.contentTabs.length,9);
const original={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(baseline.contentTabs.map(t=>[t,priorLesson(s,t)]))})),shoulder:baseline.structures,recipes:baseline.dissectionProfiles};
// Decode optional-field markers through the production reader. Compare every
// value with the exact parent resolver and retain the original runtime hash.
const parentApi=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const parentOriginal={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(baseline.contentTabs.map(t=>[t,parentApi.bodyLesson(s,t)]))})),shoulder:parentApi.structures,recipes:parentApi.dissectionProfiles};
assert.deepEqual(original,parentOriginal);
const previousAllLessonsAndRecipesHash=hash(parentOriginal);assert.equal(previousAllLessonsAndRecipesHash,'d89a8e8d9f9d44b92a9b4bc3af6e869571ac18e564d9a76dd114731ec1b9906c');
let preserved=0;for(const s of display.structures)for(const tab of baseline.contentTabs){if(ids.has(s.id)&&tab==='ultrasound')continue;assert.deepEqual(baseline.bodyLesson(s,tab),priorLesson(s,tab),s.id+'/'+tab);preserved++;}assert.equal(preserved,9932);
console.log(JSON.stringify({status:'pass',parent:pins.parentCommit,displayedStructures:display.structures.length,baselineLessons:display.structures.length*baseline.contentTabs.length,pendingTargets:4,proposedDrafts:4,previousAllLessonsAndRecipesHash,proposalPinsHash:hash(pins)}));

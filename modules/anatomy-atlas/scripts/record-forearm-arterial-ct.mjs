import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';

const sourceCommit='96c7c6fde704292744eb7a2160b25e1b488f6e10';
const files={FMA22807:'FJ2275',FMA22808:'FJ2223',FMA268667:'FJ2297',FMA268669:'FJ2245'};
const fmas=Object.keys(files);
const pinPath='content/forearm-arterial-ct-pins.json';
const transitionPath='content/forearm-arterial-ct.transition.json';
const {api,display}=await context({current:true});
const checking=process.argv.includes('--check');
const pinning=process.argv.includes('--pins');
const entries=fmas.map(fma=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);
 const identity=matches[0];
 assert.equal(identity.laterality,fma==='FMA22807'||fma==='FMA268667'?'right':'left');
 assert.equal(identity.region,'forearm');assert.deepEqual(identity.regions,['forearm']);
 assert.equal(identity.sourceTree,'isa');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
 assert.deepEqual(identity.sources.map(s=>s.file),[files[fma]]);
 return {identity,group:fma==='FMA22807'||fma==='FMA22808'?'common-interosseous':'recurrent-interosseous',topics:['ct'],previous:{ct:api.bodyLesson(identity,'ct')}};
});
assert.equal(new Set(entries.map(e=>e.identity.id)).size,4);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,1);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles};
if(pinning){
 if(checking){
  const saved=JSON.parse(await readFile(pinPath));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
  assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));
  for(const e of saved.entries)assert.equal(e.previous.ct.readiness,'pending');
  console.log(JSON.stringify({pinsHash:hash(saved),beforeHash:saved.previousAllLessonsAndRecipesHash,selections:4}));
 }else{
  const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
  for(const e of entries)assert.equal(e.previous.ct.readiness,'pending');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(pinPath));await writeFile(pinPath,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash,selections:4}));
 }
}else{
 const pins=JSON.parse(await readFile(pinPath));
 for(const key of Object.keys(base))assert.deepEqual(pins[key],base[key]);
 assert.deepEqual(pins.entries.map(e=>({identity:e.identity,group:e.group,topics:e.topics})),entries.map(e=>({identity:e.identity,group:e.group,topics:e.topics})));
 const prior=new Map();const sections=pins.entries.map(e=>{
  assert.equal(e.previous.ct.readiness,'pending');const lesson=api.bodyLesson(e.identity,'ct');assert.equal(lesson.readiness,'draft');
  prior.set(e.identity.id+'|ct',e.previous.ct);return {id:e.identity.id,sections:{ct:hash(lesson)}};
 });
 const before={...api,bodyLesson:(s,t)=>prior.get(s.id+'|'+t)??api.bodyLesson(s,t)};
 assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
 const transition={parentCommit:sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:sections};
 if(checking)assert.deepEqual(JSON.parse(await readFile(transitionPath)),transition);
 else{await assert.rejects(access(transitionPath));await writeFile(transitionPath,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
 console.log(JSON.stringify({transitionHash:hash(transition),afterHash:transition.currentAllLessonsAndRecipesHash,placements:4}));
}

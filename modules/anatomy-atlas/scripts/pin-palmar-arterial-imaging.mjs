import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {palmarArterialSelections} from '../content/palmar-arterial-imaging.ts';

const sourceCommit='0b310997ff665743f7358df4788f28d1192e94b9';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const entries=palmarArterialSelections.map(spec=>{
 const matches=display.structures.filter(s=>s.fmaId===spec.fmaId);assert.equal(matches.length,1,spec.fmaId);
 const identity=matches[0];
 assert.equal(identity.region,'hand');assert.deepEqual(identity.regions,['hand']);assert.equal(identity.sourceTree,'isa');
 assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.sources.map(s=>s.file),[spec.file]);
 const previous=Object.fromEntries(spec.topics.map(topic=>[topic,api.bodyLesson(identity,topic)]));
 if(!checking)for(const lesson of Object.values(previous))assert.equal(lesson.readiness,'pending');
 return {identity,group:spec.group,topics:spec.topics,previous};
});
assert.equal(entries.length,22);assert.equal(new Set(entries.map(e=>e.identity.id)).size,22);
assert.equal(entries.filter(e=>e.group==='proper-digital').length,10);
assert.equal(entries.reduce((n,e)=>n+e.topics.length,0),24);
const bundles=display.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));assert.equal(bundles.length,2);
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles};
const path='content/palmar-arterial-imaging-pins.json';
if(checking){
 const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
 assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));
 for(const e of saved.entries)for(const topic of e.topics)assert.equal(e.previous[topic].readiness,'pending');
 console.log(JSON.stringify({checked:true,selections:entries.length,placements:24,pinsHash:hash(saved)}));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
 const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({sourceCommit,selections:entries.length,placements:24,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));
}

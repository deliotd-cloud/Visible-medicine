import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';

const sourceCommit='bab4b00235ca44529003644d4bc41ade2b50606b';
const topics=['ct','mri','xray','ultrasound','pathology','clinical'];
const {api,display}=await context({current:true});
const matches=display.structures.filter(s=>s.fmaId==='FMA76767');
assert.equal(matches.length,1);
const identity=matches[0];
assert.equal(identity.id,'vm:anatomy:body:thorax:unspecified:vessel:anterior-cardiac-vein');
assert.equal(identity.bundle,'anterior-cardiac-vein');
assert.equal(identity.sourceTree,'isa');
assert.equal(identity.system,'vessels');
assert.equal(identity.category,'vessel');
assert.deepEqual(identity.sources.map(s=>s.file),['FJ2725','FJ2730']);
const bundle=display.bundles.find(b=>b.id===identity.bundle);
assert(bundle);
const bytes=await readFile('public'+bundle.url.split('?')[0]);
assert.equal(bytes.length,bundle.bytes);
assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
const previous=Object.fromEntries(topics.map(t=>[t,api.bodyLesson(identity,t)]));
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundle};
const path='content/anterior-cardiac-teaching-pins.json';
if(process.argv.includes('--check')){
 const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual({...saved.entry,previous:undefined},{identity,topics,previous:undefined});for(const t of topics)assert.equal(saved.entry.previous[t].readiness,'pending');
 console.log(JSON.stringify({checked:true,pinsHash:hash(saved),topicCount:display.structures.length*api.contentTabs.length}));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);
 await assert.rejects(access(path));
 for(const t of topics)assert.equal(previous[t].readiness,'pending');
 const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entry:{identity,topics,previous}};
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({sourceCommit,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash,topicCount:display.structures.length*api.contentTabs.length}));
}

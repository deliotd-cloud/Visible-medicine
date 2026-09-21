import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {laryngealImagingSelections} from '../content/laryngeal-imaging.ts';
const sourceCommit='2879b53ef8f9865c4036b06677dc9bbcf9050e90';
const {api,display}=await context({current:true});
const checking=process.argv.includes('--check');
const path='content/laryngeal-imaging-pins.json';
const entries=laryngealImagingSelections.map(spec=>{
 const matches=display.structures.filter(s=>s.fmaId===spec.fmaId);assert.equal(matches.length,1);
 const identity=matches[0];assert.equal(identity.region,'head-neck');assert.equal(identity.sourceTree,'isa');
 assert.deepEqual(identity.sources.map(s=>s.file),spec.files);
 const previous=Object.fromEntries(['ct','mri'].map(t=>[t,api.bodyLesson(identity,t)]));
 if(!checking)for(const lesson of Object.values(previous))assert.equal(lesson.readiness,'pending');
 return {identity,group:spec.group,previous};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,2);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles};
if(checking){const saved=JSON.parse(await readFile(path));for(const k of Object.keys(base))assert.deepEqual(saved[k],base[k]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const v of Object.values(e.previous))assert.equal(v.readiness,'pending');}
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));await writeFile(path,JSON.stringify({...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries},null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({checked:checking,selections:3,topics:6}));

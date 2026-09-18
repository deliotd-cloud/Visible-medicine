import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {distalPalmarMriSelections} from '../content/distal-palmar-mri.ts';
const sourceCommit='84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const entries=distalPalmarMriSelections.map(spec=>{
 const matches=display.structures.filter(s=>s.fmaId===spec.fmaId);assert.equal(matches.length,1);
 const identity=matches[0];assert.equal(identity.region,'hand');assert.deepEqual(identity.regions,['hand']);
 assert.equal(identity.bundle,'hand-vessels-hand-vascular');assert.equal(identity.sourceTree,'isa');
 assert.equal(identity.system,'vessels');assert.deepEqual(identity.sources.map(s=>s.file),spec.files);
 const previous={mri:api.bodyLesson(identity,'mri')};if(!checking)assert.equal(previous.mri.readiness,'pending');
 return {identity,group:spec.group,topics:['mri'],previous};
});
assert.equal(entries.length,6);assert.equal(new Set(entries.map(e=>e.identity.id)).size,6);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,1);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},path='content/distal-palmar-mri-pins.json';
if(checking){
 const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
 assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));
 for(const e of saved.entries)assert.equal(e.previous.mri.readiness,'pending');
 console.log(JSON.stringify({checked:true,selections:6,pinsHash:hash(saved)}));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
 const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));
}

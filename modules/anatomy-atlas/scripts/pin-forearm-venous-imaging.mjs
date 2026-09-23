import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';

const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const targets=[
  ['FMA13325','right','FJ2272','cephalic'],
  ['FMA13326','left','FJ2220','cephalic'],
  ['FMA22909','right','FJ2270','basilic'],
  ['FMA22910','left','FJ2218','basilic'],
];
const entries=targets.map(([fma,side,file,group])=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
 const identity=matches[0];assert.equal(identity.laterality,side);assert.equal(identity.sourceTree,'isa');
 assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
 assert.deepEqual(identity.regions,['forearm','shoulder-arm']);
 assert.deepEqual(identity.sources.map(s=>s.file),[file]);
 const topics=['mri'],previous={mri:api.bodyLesson(identity,'mri')};
 if(!checking)assert.equal(previous.mri.readiness,'pending');
 return {identity,group,topics,previous};
});
assert.equal(new Set(entries.map(e=>e.identity.id)).size,4);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit:'9b9a1ffca58eb9f921354eccbebeabcb9965d556',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles};
const file='content/forearm-venous-imaging-pins.json';
if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)assert.equal(e.previous.mri.readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({selections:4,placements:4,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}

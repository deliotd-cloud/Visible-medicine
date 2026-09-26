import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';
import prior from '../content/thoracic-branch-imaging-pins.json' with {type:'json'};

const parentCommit='1a978be6b835ec4a4c9fd2e22ef2888691ab7c09';
const {api,display}=await context({current:true});
const specifications=[['FMA3969','right',['mri']],['FMA4068','left',['mri']],['FMA4758','right',['mri','ultrasound']]];
const entries=specifications.map(([fmaId,side,topics])=>{
  const matches=display.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);
  const identity=matches[0], old=prior.entries.find(e=>e.identity.fmaId===fmaId);
  assert(old);assert.deepEqual(identity,old.identity);assert.equal(identity.laterality,side);
  assert.equal(identity.system,'vessels');assert.equal(identity.region,'thorax');
  return {identity,group:old.group,topics,previous:Object.fromEntries(topics.map(tab=>[tab,api.bodyLesson(identity,tab)]))};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const filename='content/internal-thoracic-imaging-pins.json';
if(process.argv.includes('--check')){
  const pins=JSON.parse(await readFile(filename));assert.equal(pins.parentCommit,parentCommit);
  assert.deepEqual(pins.bundles,bundles);assert.deepEqual(pins.coordinateSystem,display.coordinateSystem);
  assert.deepEqual(pins.entries.map(({previous:_previous,...e})=>e),entries.map(({previous:_previous,...e})=>e));
  for(const e of pins.entries)for(const tab of e.topics)assert.equal(e.previous[tab].readiness,'pending');
  console.log(JSON.stringify({identities:entries.length,placements:4,pinsHash:hash(pins)}));
}else{
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
  for(const e of entries)for(const tab of e.topics)assert.equal(e.previous[tab].readiness,'pending');
  const pins={parentCommit,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
  await writeFile(filename,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));
}

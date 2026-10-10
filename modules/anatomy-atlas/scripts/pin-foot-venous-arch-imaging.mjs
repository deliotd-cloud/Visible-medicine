import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,snapshot,hash} from './pin-pica-clinical.mjs';
const parentCommit='408ba96866e3409d096b6153ccda81eaf162b02d';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
const {api,display}=await context({current:true}),topics=['ct','mri','ultrasound'];
const entries=[['FMA44881','right'],['FMA44882','left']].map(([fma,side])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
  const identity=matches[0];assert.equal(identity.region,'foot');assert.equal(identity.system,'vessels');assert.equal(identity.laterality,side);
  const previous=Object.fromEntries(topics.map(tab=>{const lesson=api.bodyLesson(identity,tab);assert.equal(lesson.readiness,'pending');return [tab,lesson];}));
  return {identity,topics,previous};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const pins={parentCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
await writeFile('content/foot-venous-arch-imaging-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),entries:entries.map(e=>({id:e.identity.id,bundle:e.identity.bundle})),topics}));

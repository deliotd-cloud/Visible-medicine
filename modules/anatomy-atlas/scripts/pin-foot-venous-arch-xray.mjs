import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,snapshot,hash} from './pin-pica-clinical.mjs';

// Introduction-only snapshot: do not repin after dispatch or later authoring.
assert.equal(process.argv.length,2);
const parentCommit='f5052a1906bf9b87e5235bda57d367b1103729db';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
const {api,display}=await context({current:true});
const entries=[['FMA44881','right',['FJ2061','FJ2062']],['FMA44882','left',['FJ2059','FJ2060']]].map(([fma,side,files])=>{
  const found=display.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1);
  const identity=found[0];
  assert.equal(identity.region,'foot');assert.equal(identity.category,'vessel');
  assert.equal(identity.system,'vessels');assert.equal(identity.laterality,side);
  assert.equal(identity.bundle,'foot-vessels-foot-vascular');
  assert.deepEqual(identity.sources.map(s=>s.file),files);
  const xray=api.bodyLesson(identity,'xray');assert.equal(xray.readiness,'pending');
  return {identity,topics:['xray'],previous:{xray}};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,1);
for(const bundle of bundles){
  const bytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const pins={parentCommit,sourceVersion:display.sourceVersion,license:display.license,
  coordinateSystem:display.coordinateSystem,bundles,
  previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
await writeFile('content/foot-venous-arch-xray-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({parentCommit,pinsHash:hash(pins),targets:entries.map(e=>e.identity.id)}));

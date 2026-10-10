import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {contentContext} from './content-contract-tools.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';

const parentCommit='057640ca58032d1e88680ce0d99797e12532836d';
const targets=[
  ['FMA14643','Mesentery of small intestine','FJ3396','midline'],
  ['FMA14647','Transverse mesocolon','FJ3398','midline'],
  ['FMA16549','Mesoappendix','FJ3397','unspecified'],
];
assert.deepEqual(process.argv.slice(2),[]);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const entries=targets.map(([fma,name,file,laterality])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);
  assert.equal(matches.length,1,fma);
  const identity=matches[0];
  assert.equal(identity.name,name);assert.equal(identity.sourceName,name.toLowerCase());
  assert.equal(identity.system,'connective');assert.equal(identity.category,'membrane');
  assert.equal(identity.region,'abdomen');assert.deepEqual(identity.regions,['abdomen']);
  assert.equal(identity.laterality,laterality);assert.equal(identity.sourceTree,'isa');
  assert.equal(identity.bundle,'abdomen-connective-mesenteric');
  assert.deepEqual(identity.sources.map(s=>s.file),[file]);
  const previous=api.bodyLesson(identity,'ultrasound');assert.equal(previous.readiness,'pending');
  return {identity,topic:fma==='FMA14643'?'mesentery':fma==='FMA14647'?'mesocolon':'mesoappendix',topics:['ultrasound'],previous:{ultrasound:previous}};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
assert.equal(bundles.length,1);
for(const bundle of bundles){
  const bytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const pins={parentCommit,sourceVersion:display.sourceVersion,license:display.license,
  coordinateSystem:display.coordinateSystem,bundles,
  previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
await writeFile('content/abdominal-fold-ultrasound-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),identities:entries.map(e=>({id:e.identity.id,fmaId:e.identity.fmaId,topic:e.topic,bundle:e.identity.bundle,source:e.identity.sources[0].file})),bundleSha256:bundles[0].sha256}));

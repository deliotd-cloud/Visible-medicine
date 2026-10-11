import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='74a9c14258969ae33324d3f680be0f364e270463';
const path='content/pulmonary-venous-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.equal(process.argv.includes('--write')!==process.argv.includes('--check'),true,'Choose --write or --check.');
const raw=readFileSync(catalogPath);
assert(raw.equals(execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:64e6,windowsHide:true})),
  'The catalogue differs from the pinned baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const id=(side,kind,name)=>`vm:anatomy:body:thorax:${side}:${kind}:${side}-${name}`;
const targets=[
  ['FMA49914',id('right','vessel','superior-pulmonary-vein'),'thorax-vessels-recovery'],
  ['FMA49911',id('right','vessel','inferior-pulmonary-vein'),'thorax-vessels-recovery'],
  ['FMA49916',id('left','vessel','superior-pulmonary-vein'),'thorax-vessels-recovery'],
  ['FMA49913',id('left','vessel','inferior-pulmonary-vein'),'thorax-vessels-recovery'],
];
const contexts=[
  ['FMA7395',id('right','organ','main-bronchus'),'thorax-organs-inventory'],
  ['FMA50872',id('right','vessel','pulmonary-artery'),'thorax-vessels-recovery'],
  ['FMA7396',id('left','organ','main-bronchus'),'thorax-organs-inventory'],
  ['FMA50873',id('left','vessel','pulmonary-artery'),'thorax-vessels-recovery'],
];
const select=([fma,id,bundle])=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma||s.id===id);
  assert.equal(found.length,1,`Source identity ${fma}`);
  assert.equal(found[0].fmaId,fma);assert.equal(found[0].id,id);
  assert.equal(found[0].bundle,bundle);assert(found[0].regions.includes('thorax'));
  return found[0];
};
const entries=targets.map(select),contextEntries=contexts.map(select),all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,8);
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
assert.deepEqual(bundles.map(b=>b.id).sort(),['thorax-organs-inventory','thorax-vessels-recovery']);
for(const b of bundles){
  const file='public'+b.url.split('?')[0],actual=readFileSync(file);
  assert.equal(actual.length,b.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);
  assert(actual.equals(execFileSync('git',['show',baseline+':'+file],{maxBuffer:32e6,windowsHide:true})),`Asset differs from baseline: ${b.id}`);
}
const pins={schemaVersion:1,baseline,tourRevision:'pulmonary-venous-hilar-relationships-20261011-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.map(b=>({id:b.id,sha256:b.sha256,bytes:b.bytes})),pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));

import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='b3a9ff28f407437a85b9c56278bd31944ba4033e';
const path='content/pelvic-venous-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=readFileSync(catalogPath);
assert(raw.equals(execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:32e6,windowsHide:true})));
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {pelvicVeinStudy} from './content/pelvic-vein-study';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog,pelvicVeinStudy}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const resolve=fma=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,fma);assert(found[0].regions.includes('pelvis'),fma);
  return found[0];
};
const entries=pelvicVeinStudy.targetFmaIds.map(resolve);
assert.equal(entries.length,10);assert(entries.every(s=>s.bundle==='pelvic-veins'));
const contextEntries=pelvicVeinStudy.context.flatMap(c=>c.fmaIds).map(resolve);
assert.equal(contextEntries.length,7);
const all=[...entries,...contextEntries];assert.equal(new Set(all.map(s=>s.id)).size,17);
assert(!catalog.structures.some(s=>['FMA18919','FMA18907'].includes(s.fmaId)));
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
assert.equal(bundles.length,new Set(all.map(s=>s.bundle)).size);
for(const b of bundles){
  const file='public'+b.url.split('?')[0],bytes=readFileSync(file);
  assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);
  assert(bytes.equals(execFileSync('git',['show',baseline+':'+file],{maxBuffer:32e6,windowsHide:true})));
}
const pins={schemaVersion:1,baseline,tourRevision:'pelvic-venous-tour-20261010-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{assert(!existsSync(path));assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));

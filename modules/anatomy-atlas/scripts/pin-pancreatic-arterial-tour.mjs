import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='1604303bb9377dd2390e840c079652eb59c47fb0';
const path='content/pancreatic-arterial-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.equal(process.argv.includes('--write')!==process.argv.includes('--check'),true,'Choose --write or --check.');
const raw=readFileSync(catalogPath);
const git=(p)=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:64e6,windowsHide:true});
assert(raw.equals(git(catalogPath)),'The catalogue differs from the pinned baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const vessel=(name,side='unspecified')=>`vm:anatomy:body:abdomen:${side}:vessel:${name}`;
const targets=[
 ['FMA14782',vessel('anterior-superior-pancreaticoduodenal-artery')],
 ['FMA14784',vessel('posterior-superior-pancreaticoduodenal-artery')],
 ['FMA14805',vessel('inferior-pancreaticoduodenal-artery')],
 ['FMA70479',vessel('anterior-inferior-pancreaticoduodenal-artery')],
 ['FMA70480',vessel('posterior-inferior-pancreaticoduodenal-artery')],
 ['FMA14787',vessel('dorsal-pancreatic-artery')],
 ['FMA14790',vessel('inferior-pancreatic-artery')],
 ['FMA14792',vessel('great-pancreatic-artery')],
 ['FMA14793',vessel('caudal-pancreatic-artery')],
];
const contexts=[
 ['FMA7198','vm:anatomy:body:abdomen:unpaired:organ:pancreas'],
 ['FMA7196','vm:anatomy:body:abdomen:unpaired:organ:spleen'],
 ['FMA14749',vessel('superior-mesenteric-artery','midline')],
 ['FMA14773',vessel('splenic-artery')],
 ['FMA76574',vessel('trunk-of-gastroduodenal-artery')],
];
const select=([fma,id])=>{
 const found=catalog.structures.filter(s=>s.fmaId===fma||s.id===id);
 assert.equal(found.length,1,`Source identity ${fma}`);
 assert.equal(found[0].fmaId,fma);assert.equal(found[0].id,id);
 assert(found[0].regions.includes('abdomen'));return found[0];
};
const entries=targets.map(select),contextEntries=contexts.map(select),all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,14);
assert(entries.every(s=>s.bundle==='abdomen-vessels-visceral-detail'));
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
assert.deepEqual(bundles.map(b=>b.id).sort(),['abdomen-organs','abdomen-vessels-recovery','abdomen-vessels-visceral-detail','pancreas-corrected-parent']);
for(const b of bundles){
 const file='public'+b.url.split('?')[0],bytes=readFileSync(file);
 assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);
 assert(bytes.equals(git(file)),`Asset differs from baseline: ${b.id}`);
}
const pins={schemaVersion:1,baseline,tourRevision:'pancreatic-arterial-relationships-20261012-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
 assert(!existsSync(path));assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),baseline);
 writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.map(b=>b.id),pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));

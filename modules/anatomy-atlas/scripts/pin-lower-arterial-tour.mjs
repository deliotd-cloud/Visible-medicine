import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='a453a3708749d1976a1cc18b69d8ece3f0eeec1e';
const previousTourCommit='aff36c610e3aba541dfdcc97b708c9d6d19a24d2';
const previousPinHash='8fe8d8486596a983fde8c4676ae77ac3b9e15d1aa28b7b99ffd2b2d5d24cee59';
const tourRevision='right-lower-limb-arterial-orientation-v2';
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const bytes=execFileSync('git',['show',baseline+':'+rawPath],{maxBuffer:32e6,windowsHide:true});
assert(readFileSync(rawPath).equals(bytes));
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(bytes));
const targets=[['pelvis','external-iliac'],['thigh','femoral'],['thigh','deep-femoral'],['leg','popliteal'],['leg','anterior-tibial'],['leg','posterior-tibial'],['foot','dorsalis-pedis'],['foot','medial-plantar'],['foot','lateral-plantar']];
const entries=targets.map(([region,name])=>{const id=`vm:anatomy:body:${region}:right:vessel:right-${name}-artery`,matches=catalog.structures.filter(s=>s.id===id);assert.equal(matches.length,1,id);return matches[0];});
const contextTargets=[
 ['pelvis','right-hip-bone'],['thigh','right-femur'],['leg','right-tibia'],['leg','right-fibula'],
 ['foot','right-talus'],['foot','navicular-bone-of-right-foot'],['foot','right-calcaneus'],
 ['foot','right-first-metatarsal-bone'],['foot','right-fifth-metatarsal-bone'],
];
const contextEntries=contextTargets.map(([region,name])=>{const id=`vm:anatomy:body:${region}:right:bone:${name}`,matches=catalog.structures.filter(s=>s.id===id);assert.equal(matches.length,1,id);assert.equal(matches[0].laterality,'right',id);return matches[0];});
const admitted=[...entries,...contextEntries];
const bundles=catalog.bundles.filter(b=>admitted.some(s=>s.bundle===b.id));
for(const b of bundles){const actual=readFileSync('public'+b.url.split('?')[0]);assert.equal(actual.length,b.bytes);assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);}
const pins={schemaVersion:2,baseline,previousTourCommit,tourRevision,sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
const path='content/lower-arterial-tour-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else {
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),previousTourCommit);
 const previous=JSON.parse(readFileSync(path));
 assert.equal(createHash('sha256').update(JSON.stringify(previous)).digest('hex'),previousPinHash);
 assert.equal(previous.schemaVersion,1);
 assert.deepEqual(previous.entries,entries);
 assert.deepEqual(previous.bundles,bundles.filter(b=>entries.some(s=>s.bundle===b.id)));
 assert.equal(previous.baseline,baseline);
 writeFileSync(path,JSON.stringify(pins,null,2)+'\n');
}
console.log(JSON.stringify({selections:entries.length,context:contextEntries.length,bundles:bundles.length,regions:[...new Set(admitted.flatMap(s=>s.regions))],pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));

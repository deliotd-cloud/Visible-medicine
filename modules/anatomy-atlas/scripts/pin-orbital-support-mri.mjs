import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='390fc0cec7249d49106cd2bebeeb17bee6989a12';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const api=await exactSourceHistoryApi(baseline,'display-review');
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs=[['trochlea','49067','49068','cartilage'],['ring','49072','49073','tendon'],['lateralCheck','49144','49145','ligament'],['medialCheck','49147','49148','ligament'],['upperTarsal','59091','59092','connective-tissue'],['lowerTarsal','59089','59090','connective-tissue']];
const entries=specs.flatMap(([family,right,left,category])=>[[right,'right'],[left,'left']].map(([fma,laterality])=>{
 const rows=catalog.structures.filter(s=>s.fmaId==='FMA'+fma);assert.equal(rows.length,1);
 const identity=rows[0];assert.equal(identity.region,'head-neck');assert.equal(identity.category,category);assert.equal(identity.laterality,laterality);
 const previous=api.bodyLesson(identity,'mri');assert.equal(previous.readiness,'pending');return {family,identity,previous};
}));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bundles=catalog.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));
for(const b of bundles){const path='public'+new URL(b.url,'https://local.invalid').pathname;const bytes=readFileSync(path);assert.deepEqual(bytes,old(path));assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);}
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(report,null,2)+'\n',path='content/orbital-support-mri-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),output);else writeFileSync(path,output,{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,bundles:bundles.length,baseline}));

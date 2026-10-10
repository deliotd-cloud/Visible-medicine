import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='bbe33ea6ffff3503ae9cdabc0dd41350cece28cd';
const api=await exactSourceHistoryApi(baseline,'display');
const old=path=>execFileSync('git',['show',baseline+':'+path],{cwd:new URL('../',import.meta.url),windowsHide:true,maxBuffer:32e6});
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const families=[['posteriorCircumflexHumeral','posterior-circumflex-humeral-artery'],['circumflexScapular','circumflex-scapular-artery'],['thyrocervical','thyrocervical-trunk'],['costocervical','costocervical-trunk'],['dorsalScapular','dorsal-scapular-artery']];
const entries=families.flatMap(([family,slug])=>['right','left'].map(side=>{
  const id=`vm:anatomy:body:shoulder-arm:${side}:vessel:${side}-${slug}`;
  const rows=catalog.structures.filter(s=>s.id===id);assert.equal(rows.length,1,id);
  const identity=rows[0];assert.equal(identity.region,'shoulder-arm');assert.equal(identity.category,'vessel');assert.equal(identity.laterality,side);
  assert(identity.sources.length>0);assert(identity.fmaId);
  const previous=api.bodyLesson(identity,'ultrasound');assert.equal(previous.readiness,'pending',id);
  return {family,identity,previous};
}));
assert.equal(catalog.structures.length,1104);assert.equal(entries.length,10);
const snapshot={catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const path='public'+b.url.split('?')[0],bytes=readFileSync(new URL('../'+path,import.meta.url));assert.equal(sha(bytes),b.sha256);assert.deepEqual(bytes,old(path));}
const record={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,beforeAllTeachingSnapshotHash:sha(JSON.stringify(snapshot)),entries};
const path=new URL('../content/shoulder-girdle-arterial-ultrasound-pins.json',import.meta.url),text=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),text);
else writeFileSync(path,text,{flag:'wx'});
console.log(JSON.stringify({sources:entries.length,snapshotHash:record.beforeAllTeachingSnapshotHash,pinsHash:sha(JSON.stringify(record)),identities:entries.map(e=>({family:e.family,id:e.identity.id,fma:e.identity.fmaId,sources:e.identity.sources.map(s=>s.file)}))}));

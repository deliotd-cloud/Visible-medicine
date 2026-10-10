import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='707da881415d2d9dd763bc0de7e3cc04ceafdd56';
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32e6,windowsHide:true});
const api=await exactSourceHistoryApi(baseline,'display-review');
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs=[['infraspinatus','FMA32547','right','FJ1500'],['infraspinatus','FMA32548','left','FJ1500M'],['subscapularis','FMA13414','right','FJ1504'],['subscapularis','FMA13415','left','FJ1504M'],['supraspinatus','FMA32544','right','FJ1506'],['supraspinatus','FMA32545','left','FJ1506M'],['teresMinor','FMA32553','right','FJ1508'],['teresMinor','FMA32554','left','FJ1508M']];
const entries=specs.map(([family,fma,laterality,file])=>{
 const rows=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(rows.length,1);
 const identity=rows[0];assert.equal(identity.region,'shoulder-arm');assert.equal(identity.category,'muscle');assert.equal(identity.laterality,laterality);assert.deepEqual(identity.sources.map(s=>s.file),[file]);
 const previous=api.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');return {family,identity,previous};
});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bundles=catalog.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));
for(const b of bundles){const path='public'+new URL(b.url,'https://local.invalid').pathname;const bytes=readFileSync(path);assert.deepEqual(bytes,old(path));assert.equal(sha(bytes),b.sha256);}
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(report,null,2)+'\n',path='content/root-cuff-xray-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),output);else writeFileSync(path,output,{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,bundles:bundles.length,baseline}));

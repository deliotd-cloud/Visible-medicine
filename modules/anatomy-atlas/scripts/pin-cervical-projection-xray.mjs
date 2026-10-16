import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='408759d57644b05402e98a937e7cf6338b5509cf';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{windowsHide:true,maxBuffer:32e6});
const api=await exactSourceHistoryApi(baseline,'display-review');
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs=[['longusCapitis','FMA46309','Right longus capitis','right'],['longusCapitis','FMA46310','Left longus capitis','left'],['rectusAnterior','FMA46313','Right rectus capitis anterior','right'],['rectusAnterior','FMA46314','Left rectus capitis anterior','left'],['rectusLateralis','FMA46317','Right rectus capitis lateralis','right'],['rectusLateralis','FMA46318','Left rectus capitis lateralis','left']];
const entries=specs.map(([family,fmaId,name,laterality])=>{const rows=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(rows.length,1);const identity=rows[0];assert.equal(identity.name,name);assert.equal(identity.laterality,laterality);assert.equal(identity.region,'spine');assert.equal(identity.category,'muscle');assert.equal(identity.system,'muscles');const previous=api.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');return{family,identity,previous};});
const bundles=catalog.bundles.filter(bundle=>entries.some(entry=>entry.identity.bundle===bundle.id));
for(const bundle of bundles){const path='public'+new URL(bundle.url,'https://local.invalid').pathname,bytes=readFileSync(path);assert.deepEqual(bytes,old(path));assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(report,null,2)+'\n',path='content/cervical-projection-xray-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),output);else writeFileSync(path,output,{flag:'wx'});
console.log(JSON.stringify({baseline,entries:entries.map(entry=>({family:entry.family,id:entry.identity.id,fmaId:entry.identity.fmaId,sourceFiles:entry.identity.sources.map(source=>source.file)})),bundles:bundles.length,sourceGeometryChanged:false,clinicalApproval:false}));

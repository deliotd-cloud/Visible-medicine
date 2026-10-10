import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {relative,dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='a7ed1304b8ae3972dc5add5b1bb3ed8a35f671ce',root=process.cwd();
const old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6,windowsHide:true});
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'before-spinal-bone-ultrasound',setup(api){api.onLoad({filter:/body-content\.ts$/,namespace:'workspace-test'},args=>relative(root,args.path).replaceAll('\\','/')==='app/body-content.ts'?{contents:old('app/body-content.ts'),loader:'ts',resolveDir:dirname(args.path)}:undefined);}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specifications=[
 ['T2','FMA9187','FJ3160'],['T3','FMA9209','FJ3163'],['T4','FMA9248','FJ3166'],
 ['T5','FMA9922','FJ3169'],['T6','FMA9945','FJ3171'],['T7','FMA9968','FJ3173'],
 ['T8','FMA9991','FJ3174'],['T9','FMA10014','FJ3175'],['T10','FMA10037','FJ3154'],
 ['T11','FMA10059','FJ3155'],['L2','FMA13073','FJ3159'],['L3','FMA13074','FJ3162'],['L4','FMA13075','FJ3165'],
];
const entries=specifications.map(([level,fma,file])=>{
 const rows=catalog.structures.filter(s=>s.fmaId===fma&&s.sources.length===1&&s.sources[0].file===file);assert.equal(rows.length,1,level);
 const identity=rows[0];assert.equal(identity.region,'spine');assert.equal(identity.system,'skeleton');assert.equal(identity.category,'bone');assert.equal(identity.sourceTree,'isa');assert.equal(identity.laterality,'midline');
 const previous=api.bodyLesson(identity,'ultrasound');assert.equal(previous.readiness,'pending');
 return{family:level.startsWith('T')?'thoracic':'lumbar',level,identity,previous};
});
assert.equal(catalog.structures.length,1104);assert.equal(new Set(entries.map(e=>e.identity.id)).size,13);
const snapshot={catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};
const sha=b=>createHash('sha256').update(b).digest('hex'),bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles)assert.equal(sha(readFileSync('public'+b.url.split('?')[0])),b.sha256);
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,beforeAllTeachingSnapshotHash:sha(JSON.stringify(snapshot)),entries},text=JSON.stringify(report,null,2)+'\n',path='content/spinal-bone-ultrasound-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),text);else writeFileSync(path,text,{flag:'wx'});
console.log(JSON.stringify({sources:entries.length,levels:entries.map(e=>e.level),snapshotHash:report.beforeAllTeachingSnapshotHash}));

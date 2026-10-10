import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb';
const api=await exactSourceHistoryApi(baseline,'display');
const old=p=>execFileSync('git',['show',`${baseline}:${p}`],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const families={cuboid:2,medialCuneiform:2,intermediateCuneiform:2,lateralCuneiform:2,halluxNote:4};
const familyFor=s=>{
 if(/^(Left|Right) cuboid bone$/.test(s.name))return 'cuboid';
 const cuneiform=/^(Left|Right) (medial|intermediate|lateral) cuneiform bone$/.exec(s.name);
 if(cuneiform)return cuneiform[2]+'Cuneiform';
 if(/^(Proximal|Distal) phalanx of (left|right) big toe$/.test(s.name))return 'halluxNote';
 return undefined;
};
const foot=catalog.structures.filter(s=>s.region==='foot'&&s.bundle==='foot-skeleton'&&s.system==='skeleton'&&s.category==='bone');
assert.equal(foot.length,54);
assert.equal(foot.filter(s=>api.bodyLesson(s,'ultrasound').readiness==='pending').length,8);
const entries=foot.filter(s=>familyFor(s)).map(identity=>{
 const family=familyFor(identity),lesson=api.bodyLesson(identity,'ultrasound');
 assert.equal(lesson.readiness,family==='halluxNote'?'draft':'pending');
 assert(['left','right'].includes(identity.laterality));
 assert.equal(identity.sources.length,1);assert.match(identity.sources[0].file,/^FJ\d+[A-Z]?$/);assert.match(identity.fmaId,/^FMA\d+$/);
 return {family,identity,previous:{ultrasound:lesson}};
});
assert.equal(entries.length,12);
for(const[family,count]of Object.entries(families))assert.equal(entries.filter(e=>e.family===family).length,count,family);
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const snapshot={catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(tab=>[tab,api.bodyLesson(s,tab)]))})),shoulder:api.structures,recipes:api.dissectionProfiles};
assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
assert.deepEqual(bundles.map(b=>b.id),['foot-skeleton']);
for(const bundle of bundles){const file=`public${bundle.url.split('?')[0]}`,bytes=readFileSync(file);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(file));}
const record={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,beforeAllTeachingSnapshotHash:hash(snapshot),entries};
const file='content/foot-ultrasound-followup-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),output);else writeFileSync(file,output,{flag:'wx'});
console.log(JSON.stringify({sources:entries.length,families,fullSnapshotTopics:9936,snapshotHash:record.beforeAllTeachingSnapshotHash,pinsHash:hash(record)}));

import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check','Only --check is accepted');
const baseline='bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f',catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const git=args=>execFileSync('git',args,{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),old=file=>git(['show',baseline+':'+file]),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(readFileSync(catalogPath),old(catalogPath),'Source catalogue changed');
const api=await exactSourceHistoryApi(baseline,'display-review'),raw=JSON.parse(old(catalogPath)),catalog=api.bodyDisplayCatalog(raw);
const specs=[['middleCollateralUltrasound','FMA23125','ultrasound'],['middleCollateralUltrasound','FMA23124','ultrasound'],['inferiorThyroidMri','FMA10680','mri'],['inferiorThyroidMri','FMA10697','mri']];
const entries=specs.map(([family,fmaId,tab])=>{const rows=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(rows.length,1);const identity=rows[0],previous=api.bodyLesson(identity,tab);assert.equal(previous.readiness,'pending');return{family,tab,identity,previous};});
const bundles=catalog.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));assert.equal(bundles.length,2);
for(const bundle of bundles){const file='public'+new URL(bundle.url,'https://local.invalid').pathname,bytes=readFileSync(file);assert.deepEqual(bytes,old(file));assert.equal(sha(bytes),bundle.sha256);assert.equal(bytes.length,bundle.bytes);}
const result={schemaVersion:1,baseline,catalogSha256:sha(old(catalogPath)),sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(result,null,2)+'\n',target='content/arterial-evidence-limits-pins.json';
if(process.argv[2]==='--check')assert.equal(readFileSync(target,'utf8').replaceAll('\r\n','\n'),output);else{assert.equal(git(['rev-parse','HEAD']).toString().trim(),baseline);writeFileSync(target,output,{flag:'wx'});}
console.log(JSON.stringify({baseline,entries:entries.length,bundles:bundles.length,readinessPreserved:'pending',geometryChanged:false,clinicalApproval:false}));

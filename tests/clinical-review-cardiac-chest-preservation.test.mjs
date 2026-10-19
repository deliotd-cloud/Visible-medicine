import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const manifestSha='09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b';
const specs={
 'clinical-review-cardiac-venous-tour.test.ts':'9fadab73ef093d07d2f05ef18484df9a03748bd43528a8842fba854f9d5951fd',
 'clinical-review-chest-wall-quiz.test.ts':'4dee0e585c0b371cb4d98169fcd3f4968aa9b09821fded66d1971d13576a6bdd',
};
function once(source,before,after){assert.equal(source.split(before).length-1,1,'Exact admission anchor');return source.replace(before,after);}
function admitted(original,name){
 assert.equal(sha(original),specs[name],'Original test bytes');
 let result=original.toString('utf8');assert(!result.includes('\r'),'Original LF bytes');
 const anchor="import {build} from 'esbuild';\n";
 result=once(result,anchor,anchor+"import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n");
 result=once(result," const base='public/atlas-runtime/head-neck/',bytes=readFileSync(base+'manifest.json');",
  " const base='public/atlas-runtime/head-neck/',historicalBytes=readFileSync('tests/fixtures/historical-cardiac-chest-head-neck-manifest.json');");
 result=once(result,` assert.equal(sha(bytes),'${manifestSha}');`,[
  ` assert.equal(sha(historicalBytes),'${manifestSha}');`,
  ' const historicalLearner=JSON.parse(historicalBytes.toString());',
  ` assert.equal(historicalLearner.sourceCommit,'${oldSource}');`,
  " const currentDelivery=validateCurrentAtlasDelivery(),bytes=readFileSync(base+'manifest.json');",
  " assert.equal(sha(bytes),currentDelivery.documents[base+'manifest.json']);",
 ].join('\n'));
 result=once(result,`assert.equal(learner.sourceCommit,'${oldSource}');`,'assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);');
 return Buffer.from(result);
}
function preserve(original,current,name){assert(current.equals(admitted(original,name)),'Only current source admission may change; all teaching/packet/negative assertions remain exact');}
for(const name of Object.keys(specs))test(`${name}: only the reviewed historical/current split changes`,()=>{
 const original=readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
 preserve(original,readFileSync(new URL('./'+name,import.meta.url)),name);
});
test('historical learner manifest retains its exact earlier bytes and source identity',()=>{
 const bytes=readFileSync(new URL('./fixtures/historical-cardiac-chest-head-neck-manifest.json',import.meta.url));
 assert.equal(sha(bytes),manifestSha);assert.equal(JSON.parse(bytes).sourceCommit,oldSource);
});
test('clinical-approval assertion tampering cannot masquerade as current admission',()=>{
 const name='clinical-review-chest-wall-quiz.test.ts';
 const original=readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
 const current=admitted(original,name).toString();
 const tampered=Buffer.from(once(current,'assert.equal(packet.approval,false)','assert.equal(packet.approval,true)'));
 assert.throws(()=>preserve(original,tampered,name),/Only current source admission/);
});

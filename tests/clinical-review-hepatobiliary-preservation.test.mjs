import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const name='clinical-review-hepatobiliary-quiz.test.ts';
const originalSha='18d03ffc9eae9b10e6a79a3832df7454a07f5da4fa9f70dc9ad347c9fcb8afff';
const oldSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const manifestSha='09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b';
function once(source,before,after){
 assert.equal(source.split(before).length-1,1,'Exact admission anchor');
 return source.replace(before,after);
}
function admitted(original){
 assert.equal(sha(original),originalSha,'Original test bytes');
 let result=original.toString('utf8');
 assert(Buffer.from(result).equals(original),'Original UTF-8 bytes');
 assert(!result.includes('\r'),'Original LF bytes');
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
function preserve(original,current){
 assert(current.equals(admitted(original)),'Only current source admission may change; all teaching/packet/negative assertions remain exact');
}
const original=()=>readFileSync(new URL('./fixtures/clinical-current-pins/'+name+'.txt',import.meta.url));
test('hepatobiliary test retains all assertions beyond the reviewed historical/current split',()=>{
 preserve(original(),readFileSync(new URL('./'+name,import.meta.url)));
});
test('historical learner manifest keeps its exact earlier bytes and source identity',()=>{
 const bytes=readFileSync(new URL('./fixtures/historical-cardiac-chest-head-neck-manifest.json',import.meta.url));
 assert.equal(sha(bytes),manifestSha);
 assert.equal(JSON.parse(bytes).sourceCommit,oldSource);
});
test('a changed clinical approval assertion is rejected',()=>{
 const before=original(),current=admitted(before).toString();
 const tampered=Buffer.from(once(current,'assert.equal(packet.approval,false)','assert.equal(packet.approval,true)'));
 assert.throws(()=>preserve(before,tampered),/Only current source admission/);
});

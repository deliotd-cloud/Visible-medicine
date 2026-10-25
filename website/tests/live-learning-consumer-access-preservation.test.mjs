import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreConsumerAccessLaterRole} from './live-learning-consumer-access-later-inverse.mjs';
import {stripConsumerLoader} from './live-learning-consumer-loader-transition.mjs';
import {restoreNineRootQueryReader} from './page-ssr-query-role.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const importSeam="import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';\n";
const rows=[
  ['head-guided-model.test.ts','f9cc198aec25c6fcb85fb71619c0e293285d0764a8e77f5d0ef12e73d0f6f6ca',"    './AtlasBodyLearning':liveLearningConsumerModule,\n"],
  ['head-live-model.test.ts','f2e007ef253318afc61e50d5942acb0cfdc5fcb856ec5cb801ef81f9d6ae623a',"'./AtlasBodyLearning':liveLearningConsumerModule,"],
];

test('both later access roles retain the entire original consumer tests and reject forged source',()=>{
  for(const [name,originalSha,mapSeam] of rows){
    const original=read('./fixtures/live-learning-consumer-loader/'+name+'.raw');
    const current=read('./'+name);
    assert.equal(sha(original),originalSha,name+' canonical original');
    const restored=restoreConsumerAccessLaterRole(name,current);
    assert.equal(stripConsumerLoader(restored,[importSeam,mapSeam]),original,name+' complete exact original');
    assert.throws(()=>restoreConsumerAccessLaterRole(name,current+'\n// forged\n'));
    assert.throws(()=>restoreConsumerAccessLaterRole(name,current.replace("'sign-in','access-denied'","'unavailable','access-denied'")));
    assert.throws(()=>restoreConsumerAccessLaterRole(name,current.replace("    for(const reason of ['sign-in','access-denied'] as const){","")));
    assert.throws(()=>restoreConsumerAccessLaterRole(name,current+current.slice(current.indexOf("    for(const reason of ['sign-in','access-denied'] as const){"))));
    assert.throws(()=>restoreConsumerAccessLaterRole(name,current.replace("import assert from 'node:assert/strict';","import assert from 'node:assert';")));
  }
});

test('the nine-root preservation theorem keeps all original assertions through exactly two reader additions',()=>{
  const prior=read('./fixtures/live-learning-access-before/live-learning-consumer-loader-preservation.test.mjs.raw');
  assert.equal(sha(prior),'26175790b1637fa54b7f01a3d11a7bf86356e4982f6973db61cf8babfced18d6');
  const current=restoreNineRootQueryReader(read('./live-learning-consumer-loader-preservation.test.mjs'));
  const additions=[
    ["import {restoreConsumerAccessLaterRole} from './live-learning-consumer-access-later-inverse.mjs';\n",''],
    ['      :restoreConsumerAccessLaterRole(name,candidate);','      :candidate;'],
  ];
  const verify=source=>{
    let inverse=source;
    for(const [from,to] of additions){assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);}
    assert.equal(inverse,prior,'every original theorem assertion and seam retained byte for byte');
  };
  verify(current);
  assert.throws(()=>verify(current+'\n// forged\n'));
  assert.throws(()=>verify(current.replace(additions[0][0],'')));
  assert.throws(()=>verify(current+additions[0][0]));
  assert.throws(()=>verify(current.replace('assert.equal(stripConsumerLoader(historical,seams),fixture','assert.notEqual(stripConsumerLoader(historical,seams),fixture')));
});


import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const stage='F:/VisibleMedicine/staging/20261022-hand-renderer-followup';
const website='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/website';
const read=name=>readFileSync(resolve(stage,name));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const preimage=read('atlas-hand-vessel-xray-preservation.test.mjs.raw');
const proposal=read('atlas-hand-vessel-xray-preservation.test.mjs');
const epoch=read('atlas-hand-vessel-xray.renderer-epoch-a91e7a.mjs.raw');
const current=readFileSync(resolve(website,'tests/atlas-hand-vessel-xray.test.mjs'));
assert.equal(sha(preimage),'d1d148fbc34145460f6fab7fdef3d2c882e78ff931258b2989ed68b516d69840');
assert.equal(sha(epoch),'a91e7a1ab980fed3cf96ebe6b1de090502ee1f22c0a5496b83a71fbd457726a8');
assert.equal(sha(current),'f0c3a3ab07860965154ad8557066da57b343a6d7e98bff1b8436363a223988db');
for(const bytes of [preimage,proposal,epoch,current])
  assert.deepEqual(Buffer.from(bytes.toString('utf8'),'utf8'),bytes,'Lossless UTF-8 source');

function one(source,old,value){
  assert.equal(source.split(old).length,2,`Expected exactly one seam: ${old.slice(0,60)}`);
  return source.replace(old,value);
}
function section(source,begin,end,from=0){
  const start=source.indexOf(begin,from),finish=source.indexOf(end,start+begin.length);
  assert(start>=0&&finish>start,`Missing named seam: ${begin}`);
  assert.equal(source.indexOf(begin,start+1),-1,`Repeated named seam: ${begin}`);
  return source.slice(start,finish);
}
const admissionCase="test('the recovered 589 delivery closes exactly and its selected imported sources match Git',()=>{\n";
const currentCase="test('current 7b delivery binds the complete imported graph and retains protected hand teaching',async()=>{\n";
function runtime(source){
  const caseStart=source.indexOf(currentCase);assert(caseStart>=0);
  const loop='  for(const region of regions){\n';
  const start=source.indexOf(loop,caseStart)+loop.length;assert(start>=loop.length);
  const finish=source.indexOf('  const catalogPath=',start);assert(finish>start);
  return source.slice(start,finish);
}
function inverseLater(bytes){
  const source=bytes.toString('utf8'),prior=epoch.toString('utf8');
  const validator=section(source,'const historicalValidatorBytes=','const oldOriginal=');
  const admission=section(source,'  assert.throws(()=>validateCurrentAtlasDelivery',
    '  assert.equal(historicalPin.source,historical);',source.indexOf(admissionCase));
  const laterRuntime=runtime(source),oldRuntime=runtime(prior);
  assert.equal(sha(validator),'b2240be0c616f339bb0c3efc7a9c2c18e07e13184a61e5d2929c7714b8eae8a1');
  assert.equal(sha(admission),'6bf6c92511209df03102b897cf62433639c37aa9675a571748dca8a7ffd17821');
  assert.equal(sha(laterRuntime),'ab9be06856890de00a1ddc7e6092e51ba52976edab22c64023c3a953c6ba7b44');
  assert.equal(sha(oldRuntime),'70ccdf8d81b6f5e60cd5bae9e9ca8b09c75882a4808f360edb97062c33a3b5dc');
  let restored=one(source,validator,'');
  restored=one(restored,admission,'  validateCurrentAtlasDelivery({pin:historicalPin,read:historicalRead});\n');
  restored=one(restored,laterRuntime,oldRuntime);
  assert.equal(restored,prior,'Whole-file inverse to renderer epoch');
  return {validator:sha(validator),admission:sha(admission),runtime:sha(laterRuntime)};
}
const seams=inverseLater(current);
for(const [label,old,value] of [
  ['historical validator','const validatorFunctionEnd=','const validatorFunctionStop='],
  ['historical refusal','Schema-1 history cannot be admitted','Schema-1 history was admitted'],
  ['runtime family','pin.runtimeSources[region]','pin.runtimeSources.head-neck'],
]){
  const altered=one(current.toString('utf8'),old,value);
  assert.throws(()=>inverseLater(Buffer.from(altered,'utf8')),label);
}

// Reverse only the additions in the proposed preservation test and recover its
// complete original source, including all existing theorems and tamper checks.
let restored=proposal.toString('utf8');
restored=one(restored,"const rendererEpoch=readFileSync(new URL('./fixtures/atlas-hand-vessel-xray.renderer-epoch-a91e7a.mjs.raw',import.meta.url));\n",'');
restored=one(restored,"const laterSourceSha='f0c3a3ab07860965154ad8557066da57b343a6d7e98bff1b8436363a223988db';\n",'');
const addedInverse=section(restored,'function inverseLaterSource(bytes){','function verifyEpochMigration(bytes){');
restored=one(restored,addedInverse,'');
restored=one(restored,"  const candidate=inverseLaterSource(bytes).toString(),before=rendererPostimage.toString();\n",
  "  const candidate=bytes.toString(),before=rendererPostimage.toString();\n");
restored=one(restored,"  assert.equal(sha(Buffer.from(candidate,'utf8')),epochMigrationSha);\n",
  "  assert.equal(sha(bytes),epochMigrationSha);\n");
for(const row of [
  "    ['historical validator','const validatorFunctionEnd=','const validatorFunctionStop='],\n",
  "    ['historical refusal','Schema-1 history cannot be admitted','Schema-1 history was admitted'],\n",
  "    ['runtime family','pin.runtimeSources[region]','pin.runtimeSources.head-neck'],\n",
])restored=one(restored,row,'');
assert.equal(restored,preimage.toString('utf8'),'Whole-file inverse to original preservation test');
assert.equal((proposal.toString('utf8').match(/^test\('/gm)||[]).length,
  (preimage.toString('utf8').match(/^test\('/gm)||[]).length);
assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(proposal.toString('utf8')));
console.log(JSON.stringify({wholeFileInverse:true,mutationRefusals:3,seams,
  originalPreservationSha256:sha(preimage),proposedPreservationSha256:sha(proposal),
  rendererEpochSha256:sha(epoch),currentSourceSha256:sha(current)}));

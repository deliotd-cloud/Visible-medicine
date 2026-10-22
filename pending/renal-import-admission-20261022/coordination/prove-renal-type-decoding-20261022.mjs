// Whole-file, fail-closed proof of the test-only Buffer decoding correction.
import assert from 'node:assert/strict';
import {read,sha,json} from './source-only-backup-20261019.mjs';
import {inverseMedian} from 'file:///F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate/website/tests/teaching-consumer-source-inverse.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate';
const site=json(root+'/SOURCE_V2.json').website;
const old=read(root+'/verification-v2/median.before-typed-decoding.ts');
const current=read(site+'/tests/clinical-review-median-cubital-xray.test.ts');
assert.equal(sha(old),'2849d62d65fe498c4378b9705abf8934138dfe5274283c715550182721ed74f4');
assert.equal(sha(current),'ff99b7dcb7437ea01ede3d2c2fcbb4ad8e12416835031f813be9d21604bd7863');
const from="const currentText=currentSource.toString('utf8');";
const to="const currentText=Buffer.from(currentSource).toString('utf8');";
assert.equal(old.toString().split(from).length,2);
assert.deepEqual(Buffer.from(old.toString().replace(from,to)),current,'whole test outside one decoding seam unchanged');
const prior=inverseMedian(old);
assert.equal(sha(prior),'d03860ddeaac152fd082530c5661b79076279508a0f67cb308d3cb9de81ebb09');
assert.deepEqual(inverseMedian(current),prior,'all original test assertions restored');
for(const bytes of [old,current]){
 const mutation=Buffer.from(bytes);mutation[0]^=1;
 assert.throws(()=>inverseMedian(mutation),'byte mutation refused');
 assert.throws(()=>inverseMedian(Buffer.concat([bytes,Buffer.from('\n')])),'trailing data refused');
}
for(const value of [Buffer.from('dispatch\n'),Buffer.from('révision 🧠\n'),Buffer.from([0xef,0xbb,0xbf,0x61]),Buffer.from([0xff])]){
 assert.equal(Buffer.from(value).toString('utf8'),value.toString('utf8'),'same decoding for representative buffer values');
}
const helper=read(site+'/tests/teaching-consumer-source-inverse.mjs').toString();
const helperOld=read(root+'/verification-v2/teaching-helper.before-typed-decoding.mjs');
assert.equal(sha(helperOld),'c458586d1a840956920fe60d0f093c620a3a68b1cba7ec21f81cd1a69ed7d1c7');
const constant="const medianTypedPostimageSha='ff99b7dcb7437ea01ede3d2c2fcbb4ad8e12416835031f813be9d21604bd7863';\n";
const addition=`  if(sha(bytes)===medianTypedPostimageSha){
    const text=bytes.toString('utf8');
    assert.deepEqual(Buffer.from(text,'utf8'),bytes,'lossless typed median test');
    const typed="const currentText=Buffer.from(currentSource).toString('utf8');";
    assert.equal(text.split(typed).length,2,'one exact typed decoding seam');
    bytes=Buffer.from(text.replace(typed,"const currentText=currentSource.toString('utf8');"),'utf8');
  }
`;
assert.equal(helper.split(constant).length,2);assert.equal(helper.split(addition).length,2);
assert.deepEqual(Buffer.from(helper.replace(constant,'').replace(addition,'')),helperOld,'original complete historical inverse helper retained');
console.log(JSON.stringify({checks:'exact single test seam, full original inverse, mutation refusals, same UTF8 decoding, complete prior helper preservation',currentTest:sha(current),helper:sha(Buffer.from(helper)),sourceOnly:true,nativeAcceptance:false}));

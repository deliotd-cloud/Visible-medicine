import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './historical-current-atlas-delivery-56.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalBytes=readFileSync(new URL('./fixtures/clinical-review-femoral-arterial-original.ts.txt',import.meta.url));
assert.equal(sha(originalBytes),'261ba960773937f608e6e0f02bb69bd0e5d612760a1dff923891950a7fd08acd');
const original=originalBytes.toString('utf8');
const candidate=readFileSync(new URL('./clinical-review-femoral-arterial-xray.test.ts',import.meta.url),'utf8');
const oldImport="import {emittedTeaching} from './atlas-emitted-teaching.ts';";
const newImport=oldImport+"\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';";
const oldPin="const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';";
const newPin='const liveCommit=CURRENT_ATLAS_REVISION;';
const exact=original.replace(oldImport,newImport).replace(oldPin,newPin);

test('all original arterial assertions survive only the current admission seam',()=>{
 assert.equal(original.split(oldImport).length,2);
 assert.equal(original.split(oldPin).length,2);
 assert.equal(candidate,exact);
 assert.equal(execFileSync('git',['rev-parse','9fba9a1e24b6669aafd48e945d55fc0939d50ab2^{commit}'],{cwd:currentAtlasDeliveryRoot(),encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
});

test('current femoral admission is exact 46c source and b4db Review, with stale or forged pins refused',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');
 assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');
 assert.equal(pin.reviewSourceFiles,1531);
 assert(currentAtlasDeliveryRoot());
 assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
});

test('tampered historical assertions or an added read cannot masquerade as the two-seam migration',()=>{
 for(const text of [candidate+'\n',candidate.replace(newPin,oldPin),candidate.replace(newImport,newImport+'\n// foreign'),candidate.replace('assert.equal(entries.length,6)','assert.equal(entries.length,5)')])assert.notEqual(text,exact);
});

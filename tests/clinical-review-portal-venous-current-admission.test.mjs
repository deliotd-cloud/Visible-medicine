import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalBytes=readFileSync(new URL('./fixtures/clinical-review-portal-venous-original.ts.txt',import.meta.url));
assert.equal(sha(originalBytes),'7f8fbab26fd147ccf9b2f26e9e6d085486e897ecbde71cc15623d1b16c6d043c');
const original=originalBytes.toString('utf8');
const candidate=readFileSync(new URL('./clinical-review-portal-venous-xray.test.ts',import.meta.url),'utf8');
const oldImport="import {emittedTeaching} from './atlas-emitted-teaching.ts';";
const newImport=oldImport+"\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';";
const oldPin="const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';";
const newPin='const liveCommit=CURRENT_ATLAS_REVISION;';
const exact=original.replace(oldImport,newImport).replace(oldPin,newPin);

test('all original portal-venous assertions survive only the current admission seam',()=>{
 assert.equal(original.split(oldImport).length,2);
 assert.equal(original.split(oldPin).length,2);
 assert.equal(candidate,exact);
 assert.equal(execFileSync('git',['rev-parse','9fba9a1e24b6669aafd48e945d55fc0939d50ab2^{commit}'],{cwd:currentAtlasDeliveryRoot(),encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
});

test('portal-venous admission binds exact clean Atlas6a63 and its independently hashed Review inputs; stale or forged pins fail',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,'6a636fba955e30819a768372c0434432025b0fce');
 assert.equal(pin.sourceTree,'72a09bdab4750b6eeb5dbaeb9c9e242d18e3a6a0');
 const inputs=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url),'utf8'));
 assert.equal(pin.reviewIntegration,sha(JSON.stringify(inputs.inputs)));
 assert.equal(pin.reviewSourceFiles,1538);
 assert(currentAtlasDeliveryRoot());
 assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,documents:{...pin.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}));
});

test('altered historical assertion or additional source read fails the exact seam',()=>{
 for(const text of [candidate+'\n',candidate.replace(newPin,oldPin),candidate.replace(newImport,newImport+'\n// foreign'),candidate.replace('assert.equal(targets.length,4)','assert.equal(targets.length,3)')])assert.notEqual(text,exact);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalBytes=readFileSync(new URL('./fixtures/clinical-review-portal-venous-original.ts.txt',import.meta.url));
assert.equal(sha(originalBytes),'7f8fbab26fd147ccf9b2f26e9e6d085486e897ecbde71cc15623d1b16c6d043c');
const original=originalBytes.toString('utf8');
const candidate=restorePancreaticPortalCandidate('clinical-review-portal-venous-xray.test.ts',
 readFileSync(new URL('./clinical-review-portal-venous-xray.test.ts',import.meta.url)),
 readFileSync(new URL('./fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-xray.test.ts.raw',import.meta.url))).toString('utf8');
const oldImport="import {emittedTeaching} from './atlas-emitted-teaching.ts';";
const historicalImport=oldImport+"\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';";
const newImport=oldImport+"\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
const oldPin="const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';";
const newPin='const liveCommit=CURRENT_ATLAS_REVISION;';
const oldAtlas="const atlas='F:/VisibleMedicine/atlas';";
const newAtlas='const atlas=currentAtlasDeliveryRoot();';
const historicalTwoSeam=original.replace(oldImport,historicalImport).replace(oldPin,newPin);
assert.equal(sha(Buffer.from(historicalTwoSeam)),'e33cf4d6dbf57037f31f3ae1fefc6aa4cfb6e004f6a7d3480be9d9e39bec1cef');
const exact=original.replace(oldImport,newImport).replace(oldPin,newPin).replace(oldAtlas,newAtlas);
const historicalPinBytes=readFileSync(new URL('./fixtures/current-atlas-delivery-before-check-mri.json.raw',import.meta.url));
assert.equal(sha(historicalPinBytes),'00279e09c93e73bf775a1702cd163b7619ce99c5211707d32150da6efeb550f0');
const historicalPin=JSON.parse(historicalPinBytes);

test('all original portal-venous assertions survive only the current admission seam',()=>{
 assert.equal(original.split(oldImport).length,2);
 assert.equal(original.split(oldPin).length,2);
 assert.equal(original.split(oldAtlas).length,2);
 assert.equal(candidate,exact);
 const root=checkedAtlasHistoryRepo('9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 assert.equal(execFileSync('git',['rev-parse','9fba9a1e24b6669aafd48e945d55fc0939d50ab2^{commit}'],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
});

test('frozen Atlas509b witness is historical; admission binds clean current Atlas and independently hashed Review inputs',()=>{
 assert.equal(historicalPin.source,'509b01da5d72f33bd774e4a59d63e2406af1f2ff');
 assert.equal(historicalPin.sourceTree,'a9a1581bd6a3220b7d4b2554644fe0c56b688430');
 assert.equal(historicalPin.reviewSourceFiles,1538);
 const history=checkedAtlasHistoryRepo(historicalPin.source);
 assert.equal(execFileSync('git',['rev-parse',historicalPin.source+'^{tree}'],{cwd:history,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),historicalPin.sourceTree);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:historicalPin}));

 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const inputs=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url),'utf8'));
 const review=JSON.parse(readFileSync(new URL('../atlas-review/manifest.json',import.meta.url),'utf8'));
 assert.equal(pin.reviewIntegration,sha(JSON.stringify(inputs.inputs)));
 assert.equal(pin.reviewSourceFiles,review.files.length);
 assert.equal(review.revision,pin.source);
 assert(currentAtlasDeliveryRoot());
 assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:historicalPin.source}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,documents:{...pin.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}));
});

test('altered historical assertion or additional source read fails the exact seam',()=>{
 for(const text of [candidate+'\n',candidate.replace(newPin,oldPin),candidate.replace(newImport,historicalImport),candidate.replace(newAtlas,oldAtlas),candidate.replace(newImport,newImport+'\n// foreign'),candidate.replace('assert.equal(targets.length,4)','assert.equal(targets.length,3)')])assert.notEqual(text,exact);
});

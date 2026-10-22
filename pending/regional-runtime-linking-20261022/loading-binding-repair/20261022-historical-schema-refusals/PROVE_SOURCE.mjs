// Source-only witness for the frozen V6 packet and the isolated historical tests.
// Run: node F:/VisibleMedicine/staging/20261022-historical-schema-refusals/PROVE_SOURCE.mjs
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateHistoricalAtlasDelivery} from './CODE/tests/historical-atlas-delivery-register47.mjs';

const stage=fileURLToPath(new URL('.',import.meta.url));
const frozen='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const website=path.join(frozen,'website');
const archive='F:/VisibleMedicine/staging/20261017-posterior-fossa-website/candidate';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=relative=>readFileSync(path.join(stage,relative));
const frozenBytes=relative=>readFileSync(path.join(frozen,relative));
const originals={
 'completion-checklist-current-transition.test.mjs':'0fa8e77bf740b1717d0b3fc991b87ef4a755c4246dd40058412193bbdde10a5d',
 'posterior-fossa-integration-register.test.mjs':'5d32fe3e9628517ef9c5844fb50873d704a9e77813c76edd2484d7fcb2007f74',
};
assert.equal(sha(frozenBytes('PRODUCT_SOURCE_V6.json')),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
for(const [name,hash] of Object.entries(originals)){
 assert.equal(sha(bytes('RAW/tests/'+name)),hash);
 assert.deepEqual(bytes('RAW/tests/'+name),frozenBytes('website/tests/'+name));
}
assert.equal(sha(bytes('RAW/tests/current-atlas-delivery-register47.mjs')),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62');

const oldImport="import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const newImports="import {validateCurrentAtlasDelivery as validateStrictCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"+
 "import {validateHistoricalAtlasDelivery as validateCurrentAtlasDelivery} from './historical-atlas-delivery-register47.mjs';";
const addedTests=[
 "\ntest('current schema-2 admission refuses the exact closed revision47 schema-1 packet',()=>{\n assert.equal(priorPin.schema,'vm-current-atlas-test-delivery-1');\n assert.throws(()=>validateStrictCurrentAtlasDelivery({pin:priorPin}),{\n  code:'ERR_ASSERTION',actual:'vm-current-atlas-test-delivery-1',expected:'vm-current-atlas-test-delivery-2',\n });\n});\n",
 "\ntest('current schema-2 admission refuses the exact archived Register47 packet',()=>{\n const pin=json('tests/fixtures/current-atlas-delivery.json');\n assert.equal(pin.schema,'vm-current-atlas-test-delivery-1');\n assert.throws(()=>validateStrictCurrentAtlasDelivery({pin,read}),{\n  code:'ERR_ASSERTION',actual:'vm-current-atlas-test-delivery-1',expected:'vm-current-atlas-test-delivery-2',\n });\n});\n",
];
for(const [index,name] of Object.keys(originals).entries()){
 const raw=bytes('RAW/tests/'+name).toString('utf8');
 let staged=bytes('CODE/tests/'+name).toString('utf8');
 assert.equal(staged.split(addedTests[index]).length,2,'Exactly one separate current refusal');
 staged=staged.replace(addedTests[index],'');
 assert.equal(staged.split(newImports).length,2,'Only the historical/current import split');
 staged=staged.replace(newImports,oldImport);
 assert.equal(staged,raw,'Every original historical assertion and surrounding byte is preserved');
}

const archivedValidator=bytes('RAW/tests/current-atlas-delivery-register47.mjs').toString('utf8');
const helper=bytes('CODE/tests/historical-atlas-delivery-register47.mjs').toString('utf8');
const body=text=>text.slice(text.indexOf(" assert.equal(pin.schema,'vm-current-atlas-test-delivery-1');"),text.indexOf(' return structuredClone(pin);')+' return structuredClone(pin);'.length);
assert(body(archivedValidator).length>2000);
assert.equal(body(helper),body(archivedValidator),'Historical validator body equals the archived schema-1 contract');
const archivedPin=JSON.parse(readFileSync(path.join(archive,'tests/fixtures/current-atlas-delivery.json')));
const currentPin=JSON.parse(readFileSync(path.join(website,'tests/fixtures/current-atlas-delivery.json')));
assert.equal(archivedPin.schema,'vm-current-atlas-test-delivery-1');
assert.equal(currentPin.schema,'vm-current-atlas-test-delivery-2');
const archiveRead=relative=>readFileSync(path.join(archive,relative));
assert.deepEqual(validateHistoricalAtlasDelivery({pin:archivedPin,read:archiveRead}),archivedPin);
assert.throws(()=>validateHistoricalAtlasDelivery({pin:currentPin,read:archiveRead}),{
 code:'ERR_ASSERTION',actual:'vm-current-atlas-test-delivery-2',expected:'vm-current-atlas-test-delivery-1',
});
const mutatedPin=structuredClone(archivedPin);
mutatedPin.documents['atlas-review/manifest.json']='0'.repeat(64);
assert.throws(()=>validateHistoricalAtlasDelivery({pin:mutatedPin,read:archiveRead}),/Current delivery changed: atlas-review\/manifest\.json/);
const mutatedRead=relative=>relative==='atlas-review/manifest.json'?Buffer.from('mutated'):archiveRead(relative);
assert.throws(()=>validateHistoricalAtlasDelivery({pin:archivedPin,read:mutatedRead}),/Current delivery changed: atlas-review\/manifest\.json/);

const sourceTests=Object.keys(originals).map(name=>'tests/'+name);
const run=(loader)=>{
 const args=['--no-warnings'];
 if(loader)args.push('--experimental-loader',pathToFileURL(path.join(stage,'SOURCE_LOADER.mjs')).href);
 args.push('--test','--test-name-pattern=normal Review closure|Register47 retains|current schema-2 admission',...sourceTests);
 const result=spawnSync(process.execPath,args,{cwd:website,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
 assert(!result.error,result.error?.message);
 return {status:result.status,output:(result.stdout??'')+(result.stderr??'')};
};
const baseline=run(false);
assert.equal(baseline.status,1,'The unmodified frozen files must retain the first two failures');
assert.match(baseline.output,/Revision47 binding must reject the new normal build/);
assert.match(baseline.output,/vm-current-atlas-test-delivery-1/);
const selected=run(true);
assert.equal(selected.status,0,selected.output);
assert.match(selected.output,/tests 4/);
assert.match(selected.output,/pass 4/);

const evidence={
 frozenProductSourceV6Sha256:sha(frozenBytes('PRODUCT_SOURCE_V6.json')),
 raw:Object.fromEntries(Object.keys(originals).map(name=>[name,sha(bytes('RAW/tests/'+name))])),
 archivedValidatorSha256:sha(bytes('RAW/tests/current-atlas-delivery-register47.mjs')),
 code:Object.fromEntries([...Object.keys(originals),'historical-atlas-delivery-register47.mjs'].map(name=>[name,sha(bytes('CODE/tests/'+name))])),
 sourceLoaderSha256:sha(bytes('SOURCE_LOADER.mjs')),
 historicalBodyExact:true,originalAssertionsExact:true,historicalInverse:true,
 schema2Refusal:true,mutatedPinRefusal:true,mutatedDocumentRefusal:true,
 frozenFirstFailures:2,selectedCallbacksPassed:4,
};
writeFileSync(path.join(stage,'EVIDENCE','PROVE_SOURCE.json'),JSON.stringify(evidence,null,2)+'\n');
writeFileSync(path.join(stage,'EVIDENCE','first-failures.txt'),baseline.output);
writeFileSync(path.join(stage,'EVIDENCE','selected-callbacks.txt'),selected.output);
console.log(JSON.stringify(evidence,null,2));

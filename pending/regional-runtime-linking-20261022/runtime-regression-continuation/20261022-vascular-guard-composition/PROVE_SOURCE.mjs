import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,join} from 'node:path';
import {inverseSource,originalSha256,spans} from './SOURCE_INVERSE.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const frozen='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const tests=join(frozen,'website','tests');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hash=path=>sha(readFileSync(path));
const sourcePin='44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c';
assert.equal(hash(join(frozen,'PRODUCT_SOURCE_V6.json')),sourcePin,'Immutable V6 source manifest');
const pins={
 'colic-arterial':['262450cc8d41c27b4b4cbdb2605e63e4ae29d71efb46cb5490fe2c139a3297f5','76efe78cb9e237ac51d961390c762be364bbcad4ad18c448482a4c4552e16d0b'],
 'hepatic-arterial':['7ccc686e240ad9b77794047bcb952c14526195d574e3569465bbc53a642a74c4','55b2f98bb5e9436419f2db2a4e8e46195d0b91cbf0478105cecf57df597c5a74'],
 'pancreatic-arterial':['073d9868e953301693ec28534f68583bbf9df18d4bb8b81525c7e7e7f7816d73','69ee2b967c071aaad1562efed45476ba02e68588c71fd2895f189840eadeeb9b'],
 'leg-arterial':['73d3cb14dae874d61dca88b640db5dd88b402c0cc304159cb490eaa194ca7c91','4f27cdf19e4f59d930db25ee3cc00147582998a56ae8200d7fede807d6739286'],
 'leg-venous':['093925455c0b1fc5a19163502341d783f8597ffda2db00419f65cad96a68e999','cc554fa7ce6e3bd277a35ec2e45dea0ca50be52176589bba055f5c2325b9c5bf'],
 'visceral-arterial':['be2e213ba210247d94a964bb4521c2630edab81f4496c3e2363d2cf725921c7b','881101a2d4b2df2d95c3f1a5a4b14ba50df821c973ea98717877619fba77a216'],
};
const files=[];
for(const [name,[current,original]] of Object.entries(pins)){
 const file='clinical-review-'+name+'-xray.test.ts';
 assert.equal(hash(join(tests,file)),current,`${name}: exact frozen V6 clinical test`);
 assert.equal(hash(join(tests,'fixtures','vascular-live-before-20261019',file+'.raw')),original,`${name}: exact original raw`);
 files.push({name,currentSha256:current,originalSha256:original});
}
const proof=join(here,'CODE','tests','vascular-live-admission-preservation.test.mjs');
const raw=join(here,'RAW','tests','vascular-live-admission-preservation.test.mjs.raw');
const loader=join(here,'SOURCE_LOADER.mjs');
const frozenTest=join(tests,'vascular-live-admission-preservation.test.mjs');
const code=readFileSync(proof),original=readFileSync(raw);
assert.equal(hash(proof),'54a53b053cda262b83b6cd0ded374f42d9762e5a066784c245dacdb917d07f1e','Exact staged source-test revision');
assert.equal(hash(raw),originalSha256,'Exact persisted original preservation test');
assert.deepEqual(original,readFileSync(frozenTest),'Original matches frozen V6 test');
inverseSource(code,original);
const text=code.toString('utf8');
for(const mutated of [
 text.replace('const cases={','const cases={ // forged'),
 text.replace("import assert from 'node:assert/strict';","import assert from 'node:assert';"),
 text+'\nconst unreviewed=true;\n',
]){
 assert.notEqual(mutated,text,'Injected source mutation changes candidate');
 assert.throws(()=>inverseSource(Buffer.from(mutated),original),'Injected source mutation refused by declared seven-span inverse');
}
const run=spawnSync(process.execPath,['--disable-warning=ExperimentalWarning','--experimental-loader',pathToFileURL(loader).href,'--test','--test-reporter=tap',frozenTest],{
 cwd:join(frozen,'website'),encoding:'utf8',windowsHide:true,maxBuffer:4e6,
 env:process.env,
});
const callbacks=run.stdout.match(/^ok \d+ - .+$/gm)||[];
const expectedCallbacks=Object.keys(pins).flatMap(name=>[
 name+' retains the complete original proof through exact family and current-admission inverses',
 name+' refuses historical, source, mapping, Review, model, emitted, population and security guard deletion',
]);
assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
assert.deepEqual(callbacks.map(line=>line.replace(/^ok \d+ - /,'')),expectedCallbacks,'Every selected composition and injected-mutation callback ran');
assert.match(run.stdout,/^# tests 12$/m);
assert.match(run.stdout,/^# pass 12$/m);
assert.match(run.stdout,/^# fail 0$/m);
const evidence={
 source:'frozen V6 only; no current binding admission claimed',
 sourceManifest:join(frozen,'PRODUCT_SOURCE_V6.json'),sourceManifestSha256:sourcePin,
 proofFile:proof,proofSha256:hash(proof),
 originalPreservationTest:raw,originalPreservationTestSha256:originalSha256,
 sourceInverse:{path:join(here,'SOURCE_INVERSE.mjs'),sha256:hash(join(here,'SOURCE_INVERSE.mjs')),declaredSpans:spans.length,sourceMutationRefusals:3},
 sourceLoader:{path:loader,sha256:hash(loader),executedAt:frozenTest},
 preservedPriorProof:{codeSha256:hash(join(here,'PRE_FIX','CODE','tests','vascular-live-admission-preservation.test.mjs')),proveSha256:hash(join(here,'PRE_FIX','PROVE_SOURCE.mjs'))},
 clinicalTests:files,
 checks:{currentToPriorToOriginalByteExact:6,mutationRefusalCallbacks:6,selectedCallbacks:callbacks.map(line=>line.replace(/^ok \d+ - /,'')),passed:12,failed:0},
 command:'node F:/VisibleMedicine/staging/20261022-vascular-guard-composition/PROVE_SOURCE.mjs',
};
writeFileSync(join(here,'EVIDENCE.json'),JSON.stringify(evidence,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:12,failed:0,evidence:join(here,'EVIDENCE.json'),proofSha256:evidence.proofSha256})+'\n');

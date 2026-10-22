import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const stage=resolve(fileURLToPath(new URL('..',import.meta.url)));
const website='F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/website';
const receipt='F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/SOURCE.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const staged=path=>readFileSync(join(stage,path));
const live=path=>readFileSync(join(website,path));
const expected={
 'CODE/admission-source-roles.mjs':'a5d5dc5f23b1ac9be96977d8ac4d2cb4c34bc59e9fcd253473c1e1b8ccf47e5b',
 'CODE/drawable-epoch-current-admission.test.mjs':'e4fac800ddb19994e4641e6617978ffc4a2a7452ae7ec5343d56b35e8c46d1fa',
 'RAW/admission-source-roles.mjs.raw':'a5cf6db61cdf7cec6ba60f408e3c5833e0201edb5497ad3d5788c7118167ca11',
 'RAW/drawable-epoch-current-admission.test.mjs.raw':'a84dbee06466c21d4402a9886b4830162d77bffbd35fefcd5a9dc2bef44e8550',
};
assert.equal(sha(readFileSync(receipt)),'6a022d96197ea86b6fd8c32eed179b7619435c65066a8ff8a49257241434a190');
for(const [path,digest]of Object.entries(expected))assert.equal(sha(staged(path)),digest,path);
for(const path of Object.keys(expected).filter(path=>path.startsWith('CODE/')))
 execFileSync(process.execPath,['--check',join(stage,path)],{windowsHide:true});
console.log('PASS SOURCE receipt, four CODE/RAW hashes and two syntax checks');

let helper=staged('CODE/admission-source-roles.mjs').toString('utf8');
const addedStart=helper.indexOf('export function restorePreSurfaceImporter('),addedEnd=helper.indexOf('export function restorePreNeckHeadTeaching(',addedStart);
assert(addedStart>=0&&addedEnd>addedStart&&helper.indexOf('export function restorePreSurfaceImporter(',addedStart+1)<0);
helper=helper.slice(0,addedStart)+helper.slice(addedEnd);
const compose=' currentBytes=restorePreImporterDrawable(currentBytes);\n';
assert.equal(helper.split(compose).length,2);
helper=helper.replace(compose,'');
assert.deepEqual(Buffer.from(helper),staged('RAW/admission-source-roles.mjs.raw'));
console.log('PASS entire prior helper source restored outside importer functions and one composition line');

const inverse=await import(pathToFileURL(join(stage,'CODE/admission-source-roles.mjs')).href);
const current=staged('CODE/drawable-epoch-current-admission.test.mjs');
assert.deepEqual(inverse.restorePreImporterDrawable(current),staged('RAW/drawable-epoch-current-admission.test.mjs.raw'));
assert.equal(sha(inverse.restorePreNeckDrawable(current)),'21051bc34bdc0ed517f14d4d466a9c05052efe9991b5fbe79af100647f4a8fd4');
assert.equal(sha(inverse.restorePreAdmissionDrawable(current)),'269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce');
assert.throws(()=>inverse.restorePreImporterDrawable(Buffer.concat([current,Buffer.from(' ')])));
assert.throws(()=>inverse.restorePreNeckDrawable(staged('RAW/drawable-epoch-current-admission.test.mjs.raw')));
console.log('PASS whole drawable source e4fac→a84db→21051→269e7 and current/prior mutation refusals');

const importer=live('lib/head-atlas-import.ts'),prior=live('tests/fixtures/head-surface-before-20261022/lib__head-atlas-import.ts.raw');
assert.deepEqual(inverse.restorePreSurfaceImporter(importer,prior),prior);
assert.throws(()=>inverse.restorePreSurfaceImporter(Buffer.concat([importer,Buffer.from(' ')]),prior));
assert.throws(()=>inverse.restorePreSurfaceImporter(importer,Buffer.concat([prior,Buffer.from(' ')])));
assert.equal(sha(importer),'70fa65adc382a02cfa3a53d4bf6baf267c6272bed9086297866a80adc87413b7');
assert.equal(sha(prior),'9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57');
console.log('PASS actual importer70fa→historical9fcb whole-source inverse and both byte-mutation refusals');
console.log('SOURCE_ONLY_PASS; native drawable and dependent consumer cases unverified');

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const stage=resolve(fileURLToPath(new URL('..',import.meta.url)));
const website='F:/VisibleMedicine/staging/20261022-zero-registration-admission-successor/website';
const receipt='F:/VisibleMedicine/staging/20261022-zero-registration-admission-successor/SOURCE.json';
const sha=value=>createHash('sha256').update(value).digest('hex');
const staged=path=>readFileSync(join(stage,path));
const live=path=>readFileSync(join(website,path));
const expected={
 'CODE/admission-source-roles.mjs':'a5cf6db61cdf7cec6ba60f408e3c5833e0201edb5497ad3d5788c7118167ca11',
 'CODE/colic-adapter-inverse.test.mjs':'ab11c367369ef7dc50a1bbe8dc8b9d8a21cf4bdb0d0e50aba64dfcf228a10874',
 'CODE/drawable-epoch-current-admission.test.mjs':'a84dbee06466c21d4402a9886b4830162d77bffbd35fefcd5a9dc2bef44e8550',
 'CODE/head-tools-wider-consumer-source-preservation.test.mjs':'683a959e1da17d2db1b0c14fd88e80a9a549d8e52ed6d6f13fd688b318fb3efe',
 'RAW/colic-adapter-inverse.test.mjs.raw':'cfcaa8e253a9699aba33383c13c43d718ad17aa62534583ed9ba31208fcdd567',
 'RAW/drawable-epoch-current-admission.test.mjs.raw':'21051bc34bdc0ed517f14d4d466a9c05052efe9991b5fbe79af100647f4a8fd4',
 'RAW/head-tools-wider-consumer-source-preservation.test.mjs.raw':'018031d1af55b8b967a37bceddfe028d9e39e8fcc635f801a9c411b46b4c2d35',
};
assert.equal(sha(readFileSync(receipt)),'3a0062d75ac0fa5b331fe8170624675559b5aaec02da4d9d2f9f1cd77f673834');
for(const [path,digest]of Object.entries(expected))assert.equal(sha(staged(path)),digest,path);
for(const path of Object.keys(expected).filter(path=>path.startsWith('CODE/')))
 execFileSync(process.execPath,['--check',join(stage,path)],{windowsHide:true});
console.log('PASS frozen SOURCE receipt, seven staged CODE/RAW hashes, and four syntax checks');

const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
{
 let text=staged('CODE/colic-adapter-inverse.test.mjs').toString('utf8');
 text=once(text,"import {restorePreAdmissionDrawable} from './admission-source-roles.mjs';\n",'');
 text=once(text," :name==='drawable-epoch-current-admission.test.mjs'\n ?restorePreAdmissionDrawable(bytes)\n",'');
 const marker="\ntest('admitted drawable source restores exact prior colic input";
 assert.equal(text.split(marker).length,2);
 text=text.split(marker)[0];
 assert.deepEqual(Buffer.from(text),staged('RAW/colic-adapter-inverse.test.mjs.raw'));
}
{
 let text=staged('CODE/head-tools-wider-consumer-source-preservation.test.mjs').toString('utf8');
 text=once(text,"import {restorePreAdmissionDrawable} from './admission-source-roles.mjs';\n",'');
 text=once(text,"import {restoreSurfaceDesktopHistoricalTest} from './four-consumer-source-inverse.mjs';\n",'');
 text=once(text," const role=name==='desktop-learning-row-history.test.mjs'?restoreSurfaceDesktopHistoricalTest(current):\n  name==='drawable-epoch-current-admission.test.mjs'?restorePreAdmissionDrawable(current):current;\n",'');
 text=once(text,'inspectHeadToolsWiderConsumer(name,role)','inspectHeadToolsWiderConsumer(name,current)');
 text=once(text,'restoreHeadToolsWiderConsumer(name,role),prior','restoreHeadToolsWiderConsumer(name,current),prior');
 text=once(text," const forged=Buffer.concat([current,Buffer.from('\\n// forged\\n')]);\n assert.throws(()=>name==='desktop-learning-row-history.test.mjs'?restoreSurfaceDesktopHistoricalTest(forged):\n  name==='drawable-epoch-current-admission.test.mjs'?restorePreAdmissionDrawable(forged):restoreHeadToolsWiderConsumer(name,forged));\n assert.throws(()=>restoreHeadToolsWiderConsumer(name,Buffer.concat([role,Buffer.from('\\n// forged\\n')])));",
  " assert.throws(()=>restoreHeadToolsWiderConsumer(name,Buffer.concat([current,Buffer.from('\\n// forged\\n')])));");
 assert.deepEqual(Buffer.from(text),staged('RAW/head-tools-wider-consumer-source-preservation.test.mjs.raw'));
}
console.log('PASS both complete original consumer test sources outside enumerated seams');

const admission=await import(pathToFileURL(join(stage,'CODE/admission-source-roles.mjs')).href);
const headTools=await import(pathToFileURL(join(website,'tests/head-tools-wider-consumer-inverse.mjs')).href);
const surface=await import(pathToFileURL(join(website,'tests/four-consumer-source-inverse.mjs')).href);
const drawable=staged('CODE/drawable-epoch-current-admission.test.mjs');
assert.deepEqual(admission.restorePreNeckDrawable(drawable),staged('RAW/drawable-epoch-current-admission.test.mjs.raw'));
const priorDrawable=admission.restorePreAdmissionDrawable(drawable);
assert.equal(sha(priorDrawable),'269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce');
const preHeadDrawable=headTools.restoreHeadToolsWiderConsumer('drawable-epoch-current-admission.test.mjs',priorDrawable);
assert.equal(sha(preHeadDrawable),'1dcf6afcade0e1439627ce583d13c3d5181bdca4eb04fd84e9b5bf685b0a2025');
assert.throws(()=>admission.restorePreAdmissionDrawable(Buffer.concat([drawable,Buffer.from(' ')])));
assert.throws(()=>headTools.restoreHeadToolsWiderConsumer('drawable-epoch-current-admission.test.mjs',Buffer.concat([priorDrawable,Buffer.from(' ')])));
assert.throws(()=>headTools.restoreHeadToolsWiderConsumer('drawable-epoch-current-admission.test.mjs',preHeadDrawable));
console.log('PASS admitted drawable a84d→21051→269e7→pre-head1dcf6 whole-source roles and mutations');

const neck=live('atlas-review/content/regional-teaching/head-neck.json');
assert.equal(sha(neck),'574d55fe8bfdfdc0b6af35c2e1497162320a42e4190962795639667d72e240fd');
assert.equal(sha(admission.restorePreNeckHeadTeaching(neck)),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25');
assert.throws(()=>admission.restorePreNeckHeadTeaching(Buffer.concat([neck,Buffer.from(' ')])));
console.log('PASS exact current neck JSON574d→historical e6a three-row inverse and byte mutation refusal');

const desktop=live('tests/desktop-learning-row-history.test.mjs');
const preSurfaceDesktop=surface.restoreSurfaceDesktopHistoricalTest(desktop);
assert.equal(sha(preSurfaceDesktop),'189e900c45910ac63e2227098c0e4187eb69c9854018c893fc172ddaf32639c9');
const preHeadDesktop=headTools.restoreHeadToolsWiderConsumer('desktop-learning-row-history.test.mjs',preSurfaceDesktop);
assert.equal(sha(preHeadDesktop),'8c94803ea09e9389837e1b46ea41d52701e115ac1bed55f4e58444365141ca51');
assert.throws(()=>surface.restoreSurfaceDesktopHistoricalTest(Buffer.concat([desktop,Buffer.from(' ')])));
assert.throws(()=>headTools.restoreHeadToolsWiderConsumer('desktop-learning-row-history.test.mjs',Buffer.concat([preSurfaceDesktop,Buffer.from(' ')])));
console.log('PASS desktop surface→head-tools whole-source roles and current/intermediate mutations');
console.log('SOURCE_ONLY_PASS; native consumer test cases and downstream Git patch comparisons unverified');

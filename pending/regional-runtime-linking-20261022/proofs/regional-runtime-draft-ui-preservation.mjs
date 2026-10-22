// Pure source-byte proof. No website/product module is imported or executed.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {restoreRegionalReferenceDraftUiPrior} from './CODE/tests/regional-reference-draft-ui-source-inverse.mjs';

const stage=dirname(fileURLToPath(import.meta.url));
const frozen='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const product='F:/VisibleMedicine/staging/20261022-regional-mri-runtime-linking';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(path);
const prior=read(join(stage,'CODE/tests/fixtures/regional-reference-draft-ui-prior/regional-reference-draft-ui.test.ts.raw'));
const productRaw=read(join(product,'RAW/tests/regional-reference-draft-ui.test.ts'));
const current=read(join(product,'CODE/tests/regional-reference-draft-ui.test.ts'));
assert.equal(sha(prior),'87c59dc7bfab758df61a81646d95194037c44b76ad13381181232a11aa84ee18');
assert.equal(sha(current),'4f4d1e918dfaf0393a346d713e124b2417301f45db915b5edadd2333ddbb3f8c');
assert.deepEqual(productRaw,prior,'complete copied predecessor equals exact product RAW');
assert.deepEqual(restoreRegionalReferenceDraftUiPrior(current),prior,'actual pure adapter current → prior');
for(const mutant of [current.subarray(1),Buffer.concat([current,current]),
 Buffer.concat([current.subarray(0,1),Buffer.from([current[1]^1]),current.subarray(2)])])
 assert.throws(()=>restoreRegionalReferenceDraftUiPrior(mutant),'missing/duplicate/substituted current refused');
const corrupted=Buffer.concat([prior.subarray(0,1),Buffer.from([prior[1]^1]),prior.subarray(2)]);
assert.throws(()=>restoreRegionalReferenceDraftUiPrior(current,{readPrior:()=>corrupted}),'corrupt full fixture refused');

const rawWitness=read(join(stage,'RAW/tests/review-navigation-six-harness-preservation.test.mjs'));
const codeWitness=read(join(stage,'CODE/tests/review-navigation-six-harness-preservation.test.mjs'));
assert.equal(sha(rawWitness),'1af3889a15444f1f5f807ab4647d732b59b8f1fc0dc319eefe2459c3c872544f');
assert.deepEqual(rawWitness,read(join(frozen,'tests/review-navigation-six-harness-preservation.test.mjs')));
const witnessEdits=[
 ["import test from 'node:test';\n","import test from 'node:test';\nimport {restoreRegionalReferenceDraftUiPrior} from './regional-reference-draft-ui-source-inverse.mjs';\n"],
 [" let source=readFileSync(new URL('./'+change.path.slice(6),import.meta.url),'utf8');",
  " const current=readFileSync(new URL('./'+change.path.slice(6),import.meta.url));\n let source=(change.path==='tests/regional-reference-draft-ui.test.ts'\n  ?restoreRegionalReferenceDraftUiPrior(current):current).toString('utf8');"],
];
function once(source,before,after,label){
 assert.equal(source.split(before).length-1,1,label+' unique exact seam');
 return source.replace(before,after);
}
let projection=rawWitness.toString('utf8');
for(const [before,after] of witnessEdits)projection=once(projection,before,after,'witness forward');
assert.deepEqual(Buffer.from(projection),codeWitness,'whole new witness exactly enumerated edits');
for(const [before,after] of witnessEdits.toReversed())projection=once(projection,after,before,'witness inverse');
assert.deepEqual(Buffer.from(projection),rawWitness,'whole original witness inverse');
for(const mutant of [codeWitness.subarray(1),Buffer.concat([codeWitness,codeWitness]),
 Buffer.concat([codeWitness.subarray(0,1),Buffer.from([codeWitness[1]^1]),codeWitness.subarray(2)])])
 assert.notDeepEqual(mutant,Buffer.from(codeWitness),'witness source mutation rejected by whole equality');

const match=rawWitness.toString('utf8').match(/const changes=(\[[\s\S]*?\]);\nfor\(const change of changes\)/);
assert(match,'full historical six-case change map');
const changes=JSON.parse(match[1]);
assert.equal(changes.length,6,'all six original historical cases retained');
for(const change of changes){
 const fixture=read(join(frozen,change.fixture));
 assert.equal(sha(fixture),change.preimageSha256,change.path+' authentic historical fixture');
 const source=change.path==='tests/regional-reference-draft-ui.test.ts'
  ?restoreRegionalReferenceDraftUiPrior(current)
  :read(join(frozen,change.path));
 assert.equal(sha(source),change.proposedSha256,change.path+' exact navigation-harness predecessor');
 let text=source.toString('utf8');
 for(const seam of change.seams.toReversed())text=once(text,seam.to,seam.from,change.path+' historical seam');
 assert.deepEqual(Buffer.from(text),fixture,change.path+' full historical test body and assertions');
}
console.log('PASS: product one-line draft fixture inverse; six complete navigation-harness histories; whole witness inverse; actual adapter and source/fixture mutants; source bytes only.');

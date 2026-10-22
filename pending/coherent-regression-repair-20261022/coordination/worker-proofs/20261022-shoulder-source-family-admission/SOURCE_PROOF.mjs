// Pure staged-source proof. Never imports website code or runs its tests.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {restorePriorShoulderFamily,shoulderFamilyNames} from './CODE/tests/shoulder-source-family-inverse.mjs';

const root=new URL('.',import.meta.url).pathname.replace(/^\/(?=[A-Z]:\/)/,'');
const sha=b=>createHash('sha256').update(b).digest('hex');
const pairs={
 'clinical-review-shoulder-ct.test.ts':['1f07449dc566d996bd436cbe0b96abd5fc5aa48e5ddc1774b2ba2c30fec69d51','f36524c1d89314e3e3d8cf1274106f6dde644da695b8ece84e9ec3cc0fc40a99'],
 'clinical-review-shoulder-girdle-artery-quiz.test.ts':['efa18987a9fa80a339bf9e8ce2d4c38dae2e8ea99cc5f03f978b4ca544b5768a','d1414974a356a1015d93b55fd8853f3ef780c19ed5c97667c5968344e06e88e5'],
 'clinical-review-shoulder-muscle-xray.test.ts':['96c629bb05433675fc44cb92f60604fb6bb83f76b40829b4750782e4d7db61b4','5ea35b2607c3a7db43f598317f549bddee1b006d0c04464c6a2012c09d5f699e'],
 'clinical-review-shoulder-vessel-xray.test.ts':['44516bd1dfcbc003c209de635cbbcb6a10c435299fb42e4ea7cdebd94cc2d6b5','757a909f6a1149897db57543cd2ec8622752ba88330527c59e9180924d019be0'],
 'clinical-review-thoracoacromial-ultrasound.test.ts':['95e0cf5da289ced211518a5b6056dd3c221d502b2770253ccee9c63c3c1425c1','b6455564bb8d413ac0ab8d4b782ee1c0807aec45ce59a4064a5fa2821ee6546e'],
};
assert.deepEqual(Object.keys(pairs),shoulderFamilyNames);
const fixtureRoot=join(root,'CODE/tests/fixtures/shoulder-family-prior');
for(const [name,[oldHash,newHash]] of Object.entries(pairs)){
 const raw=readFileSync(join(root,'RAW/tests',name));
 const proposed=readFileSync(join(root,'CODE/tests',name));
 const fixture=readFileSync(join(fixtureRoot,name+'.raw'));
 assert.equal(sha(raw),oldHash,name+' frozen raw');
 assert.equal(sha(fixture),oldHash,name+' complete CODE fixture');
 assert.equal(sha(proposed),newHash,name+' proposed exact bytes');
 assert.deepEqual(restorePriorShoulderFamily(name,proposed),raw,name+' actual helper inverse');
 for(const mutant of [proposed.subarray(1),Buffer.concat([proposed,proposed]),
  Buffer.concat([proposed.subarray(0,1),Buffer.from([proposed[1]^1]),proposed.subarray(2)])])
  assert.throws(()=>restorePriorShoulderFamily(name,mutant),name+' missing/duplicate/substitution mutant refusal');
 const badFixture=Buffer.concat([fixture.subarray(0,1),Buffer.from([fixture[1]^1]),fixture.subarray(2)]);
 assert.throws(()=>restorePriorShoulderFamily(name,proposed,{readPrior:()=>badFixture}),name+' fixture corruption refusal');
}
assert.throws(()=>restorePriorShoulderFamily('not-declared.test.ts',Buffer.alloc(0)),'undeclared path refusal');

const witnesses={
 'clinical-imaging-role-preservation-20261021.test.mjs':{
  raw:'6a5663260ede388a42fc262940c0c6f5300765ca536ae420c6d588fe8c4be5ff',
  code:'92c0cb889ca52b374094b719562cfeac989d5deb465ae3869ac7022c578570e9',
  edits:[
   ["import test from 'node:test';\n\nconst here=dirname", "import test from 'node:test';\nimport {restorePriorShoulderFamily} from './shoulder-source-family-inverse.mjs';\n\nconst here=dirname"],
   ["  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');",
    "  const current=readFileSync(join(here,name));\n  const candidate=name==='clinical-review-shoulder-ct.test.ts'\n   ?restorePriorShoulderFamily(name,current):current;\n  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');"],
  ],
 },
 'limb-suprahyoid-role-preservation-20261021.test.mjs':{
  raw:'b9359849ff93c19f51d555d33e0ca772625632a08855d6d1f6822dac84203aa7',
  code:'f8391fa35956ff31b470673da1601a177fa6f4a33bd3dc63cb587c7f8d699f48',
  edits:[
   ["import test from 'node:test';\n\nconst here=dirname", "import test from 'node:test';\nimport {restorePriorShoulderFamily} from './shoulder-source-family-inverse.mjs';\n\nconst here=dirname"],
   ["  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');",
    "  const current=readFileSync(join(here,name));\n  const candidate=name==='clinical-review-shoulder-girdle-artery-quiz.test.ts'\n   ?restorePriorShoulderFamily(name,current):current;\n  assert.deepEqual(candidate,Buffer.from(expected),name+' unknown assertion or behavior edit');"],
  ],
 },
 'shoulder-muscle-role-preservation-20261021.test.mjs':{
  raw:'7490e8b83eb1fa80a583f52dcaa163683606680d9617a12c464a0c450f9f92ce',
  code:'a480a4d4ecefb83d6d4874c2c8611d50fbe695f97ecad26fdc11cf97c8b43d39',
  edits:[
   ["import{createHash}from'node:crypto';","import{createHash}from'node:crypto';import {restorePriorShoulderFamily} from './shoulder-source-family-inverse.mjs';"],
   [" const actual=readFileSync(new URL('./clinical-review-shoulder-muscle-xray.test.ts',import.meta.url),'utf8');assert.equal(actual,expected);",
    " const actual=restorePriorShoulderFamily('clinical-review-shoulder-muscle-xray.test.ts',readFileSync(new URL('./clinical-review-shoulder-muscle-xray.test.ts',import.meta.url))).toString('utf8');assert.equal(actual,expected);"],
  ],
 },
};
function replaceOnce(source,from,to,name){
 const first=source.indexOf(from);
 assert.notEqual(first,-1,name+' missing edit seam');
 assert.equal(source.indexOf(from,first+from.length),-1,name+' duplicate edit seam');
 return source.slice(0,first)+to+source.slice(first+from.length);
}
for(const [name,{raw:rawHash,code:codeHash,edits}] of Object.entries(witnesses)){
 const raw=readFileSync(join(root,'RAW/tests',name));
 const code=readFileSync(join(root,'CODE/tests',name));
 assert.equal(sha(raw),rawHash,name+' original bytes');
 assert.equal(sha(code),codeHash,name+' proposed bytes');
 let expected=raw.toString('utf8');
 for(const [from,to] of edits)expected=replaceOnce(expected,from,to,name);
 assert.deepEqual(code,Buffer.from(expected),name+' complete forward theorem');
 let restored=code.toString('utf8');
 for(const [from,to] of edits.toReversed())restored=replaceOnce(restored,to,from,name);
 assert.deepEqual(Buffer.from(restored),raw,name+' complete inverse theorem');
 for(const mutant of [code.subarray(1),Buffer.concat([code,code]),
  Buffer.concat([code.subarray(0,1),Buffer.from([code[1]^1]),code.subarray(2)])])
  assert.notDeepEqual(mutant,Buffer.from(expected),name+' missing/duplicate/substitution refusal');
}
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const pin=JSON.parse(readFileSync(join(website,'tests/fixtures/current-atlas-delivery.json')));
const review=JSON.parse(readFileSync(join(website,'atlas-review/manifest.json')));
const head=JSON.parse(readFileSync(join(website,'public/atlas-runtime/head-neck/manifest.json')));
const shoulder=JSON.parse(readFileSync(join(website,'public/atlas-runtime/shoulder/manifest.json')));
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const family='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],
 {windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:32e6});
assert.equal(git('rev-parse','HEAD').toString().trim(),current,'clean Atlas HEAD identity');
assert.equal(git('rev-parse',family).toString().trim(),family,'family commit identity');
assert.equal(pin.source,current,'current delivery source');
assert.equal(review.revision,current,'Review current source');
assert.equal(pin.runtimeSources['head-neck'],current,'head-neck current family');
assert.equal(head.sourceCommit,current,'head-neck published source');
assert.equal(pin.runtimeSources.shoulder,family,'shoulder family source');
assert.equal(shoulder.sourceCommit,family,'shoulder published source');
assert.equal(sha(git('show',current+':app/body-content.ts')),
 '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc',
 'exact current dispatch Git bytes');
assert.equal(sha(git('show',family+':app/body-content.ts')),
 '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',
 'exact shoulder-family dispatch Git bytes');
console.log('PASS: five exact clinical inverses with actual adapter success/mutants; three full preservation-witness inverses/refusals; no website code imported.');

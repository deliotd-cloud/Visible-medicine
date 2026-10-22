import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-heading-root-history-followup';
const live='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests';
const queue='F:/VisibleMedicine/staging/20261022-runtime-simple-consumers-batch3';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=['clinical-review-git-root-preservation.test.mjs','salivary-cache-guard-adaptation.test.mjs',
 'salivary-current-family-inverse.mjs'];
const raw=names.map(name=>readFileSync(`${stage}/RAW/tests/${name}`));
const code=names.map(name=>readFileSync(`${stage}/CODE/tests/${name}`));
for(let i=0;i<names.length;i++)assert.deepEqual(raw[i],readFileSync(`${live}/${names[i]}`),`Immutable V5 ${names[i]}`);
assert.equal(sha(raw[0]),'5f17dd98df38536edc9456addccca15b5b418af35325d6a284c503dc829992d9');

const {restoreSalivaryPrior}=await import(pathToFileURL(`${live}/salivary-cache-epoch-adapter.mjs`));
const {restoreSalivaryCurrentPrior}=await import(pathToFileURL(`${live}/salivary-current-family-inverse.mjs`));
const rootText=code[0].toString();
const rootPure=rootText.slice(rootText.indexOf('const cases=['),rootText.indexOf('for(const entry of cases)test('))
 .replaceAll('import.meta.url',JSON.stringify(pathToFileURL(`${live}/clinical-review-git-root-preservation.test.mjs`).href));
const {cases,verify,restoreHeadingRuntimePrior}=new Function('assert','sha','readFileSync','restoreSalivaryPrior',
 'restoreSalivaryCurrentPrior',`${rootPure}\nreturn {cases,verify,restoreHeadingRuntimePrior};`)(
 assert,sha,readFileSync,restoreSalivaryPrior,restoreSalivaryCurrentPrior);

const currentHeading=readFileSync(`${live}/clinical-review-teaching-heading.test.ts`);
const priorHeading=restoreHeadingRuntimePrior(currentHeading);
assert.deepEqual(priorHeading,readFileSync(`${queue}/original/tests/clinical-review-teaching-heading.test.ts`));
assert.deepEqual(currentHeading,readFileSync(`${queue}/proposal/tests/clinical-review-teaching-heading.test.ts`));
assert.equal(sha(priorHeading),'802d91134bc1cf1f39373cf33cd103dde8a78c92094386ab7051726366014d12');
for(const entry of cases){
 const current=readFileSync(`${live}/${entry.name}.test.ts`);
 const expected=verify(entry,current);
 assert.throws(()=>verify(entry,Buffer.from(expected.replace('assert.equal(','assert.notEqual('))),
  `${entry.name} assertion refusal`);
 assert.throws(()=>verify(entry,Buffer.from(`if(false){\n${expected}\n}`)),
  `${entry.name} wrapper refusal`);
 console.log(`ROOT ${entry.name}: current ${sha(current)}, original ${entry.hash}, inverse PASS`);
}
assert.equal((rootText.match(/^test\(/gm)||[]).length,(raw[0].toString().match(/^test\(/gm)||[]).length,
 'All original root witness registrations retained');

const guardText=code[1].toString();
const guardPure=guardText.slice(guardText.indexOf('const once='),guardText.indexOf("test('both original"));
const {inverseHeadingGuard,inverseGuard}=new Function('assert','sha',`${guardPure}\nreturn {inverseHeadingGuard,inverseGuard};`)(assert,sha);
const once=(text,after,before)=>{
 assert.equal(text.split(after).length,2,`Exact dependent source seam ${after.slice(0,35)}`);
 return text.replace(after,before);
};
let dependentPrior=guardText;
const insertionStart=dependentPrior.indexOf('function inverseHeadingGuard(bytes){');
const insertionEnd=dependentPrior.indexOf('function inverseGuard(name,bytes){',insertionStart);
assert(insertionStart>=0&&insertionEnd>insertionStart);
dependentPrior=dependentPrior.slice(0,insertionStart)+dependentPrior.slice(insertionEnd);
dependentPrior=once(dependentPrior,
 "  const before=read(fixtures+fixture),current=name==='atlas190-current-delivery.test.mjs'",
 "  const before=read(fixtures+fixture),after=name==='atlas190-current-delivery.test.mjs'");
dependentPrior=once(dependentPrior,
 "  const after=name==='clinical-review-git-root-preservation.test.mjs'\n   ?inverseHeadingGuard(current):current;\n",'');
dependentPrior=once(dependentPrior,
 "  const current=name==='atlas190-current-delivery.test.mjs'",
 "  const after=(name==='atlas190-current-delivery.test.mjs'");
dependentPrior=once(dependentPrior,
 "   :read('./'+name);\n  const after=(name==='clinical-review-git-root-preservation.test.mjs'\n   ?inverseHeadingGuard(current):current).toString();",
 "   :read('./'+name)).toString();");
assert.deepEqual(Buffer.from(dependentPrior),raw[1],'Whole dependent CODE back to V5 RAW');
assert.deepEqual(inverseHeadingGuard(code[0]),raw[0],'Whole corrected root witness back to V5');
assert.deepEqual(inverseGuard(names[0],inverseHeadingGuard(code[0])),
 readFileSync(`${live}/fixtures/salivary-cache-epoch-20261021/git-root-preservation.original.mjs.raw`),
 'V5 root witness back to unchanged salivary predecessor');
assert.throws(()=>inverseHeadingGuard(Buffer.from(rootText.replace('assert.equal(','assert.notEqual('))),
 'Corrected root witness assertion mutation refused');
const atlasFixture=readFileSync(`${live}/fixtures/atlas190-current-delivery-before-role-20261021.mjs.raw`);
assert.equal(sha(atlasFixture),'8b6e741d1565be147f25258163ffdc00830aafcca2f4a04b39a0f4edbd5e62cf');
assert.deepEqual(inverseGuard('atlas190-current-delivery.test.mjs',atlasFixture),
 readFileSync(`${live}/fixtures/salivary-cache-epoch-20261021/atlas190-current-delivery.original.mjs.raw`),
 'Other historical guard case unchanged');
assert.equal((guardText.match(/^test\(/gm)||[]).length,(raw[1].toString().match(/^test\(/gm)||[]).length,
 'All original dependent witness registrations retained');
const helperText=code[2].toString();
const helperPure=helperText.replace(/^import .*\n/gm,'').replaceAll('export function','function')
 .replaceAll('import.meta.url',JSON.stringify(pathToFileURL(`${live}/salivary-current-family-inverse.mjs`).href));
const {restoreSalivaryGuardPrior}=new Function('assert','createHash','readFileSync',
 `${helperPure}\nreturn {restoreSalivaryGuardPrior};`)(assert,createHash,readFileSync);
const frozenGuard=restoreSalivaryGuardPrior(code[1]);
assert.equal(sha(frozenGuard),'15daeb7333adf104dfa6d7ab211d51d716872ce0a3b7da4a9797be62550e954e');
assert.deepEqual(frozenGuard,readFileSync(`${live}/fixtures/salivary-family-prior/salivary-cache-guard-adaptation.test.mjs.raw`));
assert.throws(()=>restoreSalivaryGuardPrior(Buffer.from(guardText.replace('assert.equal(','assert.notEqual('))),
 'Mutated corrected guard refused by complete helper chain');
const helperStart=helperText.indexOf('function restoreHeadingGuardV5(currentBytes){');
const helperEnd=helperText.indexOf('export function restoreSalivaryGuardPrior(',helperStart);
assert(helperStart>=0&&helperEnd>helperStart);
let helperPrior=helperText.slice(0,helperStart)+helperText.slice(helperEnd);
helperPrior=once(helperPrior,
 ' const v5Bytes=restoreHeadingGuardV5(currentBytes);\n assert.equal(sha(v5Bytes),guardCurrent,\'Exact V5 salivary guard bytes\');',
 ' assert.equal(sha(currentBytes),guardCurrent,\'Exact current salivary guard bytes\');');
helperPrior=once(helperPrior,
 " const before=prior.toString('utf8'),after=Buffer.from(v5Bytes).toString('utf8');\n assert.deepEqual(Buffer.from(after),v5Bytes,'Lossless V5 guard UTF-8');",
 " const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');\n assert.deepEqual(Buffer.from(after),currentBytes,'Lossless guard UTF-8');");
assert.deepEqual(Buffer.from(helperPrior),raw[2],'Whole helper CODE back to V5 RAW');

const currentHead=readFileSync(`${live}/current-head-index-whole-role-transition-20261021.test.mjs`).toString();
const currentHeadPure=currentHead.replace(/^import .*\n/gm,'')
 .replaceAll('import.meta.url',JSON.stringify(pathToFileURL(`${live}/current-head-index-whole-role-transition-20261021.test.mjs`).href));
const graphRead=(path,...args)=>{
 if(path instanceof URL&&fileURLToPath(path).replaceAll('\\','/').toLowerCase()===
  `${live}/salivary-cache-guard-adaptation.test.mjs`.toLowerCase())return Buffer.from(code[1]);
 return readFileSync(path,...args);
};
const registered=[];
new Function('assert','createHash','readFileSync','restoreSalivaryGuardPrior','test',currentHeadPure)(
 assert,createHash,graphRead,restoreSalivaryGuardPrior,(name,body)=>{
  registered.push(name);
  if(name.startsWith('complete salivary guard '))body();
 });
assert.equal(registered.length,6,'All six current-head historical cases retained');
assert.equal(registered.filter(name=>name.startsWith('complete salivary guard ')).length,1);
console.log(`CURRENT-HEAD ${registered.length} unchanged registrations; salivary whole-source theorem PASS; five unrelated epochs not executed`);
console.log(`GUARD ${names[0]} CODE ${sha(code[0])} -> V5 ${sha(raw[0])} -> historical original PASS`);
console.log(`DEPENDENT ${names[1]} CODE ${sha(code[1])} -> V5 ${sha(raw[1])} (source-only) PASS`);
console.log(`HELPER ${names[2]} CODE ${sha(code[2])} -> V5 ${sha(raw[2])}, corrected guard -> frozen prior PASS`);

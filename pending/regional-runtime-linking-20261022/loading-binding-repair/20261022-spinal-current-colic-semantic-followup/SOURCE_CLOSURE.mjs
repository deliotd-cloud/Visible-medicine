import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

const stage=path.dirname(fileURLToPath(import.meta.url));
const candidate='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const raw=readFileSync(path.join(stage,'RAW/tests/spinal-current-source-inverse.mjs'));
const code=readFileSync(path.join(stage,'CODE/tests/spinal-current-source-inverse.mjs'));
const current=readFileSync(path.join(stage,'CODE/tests/atlas-spinal-muscle-xray.test.mjs'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(raw),'3008622e5256507d67006ca128488decf53d037ad5318f8d896c62ebc9524c89');
assert.equal(sha(current),'1db458f7edd9a9a1de40b50fe886cf277a3fb560f2bc629260388d81785b65ce');
const currentText=code.toString('utf8');
assert.deepEqual(Buffer.from(currentText),code);
function once(value,from,to,label){
  assert.equal(value.split(from).length,2,`${label}: unique inverse seam`);
  return value.replace(from,to);
}
let restored=once(currentText,
  "const semanticPostimageSha='1db458f7edd9a9a1de40b50fe886cf277a3fb560f2bc629260388d81785b65ce';\n",
  '', 'semantic digest');
const start=restored.indexOf('function inverseCurrentColicSemantics(bytes){');
const end=restored.indexOf('const dentalPostimageSha=',start);
assert.ok(start>=0&&end>start,'bounded semantic adapter');
restored=restored.slice(0,start)+restored.slice(end);
restored=once(restored,
  'return inverseStage(inverseV5Family(inverseNewestColic(inverseCurrentColicSemantics(bytes))),stages.at(-1));',
  'return inverseStage(inverseV5Family(inverseNewestColic(bytes)),stages.at(-1));',
  'dental history consumer');
restored=once(restored,
  'let previous=inverseV5Family(inverseNewestColic(inverseCurrentColicSemantics(bytes)));',
  'let previous=inverseV5Family(inverseNewestColic(bytes));',
  'six-history consumer');
assert.deepEqual(Buffer.from(restored),raw,'complete helper CODE to frozen V6 byte inverse');

const fixturePrefix=pathToFileURL(path.join(candidate,'tests/fixtures')+path.sep).href;
const relocated=currentText
  .replace("new URL(`./fixtures/${stage.patch}`,import.meta.url)",
    "new URL(`"+fixturePrefix+"${stage.patch}`)")
  .replace("new URL('./fixtures/spinal-later-six-current-3824.mjs.raw',import.meta.url)",
    "new URL('"+fixturePrefix+"spinal-later-six-current-3824.mjs.raw')");
assert.notEqual(relocated,currentText,'only frozen fixture URLs relocated');
const helperUrl='data:text/javascript;base64,'+Buffer.from(relocated).toString('base64');
const helper=await import(helperUrl);
assert.equal(sha(helper.inverseCurrentDental(current)),
  '075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
  'all newer adapters run before unchanged dental historical inverse');
assert.equal(sha(helper.inverseCurrentToLaterSix(current)),
  '3824e78ca19ff6f1a2745232142b9df53278393afdcf8a2e50cea82e0cd5b865',
  'all six historical patch inverses still run');
for(const [label,mutated] of [
  ['colic approval',current.toString().replace('assert.equal(worksheet.approval,false);',
    'assert.equal(worksheet.approval,true);')],
  ['colic visit',current.toString().replace('assert.equal(colicChanges,2);',
    'assert.equal(colicChanges,1);')],
  ['f1 witness',current.toString().replace('same(predecessor,priorLesson,',
    'same(predecessor,after,')],
  ['existing CT save',current.toString().replace('staleCtSave.status,409',
    'staleCtSave.status,403')],
]){
  assert.notEqual(mutated,current.toString(),`${label} mutation applied`);
  assert.throws(()=>helper.inverseCurrentToLaterSix(Buffer.from(mutated)),
    `${label} refused by new semantic preimage`);
}
function consumer(name){
  let source=readFileSync(path.join(candidate,'tests',name),'utf8');
  source=once(source,"'./spinal-current-source-inverse.mjs'",`'${helperUrl}'`,
    `${name} helper binding`);
  source=source.replace(/new URL\('\.\/fixtures\/([^']+)',import\.meta\.url\)/g,
    (_,file)=>`new URL('${fixturePrefix}${file}')`);
  source=source.replace("new URL('./atlas-spinal-muscle-xray.test.mjs',import.meta.url)",
    `new URL('${pathToFileURL(path.join(stage,'CODE/tests/atlas-spinal-muscle-xray.test.mjs')).href}')`);
  return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
await consumer('spinal-later-six-preservation.test.mjs');
await consumer('spinal-ct-save-refusal-preservation.test.mjs');
let admission=readFileSync(path.join(candidate,'tests/atlas-spinal-muscle-xray-current-admission-contract.test.mjs'),'utf8');
admission=once(admission,"'./current-atlas-delivery.mjs'",
  `'${pathToFileURL(path.join(candidate,'tests/current-atlas-delivery.mjs')).href}'`,
  'current admission delivery binding');
admission=admission.replace(/new URL\('\.\/fixtures\/([^']+)', import\.meta\.url\)/g,
  (_,file)=>`new URL('${fixturePrefix}${file}')`);
assert.equal((admission.match(/new URL\('\.\/fixtures\//g)||[]).length,0,
  'all frozen admission fixtures relocated');
await import('data:text/javascript;base64,'+Buffer.from(admission).toString('base64'));
console.log(JSON.stringify({ok:true,rawHelperSha256:sha(raw),codeHelperSha256:sha(code),
  semanticSha256:sha(current),mutationRefusals:4,consumerModules:3,sourceOnly:true}));

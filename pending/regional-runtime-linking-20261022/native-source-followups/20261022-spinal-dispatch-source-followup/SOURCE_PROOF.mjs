import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
const atlas='F:/VisibleMedicine/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(kind,name)=>readFileSync(path.join(root,kind,'tests',name));
function once(text,needle,replacement,label){
  assert.equal(text.split(needle).length,2,`${label}: unique exact seam`);
  return text.replace(needle,replacement);
}
function exact(bytes,hash,label){
  assert.equal(sha(bytes),hash,`${label}: full SHA-256`);
  const text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes),`${label}: lossless UTF-8`);
  assert.ok(!text.includes('\r'),`${label}: LF bytes`);
  return text;
}

const oldTest="  assert.equal(blob(source.source,dentalDispatchPath).toString().replaceAll('\\r\\n','\\n'),\n    dentalIntroduced,'current dental dispatch retains exact introduction source');\n";
const newTest="  const currentDentalDispatch=blob(source.source,dentalDispatchPath).toString();\n  const colicImport=\"import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\\n\";\n  const colicBranch=\"  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\\n  if (colicUltrasound) return colicUltrasound;\\n\";\n  assert.equal(currentDentalDispatch.split(colicImport).length,2,'one later colic import');\n  assert.equal(currentDentalDispatch.split(colicBranch).length,2,'one later colic dispatch branch');\n  assert.ok(Buffer.from(currentDentalDispatch.replace(colicImport,'').replace(colicBranch,'')).equals(\n    blob(dentalEpoch,dentalDispatchPath)),'current dental dispatch restores exact introduction source after colic inverse');\n";

const testName='atlas-spinal-muscle-xray.test.mjs';
const rawTest=read('RAW',testName),codeTest=read('CODE',testName);
const rawTestText=exact(rawTest,'46feb48a3d91439396e47fa739df407ea95a3eacca0900c742fd4fe1ed6adf44','V5 spinal RAW');
const codeTestText=exact(codeTest,'7a39e919130ce257d590f564b0a9839857df9b2a1c3c786cf2805527fe79e01b','spinal CODE');
assert.ok(Buffer.from(once(codeTestText,newTest,oldTest,'spinal newest inverse')).equals(rawTest),'complete spinal CODE-to-RAW inverse');
assert.ok(Buffer.from(once(rawTestText,oldTest,newTest,'spinal forward')).equals(codeTest),'complete spinal RAW-to-CODE forward');

const helperName='spinal-current-source-inverse.mjs';
const rawHelper=read('RAW',helperName),codeHelper=read('CODE',helperName);
const rawHelperText=exact(rawHelper,'c0c6f035f2564743d80bd827fe98703b192bb38086df1b639f28b786802651c8','V5 inverse helper RAW');
const codeHelperText=exact(codeHelper,'3008622e5256507d67006ca128488decf53d037ad5318f8d896c62ebc9524c89','inverse helper CODE');
const markerStart='const currentColicSha=';
const markerEnd='const stages=[';
const start=codeHelperText.indexOf(markerStart),end=codeHelperText.indexOf(markerEnd,start);
assert.ok(start>=0&&end>start,'newest adapter bounded ahead of earlier six-stage inverse');
assert.equal(codeHelperText.indexOf(markerStart,start+1),-1,'one newest adapter');
const helperWithoutAdapter=codeHelperText.slice(0,start)+codeHelperText.slice(end);
const helperPreimage=once(once(helperWithoutAdapter,
  'return inverseStage(inverseV5Family(inverseNewestColic(bytes)),stages.at(-1));',
  'return inverseStage(bytes,stages.at(-1));','direct dental consumer'),
  'let previous=inverseV5Family(inverseNewestColic(bytes));','let previous=bytes;','all-stage consumer');
assert.ok(Buffer.from(helperPreimage).equals(rawHelper),'complete helper CODE-to-RAW inverse including all earlier patches');
assert.ok(rawHelperText.includes("patch:'06-dental.patch.raw'"),'earlier dental historical patch retained');
const producerPreimage=readFileSync('F:/VisibleMedicine/staging/20261022-spinal-family-admission/atlas-spinal-muscle-xray.test.mjs.preimage.bin');
assert.equal(sha(producerPreimage),'6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc','actual saved family producer preimage');
const producerPostimage=readFileSync('F:/VisibleMedicine/staging/20261022-spinal-family-admission/atlas-spinal-muscle-xray.test.mjs');
assert.ok(producerPostimage.equals(rawTest),'actual saved family producer postimage is complete V5 RAW');
const fixturePrefix='file:///F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/fixtures/';
const executableHelper=codeHelperText
  .replace("new URL(`./fixtures/${stage.patch}`,import.meta.url)","new URL(`"+fixturePrefix+"${stage.patch}`)")
  .replace("new URL('./fixtures/spinal-later-six-current-3824.mjs.raw',import.meta.url)","new URL('"+fixturePrefix+"spinal-later-six-current-3824.mjs.raw')");
assert.notEqual(executableHelper,codeHelperText,'only fixture URL relocation for pure memory check');
const helper=await import('data:text/javascript;base64,'+Buffer.from(executableHelper).toString('base64'));
assert.equal(sha(helper.inverseCurrentDental(codeTest)),'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a','newest and V5 adapters precede frozen dental inverse');
assert.equal(sha(helper.inverseCurrentToLaterSix(codeTest)),'3824e78ca19ff6f1a2745232142b9df53278393afdcf8a2e50cea82e0cd5b865','all six historical patch inverses still execute');
for(const [label,mutated] of [
  ['missing V5 runtime family',codeTestText.replace('const shoulderFamilyDifferences = new Map([','const removedFamilyDifferences = new Map([')],
  ['foreign V5 source-input seam',codeTestText.replace("assert.equal(input.sha256, sha(committed)","assert.equal(input.sha256, sha(working)")],
  ['missing newest colic check',codeTestText.replace('one later colic import','missing later colic import')],
])assert.throws(()=>helper.inverseCurrentToLaterSix(Buffer.from(mutated)),`${label} refused before historical inverses`);

const git=(rev)=>execFileSync('git',['-C',atlas,'show',`${rev}:app/body-content.ts`],{encoding:'buffer',maxBuffer:8*1024*1024});
const intro=git('30135cdd1849115a75c036dd6897d76e3d91e231');
const current=git('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(sha(intro),'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2','dental introduction Git source SHA');
assert.equal(sha(current),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc','current Git source SHA');
const introText=intro.toString('utf8'),currentText=current.toString('utf8');
assert.ok(Buffer.from(introText).equals(intro)&&Buffer.from(currentText).equals(current),'Git sources lossless UTF-8');
const colicImport="import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\n";
const colicBranch="  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\n  if (colicUltrasound) return colicUltrasound;\n";
const restored=once(once(currentText,colicImport,'','Git colic import'),colicBranch,'','Git colic branch');
assert.ok(Buffer.from(restored).equals(intro),'actual 6d7 Git body-content restores exact 30135 dental introduction bytes');
for(const [name,mutated,fn] of [
  ['test clinical flag',codeTestText.replace('clinicalApproval: false','clinicalApproval: true'),v=>once(v,newTest,oldTest,'mutation')],
  ['test colic branch',codeTestText.replace('if (colicUltrasound) return colicUltrasound;','if (colicUltrasound) return null;'),v=>once(v,newTest,oldTest,'mutation')],
  ['helper earlier patch',codeHelperText.replace('06-dental.patch.raw','06-dental-tampered.patch.raw'),v=>v],
  ['Git import',currentText.replace(colicImport,colicImport+'// mutation\n'),v=>once(once(v,colicImport,'','mutation'),colicBranch,'','mutation')],
]){
  const expected=name.startsWith('helper')?rawHelper:name.startsWith('Git')?intro:rawTest;
  let rejected=false;
  try { rejected=!Buffer.from(fn(mutated)).equals(expected); } catch { rejected=true; }
  assert.ok(rejected,`${name} mutation refused by full byte inverse`);
}
console.log(JSON.stringify({ok:true,files:[testName,helperName],raw:[sha(rawTest),sha(rawHelper)],code:[sha(codeTest),sha(codeHelper)],git:[sha(intro),sha(current)],sourceInverse:true,mutationRefusals:7}));

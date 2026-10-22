import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync,copyFileSync,rmSync,rmdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {beforeCompactDeliveryTest} from '../CODE/tests/review-frame-history-inverse.mjs';
import {restoreColicLaterSource} from '../CODE/tests/colic-later-source-inverse.mjs';

const base=dirname(dirname(fileURLToPath(import.meta.url)));
const candidate='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const receipt=JSON.parse(readFileSync('F:/VisibleMedicine/staging/20261022-seven-final-source-closures/APPLIED_SOURCE.json'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(kind,name)=>readFileSync(join(base,kind,'tests',name));
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,`exact one seam: ${from.slice(0,70)}`);return text.replace(from,to);};
const countOld='assert.equal(sourceFiles,1558);assert.equal(inputs,1723);assert(artifacts>100);';
const countNew='assert.equal(sourceFiles,1558);assert.equal(inputs,1724);assert(artifacts>100);';
const inverse={
 'current-atlas-delivery.test.mjs':s=>once(s,countNew,countOld),
 'review-frame-history-inverse.mjs':s=>once(s,
  ` current=once(current,'${countNew}',\n  '${countOld}');\n`,''),
 'expanded-review-delivery-admission.test.mjs':s=>once(once(s,
  'assert.equal(binding.inputs.length,1724);','assert.equal(binding.inputs.length,1723);'),
  `const seam='${countNew}';`,`const seam='${countOld}';`),
 'colic-later-source-inverse.mjs':s=>once(once(s,
  "current:'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea'",
  "current:'b0f078527cdb040ce7afa105bc0db9ebb979be590757ce7e749583eaed0f0045'"),
  `  if(name==='current-atlas-delivery.test.mjs')text=once(text,\n   '${countNew}',\n   '${countOld}',name);\n`,''),
 'head-review-compact-preservation.test.mjs':s=>once(s,
  'assert.equal(currentBinding.inputs.length,1724);','assert.equal(currentBinding.inputs.length,1723);'),
 'review-navigation-delivery-preservation.test.mjs':s=>once(s,
  'assert.equal(currentBinding.inputs.length,1724);','assert.equal(currentBinding.inputs.length,1723);'),
};
const rows=[];
for(const [name,undo] of Object.entries(inverse)){
 const raw=read('RAW',name),code=read('CODE',name),prior=receipt.sourceRows.find(row=>row.path===`tests/${name}`);
 assert(prior,`source receipt: ${name}`);
 assert.equal(raw.length,prior.bytes,name);
 assert.equal(sha(raw),prior.sha256,name);
 assert.equal(sha(readFileSync(join(candidate,'tests',name))),prior.sha256,`candidate frozen: ${name}`);
 assert.deepEqual(Buffer.from(undo(code.toString())),raw,`full CODE→RAW inverse: ${name}`);
 rows.push({name,raw:sha(raw),code:sha(code)});
}
const binding=JSON.parse(readFileSync(join(candidate,'atlas-review/integration-inputs.json')));
const pin=JSON.parse(readFileSync(join(candidate,'tests/fixtures/current-atlas-delivery.json')));
assert.equal(receipt.sourcePaths,6071);
assert.equal(binding.sourceCommit,pin.source);
assert.equal(binding.inputs.length,1724);
assert.equal(new Set(binding.inputs.map(row=>row.path)).size,1724);
assert.equal(binding.sha256,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
assert.equal(pin.reviewIntegration,binding.sha256);
assert.equal(JSON.parse(readFileSync(join(candidate,'atlas-review/manifest.json'))).files.length,1558);
for(const row of binding.inputs)assert.equal(sha(readFileSync(join(candidate,row.path))),row.sha256,`binding row: ${row.path}`);
const current=read('CODE','current-atlas-delivery.test.mjs');
const fixtureParent=join(base,'CODE','tests','fixtures');
const fixtureDir=join(fixtureParent,'head-review-compact');
const fixture=join(fixtureDir,'current-atlas-delivery.test.mjs.raw');
assert(!existsSync(fixtureParent),'temporary fixture path must be absent');
mkdirSync(fixtureDir,{recursive:true});
let priorCompact;
try{
 copyFileSync(join(candidate,'tests','fixtures','head-review-compact','current-atlas-delivery.test.mjs.raw'),fixture);
 priorCompact=beforeCompactDeliveryTest(current.toString());
}finally{
 if(existsSync(fixture))rmSync(fixture);
 rmdirSync(fixtureDir);rmdirSync(fixtureParent);
}
assert.match(priorCompact,/assert\.equal\(inputs,1712\)/);
const colic=restoreColicLaterSource('current-atlas-delivery.test.mjs',current);
assert.equal(sha(colic),'799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b');
const expanded=readFileSync(join(candidate,'tests/fixtures/expanded-review-admission/current-atlas-delivery.test.mjs.raw'));
assert.equal(current.toString().replace(countNew,
 'assert.equal(sourceFiles,1558);assert.equal(inputs,1721);assert(artifacts>100);'),expanded.toString());
console.log(JSON.stringify({ok:true,sourcePaths:6071,bindingInputs:1724,sourceFiles:1558,
 reviewIntegration:binding.sha256,completeInverses:rows,compactCallback:true,colicCallback:true,expandedWholeSource:true},null,2));

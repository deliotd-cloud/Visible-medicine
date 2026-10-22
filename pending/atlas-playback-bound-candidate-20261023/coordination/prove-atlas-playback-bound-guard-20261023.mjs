import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-atlas-playback-bound-candidate',prep=json(root+'/PREPARATION.json'),site=prep.atlas;
const test='scripts/test-whole-body-guided-learning.mjs',text=read(site+'/'+test).toString();
const start=text.indexOf('// This closed 2381 theorem still executes exact 2381 source.'),end=text.indexOf("const css=readFileSync('app/whole-body-guided-learning.css'",start);assert(start>=0&&end>start);
const addition=text.slice(start,end),component='app/whole-body-guided-learning.tsx',bytes=read(site+'/'+component),part=' initialGuidedLearningExpanded pauseRequest={pauseRequest}';
const old=runGit(['-C',site,'show',prep.baselineHead+':'+component]);
const guard=value=>runInNewContext(addition+'\nhistoricalComponentInput;',{readFileSync:()=>value,Buffer,assert});
assert.deepEqual(guard(bytes)(component),old);
for(const changed of [Buffer.from(bytes.toString().replace(part,' initialGuidedLearningExpanded pauseRequest={999}')),Buffer.from(bytes.toString()+'\n// foreign code\n'),Buffer.from(bytes.toString().replaceAll(part,' initialGuidedLearningExpanded'))]){
 assert.throws(()=>assert.deepEqual(guard(changed)(component),old),{name:'AssertionError'});
}
// The helper is transparent outside its one exact component.
assert.deepEqual(guard(bytes)('app/whole-body-guided-learning.css'),bytes);
const receipt={at:new Date().toISOString(),sourceScriptSha256:sha(read(new URL(import.meta.url))),componentSha256:sha(bytes),testSha256:sha(read(site+'/'+test)),actualGuardExecuted:true,admittedSignalProps:2,wrongSignalForeignCodeAndMissingPropsRefused:true,otherPathsTransparent:true,productSourceEdited:false,previewChanged:false};
fs.writeFileSync(root+'/GUARD_PROOF.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/GUARD_PROOF.json',sha256:sha(read(root+'/GUARD_PROOF.json')),passed:true}));

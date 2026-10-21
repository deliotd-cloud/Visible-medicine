import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const previous="F:/VisibleMedicine/staging/20261021-shared-viewer-keyboard-epoch-proposal",stage="F:/VisibleMedicine/staging/20261021-shared-viewer-keyboard-epoch-proposal/v2",testPath="tests/atlas-shared-viewer-accessibility.test.ts",old="const historical=(path:string)=>execFileSync('git',['--no-replace-objects','show',`${websiteEpoch}:${path}`]);",next="const historical=(path:string)=>execFileSync('git',['--no-replace-objects','show',`${websiteEpoch}:${path}`],{windowsHide:true,maxBuffer:32e6});";
const prior=json(previous+'/PREPARATION.json'),failed=json(previous+'/SHARED_VIEWER_KEYBOARD_EPOCH.json');
assert.equal(failed.code,1);assert.equal(sha(read(failed.log)),failed.logSha256);
assert(read(failed.log).toString().includes('spawnSync git ENOBUFS'));
const control=read('prepare-shared-viewer-keyboard-epoch-20261021.mjs');
const match=control.toString().match(/operations=(\[.*\]);\nconst before=/);assert(match);
const operations=JSON.parse(match[1]),before=read(prior.site+'/'+testPath),bytes=read(stage+'/'+testPath);
assert.equal(sha(before),prior.beforeSha256);
let inverse=bytes.toString();assert.equal(inverse.split(next).length,2);inverse=inverse.replace(next,old);
assert.equal(sha(Buffer.from(inverse)),prior.sha256,'Only explicit bounded Git output capacity changes from V1');
for(const op of [...operations].reverse()){
 if(op.append){assert(inverse.endsWith(op.to));inverse=inverse.slice(0,-op.to.length);}
 else{assert.equal(inverse.split(op.to).length,2);inverse=inverse.replace(op.to,op.from);}
}
assert.equal(sha(Buffer.from(inverse)),prior.beforeSha256,'Complete original historical/current test source still reconstructs exactly');
const result={...prior,stage,sha256:sha(bytes),bytes:bytes.length,firstFailure:previous+'/SHARED_VIEWER_KEYBOARD_EPOCH.json',firstFailureLogSha256:failed.logSha256,fix:'New exact historical scene read exceeds the default1MiB buffer; allow32MB bounded output like existing Git source readers. No assertions removed or child process skipped.',inverseControllerSha256:sha(control)};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const harness='F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check/'+testPath;
assert.equal(sha(read(harness)),prior.sha256);fs.copyFileSync(stage+'/'+testPath,harness);
console.log(JSON.stringify(result));

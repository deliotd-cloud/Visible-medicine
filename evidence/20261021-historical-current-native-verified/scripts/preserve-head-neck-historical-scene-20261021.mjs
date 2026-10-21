// Scoped local artifact recovery only. Never include the asset in source backup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,sha} from './source-only-backup-20261019.mjs';
const expected='1d5cca6d39e99fc8aa1e8c40b7cd10c10cd2b49654314632b66f4990c17d5fea';
const object='e87f3e7fe1e50735ff9a9a9ba8c989be8bd8b26b';
const from='F:/VisibleMedicine/website/public/atlas-runtime/head-neck/assets/body-scene-CcFnIl_v.js';
const root='F:/VisibleMedicine/recovery/historical-assets/sha256';
const to=root+'/'+expected+'.js';
const bytes=read(from);assert.equal(bytes.length,1117521);assert.equal(sha(bytes),expected);
assert.equal(execFileSync('git',['hash-object','--stdin'],{input:bytes,windowsHide:true}).toString().trim(),object);
fs.mkdirSync(root,{recursive:true});
assert(!fs.existsSync(to),'Do not overwrite a historical artifact');
fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
assert.deepEqual(read(to),bytes);assert.equal(sha(read(to)),expected);
const receipt={at:new Date().toISOString(),from,to,bytes:bytes.length,sha256:expected,gitObject:object,
 sourceUnchanged:true,localReadbackVerified:true,offDeviceBackup:false,gitHubAssetUpload:false,
 scope:'One exact historical generated scene chunk, retained F-local to protect historical tests during future coherent runtime replacement. No model bundle, private data or full runtime copied. Current tests still require their independently pinned bytes; no unchecked fallback added.'};
fs.writeFileSync(to+'.receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:to+'.receipt.json',sha256:sha(read(to+'.receipt.json')),localOnly:true}));

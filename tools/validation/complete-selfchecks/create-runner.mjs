import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const prior='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-generation/launch-contained.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
let text=fs.readFileSync(prior,'utf8');
assert.equal(hash(Buffer.from(text)),'f04c3f21060696432dd21ed22b3ae11d7e79f25893ea35fc1eebbbe82978a1ed');
function change(a,b){assert.equal(text.split(a).length,2,a);text=text.replace(a,b);}
change("const stage='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-native',site=stage+'/atlas';","const stage='G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-native',site=stage+'/atlas';");
change("const root='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-generation';","const root='G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-generation';");
change('4d95d5118e72c3dac24afaf6eab142a3699b5322bd88f6a2f5698d265da3b2f5','a40692560132b21e2de821f44de3b939631d03f39d60d8b28ddbaa58f5c83e2b');
change('assert.equal(expected.size,6490);','assert.equal(expected.size,6498);');
const root='G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-generation';
assert(!fs.existsSync(root));fs.mkdirSync(root+'/temp',{recursive:true});
fs.writeFileSync(root+'/launch-contained.mjs',text,{flag:'wx'});
console.log(JSON.stringify({runner:root+'/launch-contained.mjs',sha256:hash(Buffer.from(text)),minimumFreeMiB:3072,nativeJobMiB:1024,heapMiB:384,freeFloorMiB:2048}));

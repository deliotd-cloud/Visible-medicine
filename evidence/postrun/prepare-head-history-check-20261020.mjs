import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261020-head-history-harness',site=stage+'/website';
const candidate='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const file='tests/head-image-history.test.ts',before=read(stage+'/before/head-image-history.test.ts');
assert.equal(sha(before),'0fbaf3dd0b25c93754a9edfc1ea0a8918e28c5a8ab9b3345cbb1f6503aa1184c');
assert.equal(sha(read(candidate+'/'+file)),sha(before));
const after=read(site+'/'+file).toString();
const edits=[['import {headIndexKey}','import {headIndexKey,headIndexTabStop}'],["name==='../lib/head-index-keyboard'?{headIndexKey}:","name==='../lib/head-index-keyboard'?{headIndexKey,headIndexTabStop}:"]];
let inverse=after;
for(const [old,next] of edits.toReversed()){assert.equal(inverse.split(next).length,2);inverse=inverse.replace(next,old);}
assert.equal(inverse,before.toString(),'Every original test body/assertion byte exact');
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,site,atlas:'F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source',candidate,beforeSha256:sha(before),afterSha256:sha(Buffer.from(after)),completeByteInverse:true,scope:'One complete original native head-history behavioral test module; only two harness wiring seams provide the real current keyboard helper, no production or assertion change. Prior187 failures may share first TypeError; full run decides.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,completeByteInverse:true,sourceSha256:sha(Buffer.from(after))}));

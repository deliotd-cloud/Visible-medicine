import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const originalPath='tests/fixtures/atlas-deep-brain-core-checks-before-lock-history.txt';
const sourcePath='tests/atlas-deep-brain-core-checks.mjs';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

test('deep-brain historical check changes only the lockfile source epoch',()=>{
 const originalBytes=readFileSync(originalPath);
 assert.equal(sha256(originalBytes),'64eae587a7ae0fafb4c249a2237fee54911e9c0a9bd28e2f169532679e761ace');
 const original=originalBytes.toString('utf8');
 const assertions=original.match(/^for\(const path of \['package-lock\.json'.*$/gm);
 assert.equal(assertions?.length,1);
 const expected=[
  "// The lockfile is outside the epoch reader's Review/runtime scope; compare its saved feature bytes.",
  "const featureLock=execFileSync('git',['show',preFootWebsiteEpoch+':package-lock.json'],{windowsHide:true,maxBuffer:32e6});",
  "assert.equal(featureLock.toString().replaceAll('\\r\\n','\\n'),old('package-lock.json').toString().replaceAll('\\r\\n','\\n'),'package-lock.json');",
  assertions[0].replace("'package-lock.json',",''),
 ].join('\n');
 assert.equal(readFileSync(sourcePath,'utf8'),original.replace(assertions[0],expected));
});

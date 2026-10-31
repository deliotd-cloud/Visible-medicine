// Execute the complete authenticated d143 source in its original delivery context.
// The current-source FDA theorem lives in fda-reference-current-delivery.test.mjs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const site='F:/VisibleMedicine/staging/20261023-forearm-website/website';
const receiptPath='F:/VisibleMedicine/staging/20261023-forearm-website/SOURCE_BOUND.json';
const receiptSha='cf71965d5f836d30811e17f5bcd1fc7abde902f864b325904a538b93d7a79471';
const originalSha='367aaacc1c169991eef6782b9643c424b39bae8c7a5a7a650f8d0e7c4b4d44c5';
const manifestSha='14659458a669cac032910b714e39dd70c0cc8e8803e4e6434a613b9c7d732138';
const source='d143c28fb1e5da200712af6629a375c25d17dad7';
const sourceTree='486287b25d968117cffdd27bb20009fa46cda6f3';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('the complete two-case FDA link source retains its d143 delivery and negative assertions',()=>{
 const receiptBytes=readFileSync(receiptPath);
 assert.equal(sha(receiptBytes),receiptSha,'Exact historical website receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(receipt.website,site);
 assert.equal(receipt.atlasHead,source);
 assert.equal(receipt.atlasTree,sourceTree);
 const rows=receipt.sourceRows.filter(row=>row.path==='tests/fda-reference-review-links.test.mjs');
 assert.equal(rows.length,1,'One complete original test source');
 assert.equal(rows[0].bytes,6997);
 assert.equal(rows[0].sha256,originalSha);
 const original=join(site,rows[0].path),bytes=readFileSync(original);
 assert.equal(bytes.length,rows[0].bytes);
 assert.equal(sha(bytes),originalSha,'Unmodified original assertions');
 const manifestBytes=readFileSync(join(site,'atlas-review/manifest.json'));
 assert.equal(sha(manifestBytes),manifestSha,'Exact imported historic Review manifest');
 assert.equal(JSON.parse(manifestBytes).revision,source);
 const env={...process.env,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--max-old-space-size=768','--test','--test-concurrency=1','--test-reporter=tap',original],
  {cwd:site,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:16e6});
 assert.equal(run.error,undefined,String(run.error));
 assert.equal(run.signal,null);
 assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 for(const [key,count] of Object.entries({tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0}))
  assert.equal((run.stdout.match(new RegExp('^# '+key+' (\\d+)\\r?$','m'))||[])[1],String(count),key);
 assert.deepEqual([...run.stdout.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)].map(row=>Number(row[1])),[1,2]);
 assert(!/^not ok \d+/m.test(run.stdout),'Both original cases pass');
 assert.equal(sha(readFileSync(original)),originalSha,'Original source remains exact after execution');
 assert.equal(sha(readFileSync(receiptPath)),receiptSha,'Receipt remains exact after execution');
});

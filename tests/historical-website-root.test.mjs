import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {checkedHistoricalWebsiteRoot} from './historical-website-root.mjs';

const pin56=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-56.json',import.meta.url)));
const pin57=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-57.json',import.meta.url)));
const old56='F:/VisibleMedicine/staging/20261020-authenticated-old-websites/website56';
const old57='F:/VisibleMedicine/staging/20261020-authenticated-old-websites/website57';

test('each archived Website epoch binds its distinct clean Git root and old integration metadata',()=>{
 assert.equal(checkedHistoricalWebsiteRoot(56,pin56,{configured:old56}).replaceAll('\\','/').toLowerCase(),old56.toLowerCase());
 assert.equal(checkedHistoricalWebsiteRoot(57,pin57,{configured:old57}).replaceAll('\\','/').toLowerCase(),old57.toLowerCase());
});

test('wrong epoch, subdirectory, absent root, and changed metadata are refused',()=>{
 assert.throws(()=>checkedHistoricalWebsiteRoot(56,pin56,{configured:old57}),/commit changed/);
 assert.throws(()=>checkedHistoricalWebsiteRoot(57,pin57,{configured:old56}),/commit changed/);
 assert.throws(()=>checkedHistoricalWebsiteRoot(56,pin56,{configured:join(old56,'atlas-review')}),/repository root/);
 assert.throws(()=>checkedHistoricalWebsiteRoot(56,pin56,{configured:old56+'-absent'}));
 const wrong=structuredClone(pin56);wrong.documents['atlas-review/integration-inputs.json']='0'.repeat(64);
 assert.throws(()=>checkedHistoricalWebsiteRoot(56,wrong,{configured:old56}),/integration inputs changed/);
});

test('an actually dirty historical Website is refused and its exact source bytes are restored',()=>{
 assert.equal(realpathSync(old56).replaceAll('\\','/').toLowerCase(),old56.toLowerCase());
 const file=join(old56,'package.json'),before=readFileSync(file);
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 checkedHistoricalWebsiteRoot(56,pin56,{configured:old56});
 try{
  // This is an isolated regular source file, never a hardlinked model payload.
  writeFileSync(file,Buffer.concat([before,Buffer.from('\n ')]));
  assert.throws(()=>checkedHistoricalWebsiteRoot(56,pin56,{configured:old56}),/worktree is dirty/);
 }finally{writeFileSync(file,before);}
 assert.equal(sha(readFileSync(file)),sha(before));
 assert.equal(checkedHistoricalWebsiteRoot(56,pin56,{configured:old56}).replaceAll('\\','/').toLowerCase(),old56.toLowerCase());
});

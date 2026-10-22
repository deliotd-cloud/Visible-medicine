import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('all five original course-details behaviors remain true at the explicit pre-focus epoch',t=>{
 const site=fileURLToPath(new URL('../',import.meta.url));
 const env={...process.env,STUDIO_FOCUS_ROLE:'historical',STUDIO_FOCUS_WEBSITE_ROOT:site};
 // A separate test-runner process must emit ordinary TAP, not inherit its parent's IPC reporter.
 delete env.NODE_TEST_CONTEXT;
 const child=spawnSync(process.execPath,['--test','--test-reporter=tap','tests/studio-course-details-content.test.mjs'],{
  cwd:site,windowsHide:true,encoding:'utf8',timeout:30000,
  env,maxBuffer:1024*1024});
 assert.equal(child.error,undefined);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);
 for(const [key,value] of Object.entries({tests:5,pass:5,fail:0,cancelled:0,skipped:0,todo:0}))assert.match(child.stdout,new RegExp('^# '+key+' '+value+'\\r?$','m'));
 t.diagnostic('Explicit SHA-pinned pre-focus component: five original behavioral checks passed; separate from current-role tests.');
});

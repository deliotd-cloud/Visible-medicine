import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
const sha=s=>createHash('sha256').update(s).digest('hex');
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'One exact output-location seam');return s.replace(a,b);};

test('the complete notice and foot transports retain every original authentication and child-result assertion',()=>{
  for(const [file,group,expected] of [
    ['viewer-notice-roles.mjs','viewer-notice-role-runs','f54a4801e28274735e2168b0aa6da103e4a6b8064ee2be1197e4739ac6da81c3'],
    ['deepbrain-foot-roles.mjs','deepbrain-foot-originals','fb2d2aa0e5567f40d6498533a18264cb95bc7d4d9296b801bf356db57d869faf'],
  ]){
    let text=readFileSync(new URL(file,import.meta.url),'utf8');
    text=once(text,"import {createTestEvidenceDirectory} from '../scripts/test-evidence-directory.mjs';\n",'');
    text=once(text,"import {createHash} from 'node:crypto';","import {createHash,randomUUID} from 'node:crypto';");
    text=once(text,` const dir=createTestEvidenceDirectory(site,'${group}',{evidenceRoot:process.env.VM_TEST_EVIDENCE_ROOT,label:role});`,
      ` const dir=path.join(site,'.local','${group}',new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());fs.mkdirSync(dir,{recursive:true});`);
    assert.equal(sha(text),expected,file+': entire original transport restored exactly');
  }
});

test('the complete runner retains preflight, discovery, partitioning and strict passing-claim rules',()=>{
  let text=readFileSync(new URL('../scripts/run-website-tests.mjs',import.meta.url),'utf8');
  text=once(text,"import { createTestEvidenceDirectory } from './test-evidence-directory.mjs';\n",'');
  text=once(text,"import { createHash } from 'node:crypto';","import { createHash, randomUUID } from 'node:crypto';");
  text=once(text,`  // Synthetic roots keep their historical local-output contract even when a
  // parent full-suite process uses another drive for its real run evidence.
  return createTestEvidenceDirectory(root, 'website-test-runs', {
    evidenceRoot: resolve(root) === scriptRoot ? process.env.VM_TEST_EVIDENCE_ROOT : undefined,
  });`, `  const local = join(root, '.local');
  if (!existsSync(local)) mkdirSync(local);
  directory(local);
  const runs = join(local, 'website-test-runs');
  if (!existsSync(runs)) mkdirSync(runs);
  directory(runs);
  const output = join(runs, \`\${new Date().toISOString().replace(/[:.]/g, '-')}-\${randomUUID()}\`);
  mkdirSync(output); // unique, never reuse or clear an existing result
  return output;`);
  assert.equal(sha(text),'a21056ff27adca9b1dffb34e6308e0ea36a71943ae024eea1856c5f7f38cb278');
});

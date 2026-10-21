// Create-only exact copies. Semantic source edits are applied separately.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-clinical-git-root-proposal';
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
for(const name of ['clinical-review-salivary-stylohyoid-quiz','clinical-review-teaching-heading']){
 const b=read(site+'/tests/'+name+'.test.ts');
 for(const relative of ['tests/'+name+'.test.ts','tests/fixtures/'+name+'.before-git-root.ts.raw']){
  const target=stage+'/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});
  assert.equal(sha(read(target)),sha(b));
 }
}
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,site,atlas:'F:/VisibleMedicine/staging/20261020-inbox-material-source',
 scope:'Only exact test-root repair and native inverse/metadata proofs; no actual corpus bundles or frozen/canonical edits.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,copiedSourceTests:2,exactRawPreimages:2,semanticEditsApplied:false}));

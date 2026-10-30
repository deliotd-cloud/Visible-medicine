import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review',site=root+'/website', changed=[];
for(const name of ['auto-return','deferred-return','failure-focus','page-reconcile','return-context','return-pager-focus','link-context','workbench']) {
  const p=`tests/clinical-review-inbox-${name}.test.mjs`, file=site+'/'+p, before=fs.readFileSync(file,'utf8');
  const conditional=['link-context','workbench'].includes(name);
  const marker=conditional?"name.endsWith('.css') ? {} : require(name)":"if (name.endsWith('.css')) return {};";
  assert.equal(before.split(marker).length,2,p);
  fs.mkdirSync(path.dirname(root+'/before/'+p),{recursive:true});fs.writeFileSync(root+'/before/'+p,before,{flag:'wx'});
  // These harnesses inspect the parent's effects and elements; the child has its own real-source UI tests.
  const next=conditional?"name === './ClinicalReviewQuickStart' ? { ClinicalReviewQuickStart: () => null } :\n    "+marker:"if (name === './ClinicalReviewQuickStart') return { ClinicalReviewQuickStart: () => null }; "+marker;
  fs.writeFileSync(file,before.replace(marker,next));changed.push(p);
}
fs.writeFileSync(root+'/HARNESS_ADAPTATION.json',JSON.stringify({at:new Date().toISOString(),changed,reason:'Resolve new isolated child import in parent-only VM harnesses. Existing assertions retained; real child behavior covered separately.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({adapted:changed.length}));

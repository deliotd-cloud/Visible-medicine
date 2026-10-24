// Proposed focused admission tests; runnable after main seals the capture and
// installs the helper in the new Website tests directory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertPancreaticUsCurrentSource,assertPancreaticUsCurrentDisplay}
 from './pancreatic-us-current-source-role.mjs';

const native='F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas';
const parentNative='F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/atlas';
const site='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const parentSite='F:/VisibleMedicine/staging/20261024-review-pager-website/website';
const source='6e810b188dde401f6c19a970928f316a479696df';
const read=p=>readFileSync(site+'/'+p);
const fixture=()=>({manifest:JSON.parse(read('atlas-review/manifest.json')),
 binding:JSON.parse(read('atlas-review/integration-inputs.json'))});

test('only sealed clean native pancreatic source is current',()=>{
 const result=assertPancreaticUsCurrentSource({atlasRoot:native,sourceCommit:source});
 assert.equal(result.source,source);assert.equal(result.changed,10);
 assert.throws(()=>assertPancreaticUsCurrentSource({atlasRoot:native,sourceCommit:'b8ec59eeb0ec554b86d7ce01be992967e203b6a5'}));
 assert.throws(()=>assertPancreaticUsCurrentSource({atlasRoot:parentNative,sourceCommit:source}));
});

test('only captured four-runtime, protected Review Website delivery is current',()=>{
 const {manifest,binding}=fixture();
 const result=assertPancreaticUsCurrentDisplay({root:site,manifest,binding,read});
 assert.equal(result.source,source);
 assert.throws(()=>assertPancreaticUsCurrentDisplay({root:parentSite,manifest,binding,read}),
  /Only the exact new Website checkout/);
 assert.throws(()=>assertPancreaticUsCurrentDisplay({root:site,manifest:{...manifest,revision:'foreign'},binding,read}));
 assert.throws(()=>assertPancreaticUsCurrentDisplay({root:site,manifest,binding,
  read:p=>p==='atlas-review/lib/body-pancreatic-venous-us.ts'?Buffer.from('forged'):read(p)}),
  /atlas-review\/lib\/body-pancreatic-venous-us.ts/);
 assert.throws(()=>assertPancreaticUsCurrentDisplay({root:site,manifest,binding,
  read:p=>p==='components/ClinicalReviewInbox.tsx'?Buffer.from('forged'):read(p)}),
  /Review pager source/);
});

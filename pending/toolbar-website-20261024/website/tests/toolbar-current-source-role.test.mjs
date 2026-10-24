import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertToolbarCurrentSource,assertToolbarCurrentDisplay} from './toolbar-current-source-role.mjs';

const atlasRoot='F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/atlas';
const sourceCommit='b8ec59eeb0ec554b86d7ce01be992967e203b6a5';
const root='F:/VisibleMedicine/staging/20261024-toolbar-website/website';
const read=p=>readFileSync(root+'/'+p);

test('native b8ec source retains exact 80d and genuine 5e75 tour bytes',()=>{
 const result=assertToolbarCurrentSource({atlasRoot,sourceCommit});
 assert.equal(result.changed,6);assert.equal(result.oldTours,6);
});

test('unknown source and wrong checkout are refused',()=>{
 assert.throws(()=>assertToolbarCurrentSource({atlasRoot,sourceCommit:'80d323ec504afc7867e3e716bf735681a29ab5bc'}));
 assert.throws(()=>assertToolbarCurrentSource({atlasRoot:'F:/VisibleMedicine/staging/20261024-orbital-ct-draft/atlas',sourceCommit}));
});

test('only sealed b8ec Website delivery is admitted',()=>{
 const manifest=JSON.parse(read('atlas-review/manifest.json'));
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 const result=assertToolbarCurrentDisplay({root,manifest,binding,read});
 assert.equal(result.source,sourceCommit);
 assert.equal(result.imported,1604);assert.equal(result.inputs,1807);
 assert.throws(()=>assertToolbarCurrentDisplay({root,manifest,binding,
  read:p=>p==='atlas-review/components/ui/button.tsx'?Buffer.from('forged'):read(p)}),
  /atlas-review\/components\/ui\/button.tsx/);
 assert.throws(()=>assertToolbarCurrentDisplay({root,manifest:{...manifest,revision:'80d'},binding,read}));
 assert.throws(()=>assertToolbarCurrentDisplay({root:'F:/VisibleMedicine/staging/20261024-orbital-ct-website/website',manifest:{},binding:{}}),
  /Only the exact toolbar Website successor/);
});

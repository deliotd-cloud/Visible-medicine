import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertOrbitalCtCurrentTourSource,assertOrbitalCtCurrentDisplay} from './orbital-ct-current-source-role.mjs';

const atlasRoot='F:/VisibleMedicine/staging/20261024-orbital-ct-draft/atlas';
const sourceCommit='80d323ec504afc7867e3e716bf735681a29ab5bc';

test('native 80d source retains authentic b79 and 5e75 tour bytes',()=>{
 const result=assertOrbitalCtCurrentTourSource({atlasRoot,sourceCommit});
 assert.equal(result.unchangedTourFiles,6);
 assert.equal(result.changed,8);
});

test('wrong source and source checkout are refused',()=>{
 assert.throws(()=>assertOrbitalCtCurrentTourSource({atlasRoot,sourceCommit:'b79e110d2d28f18993263926ba35aa7a3f478b20'}));
 assert.throws(()=>assertOrbitalCtCurrentTourSource({atlasRoot:'F:/VisibleMedicine/staging/20261024-cervical-vascular-draft/atlas',sourceCommit}));
});

test('only main-captured 1604/1807 production delivery is admitted',()=>{
 const root='F:/VisibleMedicine/staging/20261024-orbital-ct-website/website';
 const read=p=>readFileSync(root+'/'+p);
 const manifest=JSON.parse(read('atlas-review/manifest.json'));
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 const result=assertOrbitalCtCurrentDisplay({root,manifest,binding,read});
 assert.equal(result.imported,1604);assert.equal(result.inputs,1807);
 assert.throws(()=>assertOrbitalCtCurrentDisplay({root,manifest,binding,
  read:p=>p==='atlas-review/app/body-content.ts'?Buffer.from('forged'):read(p)}),/atlas-review\/app\/body-content.ts/);
 assert.throws(()=>assertOrbitalCtCurrentDisplay({root,manifest:{...manifest,revision:'b79'},binding,read}));
 assert.throws(()=>assertOrbitalCtCurrentDisplay({root:'F:/VisibleMedicine/staging/20261024-studio-route-website/website',manifest:{},binding:{}}),
  /Only the isolated successor Website/);
});

import test from 'node:test';
import {readFileSync} from 'node:fs';
import {assertRealRuntimeFrameMarkup} from './atlas-runtime-page-contract.ts';

test('actual AtlasRuntimeFrame renders the audited page sources and frame policy',async()=>{
  for(const [path,sourceExpression,source] of [
    ['female-pelvis-3d','/atlas-runtime/female-pelvis/index.html','/atlas-runtime/female-pelvis/index.html'],
    ['lower-limb-3d','source','/atlas-runtime/lower-limb/index.html'],
    ['pelvis-3d','/atlas-runtime/head-neck/index.html?region=pelvis','/atlas-runtime/head-neck/index.html?region=pelvis'],
    ['spine-3d','/atlas-runtime/head-neck/index.html?region=spine','/atlas-runtime/head-neck/index.html?region=spine'],
    ['shoulder-3d','moduleHref','/atlas-runtime/shoulder/index.html'],
    ['thorax-3d','/atlas-runtime/head-neck/index.html?region=thorax','/atlas-runtime/head-neck/index.html?region=thorax'],
    ['3d','source','/atlas-runtime/head-neck/index.html?region=leg'],
  ] as const){
    const page=readFileSync(new URL(`../app/atlas/${path}/page.tsx`,import.meta.url),'utf8');
    await assertRealRuntimeFrameMarkup(page,sourceExpression,source);
  }
});

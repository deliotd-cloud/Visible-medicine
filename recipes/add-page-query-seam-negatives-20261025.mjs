import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/staging/20261025-page-ssr-query-role-proposal',file=root+'/tests/page-ssr-query-role-integrity.test.mjs',patchFile=root+'/PATCHSET.json',patch=json(patchFile),row=patch.files.find(r=>r.path==='tests/page-ssr-query-role-integrity.test.mjs');assert.equal(hash(file),row.afterSha256);assert(!fs.existsSync(root+'/MAIN_PAGE_NEGATIVES_BEFORE'));fs.mkdirSync(root+'/MAIN_PAGE_NEGATIVES_BEFORE');for(const p of ['PATCHSET.json','tests/page-ssr-query-role-integrity.test.mjs'])fs.copyFileSync(root+'/'+p,root+'/MAIN_PAGE_NEGATIVES_BEFORE/'+p.split('/').at(-1),fs.constants.COPYFILE_EXCL);
fs.appendFileSync(file,`
test('each complete page query seam refuses loss, duplication, substitution and reordering',()=>{
  const current=read('../app/atlas/3d/page.tsx').replaceAll('\\r\\n','\\n');
  const seams=[
    "import {regionalTourEntrySuffix} from '../../../lib/regional-tour-entry-navigation';\\n",
    "import {hasHeadLearningQuery} from '../../../lib/head-atlas-learning';\\n",
    '  const tourSuffix=regionalTourEntrySuffix(params);\\n',
    '  if(tourSuffix===null||(tourSuffix&&(studySuffix||hasHeadLearningQuery(params))))notFound();\\n',
    "  if(!studySuffix&&!tourSuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href);\\n",
    '  const source=\x60/atlas-runtime/head-neck/index.html?region=\x24{region.id}\x24{studySuffix}\x24{tourSuffix}\x60;\\n',
  ];
  assert.doesNotThrow(()=>restoreAtlas3dQueryPage(current));
  for(const seam of seams){
    assert.equal(current.split(seam).length,2,'Each actual query import, validation, redirect and URL is unique');
    for(const changed of [current.replace(seam,''),current+seam,current.replace(seam,seam+'// foreign seam\\n'),
      current.replace(seam,'')+seam]){
      assert.notEqual(changed,current);assert.throws(()=>restoreAtlas3dQueryPage(changed));
    }
  }
  assert.throws(()=>restoreAtlas3dQueryPage(current.replace('studySuffix||hasHeadLearningQuery(params)','false')));
});
`);
row.afterSha256=hash(file);patch.mainPageNegativeReview={reason:'Add explicit mutations for both imports, both validation lines, redirect and iframe URL plus mixed-query refusal. Complements whole-source hash guards with actual seam negatives; no application/original fixture or earlier assertion changed.',addedCase:1,runtimePending:true};fs.writeFileSync(patchFile,JSON.stringify(patch,null,2)+'\n');console.log(JSON.stringify({patchset:patchFile,sha256:hash(patchFile),expectedFocusedCases:30}));

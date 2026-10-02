import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('learner and reviewer share bounded word forms and exact source-bound results', async () => {
  const manifest=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
  assert.equal(manifest.revision,'aa290176f8bfdb02157f7197e4647508c9c41d87');
  for(const path of ['lib/anatomy-search.ts','lib/atlas-navigation.ts']) {
    const file=manifest.files.find((f:any)=>f.path===path);assert(file);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
  }
  // Review fingerprints are review-only metadata, not learner dependencies.
  const renderer=manifest.files.find((f:any)=>f.path==='content/body-renderer-revision.json');assert(renderer);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+renderer.path)).digest('hex'),renderer.importedSha256);
  const result=await build({stdin:{contents:`
    export * from './atlas-review/lib/clinical-review-index';
    export * from './atlas-review/lib/nested-review-material';
    export * from './atlas-review/lib/anatomy-search';
    export * from './lib/clinical-review-links';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  const baseline=api.findClinicalReviewEntries({q:'inferior colliculus',scope:'nested'});
  assert.equal(baseline.total,2);
  for(const q of ['inferior collicular','inferior colliculi','inferior collicular brachia'])
    assert.deepEqual(api.findClinicalReviewEntries({q,scope:'nested'}).entries,baseline.entries);
  for(const side of ['left','right']) {
    const matches=api.findClinicalReviewEntries({q:`${side} inferior collicular brachia`,scope:'nested'});
    assert.equal(matches.total,1);
    const e=matches.entries[0];assert.equal(e.laterality,side);
    const link=new URL(e.href,'https://local.invalid');
    assert.equal(link.pathname,'/workspace/atlas-review/nested');
    assert.equal(link.searchParams.get('structure'),e.id);
    const key=api.nestedReviewRows.find((r:any)=>r.study==='brainstem').key;
    const packet=await api.nestedReviewSelection(key,e.id,link.searchParams.get('source'));
    assert(packet);
    assert.equal(await api.nestedReviewSelection(key,e.id,'0'.repeat(64)),null);
    const material=await api.nestedReviewMaterial(key,e.id);
    assert.equal(material.context.revisions.imaging,null);
    const model=new URL(api.reviewModelHref(material.atlasLink),'https://local.invalid');
    assert.equal(model.pathname,'/workspace/atlas-review/model');
    assert.equal(model.searchParams.get('region'),'head-neck');
    assert(model.search.includes(encodeURIComponent(e.id)));
  }
  assert.equal(api.findClinicalReviewEntries({q:'superior collicular brachia',scope:'nested'}).total,0);
  assert.equal(api.findClinicalReviewEntries({q:'inferior collicular left right',scope:'nested'}).total,0);
  assert.equal(api.anatomySearchWordMatches('brachial artery','brachia'),false);
  assert.equal(api.anatomySearchWordMatches('fma73464','fma7346'),false);
});

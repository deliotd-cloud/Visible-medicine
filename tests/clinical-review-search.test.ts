import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

test('imported reviewer search finds both Achilles sides without combining specimens or decisions', async () => {
  const manifest=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(manifest.revision,'14581a6e2cbf82d8d57e98290c7d7b63c5bf3cb1');
  const result=await build({stdin:{contents:"export {findClinicalReviewEntries} from './atlas-review/lib/clinical-review-index'; export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  const body=api.findClinicalReviewEntries({q:'Achilles',scope:'body'});
  assert.equal(body.total,2);
  assert.deepEqual(body.entries.map((e:any)=>e.laterality).sort(),['left','right']);
  for(const entry of body.entries) {
    const link=new URL(entry.href,'https://test.invalid');
    assert.equal(link.pathname,'/workspace/atlas-review/body');
    assert.equal(link.searchParams.get('structure'),entry.id);
    const material=await api.bodyReviewMaterial(entry.id);
    assert.equal(material.approval,false);
    const ct=material.topics.find((t:any)=>t.tab==='ct');
    assert.equal(ct.readiness,'draft');
    assert(ct.citations.includes('https://doi.org/10.3390/jcm13154426'));
    assert(ct.citations.includes('https://creativecommons.org/licenses/by/4.0/'));
  }
  const all=api.findClinicalReviewEntries({q:'Achilles'});
  assert.equal(all.total,5);
  assert.equal(all.entries.filter((e:any)=>e.scope==='specimens').length,3);
  assert.equal(new Set(all.entries.map((e:any)=>e.key)).size,5);
  assert.equal(api.findClinicalReviewEntries({q:'right Achilles',scope:'body'}).total,1);
  assert.equal(api.findClinicalReviewEntries({q:'Achilles rupture',scope:'body'}).total,0);
});

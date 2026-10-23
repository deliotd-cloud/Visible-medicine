import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {build} from 'esbuild';import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),site=path.resolve(import.meta.dirname,'..'),output=path.join(site,'.local/fda-model-entry/test.mjs');
fs.mkdirSync(path.dirname(output),{recursive:true});
await build({stdin:{contents:"export {renderReviewModel} from './app/workspace/atlas-review/model/model-view';export {reviewModelHref} from './lib/clinical-review-links';export {specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';",resolveDir:site,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:output,external:['react','react/*'],plugins:[{name:'actual-navigation-and-css-only-boundary',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:pathToFileURL(require.resolve('next/navigation')).href,external:true}));b.onLoad({filter:/\.css$/},()=>({contents:'',loader:'js'}));}}]});
const api=await import(pathToFileURL(output).href),specimen='fda-shoulder-fc9f3e56';
const entries=api.clinicalReviewEntries.filter(e=>e.scope==='specimens'&&new URL(e.href,'https://local.invalid').searchParams.get('specimen')===specimen);
const paramsFromQuery=href=>{const q=new URL(href,'https://local.invalid').searchParams;return Object.fromEntries([...new Set(q.keys())].map(k=>[k,q.getAll(k).length===1?q.get(k):q.getAll(k)]));};
test('actual server wrapper renders six exact independent model links and worksheet returns',async()=>{
 assert.equal(entries.length,6);for(const entry of entries){const material=await api.specimenReviewMaterial(specimen,entry.id),params=paramsFromQuery(api.reviewModelHref(material.atlasLink));
  const html=renderToStaticMarkup(await api.renderReviewModel(params));assert.match(html,/data-review-return/);assert(html.includes(entry.href.replaceAll('&','&amp;')));assert(html.includes(encodeURIComponent(entry.id)));assert(html.includes('/atlas-review-viewer/index.html?'));assert(!html.includes('kind=body'));
  const embedded=renderToStaticMarkup(await api.renderReviewModel(params,true));assert.match(embedded,/class="review-model-embedded"/);assert.match(embedded,/no decision is recorded here/);assert(!embedded.includes('data-review-return'));assert(embedded.includes(encodeURIComponent(entry.id)));
 }
});
test('actual notFound boundary rejects duplicate, stale, cross-frame and mixed source queries before an iframe',async()=>{
 const material=await api.specimenReviewMaterial(specimen,entries[0].id),base=paramsFromQuery(api.reviewModelHref(material.atlasLink));
 const invalid=[{},...Object.keys(base).map(k=>({...base,[k]:[base[k],base[k]]})),{...base,structure:'vm:reference:foreign:scapula'},{...base,referenceRevision:'0'.repeat(64)},{...base,refFrame:'body-lps'},{...base,kind:'body'},{...base,region:'pelvis'},{...base,source:'other'}];
 for(const params of invalid.filter(p=>Object.keys(p).length)){await assert.rejects(api.renderReviewModel(params),error=>typeof error.digest==='string'&&error.digest.includes('404'));}
 const legacy=renderToStaticMarkup(await api.renderReviewModel({kind:'body',region:'whole-body'}));assert(legacy.includes('kind=body'));assert(!legacy.includes('referenceRevision'));
});
test('standalone viewer uses only the strict source selection/private base and a compact nonmetric adapter',()=>{
 const main=fs.readFileSync('scripts/clinical-review-viewer/main.tsx','utf8'),css=fs.readFileSync('scripts/clinical-review-viewer/fda-reference-embedded.css','utf8');
 assert.match(main,/q\.getAll\(k\)\.length === 1/);assert.match(main,/parseWebsiteFdaSelection\(params\)/);assert.match(main,/<FdaShoulder assetBase=\{fda\.assetBase\} expectedRevision=\{fda\.expectedRevision\} selectedId=\{fda\.selectedId\}/);assert.match(main,/no substitute model was loaded/);
 assert.match(css,/minmax\(0,1fr\)/);assert.match(css,/overflow:hidden/);assert.match(css,/overscroll-behavior:contain/);assert(!css.includes('display:none'),'Source limitations are not hidden for the compact iframe');
 const component=fs.readFileSync('atlas-review/app/fda-shoulder-reference.tsx','utf8');assert(component.includes('Save draft corrections in the surrounding review worksheet'));assert(component.includes('Geometry approval remains blocked'));assert(!component.includes('decision writing are not connected'));
});

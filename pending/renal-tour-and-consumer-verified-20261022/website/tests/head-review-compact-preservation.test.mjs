import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeCompactBinder,beforeCompactDeliveryTest,beforeProposedNavigation,compactInputs} from './review-frame-history-inverse.mjs';
import {beforeSurfaceBinder,beforeSurfaceDeliveryTest,beforeNeckXrayDeliveryTest} from './surface-binder-history-inverse.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const originals={
 'components/HeadTeachingReviewNavigator.tsx':'5ba595293bc39f08c86df45dda2f9e4d460ca27db9ee3a7bde336c3f1217a6ed',
 'components/HeadAtlasTeachingReview.tsx':'50b0cec76bf51624521006e4e46d366f6f40f7bdd7752547ac35963d607f087a',
 'components/HeadCtFacialTeachingReview.tsx':'82d2b3d249128a16f39440dfed705eb5341003d5b0d93473c534039007cc51b7',
 'tests/head-teaching-review-navigation.test.ts':'d948a5fcca72731026b5c6b6781b3bc2e380cfcaace278125c2b80327b95d425',
 'tests/current-atlas-delivery.test.mjs':'07e7fd5ede613f7c81d242580f54f75bf8dcaf6a7edccccd45b761fb63659357',
 'tests/review-navigation-delivery-preservation.test.mjs':'a6635789e100ef4bfd70df0cd5e2c6dd4d08b72017518b7d5f5f58a615008295',
 'scripts/bind-clinical-review.mjs':'072053ecdc9b882c873ddadb92b36e156f77e190977b33e68a8ba544d6a3548f',
};
function original(p){const s=read('tests/fixtures/head-review-compact/'+p.split('/').at(-1)+'.raw');assert.equal(sha(s),originals[p],p);return s;}
function replaceOnce(s,from,to){assert.equal(s.split(from).length,2,from);return s.replace(from,to);}
function inverse(p,pairs,source=read(p)){let s=source;for(const [from,to]of pairs)s=replaceOnce(s,from,to);assert.equal(s,original(p),p);}

test('head notes reorder and facial disclosure preserve every original medical fact, scope, ID and independent decision',()=>{
 const p='components/HeadAtlasTeachingReview.tsx';let s=read(p);
 s=replaceOnce(s,'    {reviewNotes}\n    {comparisonReview}','    {comparisonReview}');
 s=replaceOnce(s,'    {imageOnlyReview}\n    {knowledgeReview}','    {imageOnlyReview}\n    {reviewNotes}\n    {knowledgeReview}');assert.equal(s,original(p));
 inverse('components/HeadCtFacialTeachingReview.tsx',[
 ['  return <details id="head-ct-facial-teaching-review" className="head-review-packet" aria-labelledby="head-ct-facial-teaching-title">','  return <section id="head-ct-facial-teaching-review" aria-labelledby="head-ct-facial-teaching-title">'],
 ['    <summary><h2 id="head-ct-facial-teaching-title">CT facial anatomy and clinical orientation · independent drafts</h2></summary>','    <h2 id="head-ct-facial-teaching-title">CT facial anatomy and clinical orientation · independent drafts</h2>'],
 ['  </details>;','  </section>;'],
 ]);
});

test('only declared target handling changes in the navigator; original inert selection, whitelist and surrounding form are exact',()=>{
 const p='components/HeadTeachingReviewNavigator.tsx';let s=read(p);
 s=replaceOnce(s,'    if(!target||!main.contains(target))return;',"    if(!target||!main.contains(target)||target.tagName!=='DETAILS')return;");
 const start=s.indexOf('    const focusTarget='),end=s.indexOf('    target.scrollIntoView',start);assert(start>0&&end>start);
 s=replaceOnce(s,s.slice(start,end),"    target.querySelector<HTMLElement>(':scope > summary')?.focus();\n");assert.equal(s,original(p));
 assert(!/fetch\(|localStorage|sessionStorage|location\.|history\.|useRouter|useState/.test(read(p)));
});

test('the stock Review binder gains exactly one navigator source and no other dependency',()=>{
 const preSurface=beforeSurfaceBinder(read('scripts/bind-clinical-review.mjs'),read('tests/fixtures/head-surface-before-20261022/scripts__bind-clinical-review.mjs.raw'));
 inverse('scripts/bind-clinical-review.mjs',[["'components/HeadAtlasTeachingReview.tsx','components/HeadTeachingReviewNavigator.tsx','components/head-atlas.css'","'components/HeadAtlasTeachingReview.tsx','components/head-atlas.css'"]],beforeCompactBinder(preSurface));
 const current=validateCurrentAtlasDelivery(),currentBinding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(currentBinding.inputs.length,1727);assert.equal(currentBinding.inputs.filter(r=>r.path==='components/HeadTeachingReviewNavigator.tsx').length,1);
 assert.equal(currentBinding.inputs.filter(r=>r.path==='lib/head-surface-validation.ts').length,1);
 assert.equal(current.source,currentBinding.sourceCommit);
 const binding=compactInputs();
 assert.equal(binding.inputs.length,1712);const rows=binding.inputs.filter(r=>r.path==='components/HeadTeachingReviewNavigator.tsx');assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(rows[0].path)));
});

test('all existing current-delivery and preservation assertions survive explicit 1711-to-1712 input enumeration',()=>{
 const preSurface=beforeSurfaceDeliveryTest(read('tests/current-atlas-delivery.test.mjs'),read('tests/fixtures/head-surface-before-20261022/tests__current-atlas-delivery.test.mjs.raw'));
 const preNeck=beforeNeckXrayDeliveryTest(preSurface,read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'));
 inverse('tests/current-atlas-delivery.test.mjs',[['assert.equal(inputs,1712)','assert.equal(inputs,1711)']],beforeCompactDeliveryTest(preNeck));
 inverse('tests/review-navigation-delivery-preservation.test.mjs',[
 ['all previous current-delivery assertions survive the enumerated helper and head navigator additions','all previous current-delivery assertions survive the sole 1710-to-1711 helper addition'],
 ["seam='assert.equal(inputs,1712)'","seam='assert.equal(inputs,1711)'"],
 ['assert.equal(binding.inputs.length,1712)','assert.equal(binding.inputs.length,1711)'],
 ],beforeProposedNavigation(read('tests/review-navigation-delivery-preservation.test.mjs')));
});

test('all original head navigation refusals and assertions remain except the intentionally supported listed SECTION',()=>{
 const p='tests/head-teaching-review-navigation.test.ts';let s=read(p);
 s=replaceOnce(s,'selection is inert; explicit submit opens only an explicitly listed target inside the current main','selection is inert; explicit submit opens only a valid summary inside the current main');
 const start=s.indexOf('  calls.length=0;\n  const heading='),end=s.indexOf('  calls.length=0;found={...target};',start);assert(start>0&&end>start);
 s=replaceOnce(s,s.slice(start,end),"  calls.length=0;found={...target,tagName:'SECTION'};within.add(found);submit(selected);assert.equal(target.open,false);assert(!calls.includes('focus'));\n");assert.equal(s,original(p));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const {renderToStaticMarkup}=require('react-dom/server');
const path=new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url);
const allowedImports=new Set(["@/lib/clinical-review-server","@/components/HeadAtlasTeachingReview","@/lib/head-atlas-import","@/lib/head-teaching-review-contract","@/components/HeadTeachingReviewNotes","@/components/HeadMriComparisonReview","@/lib/head-mri-comparison-review","@/lib/head-mri-only-teaching","@/lib/head-mri-learning","@/lib/head-mri-review-draft-contract","@/components/HeadMriReviewNotes","@/components/HeadInsulaComparisonReview","@/lib/head-insula-comparison-review","@/lib/head-insula-teaching","@/lib/head-insula-learning","@/components/HeadOrbitalComparisonReview","@/lib/head-orbital-comparison-review","@/lib/head-orbital-teaching","@/lib/head-orbital-learning","@/components/HeadCtBoneComparisonReview","@/lib/head-ct-bone-comparison-review","@/components/HeadCtFacialComparisonReview","@/lib/head-ct-facial-comparison-review","@/components/HeadCtFacialLearningReview","@/lib/head-ct-facial-learning","@/lib/head-ct-bone-teaching","@/components/HeadCtFacialTeachingReview","@/lib/head-ct-facial-teaching.ts","@/lib/head-ct-facial-clinical.ts","@/components/HeadImageOnlyComparisonReview","@/lib/head-image-only-comparison-review","@/lib/head-image-only-links","@/lib/head-cerebellar-teaching","@/lib/head-cerebellar-learning","@/lib/head-anatomy-checks","@/components/HeadAnatomyChecksReview","@/components/HeadMriAnatomyChecksReview","@/lib/head-mri-anatomy-checks","@/components/HeadCerebellarClinicalReview","@/lib/head-cerebellar-clinical","@/components/HeadDeepGreyClinicalReview","@/lib/head-deep-grey-clinical","@/components/HeadLobarClinicalReview","@/lib/head-lobar-clinical","@/components/HeadHippocampalClinicalReview","@/lib/head-hippocampal-clinical","@/components/HeadMriOnlyClinicalReview","@/lib/head-mri-only-clinical"]);
const source=readFileSync(path),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const compiled=ts.transpileModule(source.toString(),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;

async function probe(authorized){
  let authCalls=0,contextCalls=0,downstreamCalls=0;
  const module={exports:{}};
  const resolve=specifier=>{
    if(specifier==='react/jsx-runtime')return require(specifier);
    if(specifier==='@/lib/clinical-review-server')return {authorizeClinicalReview:async()=>{authCalls++;if(!authorized)throw Error('Synthetic unauthorized');}};
    if(specifier==='@/lib/head-atlas-import')return {HEAD_MANIFEST_SHA256:'synthetic-unavailable-source'};
    if(specifier==='@/lib/head-teaching-review-contract')return {headTeachingDraftContext:async()=>{contextCalls++;throw Error('Synthetic source changed');}};
    assert(allowedImports.has(specifier),'Unexpected page import: '+specifier);
    // Exact imported names are never evaluated before either gate; count any attempt.
    return new Proxy({}, {get:()=>()=>{downstreamCalls++;throw Error('Downstream evidence reached before its gate');}});
  };
  new Function('require','module','exports',compiled)(resolve,module,module.exports);
  const tree=await module.exports.default();
  assert.equal(hash(readFileSync(path)),hash(source),'Review route remains unchanged');
  return {html:renderToStaticMarkup(tree),authCalls,contextCalls,downstreamCalls};
}

test('actual Review route rejects unauthorized entry before source or facial evidence resolution',async()=>{
  const result=await probe(false);
  assert.equal(result.authCalls,1);assert.equal(result.contextCalls,0);assert.equal(result.downstreamCalls,0);
  assert.match(result.html,/role="alert"/);assert.match(result.html,/authorized administrator account/);
  assert.doesNotMatch(result.html,/zygomatic|mandible|Teaching packet|Clinical orientation/);
});

test('authorized route with changed head source refuses before any independent evidence or Review controls',async()=>{
  const result=await probe(true);
  assert.equal(result.authCalls,1);assert.equal(result.contextCalls,1);assert.equal(result.downstreamCalls,0);
  assert.match(result.html,/exact binding is restored/);
  assert.doesNotMatch(result.html,/<form|<button|zygomatic|mandible/);
});

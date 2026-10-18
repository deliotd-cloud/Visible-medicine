import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

test('expanded practice is the same reviewed source in learner and Clinical Review, with unchanged anatomy',()=>{
  const revision='88cea927d48729769b96ad8fe680b0872b7e6687';
  const featureWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
  const feature=(path:string)=>JSON.parse(execFileSync('git',['show',featureWebsite+':'+path],{encoding:'utf8',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  const atlas=currentAtlasDeliveryRoot();
  const read=(p:string)=>readFileSync(p,'utf8');
  const json=(p:string)=>JSON.parse(read(p));
  const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const review=json('atlas-review/manifest.json');
  const historicalLearner=feature('public/atlas-runtime/head-neck/manifest.json');
  const historicalReview=feature('atlas-review/manifest.json');
  assert.equal(historicalLearner.sourceCommit,revision);assert.equal(historicalReview.revision,revision);
  assert.equal(historicalLearner.structures,291);assert.equal(historicalLearner.nestedSelections,77);
  assert.equal(learner.sourceCommit,pin.source);assert.equal(review.revision,pin.source);
  const page=read('app/atlas/head-neck-3d/page.tsx');
  assert(page.includes('{regionalManifest.structures} regional selections and {regionalManifest.nestedSelections} nested selections'));
  assert.equal(learner.structures,291);assert.equal(learner.nestedSelections,77);
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['app/body-scene.tsx','app/nested-practice.tsx','app/ventricles.tsx','lib/nested-practice.ts']) {
    const source=review.files.find((f:{path:string})=>f.path===path);
    assert.equal(source.sourceSha256,inputs.find((f:{path:string})=>f.path===path).sha256);
    assert.equal(source.importedSha256,sha(read('atlas-review/'+path)));
    const bytes=execFileSync('git',['show',pin.source+':'+path],{cwd:atlas,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.equal(source.sourceSha256,createHash('sha256').update(bytes).digest('hex'),path);
  }
  const source=ts.createSourceFile('practice.ts',read('atlas-review/lib/nested-practice.ts'),ts.ScriptTarget.Latest,true);
  const admitted:Record<string,string[]>={};
  const visit=(node:ts.Node)=>{
    if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='eligibleFmaIds') {
      assert(node.initializer&&ts.isObjectLiteralExpression(node.initializer));
      for(const prop of node.initializer.properties) {
        assert(ts.isPropertyAssignment(prop)&&ts.isNewExpression(prop.initializer));
        const array=prop.initializer.arguments?.[0];assert(array&&ts.isArrayLiteralExpression(array));
        admitted[prop.name.getText(source).replaceAll("'",'')]=array.elements.map(e=>{assert(ts.isStringLiteral(e));return e.text;});
      }
    }
    ts.forEachChild(node,visit);
  };visit(source);
  assert.deepEqual(Object.fromEntries(Object.entries(admitted).map(([key,ids])=>[key,ids.length])),{
    cardiac:4,ventricles:4,cerebral:16,brainstem:6,pulmonary:5,hepatic:7,renal:7,'visual-pathway':3,cricothyroid:4,'coronary-venous':2,
  });
  assert.equal(new Set(Object.values(admitted).flat()).size,58);
  const before=(path:string)=>JSON.parse(execFileSync('git',['show','8320a258ced06497a1ef6d63ad245015eced5031:'+path],{encoding:'utf8'}));
  for(const path of ['lib/atlas-model-inventory.json'])assert.deepEqual(json(path).models,before(path).models);
  assert.deepEqual(learner.regionalScopes,before('public/atlas-runtime/head-neck/manifest.json').regionalScopes);
  for(const path of ['atlas-review/content/nested-teaching-bindings.v1.json','atlas-review/content/nested-review-bindings.json']){
    assert.deepEqual(feature(path),before(path),'Exact feature-era teaching and geometry identities unchanged');
    const relative=path.slice('atlas-review/'.length);
    const entry=review.files.find((f:{path:string})=>f.path===relative);assert(entry,relative);
    const bytes=execFileSync('git',['show',pin.source+':'+relative],{cwd:atlas,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.equal(entry.sourceSha256,createHash('sha256').update(bytes).digest('hex'),relative);
    assert.equal(entry.importedSha256,sha(read(path)),relative);
    assert.equal(inputs.find((f:{path:string})=>f.path===relative)?.sha256,entry.sourceSha256,relative);
  }
  const altered=structuredClone(review);
  altered.files.find((f:{path:string})=>f.path==='content/nested-review-bindings.json').sourceSha256='0'.repeat(64);
  assert.throws(()=>validateCurrentAtlasDelivery({pin,read:(path:string)=>path==='atlas-review/manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(path)}),/Current delivery changed: atlas-review\/manifest.json/);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
});

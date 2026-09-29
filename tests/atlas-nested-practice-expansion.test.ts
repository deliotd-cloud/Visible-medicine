import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';

test('expanded practice is the same reviewed source in learner and Clinical Review, with unchanged anatomy',()=>{
  const revision='6149a26a1fd1ae74782f93be77856a1c1de08b86';
  const read=(p:string)=>readFileSync(p,'utf8');
  const json=(p:string)=>JSON.parse(read(p));
  const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const review=json('atlas-review/manifest.json');
  assert.equal(learner.sourceCommit,revision);assert.equal(review.revision,revision);
  const page=read('app/atlas/head-neck-3d/page.tsx');
  assert(page.includes('{regionalManifest.structures} regional selections and {regionalManifest.nestedSelections} nested selections'));
  assert.equal(learner.structures,291);assert.equal(learner.nestedSelections,77);
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['app/body-scene.tsx','app/nested-practice.tsx','app/ventricles.tsx','lib/nested-practice.ts']) {
    const source=review.files.find((f:{path:string})=>f.path===path);
    assert.equal(source.sourceSha256,inputs.find((f:{path:string})=>f.path===path).sha256);
    assert.equal(source.importedSha256,sha(read('atlas-review/'+path)));
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
  for(const path of ['atlas-review/content/nested-teaching-bindings.v1.json','atlas-review/content/nested-review-bindings.json'])assert.deepEqual(json(path),before(path),'Exact teaching and geometry identities unchanged');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
});

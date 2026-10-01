import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('learner and review CSS keep the return control after, not over, answers',()=>{
  for (const root of ['public/atlas-runtime/head-neck/','public/atlas-review-viewer/']) {
    const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
    assert.equal(manifest.sourceCommit,root.includes('atlas-review-viewer')?'d35fab9730ca5420d7a65f0ba321d8cbfff03571':'d35fab9730ca5420d7a65f0ba321d8cbfff03571');
    const css=manifest.files.filter((f:{path:string})=>f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{
      const bytes=readFileSync(root+f.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
      return bytes.toString();
    }).join('\n');
    const rules=[...css.matchAll(/\.anatomy-controls-return\s*\{([^}]+)\}/g)];
    assert(rules.length>0,root);
    for (const rule of rules) {
      assert.match(rule[1],/position:\s*static(?:;|$)/);
      assert(!/position:\s*(sticky|fixed|absolute)/.test(rule[1]));
      assert.match(rule[1],/min-height:\s*44px(?:;|$)/);
    }
  }
});

// Delivery evidence only: Atlas actual-component tests establish answer behavior.
test('regional learner and review viewers ship the tested selectable-question source',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'d35fab9730ca5420d7a65f0ba321d8cbfff03571');
  assert.equal(review.revision,'d35fab9730ca5420d7a65f0ba321d8cbfff03571');
  for(const [path,sha256] of Object.entries({
    'app/atlas-workspace.tsx':'ee177772777f18e2db5ed8ab5c30448ace5e07fa1adab4e7f6515c6907605110',
    'app/structure-quick-check.tsx':'7944394d093532c548b062e68be601d0fe6d4ebe7b4c5267275ade0436548632',
    'app/structure-quick-check.css':'fb0ae0d036f91d13bd0d6a82c335159c1f3620c8d0301e63724f369c5e836942',
  })) {
    assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256,path);
    assert.equal(review.files.find((f:{path:string})=>f.path===path)?.sourceSha256,sha256,path+' review parity');
  }
  const js=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const text of ['Quiz notes','Structure check','Check answer','Try again','Formative draft','cannot be marked']) assert(js.includes(text),text);
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[key],false);
});

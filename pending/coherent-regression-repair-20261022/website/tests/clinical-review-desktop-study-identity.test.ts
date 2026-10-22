import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
test('desktop full-name study styling is source-bound in Review and learner runtime',()=>{
  const review=json('atlas-review/manifest.json');
  const deliveryPin=validateCurrentAtlasDelivery();
  assert.equal(review.revision,deliveryPin.source,'Review stays bound to current source');
  const cssPath='app/atlas-workspace.css';
  const sourceCss=readFileSync('atlas-review/'+cssPath,'utf8');
  const input=review.files.find((file:{path:string})=>file.path===cssPath);
  assert(input);
  assert.equal(sha(sourceCss.replace(/\r\n/g,'\n')),input.sourceSha256);
  assert.match(sourceCss,/\.body-layout > \.body-info h2\[data-structure-study-heading\]/);
  assert.match(sourceCss,/font-size: 1\.25rem;/);
  const explorer=readFileSync('atlas-review/app/body-explorer.tsx','utf8');
  assert.match(explorer,/<h2 data-structure-study-heading tabIndex=\{-1\}>\{selected.name\}<\/h2>/);
  assert.match(explorer,/<ReviewStatus structureId=\{selected.id\} \/>/);
  assert.match(explorer,/\{bodySystems\[selected.system\].name\} · \{selected.fmaId\}/);
  for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
    const root=`public/atlas-runtime/${module}/`;
    const manifest=json(root+'manifest.json');
    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module]);
    if(module!=='head-neck')continue;
    const sheets=manifest.files.filter((file:{path:string})=>file.path.endsWith('.css'));
    assert(sheets.length>0);
    const css=sheets.map((file:{path:string;sha256:string})=>{
      const bytes=readFileSync(root+file.path);assert.equal(sha(bytes),file.sha256);return bytes.toString();
    }).join('\n');
    const rule=css.match(/\.body-layout>\.body-info h2\[data-structure-study-heading\]\{([^}]+)\}/)?.[1];
    assert(rule);
    assert.match(rule,/font-size:1\.25rem/);
    assert.match(rule,/line-height:1\.3/);
    assert.match(rule,/overflow-wrap:anywhere/);
    assert.doesNotMatch(rule,/(?:line-clamp|max-height|text-overflow|display:none|overflow:hidden)/);
  }
});

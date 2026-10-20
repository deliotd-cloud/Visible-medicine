import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import postcss from 'postcss';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const adapter='components/review-ui-variants.css';
const marker='/* Keep the selected model and worksheet responsive to the paper\'s actual width. */';
const oldCssSha='bf42eda18eed6d388e6f3204cab87df01270628f32e8e1e0cc7896e651a73ee7';
const old=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-desktop-layout.json'));

test('pre-layout delivery stays immutable; learner/model delivery is unchanged',()=>{
 assert.equal(sha(read('tests/fixtures/current-atlas-delivery-before-desktop-layout.json')),'1dc2a730c32e6ae8181ec5c1de99dd2b82522b5271273c09badfa69e39e679aa');
 const current=validateCurrentAtlasDelivery();
 for(const key of ['schema','source','sourceTree','reviewSourceFiles','viewerFiles','viewerPackages'])assert.equal(current[key],old[key],key);
 const changed=['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'];
 for(const [path,digest]of Object.entries(old.documents))if(!changed.includes(path))assert.equal(current.documents[path],digest,path);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),'Old Review binding is not admitted as current');
});

test('exact inverse binding proves the CSS adapter is the sole changed Review input',()=>{
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.inputs.length,1682);
 const inverse=structuredClone(binding.inputs),row=inverse.filter(r=>r.path===adapter);
 assert.equal(row.length,1);assert.notEqual(row[0].sha256,oldCssSha);
 assert.equal(row[0].sha256,sha(read(adapter)));
 row[0].sha256=oldCssSha;
 assert.equal(sha(JSON.stringify(inverse)),old.reviewIntegration,'No unrelated input, source, decision or access edit');
});

test('layout appends scoped CSS without changing prior styles or hiding review controls',()=>{
 assert.equal(sha(read('app/workspace/atlas-review/website-review.css')),'acd14e1c9a23f62fe86de0778d07b74ac23c19b62d63941858906a941ac77c0b','Shared schematic presentation input is unchanged');
 for(const path of ['app/globals.css','atlas-review/app/globals.css'])assert(read(path).toString().includes('components/review-ui-variants.css'),'Existing stylesheet entry: '+path);
 const css=read(adapter).toString(),index=css.indexOf(marker);
 assert(index>0);assert.equal(index,css.lastIndexOf(marker));
 assert.equal(sha(css.slice(0,index-1)),oldCssSha,'Original adapter prefix remains byte exact');
 const added=postcss.parse(css.slice(index));
 const allowed=new Set(['container','grid-template-columns','gap','padding','margin']);
 added.walkDecls(d=>{assert(allowed.has(d.prop),d.prop);assert(!/none|hidden|clip|absolute|fixed|!important/.test(d.value));});
 added.walkRules(rule=>assert(rule.selector.startsWith('.website-clinical-review '),rule.selector));
 const query=added.nodes.find(n=>n.type==='atrule'&&n.name==='container');
 assert.equal(query.params,'clinical-review-paper (min-width:40rem)');
 const media=added.nodes.find(n=>n.type==='atrule'&&n.name==='media');
 assert.equal(media.params,'(min-width:1000px) and (max-width:1199px)');
});

test('real source wrappers and preview retain worksheet context, minimum canvas and controls',()=>{
 for(const [file,selected,worksheet]of [
  ['atlas-review/app/review/body/review-dashboard.tsx','body-review-selected','body-review-worksheet'],
  ['atlas-review/app/review/review-dashboard.tsx','review-selected','review-worksheet'],
 ]){
  const text=read(file).toString();assert(text.includes(selected));assert(text.includes(worksheet));assert(text.includes('ReviewModelPreview'));
 }
 const component=read('atlas-review/app/review/review-model-preview.tsx').toString();
 for(const text of ['Worksheet revision','Hide model','Show model','Inspection does not record approval'])assert(component.includes(text),text);
 const css=read('atlas-review/app/review/review-model-preview.css').toString();
 assert(css.includes('clamp(420px, 65dvh, 760px)')||css.includes('clamp(420px,65dvh,760px)'));
 assert(css.includes('focus-visible'));
});

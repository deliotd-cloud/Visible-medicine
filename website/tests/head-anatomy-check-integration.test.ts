import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_ANATOMY_CHECK_REVISION,headAnatomyCheckContent,verifiedHeadAnatomyCheckRevision} from '../lib/head-anatomy-checks.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
function component(file:string,exportName=file){
  const code=ts.transpileModule(readFileSync(new URL(`../components/${file}.tsx`,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as Record<string,React.ComponentType<any>>};
  new Function('require','module','exports',code)((id:string)=>id==='./HeadAnatomyCheck'?headAnatomyCheckModule:id==='./HeadReviewImageLink'?headReviewImageLinkModule:id==='./HeadTeachingReviewNavigator'?{HeadTeachingReviewNavigator:()=>null,HeadTeachingReviewSections:component('HeadTeachingReviewNavigator','HeadTeachingReviewSections')}:id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):require(id),mod,mod.exports);
  return mod.exports[exportName];
}
const Native=component('HeadAtlasTeaching'),Reference=component('HeadAtlasReferenceTeaching'),Review=component('HeadAnatomyChecksReview'),Shell=component('HeadAtlasTeachingReview');
const render=(type:React.ComponentType<any>,props:Record<string,unknown>)=>renderToStaticMarkup(React.createElement(type,props));

test('all 25 questions reach actual native CT/MRI and existing3D teaching without changing the anatomy packet',()=>{
  for(const question of headAnatomyCheckContent.questions){
    for(const surface of ['CT','MRI','3D']){
      const html=render(surface==='3D'?Reference:Native,{conceptId:question.conceptId,modality:surface,revision:HEAD_LINK_REVISION});
      assert(html.includes('Check understanding · Draft'));
      assert(html.includes(question.prompt));
      assert(html.includes(HEAD_ANATOMY_CHECK_REVISION));
      assert.equal([...html.matchAll(/type="radio"/g)].length,3);
      assert(!html.includes('checked=""'));assert(!html.includes('<details open'));
      assert(!html.includes('Correct answer:'));
    }
  }
  assert.equal(render(Native,{conceptId:'brainstem-pons',modality:'MRI',revision:'stale'}),'');
  assert.equal(render(Reference,{conceptId:'brainstem-pons',revision:'stale'}),'');
  assert.equal(createHash('sha256').update(JSON.stringify(headTeachingPacket())).digest('hex'),HEAD_TEACHING_REVISION);
});

test('separate protected review offers exactly25 answer keys and exact destinations only at a verified revision',async()=>{
  const questionRevision=await verifiedHeadAnatomyCheckRevision(HEAD_LINK_REVISION);
  assert.equal(questionRevision,HEAD_ANATOMY_CHECK_REVISION);
  const knowledgeReview=React.createElement(Review,{revision:HEAD_LINK_REVISION,questionRevision});
  const html=render(Shell,{revision:HEAD_LINK_REVISION,knowledgeReview});
  assert(html.includes('href="#head-anatomy-check-review"'));
  assert(html.includes('id="head-anatomy-check-review"'));
  assert.equal([...html.matchAll(/ · Correct answer<\/li>/g)].length,25);
  assert.equal([...html.matchAll(/>Inspect question CT target<\/a>/g)].length,25);
  assert.equal([...html.matchAll(/>Inspect question MRI target<\/a>/g)].length,25);
  assert.equal([...html.matchAll(/>Inspect question 3D target<\/a>/g)].length,25);
  assert(html.includes('Earlier anatomy, clinical and sequence decisions do not approve these questions'));
  for(const props of [{revision:'stale',questionRevision},{revision:HEAD_LINK_REVISION,questionRevision:'stale'},{revision:HEAD_LINK_REVISION,questionRevision:null}]){
    const refused=render(Review,props);
    assert(refused.includes('role="alert"'));assert(!refused.includes('Correct answer'));assert(!refused.includes('Inspect question'));
  }
  const refusedShell=render(Shell,{revision:'stale',knowledgeReview});
  assert(!refusedShell.includes('Correct answer'));
});

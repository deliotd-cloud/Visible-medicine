import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as lectureLinks from '../lib/lecture-related-links.ts';
import * as tourContext from '../lib/lecture-tour-context.ts';
import * as resourceStatus from '../components/LearningResourceStatus.ts';

const require=createRequire(import.meta.url);
const notice='CT/MRI comparisons and linked tours are temporarily unavailable because the imaging revision has changed. The source mappings must be checked before these links can be used. You can still explore the 3D Atlas.';

function load(relative:string,imports:Record<string,unknown>){
  const source=readFileSync(new URL(relative,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((id:string)=>Object.hasOwn(imports,id)?imports[id]:require(id),module,module.exports);
  return module.exports;
}

test('head link availability accepts only the exact current imaging manifest revision',()=>{
  const imports={'./head-atlas-import.ts':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},'./head-atlas-links.ts':{HEAD_LINK_REVISION}};
  const current=load('../lib/head-link-availability.ts',imports);
  assert.equal(current.headLinksCurrent({}),true);
  assert.match(String(current.HEAD_LINK_REVISION_NOTICE),/imaging revision has changed/);
  for(const changed of ['a'.repeat(64),undefined,'']){
    const stale=load('../lib/head-link-availability.ts',{...imports,'./head-atlas-import.ts':{HEAD_MANIFEST_SHA256:changed}});
    assert.equal(stale.headLinksCurrent({}),false,`changed manifest ${String(changed)}`);
  }
});

test('mismatched imaging revision hides all four linked navigation surfaces',()=>{
  const gate={'../lib/head-link-availability.ts':{headLinksCurrent:()=>false,HEAD_LINK_REVISION_NOTICE:notice}};
  const imports={...gate,'next/navigation':{useRouter:()=>({push:()=>assert.fail('stale navigation')})},
    '../lib/lecture-related-links':lectureLinks,
    '../lib/lecture-tour-context':tourContext,
    '../lib/head-atlas-learning':{headLearningSequencesForModality:()=>[],headLearningNavigation:()=>assert.fail('stale sequence'),headLearningLinks:()=>assert.fail('stale links')},
    '../lib/head-atlas-links':{headAtlasConceptOptions:()=>assert.fail('stale options'),headConceptById:()=>assert.fail('stale concept')},
    './HeadAtlasLearningPicker':{HeadAtlasLearningPicker:()=>assert.fail('stale picker')},
    './LearningResourceStatus.ts':resourceStatus,
    './HeadLearningBookmark':{HeadLearningBookmark:()=>assert.fail('stale bookmark')},
    '../lib/head-mri-learning':{},'../lib/head-insula-learning':{},'../lib/head-orbital-learning':{},'../lib/head-ct-bone-learning':{},
    'react/jsx-runtime':require('react/jsx-runtime')};
  const cases:Array<{file:string;name:string;props:Record<string,unknown>}>=[
    {file:'../components/HeadAtlasComparisonNavigation.tsx',name:'HeadAtlasComparisonNavigation',props:{conceptId:'brainstem-pons',liveState:'unavailable',onRetry:()=>assert.fail('stale retry')}},
    {file:'../components/HeadAtlasLearningPicker.tsx',name:'HeadAtlasLearningPicker',props:{sequenceId:'brainstem',conceptId:'brainstem-pons'}},
    {file:'../components/HeadAtlasLearningNavigation.tsx',name:'HeadAtlasLearningNavigation',props:{position:{sequenceId:'brainstem',conceptId:'brainstem-pons'}}},
    {file:'../components/HeadAtlasLearningLibrary.tsx',name:'HeadAtlasLearningLibrary',props:{}},
  ];
  for(const item of cases){
    const Component=load(item.file,imports)[item.name];assert(Component,item.name);
    const html=renderToStaticMarkup(React.createElement(Component,item.props));
    assert.match(html,/role="status"/,item.name);
    assert.match(html,/imaging revision has changed/,item.name);
    assert.match(html,/still explore the 3D Atlas/,item.name);
    assert.doesNotMatch(html,/<(?:a|form|select|button|details)\b/i,item.name);
    assert.doesNotMatch(html,/(?:Retry comparison|Open in model|Start at step 1|Continue .* on CT)/,item.name);
  }
});

test('guided learning explains stale imaging revision and retains current sequence controls',()=>{
  const entry={id:'cth.bst.midbrain',label:'Midbrain',family:'bst'};
  const calls:string[]=[];
  const shared={
    'react':React,
    'next/link':({href,children}:{href:string;children:React.ReactNode})=>React.createElement('a',{href},children),
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},
    '../lib/head-atlas-links':{headAtlasConcept:()=>null},
    '../lib/head-atlas-learning':{
      headLearningSteps:()=>[{conceptId:'brainstem-midbrain',index:0,label:'Midbrain',entry}],
      headLearningSequencesForModality:()=>[{id:'brainstem',label:'Brainstem orientation',concepts:['brainstem-midbrain']}],
      headLearningLinks:()=>assert.fail('no comparison for fixture'),
    },
    '../lib/head-atlas-practice':{practiceEntries:()=>[]},
    '../lib/head-atlas-focus':{focusHeadLearningContent:()=>{}},
    '../lib/lecture-related-links':lectureLinks,
    '../lib/lecture-tour-context':tourContext,
    './HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},
    './HeadAtlasConceptTeaching':{HeadAtlasConceptTeaching:()=>null},
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  };
  const props={study:{definition:{entries:[entry]}},modality:'CT',position:{sequenceId:'brainstem',conceptId:null},
    onPositionChange:()=>calls.push('position'),onSelect:()=>calls.push('select'),onPractice:()=>calls.push('practice')};
  for(const current of [false,true]){
    const imports={...shared,'../lib/head-link-availability.ts':{headLinksCurrent:()=>current,HEAD_LINK_REVISION_NOTICE:notice}};
    const Component=load('../components/HeadAtlasGuidedLearning.tsx',imports).HeadAtlasGuidedLearning;
    const html=renderToStaticMarkup(React.createElement(Component,props));
    if(current){assert.match(html,/Guided learning/);assert.match(html,/<select/);assert.match(html,/1 \/ 1 steps available/);}
    else {assert.match(html,/role="status"/);assert.match(html,/imaging revision has changed/);assert.doesNotMatch(html,/<(?:select|button|a|details)\b/);}
  }
  assert.deepEqual(calls,[]);
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as learning from '../lib/head-atlas-learning.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as tour from '../lib/lecture-tour-context.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import {practiceEntries} from '../lib/head-atlas-practice.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

function load(file:string,bindings:Record<string,unknown>){
  const source=readFileSync(new URL(`../components/${file}`,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const exports:Record<string,unknown>={};
  new Function('exports','require',code)(exports,(name:string)=>{
    if(name==='react/jsx-runtime')return requireJsx;
    if(Object.hasOwn(bindings,name))return bindings[name];
    throw new Error(`Unbound component import: ${name} in ${file}`);
  });
  return exports;
}
const requireJsx=await import('react/jsx-runtime');
const Link=({href,children,prefetch:_prefetch,...props}:any)=>React.createElement('a',{href,...props},children);
const pons:HeadEntry={id:'cth.bst.pons',label:'Pons — regional mask',family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};

function guided(studyEntries:HeadEntry[]|null,modality:'CT'|'MRI',current=true,at=position){
  const imports={
    react:{useEffect:()=>{},useLayoutEffect:()=>{},useRef:()=>({current:null}),useState:(value:unknown)=>[value,()=>{}]},
    'next/link':Link,
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>current,HEAD_LINK_REVISION_NOTICE:'Revision changed'},
    '../lib/head-image-only-links.ts':{headImageConcept:()=>null},
    '../lib/head-atlas-learning':learning,
    '../lib/head-atlas-practice':{practiceEntries},
    '../lib/head-atlas-focus':{focusHeadLearningContent:()=>{}},
    '../lib/lecture-tour-context':tour,
    '../lib/lecture-related-links':{relatedLectureHref},
    './HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},
    './HeadAtlasConceptTeaching':{HeadAtlasConceptTeaching:()=>null},
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  };
  const Component=load('HeadAtlasGuidedLearning.tsx',imports).HeadAtlasGuidedLearning as React.ComponentType<any>;
  return renderToStaticMarkup(React.createElement(Component,{study:studyEntries?{definition:{entries:studyEntries}}:null,modality,position:at,onPositionChange:()=>{},onSelect:()=>{},onPractice:()=>{}}));
}

function lectureLink(html:string){
  const match=html.match(/<a\b([^>]*)>Find related lectures<\/a>/);
  if(!match)return null;
  const attrs=match[1];
  return {href:attrs.match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;','&'),target:attrs.match(/target="([^"]+)"/)?.[1],rel:attrs.match(/rel="([^"]+)"/)?.[1]};
}

test('canonical CT/MRI step offers a closed, exact-pinned new-tab lecture link even without a local mask',()=>{
  for(const modality of ['CT','MRI'] as const){
    for(const entries of [[modality==='CT'?pons:{...pons,id:'mrb.bst.pons'}],[]]){
      const html=guided(entries,modality);
      const context=tour.createLectureTourContext(position,modality,HEAD_LINK_REVISION);
      assert.equal(context.kind,'ready');
      assert.match(html,/<details[^>]*><summary>Related lectures<\/summary>/);
      assert.doesNotMatch(html,/<details[^>]*open/);
      assert.match(html,/Lecture access is separate from Atlas access/);
      assert.deepEqual(lectureLink(html),{href:relatedLectureHref(position.conceptId,HEAD_LINK_REVISION,0,context),target:'_blank',rel:'noopener noreferrer'});
      if(!entries.length)assert.match(html,/unavailable in the loaded study/);
    }
  }
  assert.equal(lectureLink(guided([], 'CT',false)),null);
  assert.equal(lectureLink(guided([], 'CT',true,{sequenceId:'unknown',conceptId:'brainstem-pons'})),null);
});

test('3D authored step offers the same link without claiming a confirmed model selection',()=>{
  const imports={
    '../lib/head-atlas-learning':learning,
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>true,HEAD_LINK_REVISION_NOTICE:'Revision changed'},
    '../lib/head-atlas-links':{HEAD_LINK_REVISION},
    '../lib/lecture-tour-context':tour,
    '../lib/lecture-related-links':{relatedLectureHref},
    './HeadAtlasLearningPicker':{HeadAtlasLearningPicker:()=>null},
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  };
  const Component=load('HeadAtlasLearningNavigation.tsx',imports).HeadAtlasLearningNavigation as React.ComponentType<any>;
  const html=renderToStaticMarkup(React.createElement(Component,{position,comparisonReady:false}));
  const context=tour.createLectureTourContext(position,'3D',HEAD_LINK_REVISION);
  assert.deepEqual(lectureLink(html),{href:relatedLectureHref(position.conceptId,HEAD_LINK_REVISION,0,context),target:'_blank',rel:'noopener noreferrer'});
  assert.match(html,/does not confirm the live model selection/);
});

test('verified and unavailable lecture views preserve validated tour return; invalid context has no fallback',async()=>{
  class LectureError extends Error{}
  const publication={manifest:{workbook:{id:'lecture-1',title:'Lecture',version:2},slides:[]},integrityHash:'a'.repeat(64)};
  const player=()=>null;
  const base={
    'next/link':Link,
    '@/lib/lecture-tour-context':tour,
    '@/components/SiteFrame':{WorkspaceContextBar:()=>null},
    '@/components/LecturePlayer':{LecturePlayer:player},
  };
  const context=tour.createLectureTourContext(position,'CT',HEAD_LINK_REVISION);
  assert.equal(context.kind,'ready');
  const success=load('LectureLesson.tsx',{...base,'@/lib/lecture-repository':{LectureError,getPublishedLecture:async()=>publication}}).LectureLesson as (props:any)=>Promise<React.ReactNode>;
  const result=await success({auth:{},workbookId:'lecture-1',tourContext:context});
  const html=renderToStaticMarkup(result);
  const returnTo=tour.lectureTourReturn(context)!;
  assert(html.includes(`href="${returnTo.href.replaceAll('&','&amp;')}"`));
  assert.match(html,/step 2 \/ 3 · CT/);
  const findPlayer=(node:any):any=>Array.isArray(node)?node.map(findPlayer).find(Boolean):React.isValidElement(node)?node.type===player?node:findPlayer((node.props as {children?:unknown}).children):null;
  assert.deepEqual(findPlayer(result).props.navigation.tourContext,context);
  assert.equal(findPlayer(result).props.navigation.revision,publication.integrityHash);
  const denied=load('LectureLesson.tsx',{...base,'@/lib/lecture-repository':{LectureError,getPublishedLecture:async()=>{throw new LectureError('Access required');}}}).LectureLesson as (props:any)=>Promise<React.ReactNode>;
  assert.match(renderToStaticMarkup(await denied({auth:{},workbookId:'lecture-1',tourContext:context})),/Return to .*step 2 \/ 3 · CT/);
  const invalid=renderToStaticMarkup(await denied({auth:{},workbookId:'lecture-1',tourContext:{kind:'invalid'}}));
  assert.match(invalid,/guided learning return link is unavailable/i);
  assert.doesNotMatch(invalid,/Return to .*step|href="\/atlas\//);
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as anatomy from '../lib/lecture-anatomy-reference.ts';
import * as collection from '../lib/lecture-anatomy-collection.ts';
import * as atlasNavigation from '../lib/head-atlas-navigation.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as structureGuides from '../lib/head-structure-guides.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as related from '../lib/lecture-related-links.ts';
import * as navigation from '../lib/lecture-slide-navigation.ts';
import * as tour from '../lib/lecture-tour-context.ts';

const requireNode=createRequire(import.meta.url);
const concept='brainstem-pons',publication='b'.repeat(64),workbookId='workbook:guided';
const context=tour.createLectureTourContext({sequenceId:'brainstem',conceptId:concept},'CT',HEAD_LINK_REVISION);
assert.equal(context.kind,'ready');
const base=related.relatedLectureHref(concept,HEAD_LINK_REVISION)!;
const entry=related.relatedLectureHref(concept,HEAD_LINK_REVISION,0,context)!;
const learner={userId:'learner',email:'learner@example.invalid',displayName:'Learner'};

function compile(path:string,mocks:Record<string,unknown>,jsx=false){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:jsx?ts.JsxEmit.ReactJSX:undefined}}).outputText;
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>name.endsWith('.css')?{}:name in mocks?mocks[name]:name==='@/lib/head-structure-guides'?structureGuides:requireNode(name),module,module.exports);
  return module.exports;
}
const link=({href,children}:any)=>React.createElement('a',{href},children);
const htmlLinks=(html:string)=>[...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'));

test('related discovery preserves old no-context links and accepts only the exact authored step',()=>{
  assert.deepEqual(related.parseRelatedLectureRequest(Object.fromEntries(new URL(base,'https://visible.invalid').searchParams)),
    {conceptId:concept,headRevision:HEAD_LINK_REVISION,offset:0});
  const request=related.parseRelatedLectureRequest(Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams));
  assert.deepEqual(request,{conceptId:concept,headRevision:HEAD_LINK_REVISION,offset:0,tourContext:context});
  assert.equal(related.relatedLectureHref('brainstem-midbrain',HEAD_LINK_REVISION,0,context),null);
  assert.equal(related.relatedLectureHref(concept,HEAD_LINK_REVISION,0,{...context,headRevision:'a'.repeat(64)}),null);
  for(const query of [
    {...Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams),returnStep:'0'},
    {...Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams),returnView:['CT','CT']},
    {...Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams),returnConcept:'brainstem-midbrain'},
  ])assert.equal(related.parseRelatedLectureRequest(query),null);
  const duplicate=new URL(entry,'https://visible.invalid').searchParams;
  duplicate.append('returnTour','brainstem');
  assert.equal(related.parseRelatedLectureRequest({...Object.fromEntries(duplicate),returnTour:duplicate.getAll('returnTour')}),null);
});

test('published slide links, sign-in returns and route matching retain exact context',()=>{
  const source:navigation.PublishedLectureNavigation={workbookId,revision:publication,request:{kind:'requested',slideId:'intro',revision:publication},tourContext:context};
  const href=navigation.lectureSlideHref(source,'next');
  assert(href);
  const url=new URL(href,'https://visible.invalid');
  assert.deepEqual(tour.parseLectureTourContext(url.searchParams),context);
  assert.deepEqual(navigation.parseLectureSlideRequest(url.searchParams),{kind:'requested',slideId:'next',revision:publication});
  assert.equal(navigation.lectureRequestReturnPath(workbookId,undefined,source.request,context),navigation.lectureSlideHref(source,'intro'));
  assert.equal(navigation.lectureLocationMatches(source,{pathname:url.pathname,search:url.search}),true);
  for(const search of ['',url.search.replace('returnView=CT','returnView=MRI'),url.search+'&returnTour=brainstem']){
    assert.equal(navigation.lectureLocationMatches(source,{pathname:url.pathname,search}),false);
  }
  assert.equal(navigation.lectureLocationMatches(source,{pathname:'/learn/lectures/other',search:url.search}),false);
  const old={...source,tourContext:undefined};
  assert.equal(navigation.lectureSlideHref(old,'next'),`/learn/lectures/${encodeURIComponent(workbookId)}?lectureSlide=next&lectureRevision=${publication}`);
  assert.equal(navigation.lectureLocationMatches(old,{pathname:url.pathname}),true);
});

test('related page authenticates exact context, retains it through groups/retry and decorates only verified local slides',async()=>{
  const calls:string[]=[];
  const slide=navigation.lectureSlideHref({workbookId,revision:publication,request:{kind:'none'}},'intro')!;
  let fail=false;
  const page=compile('../app/learn/related-anatomy/page.tsx',{
    'next/link':link,
    '../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{calls.push(`auth:${path}`);return learner;}},
    '@/lib/lecture-related-links':related,
    '@/lib/lecture-tour-context':tour,
    '@/lib/head-atlas-navigation':atlasNavigation,
    '@/lib/head-atlas-learning':learning,
    '@/lib/lecture-related-repository':{getRelatedPublishedLectures:async(_auth:unknown,request:unknown)=>{
      calls.push(`query:${JSON.stringify(request)}`);
      if(fail)throw new Error('SECRET SOURCE');
      return {items:[{workbookId,title:'Verified lecture',version:2,slides:[{id:'intro',title:'Verified slide',href:slide},
        {id:'external',title:'Unsafe slide',href:'https://evil.invalid/learn/lectures/other'}]}],nextOffset:16};
    }},
  },true).default;
  const params=Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams);
  const result=renderToStaticMarkup(await page({searchParams:Promise.resolve(params)}));
  assert.equal(calls[0],`auth:${entry}`);
  assert.deepEqual(JSON.parse(calls[1].slice(6)).tourContext,context);
  const links=htmlLinks(result);
  assert(links.includes(tour.lectureTourReturn(context)!.href));
  const nextGroup=related.relatedLectureHref(concept,HEAD_LINK_REVISION,16,context);
  const contextualSlide=tour.appendLectureTourContext(slide,context);
  assert(nextGroup);
  assert(contextualSlide);
  assert(links.includes(nextGroup));
  assert(links.includes(contextualSlide));
  assert.doesNotMatch(result,/Unsafe slide|evil\.invalid/);
  fail=true;
  const failed=renderToStaticMarkup(await page({searchParams:Promise.resolve(params)}));
  assert(htmlLinks(failed).includes(entry));
  assert.doesNotMatch(failed,/SECRET SOURCE/);
  const before=calls.length;
  const invalid=renderToStaticMarkup(await page({searchParams:Promise.resolve({...params,returnStep:'0'})}));
  assert.equal(calls[before],'auth:/learn/related-anatomy?invalid=1');
  assert.equal(calls.length,before+1);
  assert.match(invalid,/link is invalid/);
});

test('real repository still calls published lecture authority before disclosing slide metadata',async()=>{
  const calls:string[]=[];
  let deny=false;
  const pin=anatomy.createLectureAnatomyReference(concept);
  assert(pin);
  class LectureError extends Error{status:number;constructor(status:number){super('denied');this.status=status;}}
  const repository=compile('../lib/lecture-related-repository.ts',{
    'cloudflare:workers':{env:{DB:{prepare:()=>({bind:()=>({all:async()=>({results:[{id:workbookId}]})})})}}},
    '@/db/bootstrap':{ensureEducationUser:async()=>({roles:['learner']})},
    '@/db/platform':{getPlatformSnapshot:async()=>{throw new Error('staff-only');}},
    '@/lib/lecture-repository':{getPublishedLecture:async(_auth:unknown,id:string)=>{
      calls.push(id);
      if(deny)throw new LectureError(403);
      return {manifest:{workbook:{id,title:'Verified lecture',version:2},slides:[{id:'intro',title:'Verified slide',anatomyReference:pin}]},integrityHash:publication};
    },LectureError},
    '@/lib/lecture-anatomy-reference':anatomy,
    './lecture-anatomy-collection.ts':collection,
    '@/lib/lecture-slide-navigation':navigation,
    '@/lib/lecture-related-links':related,
  });
  const request=related.parseRelatedLectureRequest(Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams));
  assert(request);
  const result=await repository.getRelatedPublishedLectures({userId:'learner'},request);
  assert.deepEqual(calls,[workbookId]);
  assert.equal(result.items.length,1);
  assert.equal(result.items[0].slides[0].href,navigation.lectureSlideHref({workbookId,revision:publication,request:{kind:'none'}},'intro'));
  deny=true;
  assert.deepEqual(await repository.getRelatedPublishedLectures({userId:'learner'},request),{items:[],nextOffset:null});
  assert.deepEqual(calls,[workbookId,workbookId]);
});

test('both lecture routes parse context before auth and pass the same value to the lesson',async()=>{
  const calls:string[]=[];
  const lessons:any[]=[];
  const lesson=(props:any)=>{lessons.push(props);return React.createElement('div',null,'Lesson');};
  const common={
    '@/lib/lecture-slide-navigation':navigation,
    '@/lib/lecture-tour-context':tour,
    '@/components/LectureLesson':{LectureLesson:lesson},
  };
  const direct=compile('../app/learn/lectures/[workbookId]/page.tsx',{
    ...common,'../../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{calls.push(path);return learner;}},
  },true).default;
  const course=compile('../app/learn/[courseSlug]/[workbookId]/page.tsx',{
    ...common,'../../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{calls.push(path);return learner;}},
    '@/components/EducationRuntime':{EducationRuntime:()=>null},
    '@/db/bootstrap':{ensureEducationUser:async()=>{}},
    '@/lib/lecture-repository':{isLectureWorkbook:async()=>true},
  },true).default;
  const query=Object.fromEntries(new URL(entry,'https://visible.invalid').searchParams);
  renderToStaticMarkup(await direct({params:Promise.resolve({workbookId}),searchParams:Promise.resolve(query)}));
  renderToStaticMarkup(await course({params:Promise.resolve({courseSlug:'head-and-neck',workbookId}),searchParams:Promise.resolve(query)}));
  assert.equal(lessons.length,2);
  assert.deepEqual(lessons.map(item=>item.tourContext),[context,context]);
  assert.deepEqual(calls.map(path=>tour.parseLectureTourContext(new URL(path,'https://visible.invalid').searchParams)),[context,context]);
  const malformed={...query,returnStep:'0'};
  renderToStaticMarkup(await direct({params:Promise.resolve({workbookId}),searchParams:Promise.resolve(malformed)}));
  assert.deepEqual(lessons.at(-1).tourContext,{kind:'invalid'});
  assert.deepEqual(tour.parseLectureTourContext(new URL(calls.at(-1)!,'https://visible.invalid').searchParams),{kind:'invalid'});
});

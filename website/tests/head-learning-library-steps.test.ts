import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {loadHeadBookmark} from './head-bookmark-ui-loader.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';
import * as availability from '../lib/head-link-availability.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import * as orbitalLearning from '../lib/head-orbital-learning.ts';
import * as boneLearning from '../lib/head-ct-bone-learning.ts';
import {headImageConceptById as headConceptById} from '../lib/head-image-only-links.ts';

const source=readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8');
// Export the pure list locally so its native details event can be exercised without a DOM fixture.
const compiled=ts.transpileModule(source.replace('function TourList(', 'export function TourList('),
  {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const require=createRequire(import.meta.url);
type Sequence={id:string;label:string;concepts:string[]};
type Module={HeadAtlasLearningLibrary:()=>React.ReactNode;TourList:(props:{sequences:Sequence[]})=>React.ReactNode};
function load(options:{missing?:string;current?:boolean}={}){
  const mocked={...learning,headLearningLinks:(position:learning.HeadLearningPosition)=>
    position.conceptId===options.missing?null:learning.headLearningLinks(position)};
  const dependencies:Record<string,unknown>={
    './HeadLearningBookmark':loadHeadBookmark(),
    '../lib/head-atlas-learning':mocked,
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>options.current!==false},
    '../lib/head-mri-learning':mriLearning,
    '../lib/head-insula-learning':insulaLearning,
    '../lib/head-orbital-learning':orbitalLearning,
    '../lib/head-ct-bone-learning':boneLearning,
  };
  const mod={exports:{} as Module};
  new Function('require','module','exports',compiled)((id:string)=>dependencies[id]??require(id),mod,mod.exports);
  return mod.exports;
}
const all=learning.headLearningSequencesForModality();
function previews(html:string){return [...html.matchAll(/<details class="head-linked-step-preview"([^>]*)>([\s\S]*?)<\/details>/g)];}
function anchors(html:string){return [...html.matchAll(/<a href="([^"]+)" aria-label="([^"]+)">([^<]+)<\/a>/g)]
  .map(match=>({href:match[1].replaceAll('&amp;','&'),label:match[2],text:match[3]}));}

test('all thirteen previews preserve exact canonical step order and mapped destinations',()=>{
  const html=renderToStaticMarkup(React.createElement(load().HeadAtlasLearningLibrary));
  const details=previews(html);
  assert.equal(all.length,13);
  assert.equal(details.length,all.length);
  for(const [tourIndex,sequence] of all.entries()){
    const [ ,attributes,body]=details[tourIndex];
    assert.doesNotMatch(attributes,/\bopen(?:\s|=|$)/);
    assert(body.includes(`<summary>View steps · ${sequence.label}</summary>`));
    assert.match(body,/no progress or completion/);
    const slots=[...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match=>match[1]);
    assert.equal(slots.length,sequence.concepts.length,sequence.id);
    for(const [index,conceptId] of sequence.concepts.entries()){
      const label=headConceptById(conceptId)?.label;
      assert(label,conceptId);
      const expected=learning.headLearningLinks({sequenceId:sequence.id,conceptId});
      assert(expected,conceptId);
      assert(slots[index].includes(`<span>${label}</span>`));
      assert(slots[index].includes(`aria-label="${sequence.label} step ${index+1}: ${label}"`));
      const expectedAnchors=[
        ...(expected.atlasHref?[{href:expected.atlasHref,label:`Open ${label} at step ${index+1} in the 3D Atlas`,text:'3D'}]:[]),
        ...(expected.ctHref?[{href:expected.ctHref,label:`Open ${label} at step ${index+1} in CT`,text:'CT'}]:[]),
        ...(expected.mriHref?[{href:expected.mriHref,label:`Open ${label} at step ${index+1} in MRI`,text:'MRI'}]:[]),
        ...([expected.atlasHref,expected.ctHref,expected.mriHref].filter(Boolean).length>=2?[{href:headGuidedComparisonForStep(sequence.id,conceptId)!.activityHref,label:`Compare views for ${label} at step ${index+1}`,text:'Compare views'}]:[]),
      ];
      assert.deepEqual(anchors(slots[index]),expectedAnchors,`${sequence.id} step ${index+1}`);
      for(const anchor of expectedAnchors){
        const url=new URL(anchor.href,'https://example.invalid');
        assert.equal(url.searchParams.get('headTour'),sequence.id);
        assert.equal(url.searchParams.get('headStep'),String(index));
        assert.deepEqual(learning.parseHeadLearningIntent(url.searchParams,anchor.text==='3D'?'atlas':'image'),
          {sequenceId:sequence.id,conceptId});
      }
    }
  }
});

test('a missing later step stays in its slot with no substitute or fabricated links',()=>{
  const sequence=all[0],missing=sequence.concepts[1];
  const html=renderToStaticMarkup(React.createElement(load({missing}).HeadAtlasLearningLibrary));
  const slots=[...previews(html)[0][2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match=>match[1]);
  assert.equal(slots.length,sequence.concepts.length);
  assert(slots[1].includes(headConceptById(missing)!.label));
  assert.match(slots[1],/Exact comparison unavailable/);
  assert.equal(anchors(slots[1]).length,0);
  assert.equal(anchors(slots[0]).length,4);
  assert.equal(anchors(slots[2]).length,4);
});

test('stale link revision suppresses every step preview and navigation target',()=>{
  const html=renderToStaticMarkup(React.createElement(load({current:false}).HeadAtlasLearningLibrary));
  assert.equal(previews(html).length,0);
  assert.doesNotMatch(html,/<a |<li>|<button|<input|<select/);
  assert(html.includes(availability.HEAD_LINK_REVISION_NOTICE));
});

test('Escape closes an open step preview and returns keyboard focus to its summary',()=>{
  const list=load().TourList({sequences:[all[0]]}) as React.ReactElement<{children:React.ReactNode}>;
  const tour=React.Children.toArray(list.props.children)[0] as React.ReactElement<{children:React.ReactNode}>;
  const details=React.Children.toArray(tour.props.children).find(child=>React.isValidElement(child)&&child.type==='details') as React.ReactElement<{
    onKeyDown:(event:{key:string;currentTarget:{open:boolean;querySelector:(selector:string)=>{focus:()=>void}|null};preventDefault:()=>void;stopPropagation:()=>void})=>void;
  }>;
  assert(details);
  let focused=0,prevented=0,stopped=0;
  const target={open:true,querySelector:(selector:string)=>selector==='summary'?{focus:()=>{focused++;}}:null};
  const event={key:'Escape',currentTarget:target,preventDefault:()=>{prevented++;},stopPropagation:()=>{stopped++;}};
  details.props.onKeyDown(event);
  assert.equal(target.open,false);
  assert.equal(focused,1);
  assert.equal(prevented,1);
  assert.equal(stopped,1);
});

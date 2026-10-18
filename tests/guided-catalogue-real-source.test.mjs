import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as learning from '../lib/head-atlas-learning.ts';
import * as mri from '../lib/head-mri-learning.ts';
import * as insula from '../lib/head-insula-learning.ts';
import * as orbital from '../lib/head-orbital-learning.ts';
import * as bone from '../lib/head-ct-bone-learning.ts';
import * as cerebellar from '../lib/head-cerebellar-learning.ts';
import * as facial from '../lib/head-ct-facial-learning.ts';
import * as concepts from '../lib/head-image-only-links.ts';
import * as availability from '../lib/head-link-availability.ts';

const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {transformSync}=require('esbuild');
const code=transformSync(readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8'),{loader:'tsx',format:'cjs',jsx:'automatic'}).code;
const groups=[learning.headLearningSequences,mri.headMriLearningSequences,insula.headInsulaLearningSequences,orbital.headOrbitalLearningSequences,bone.headCtBoneLearningSequences,cerebellar.headCerebellarLearningSequences,facial.headCtFacialLearningSequences];
const ordered=groups.flat();
const dependencies={
  react:React,'react/jsx-runtime':require('react/jsx-runtime'),
  './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
  '../lib/head-image-only-links.ts':concepts,
  '../lib/head-cerebellar-learning.ts':cerebellar,
  '../lib/head-atlas-learning':learning,
  '../lib/head-link-availability.ts':availability,
  '../lib/head-mri-learning':mri,
  '../lib/head-insula-learning':insula,
  '../lib/head-orbital-learning':orbital,
  '../lib/head-ct-bone-learning':bone,
  '../lib/head-ct-facial-learning.ts':facial,
};
function harness({missing=null,current=true}={}){
  const state=[],refs=[];let hook=0;
  const reactMock={...React,useState(initial){const slot=hook++;if(!(slot in state))state[slot]=initial;return [state[slot],value=>{state[slot]=value;}];},
    useRef(initial){const slot=hook++;if(!refs[slot])refs[slot]={current:initial};return refs[slot];}};
  const imports={...dependencies,react:reactMock,
    '../lib/head-atlas-learning':{...learning,headLearningLinks:position=>position.sequenceId===missing?null:learning.headLearningLinks(position)},
    '../lib/head-link-availability.ts':{...availability,headLinksCurrent:()=>current}};
  const mod={exports:{}};
  new Function('require','module','exports',code)((id)=>{if(!(id in imports))throw new Error(`Unexpected dependency ${id}`);return imports[id];},mod,mod.exports);
  function render(){hook=0;const tree=mod.exports.HeadAtlasLearningLibrary({compact:true});return {tree,html:renderToStaticMarkup(tree)};}
  function find(node,type,predicate=()=>true){if(Array.isArray(node)){for(const child of node){const found=find(child,type,predicate);if(found)return found;}return null;}
    if(!React.isValidElement(node))return null;if(node.type===type&&predicate(node.props))return node;return find(node.props.children,type,predicate);}
  function next(){const {tree}=render();const button=find(tree,'button',props=>props['aria-label']?.startsWith('Next linked tours'));assert(button&&!button.props.disabled);button.props.onClick({currentTarget:{disabled:false}});}
  function select(value){const {tree}=render();const control=find(tree,'select');assert(control);control.props.onChange({target:{value}});}
  return {render,next,select};
}
function starts(html){return [...html.matchAll(/<nav aria-label="Start ([^"]+)">([\s\S]*?)<\/nav>/g)].map(([,label,body])=>({label,hrefs:hrefs(body)}));}
function hrefs(html){return [...html.matchAll(/<a href="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'));}
function selectedHrefs(links,view){return [
  ...((view==='all'||view==='3D')&&links?.atlasHref?[links.atlasHref]:[]),
  ...((view==='all'||view==='CT')&&links?.ctHref?[links.ctHref]:[]),
  ...((view==='all'||view==='MRI')&&links?.mriHref?[links.mriHref]:[]),
];}

test('real thirteen tour starts and every ordered step retain exact mappings over 6/6/1 pages',()=>{
  assert.deepEqual(groups.map(group=>group.length),[5,2,1,1,2,1,1]);
  assert.equal(ordered.length,13);
  const view=harness(),seen=[];
  for(const [page,size] of [6,6,1].entries()){
    const html=view.render().html,rows=starts(html);assert.equal(rows.length,size);
    assert.match(html,new RegExp(`Showing linked tours ${page*6+1}–${page*6+size} of 13`));
    for(const row of rows){const sequence=ordered[seen.length];assert.equal(row.label,sequence.label);
      assert.deepEqual(row.hrefs,selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]}),'all'));
      const start=html.indexOf(`<strong>${sequence.label}</strong>`),end=html.indexOf('</details></li>',start);
      assert(start>=0&&end>start);
      const tourHtml=html.slice(start,end);
      const stepHrefs=hrefs(tourHtml.slice(tourHtml.indexOf('<details class="head-linked-step-preview"')));
      const expected=sequence.concepts.flatMap(conceptId=>selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId}),'all'));
      assert.deepEqual(stepHrefs,expected,sequence.id);
      seen.push(sequence.id);
    }
    if(page<2)view.next();
  }
  assert.deepEqual(seen,ordered.map(sequence=>sequence.id));assert.equal(new Set(seen).size,13);
});

test('real modality filters page only mapped tours with exact starts',()=>{
  for(const [viewName,count,pageSizes] of [['3D',12,[6,6]],['CT',11,[6,5]],['MRI',10,[6,4]]]){
    const view=harness();view.select(viewName);
    const expected=ordered.filter(sequence=>selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]}),viewName).length);
    assert.equal(expected.length,count);
    let index=0;
    for(const size of pageSizes){const html=view.render().html,rows=starts(html);assert.equal(rows.length,size);
      for(const row of rows){const sequence=expected[index++];assert.equal(row.label,sequence.label);
        assert.deepEqual(row.hrefs,selectedHrefs(learning.headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]}),viewName));}
      if(index<count)view.next();
    }
    assert.equal(index,count);
  }
});

test('missing real first-step mapping and stale revision expose no substitute links',()=>{
  const first=ordered[0];const missing=harness({missing:first.id}).render().html;
  assert.equal(starts(missing).length,6);assert.doesNotMatch(missing,new RegExp(`Start ${first.label}`));
  assert.match(missing,/Showing linked tours 1–6 of 12/);
  const stale=harness({current:false}).render().html;
  assert.match(stale,/temporarily unavailable/);assert.doesNotMatch(stale,/<a href=|<nav|<details/);
});

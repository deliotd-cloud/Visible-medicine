import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {headStudyComparisons} from '../lib/head-study-comparison.ts';
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasStudySet.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{} as {HeadAtlasStudySet:(props:any)=>React.ReactNode}};
new Function('require','module','exports',compiled)((id:string)=>id==='react'?{...React,useEffect:()=>{},useState:(initial:unknown)=>[typeof initial==='function'?initial():initial,()=>{}]}:id.startsWith('../lib/')?require(id+'.ts'):require(id),mod,mod.exports);
function fixture(){
 const entry:HeadEntry={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'bst',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{file:'synthetic.bin',sha256:'a'.repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}};
 const study={definition:{entries:[entry]}} as LoadedStudy;
 const comparisons=headStudyComparisons({study,revision:HEAD_MANIFEST_SHA256,entries:[entry]},study,HEAD_MANIFEST_SHA256,'CT');
 return {entry,comparisons};
}
function render(entries:HeadEntry[],comparisons?:ReturnType<typeof headStudyComparisons>){
 let calls=0;
 const html=renderToStaticMarkup(mod.exports.HeadAtlasStudySet({entries,comparisons,onSelect:()=>calls++,onRemove:()=>calls++,onClear:()=>calls++,onPractice:()=>calls++}));
 assert.equal(calls,0,'rendering comparison links must not change study, selection or practice');return html;
}
test('study-set links stay inside collapsed set and open exact mappings separately without sharing data',()=>{
 const {entry,comparisons}=fixture(),html=render([entry],comparisons);
 assert.match(html,/<details class="head-study-set">/);
 assert.match(html,/aria-label="Compare Pons in another view"/);
 assert.match(html,/Compare Pons in 3D Atlas \(new tab\)/);
 assert.match(html,/Compare Pons in MRI \(new tab\)/);
 assert.doesNotMatch(html,/Compare Pons in CT/);
 const anchors=[...html.matchAll(/<a ([^>]+)>/g)];assert.equal(anchors.length,2);
 for(const [index,anchor] of anchors.entries()){
  assert.match(anchor[1],/target="_blank"/);assert.match(anchor[1],/rel="noopener noreferrer"/);
  const href=anchor[1].match(/href="([^"]+)"/)![1].replaceAll('&amp;','&');
  assert.equal(href,comparisons[0].links[index].href);
  assert.doesNotMatch(href,/synthetic|scan|answer|score|user|token|slice|voxel/);
 }
 assert.match(html,/different, unregistered subjects/);assert.match(html,/does not transfer the set, scores, scans or annotations/);
 assert.match(html,/configured local preview opens automatically; otherwise choose the approved folder/);assert.match(html,/unlock separate access/);
 assert.match(html,/Practise study set \(1\)/);
});
test('unmapped and foreign comparison rows cannot borrow another entry mapping',()=>{
 const {entry,comparisons}=fixture();
 for(const rows of [[],[{entry,links:[]}],comparisons.map(row=>({...row,entry:{...entry}}))]){
  const html=render([entry],rows);assert.doesNotMatch(html,/<a /);assert.match(html,/No exact comparison mapped/);
 }
 assert.doesNotMatch(render([entry]),/No exact comparison mapped|<a /,'legacy callers remain compatible');
 assert.doesNotMatch(render([],comparisons),/<a |Compare Pons|Practise study set/,'empty set cannot leak old links');
});
test('viewer uses current exact shortlist and keeps comparison controls outside scored practice',()=>{
 const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
 assert.match(viewer,/comparisons=\{headStudyComparisons\(studySet,study,HEAD_MANIFEST_SHA256,modality\)\}/);
 assert.match(viewer,/const sidebar=quizActive\?<div className="head-atlas-sidebar head-index-paused"/);
 assert.doesNotMatch(source,/fetch\(|localStorage|sessionStorage|postMessage|window\.open/);
});

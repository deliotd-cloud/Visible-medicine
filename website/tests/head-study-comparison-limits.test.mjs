import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {headStudyComparisons} from '../lib/head-study-comparison.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasStudySet.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};
new Function('require','module','exports',compiled)((id)=>id==='react'?{...React,useEffect:()=>{},useState:initial=>[typeof initial==='function'?initial():initial,()=>{}]}:id.startsWith('../lib/')?require(id+'.ts'):require(id),module,module.exports);

function fixture(){
 const entry={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'bst',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{file:'synthetic.bin',sha256:'a'.repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}};
 const study={definition:{entries:[entry]}};
 const comparisons=headStudyComparisons({study,revision:HEAD_MANIFEST_SHA256,entries:[entry]},study,HEAD_MANIFEST_SHA256,'CT');
 assert.equal(comparisons.length,1);assert(comparisons[0].scopeNote);
 return {entry,comparisons};
}
function render(entries,comparisons){
 const calls=[];
 const props={entries,comparisons,onSelect:()=>calls.push('select'),onRemove:()=>calls.push('remove'),onClear:()=>calls.push('clear'),onPractice:()=>calls.push('practice')};
 const tree=module.exports.HeadAtlasStudySet(props);
 const html=renderToStaticMarkup(tree);
 assert.deepEqual(calls,[],'render must not invoke study-set callbacks');
 return {tree,html,calls};
}
function elements(value,type){
 if(Array.isArray(value))return value.flatMap(item=>elements(item,type));
 if(!value||typeof value!=='object'||!('type' in value))return [];
 return [...(value.type===type?[value]:[]),...elements(value.props?.children,type)];
}
function limits(tree){return elements(tree,'details').filter(item=>item.props.className==='head-study-comparison-limits');}
function escapeText(value){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');}

test('exact source-bound scope appears in a collapsed, named per-entry disclosure with mapped destinations unchanged',()=>{
 const {entry,comparisons}=fixture(),{tree,html}=render([entry],comparisons);
 const disclosures=limits(tree);assert.equal(disclosures.length,1);assert.equal(disclosures[0].props.open,undefined);
 const summary=elements(disclosures[0],'summary')[0];assert.equal(summary.props['aria-label'],'Comparison limits for Pons');
 assert.match(html,/<details class="head-study-comparison-limits"[^>]*><summary aria-label="Comparison limits for Pons"[^>]*>Comparison limits<\/summary>/);
 assert.equal(elements(disclosures[0],'p')[0].props.children,comparisons[0].scopeNote);
 const anchors=[...html.matchAll(/<a ([^>]+)>/g)];assert.equal(anchors.length,comparisons[0].links.length);
 for(const [index,match] of anchors.entries()){
  assert.match(match[1],/target="_blank"/);assert.match(match[1],/rel="noopener noreferrer"/);
  assert.equal(match[1].match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'),comparisons[0].links[index].href);
  assert.match(match[1],/aria-label="Compare Pons in /);
 }
});

test('scope is exact-identity only, optional, and independent of mapped link count',()=>{
 const {entry,comparisons}=fixture(),scope=comparisons[0].scopeNote;
 for(const rows of [undefined,[],[{entry:{...entry},links:comparisons[0].links,scopeNote:scope}],[{entry,links:[],scopeNote:''}],[{entry,links:[],scopeNote:'   '}],[{entry,links:[]}]] ){
  const {tree,html}=render([entry],rows);assert.equal(limits(tree).length,0);assert.doesNotMatch(html,/Comparison limits/);
 }
 const {tree,html}=render([entry],[{entry,links:[],scopeNote:scope}]);
 assert.equal(limits(tree).length,1);assert.match(html,/No exact comparison mapped/);assert.equal(elements(limits(tree)[0],'p')[0].props.children,scope);
 assert.doesNotMatch(html,/<a /);
});

test('React escapes scope text and Escape closes only its inner disclosure',()=>{
 const {entry}=fixture(),scope='Known <source> & "limit"';
 const {tree,html}=render([entry],[{entry,links:[],scopeNote:scope}]);
 assert(html.includes(`${escapeText(scope)}</p>`));assert.doesNotMatch(html,/>Known <source>/);
 const disclosure=limits(tree)[0],handler=disclosure.props.onKeyDown;
 let focused=0,prevented=0,stopped=0;
 const summary={isConnected:true,focus:()=>{focused++;}};
 const inner={open:true,isConnected:true,querySelector:(selector)=>selector===':scope > summary'?summary:null};
 const event=(key,currentTarget)=>({key,defaultPrevented:false,currentTarget,target:{closest:()=>currentTarget},preventDefault:()=>{prevented++;},stopPropagation:()=>{stopped++;}});
 handler(event('Escape',inner));
 assert.equal(inner.open,false);assert.deepEqual([focused,prevented,stopped],[1,1,1]);
 handler(event('Escape',inner));handler(event('Enter',{open:true,querySelector:()=>summary}));
 assert.deepEqual([focused,prevented,stopped],[1,1,1]);
});

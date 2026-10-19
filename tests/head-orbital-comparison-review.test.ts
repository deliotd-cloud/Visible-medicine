import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as orbital from '../lib/head-orbital-comparison-review.ts';
import * as teaching from '../lib/head-orbital-teaching.ts';
import * as sequence from '../lib/head-orbital-learning.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
const require=createRequire(import.meta.url),source=readFileSync(new URL('../components/HeadOrbitalComparisonReview.tsx',import.meta.url),'utf8');
const panelSource=readFileSync(new URL('../components/HeadPairedDecisionPanel.tsx',import.meta.url),'utf8');
const panelModule={exports:{} as {HeadPairedDecisionPanel:React.ComponentType<any>}};
new Function('require','module','exports',ts.transpileModule(panelSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText)((name:string)=>name==='../lib/head-paired-decision-contract'||name==='./HeadPairedDecisionForm'?{}:require(name),panelModule,panelModule.exports);
const Panel=panelModule.exports.HeadPairedDecisionPanel;
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{} as {HeadOrbitalComparisonReview:React.ComponentType<any>}};
const imports:Record<string,unknown>={'./HeadPairedDecisionPanel':{HeadPairedDecisionPanel:Panel},'../lib/head-orbital-comparison-review':orbital,'../lib/head-orbital-teaching':teaching,'../lib/head-orbital-learning':sequence,'../lib/head-atlas-learning':learning,'./HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},'./HeadReviewImageLink':headReviewImageLinkModule};
new Function('require','module','exports',compiled)((name:string)=>imports[name]??require(name),mod,mod.exports);
test('authorized evidence renders exact ordered globe steps only for its own verified revision',()=>{
 const render=(revision:string|null,packet:unknown=orbital.headOrbitalComparisonPacket())=>renderToStaticMarkup(React.createElement(mod.exports.HeadOrbitalComparisonReview,{packet,learningRevision:revision}));
 const html=render(sequence.HEAD_ORBITAL_LEARNING_REVISION);
 assert(html.includes('Globe guided sequence · separate draft'));
 assert(html.includes(sequence.HEAD_ORBITAL_LEARNING_REVISION));
 assert(html.includes('No saved approval or completion'));
 for(const conceptId of sequence.headOrbitalLearningSequences[0].concepts){
   const links=learning.headLearningLinks({sequenceId:'globes',conceptId});assert(links);
   for(const href of [links.atlasHref,links.ctHref,links.mriHref])assert(href&&html.includes(href.replaceAll('&','&amp;')));
 }
 for(const revision of [null,'stale',teaching.HEAD_ORBITAL_TEACHING_REVISION,orbital.HEAD_ORBITAL_COMPARISON_REVISION]){
   const hidden=render(revision);assert(!hidden.includes('Inspect 3D step'));assert(hidden.includes('Globe guided sequence is unavailable'));
 }
 assert(!render(sequence.HEAD_ORBITAL_LEARNING_REVISION,null).includes('Inspect 3D step'));
});

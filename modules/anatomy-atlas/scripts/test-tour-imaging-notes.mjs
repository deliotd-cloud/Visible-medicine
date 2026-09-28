/* oxlint-disable react-hooks/rules-of-hooks -- actual component event harness */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
let selected='ct',active=false,opened=0;
const shim={...React,useState(initial){return active?[selected,value=>{selected=value;}]:React.useState(initial);}};
const built=await build({stdin:{contents:"export * from './app/tour-imaging-notes'; export {ShoulderTourPlayer} from './app/shoulder-tour-player'; export {shoulderTour} from './lib/shoulder-tours'; export {structures} from './app/anatomy-data'; export {bodyLesson} from './app/body-content'; export {thoraxTour,regionalTourStructures} from './lib/regional-tours'; export {bodyReviewMaterial} from './lib/body-review-material'; import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'}});
const mod={exports:{}};runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,crypto,TextEncoder,URLSearchParams,require:id=>id==='react'?shim:require(id)});
const api=mod.exports,plain=v=>JSON.parse(JSON.stringify(v));
const tourBundle=await build({stdin:{contents:"export {regionalTours} from './lib/regional-tours';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});
const tourModule={exports:{}};runInNewContext(tourBundle.outputFiles[0].text,{module:tourModule,exports:tourModule.exports,require});
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
const text=t=>t==null?'':typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):text(t.props?.children);
const lessons=api.tourImagingModalities.map(({id,label})=>({id,label,content:{title:label+' draft',body:id+' teaching',bullets:['Context'],note:'Source limits',citations:['https://example.org/reference','javascript:alert(1)']}}));
const props={structureName:'Example structure',lessons,onOpen:()=>opened++};
let tree;
function render(next=props){active=true;tree=api.TourImagingNotes(next);active=false;return tree;}
render();assert.equal(tree.type,'details');assert.equal(tree.props.open,undefined,'Starts collapsed');
tree.props.onToggle({currentTarget:{open:false}});assert.equal(opened,0);
tree.props.onToggle({currentTarget:{open:true}});assert.equal(opened,1);
for(const {id,label} of api.tourImagingModalities){
 nodes(tree).find(n=>n.props?.onClick&&text(n)===label).props.onClick();render();
 assert.equal(selected,id);assert.ok(text(tree).includes(id+' teaching'));
 assert.equal(nodes(tree).filter(n=>n.props?.['aria-pressed']===true).length,1);
 assert.ok(nodes(tree).filter(n=>n.type==='a').every(n=>n.props.href.startsWith('https://')));
}
render({...props,lessons:[]});assert.match(text(tree),/not yet available/);
render({...props,lessons:[{id:selected,label:'Pending',content:{title:'Pending source',body:'Not supplied',readiness:'pending'}}]});assert.match(text(tree),/Teaching incomplete/);
const html=require('react-dom/server').renderToStaticMarkup(React.createElement(api.TourImagingNotes,props));
assert.match(html,/No scan loaded or spatial alignment/);assert.match(html,/paid lectures require their own access/);
assert.doesNotMatch(html,/javascript:|<img|<iframe|<canvas|<details[^>]*open/);
assert.match(html,/aria-pressed="true"/);
// Bind all displayed lessons to the exact source selection and existing review topics.
let count=0;
for(const tour of tourModule.exports.regionalTours) for(const step of tour.steps){
 const structure=api.regionalTourStructures(api.catalog,tour).find(s=>s.id===step.selectedId);
 const packet=await api.bodyReviewMaterial(structure.id);
 for(const {id} of api.tourImagingModalities){
  const lesson=api.bodyLesson(structure,id),topic=packet.topics.find(t=>t.tab===id);
  for(const key of ['title','body','bullets','note','citations','readiness'])assert.deepEqual(plain(lesson[key]??null),plain(topic[key]??null),structure.name+': '+id+' '+key);
  count++;
 }
}
for(const [index,step] of api.shoulderTour.steps.entries()){
 const p=api.ShoulderTourPlayer({index,playing:false,ready:true,onStart(){},onPlayPause(){},onStep(){},onExit(){},onReadImaging:props.onOpen});
 const notes=nodes(p).find(n=>n.type===api.TourImagingNotes);assert.ok(notes);assert.equal(notes.key,step.id);
 const structure=api.structures.find(s=>s.id===step.selectedId);assert.equal(notes.props.structureName,structure.name);
 for(const l of notes.props.lessons){assert.deepEqual(plain(l.content),plain(structure.sections[l.id]));count++;}
 notes.props.onOpen();
}
assert.equal(opened,6);assert.equal(count,348);
console.log(JSON.stringify({passed:true,sourceBoundModalityLessons:count,openPauseCallback:true,missingAndPending:true,safeReferences:true,noPatientImages:true}));

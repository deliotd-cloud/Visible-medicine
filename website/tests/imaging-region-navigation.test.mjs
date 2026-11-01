import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
// Optional baseline root permits the identical tests to run against preserved source.
const root=process.env.IMAGING_REGION_SOURCE_ROOT||process.cwd();
const invalid=['hand','', 'HEAD-NECK','head-neck ', '__proto__','constructor','../abdomen',['abdomen'],['head-neck','head-neck'],['thorax','abdomen']];
function fixture(react=React,loadStudy=()=>{throw Error('unexpected local load');}){
 const cache=new Map();
 const navigation={notFound(){throw Object.assign(new Error('not found'),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});},redirect(href){throw Object.assign(new Error('redirect'),{digest:'NEXT_REDIRECT',href});}};
 const Shell=({children,actions,sidebar,info,title,regionId})=>React.createElement('section',{'data-region':regionId},React.createElement('h1',null,title),actions,sidebar,children,info);
 function load(relative){
  const file=path.resolve(root,relative);
  if(cache.has(file))return cache.get(file);
  const output=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{}};cache.set(file,module.exports);
  function mocked(name){
   if(name==='react')return react;
   if(name==='next/navigation')return navigation;
   if(name==='next/link')return ({href,children})=>React.createElement('a',{href},children);
   if(name.endsWith('/ImagingAtlasShell')||name==='./ImagingAtlasShell')return {ImagingAtlasShell:Shell};
   if(name.endsWith('/ultrasound-local-files'))return {loadUltrasoundStudy:loadStudy};
   if(name.endsWith('.css'))return {};
   if(name.startsWith('.')){
    const target=path.resolve(path.dirname(file),name);
    if(name.endsWith('.json'))return require(target);
    for(const ext of ['.tsx','.ts']){try{return load(path.relative(root,target+ext));}catch(error){if(error.code!=='ENOENT')throw error;}}
   }
   return require(name);
  }
  new Function('require','module','exports',output)(mocked,module,module.exports);cache.set(file,module.exports);return module.exports;
 }
 return {load,navigation};
}
const app=fixture(),api=app.load('lib/atlas-navigation.ts');
for(const [modality,defaultRegion] of [['ct','head-neck'],['mri','head-neck'],['ultrasound','abdomen'],['x-ray','thorax']]){
 test(`${modality}: only absent region defaults; all explicit invalid values are refused`,()=>{
  assert.equal(api.selectedImagingRegion(modality)?.id,defaultRegion);
  for(const region of api.atlasRegionLinks(modality))assert.equal(api.selectedImagingRegion(modality,region.id)?.id,region.id);
  for(const region of invalid)assert.equal(api.selectedImagingRegion(modality,region),null,JSON.stringify(region));
 });
 test(`${modality}: actual server route refuses invalid values before redirect or rendering`,async()=>{
  const Page=app.load(`app/atlas/${modality}/page.tsx`).default;
  for(const region of invalid)await assert.rejects(()=>Page({searchParams:Promise.resolve({region})}),error=>error.digest==='NEXT_HTTP_ERROR_FALLBACK;404',JSON.stringify(region));
  for(const region of [undefined,...api.atlasRegionLinks(modality).map(item=>item.id)]){
   const id=region??defaultRegion;
   if((modality==='ct'||modality==='mri')&&id==='head-neck'){
    await assert.rejects(()=>Page({searchParams:Promise.resolve({region})}),error=>error.digest==='NEXT_REDIRECT'&&error.href===`/atlas/${modality}-head`);
   }else{
    const element=await Page({searchParams:Promise.resolve({region})});
    const html=renderToStaticMarkup(element);
    assert.ok(html.includes(`data-region="${id}"`));
    assert.ok(!html.includes('<img'),'no substitute scan appears');
   }
  }
 });
}
test('actual pending component rejects direct invalid selections and retains planned-region links',()=>{
 const Page=app.load('components/ImagingAtlasPage.tsx').ImagingAtlasPage;
 for(const modality of ['ct','mri','ultrasound','x-ray']){
  for(const region of invalid)assert.throws(()=>renderToStaticMarkup(React.createElement(Page,{modality,region})),error=>error.digest==='NEXT_HTTP_ERROR_FALLBACK;404');
  for(const region of api.atlasRegionLinks(modality)){
   const html=renderToStaticMarkup(React.createElement(Page,{modality,region:region.id}));
   const destination=api.atlas3dReturnRegionForImaging(region.id);
   assert.ok(html.includes(`href="${destination.href}"`));
   assert.ok(html.includes('independent access'));
  }
 }
});

function hooks(){
 const slots=[],effects=[];let cursor=0,signature=[],previousSignature;
 function slot(kind,init){const index=cursor++;signature.push(kind);return [index,slots[index]??(slots[index]=init())];}
 const react={...React,
  useState(init){const [index,value]=slot('state',()=>({value:typeof init==='function'?init():init}));return [value.value,next=>{slots[index].value=typeof next==='function'?next(slots[index].value):next;}];},
  useRef(init){return slot('ref',()=>({current:init}))[1];},
  useId(){return slot('id',()=>({value:'test-image'}))[1].value;},
  useMemo(fn,deps){const [,value]=slot('memo',()=>({}));if(!value.deps||deps.some((d,i)=>!Object.is(d,value.deps[i]))){value.value=fn();value.deps=deps;}return value.value;},
  useEffect(fn,deps){const [,value]=slot('effect',()=>({}));if(!value.deps||deps.some((d,i)=>!Object.is(d,value.deps[i]))){effects.push(()=>{value.cleanup?.();value.cleanup=fn();});value.deps=deps;}},
 };
 return {react,render(Page,region){cursor=0;signature=[];const result=Page({region});if(previousSignature)assert.deepEqual(signature,previousSignature,'hook ordering survives valid/invalid changes');previousSignature=signature;return result;},flush(){while(effects.length)effects.shift()();},cleanup(){for(const slot of slots)slot.cleanup?.();}};
}
function find(node,predicate){if(!node||typeof node!=='object')return; if(predicate(node))return node;for(const value of Object.values(node.props??{}))for(const child of Array.isArray(value)?value:[value]){const found=find(child,predicate);if(found)return found;}}
function study(){let disposed=0;return {study:{region:'abdomen',title:'Synthetic grid',frames:[],source:{author:'QA',license:'CC0',attribution:'Synthetic'}} ,dispose(){disposed++;},get disposed(){return disposed;}};}
test('actual ultrasound component renders no invalid region and preserves hook ordering',()=>{
 const h=hooks(),Page=fixture(h.react).load('components/UltrasoundLocalAtlas.tsx').UltrasoundLocalAtlas;
 for(const region of [undefined,...invalid,'thorax',undefined]){
  const tree=h.render(Page,region);
  if(invalid.includes(region))assert.equal(tree,null);else assert.ok(renderToStaticMarkup(tree).includes(`data-region="${region??'abdomen'}"`));
  h.flush();
 }
 h.cleanup();
});
test('ultrasound invalidation disposes active data, aborts pending work and refuses late data',async()=>{
 const h=hooks(),requests=[];
 const Page=fixture(h.react,(_,options)=>new Promise(resolve=>requests.push({resolve,options}))).load('components/UltrasoundLocalAtlas.tsx').UltrasoundLocalAtlas;
 const render=region=>h.render(Page,region);
 async function pick(tree){const input=find(tree,n=>n.type==='input'&&n.props.type==='file');assert(input);return input.props.onChange({target:{files:[{}],value:'synthetic'},currentTarget:{files:[{}],value:'synthetic'}});}
 let tree=render('abdomen');h.flush();
 await pick(tree);assert.equal(requests.length,1);const prior=study();requests[0].resolve(prior);await Promise.resolve();await Promise.resolve();
 tree=render('abdomen');h.flush();await pick(tree);assert.equal(requests.length,2);
 assert.equal(render('hand'),null);h.flush();assert.equal(prior.disposed,1);assert.equal(requests[1].options.signal.aborted,true);
 await pick(tree);assert.equal(requests.length,2,'a retired file-picker callback cannot start loading for a former region');
 await pick(tree);assert.equal(requests.length,2,'an obsolete valid input cannot start loading after invalidation');
 const late=study();requests[1].resolve(late);await Promise.resolve();await Promise.resolve();assert.equal(late.disposed,1);
 assert.equal(render(''),null);h.flush();tree=render('abdomen');h.flush();assert.ok(!renderToStaticMarkup(tree).includes('Synthetic grid'));
 // Invalid renders expose no folder input.
 assert.equal(find(render(['abdomen','abdomen']),n=>n.type==='input'),undefined);h.flush();assert.equal(requests.length,2);
 tree=render('abdomen');h.flush();h.cleanup();
 await pick(tree);assert.equal(requests.length,2,'a file-picker callback cannot start after unmount');
});

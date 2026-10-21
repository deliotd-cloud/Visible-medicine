import assert from 'node:assert/strict';import test from 'node:test';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {build} from 'esbuild';
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let initialStates=[];
const shim={...React,useState(value){initialStates.push(typeof value==='function'?value():value);return React.useState(value);}};
const built=await build({stdin:{contents:`export {default as shoulder} from './atlas-review/app/review/page';
export {default as body} from './atlas-review/app/review/body/page';
export {default as specimens} from './atlas-review/app/review/specimens/page';
export {ReviewDashboard} from './atlas-review/app/review/review-dashboard';
export {BodyDecisionEditor} from './atlas-review/app/review/body/body-decision-editor';
export {SpecimenReviewWorkspace} from './atlas-review/app/review/specimens/workspace';
export {reviewEntryTrack} from './atlas-review/lib/review-entry-track';
export {nestedReviewNavigationTrack} from './atlas-review/lib/nested-review-queue';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'@':process.cwd()},loader:{'.css':'empty'}});
const scope={exports:{}};runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,console,structuredClone,require:id=>id==='react'?shim:id==='next/link'?({children,...props})=>React.createElement('a',props,children):id==='next/image'?({unoptimized:_omit,...props})=>React.createElement('img',props):require(id)});
const api=scope.exports;
const target=(name,element)=>name==='specimens'?element.props.children[1].props.children[2]:element;

test('generated review pages receive Teaching without changing their selected source structure',async()=>{
 for(const name of ['shoulder','body','specimens']){
  const plain=target(name,await api[name]({searchParams:Promise.resolve({})}));
  const query=name==='shoulder'?{structure:plain.props.initialId}:name==='body'?{structure:plain.props.rows[0].id}:{};
  const geometry=target(name,await api[name]({searchParams:Promise.resolve(query)}));
  const teaching=target(name,await api[name]({searchParams:Promise.resolve({...query,t:'teaching'})}));
  assert.equal(geometry.type,teaching.type);assert.equal(geometry.props.initialTrack,'geometry');assert.equal(teaching.props.initialTrack,'teaching');
  const {initialTrack:_geometry,...before}=geometry.props,{initialTrack:_teaching,...after}=teaching.props;assert.deepEqual(after,before,'Only initial tab differs: '+name);
 }
});

test('missing, unknown, hostile and duplicate track values keep the existing Anatomy default',async()=>{
 for(const value of [undefined,null,'geometry','imaging','approved','../teaching','teaching&approved=1',['teaching'],['teaching','geometry'],{},42]){
  assert.equal(api.reviewEntryTrack(value),'geometry');assert.equal(api.nestedReviewNavigationTrack(value),'geometry');
  for(const name of ['shoulder','body','specimens'])assert.equal(target(name,await api[name]({searchParams:Promise.resolve({t:value})})).props.initialTrack,'geometry');
 }
 assert.equal(api.reviewEntryTrack('teaching'),'teaching');assert.equal(api.nestedReviewNavigationTrack('teaching'),'teaching');
});

test('actual imported component initial states use the entry preference, with no saved decision or browser API call',async()=>{
 const shoulder=target('shoulder',await api.shoulder({searchParams:Promise.resolve({})}));
 for(const track of ['geometry','teaching'])for(const [Component,props,index]of[
  [api.ReviewDashboard,{initialId:shoulder.props.initialId},1],
  [api.BodyDecisionEditor,{id:'synthetic',materialHash:'synthetic',onDirty(){}},2],
  [api.SpecimenReviewWorkspace,{rows:[{key:'synthetic',surfaces:[]}],packet:null,invalid:false},3],
 ]){initialStates=[];renderToStaticMarkup(React.createElement(Component,{...props,initialTrack:track}));assert.equal(initialStates[index],track);}
});

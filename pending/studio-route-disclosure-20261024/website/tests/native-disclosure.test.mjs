import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
import {restoreNativeDisclosureConsumer} from './native-disclosure-source.mjs';
import {restoreStudioRouteDisclosure,studioRouteComponentSha256,restoreAtlasRegionGuardDisclosure,atlasRegionGuardSha256} from './studio-route-disclosure-source.mjs';

const require=createRequire(import.meta.url),source=readFileSync(new URL('../components/NativeDisclosure.tsx',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
new Function('require','module','exports',output)(name=>name==='../lib/head-disclosure-keyboard'?{headDisclosureKeyDown}:require(name),module,module.exports);
const {NativeDisclosure}=module.exports;
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const actions=[],summary={isConnected:true,focus:options=>actions.push(['focus',options])};
 const details={isConnected:true,open:true,querySelector:()=>summary};
 const event={key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false,keyCode:27},currentTarget:details,target:{closest:()=>details},preventDefault(){this.defaultPrevented=true;actions.push('prevent');},stopPropagation(){actions.push('stop');}};
 return{actions,summary,details,event};
}

test('actual component renders the same native DOM and retains every child and attribute',()=>{
 const child=React.createElement(React.Fragment,null,React.createElement('summary',null,'Options'),React.createElement('form',{action:'/synthetic'},React.createElement('input',{name:'draft',defaultValue:'unsaved text'})));
 for(const open of [undefined,false,true]){
  const props={id:'options',className:'existing-style','aria-label':'Workspace options',open,children:child};
  const real=NativeDisclosure(props);assert.equal(real.type,'details');assert.equal(real.props.children,child);
  assert.equal(renderToStaticMarkup(React.createElement(NativeDisclosure,props)),renderToStaticMarkup(React.createElement('details',props)));
 }
 assert.doesNotMatch(source,/useEffect|useState|addEventListener|sessionStorage|localStorage|fetch\(|router\.|onClick|onSubmit/);
});

test('Escape closes only the live disclosure, returns focus and calls no form or navigation action',()=>{
 const f=fixture(),child=React.createElement('input',{defaultValue:'kept'}),node=NativeDisclosure({children:child});
 node.props.onKeyDown(f.event);assert.equal(f.details.open,false);assert.deepEqual(f.actions,['prevent','stop',['focus',{preventScroll:true}]]);assert.equal(node.props.children,child);
 node.props.onKeyDown(f.event);assert.equal(f.actions.length,3);
});

test('caller handling, composition, other keys and detached or nested targets remain inert',()=>{
 for(const alter of [f=>{f.event.key='Enter';},f=>{f.event.defaultPrevented=true;},f=>{f.event.nativeEvent.isComposing=true;},f=>{f.details.isConnected=false;},f=>{f.event.target.closest=()=>({open:true});}]){
  const f=fixture();alter(f);NativeDisclosure({}).props.onKeyDown(f.event);assert.equal(f.details.open,true);assert.deepEqual(f.actions,[]);
 }
 const f=fixture();let called=0;NativeDisclosure({onKeyDown:event=>{called++;event.preventDefault();}}).props.onKeyDown(f.event);assert.equal(called,1);assert.equal(f.details.open,true);assert.deepEqual(f.actions,['prevent']);
});

test('nested Escape is consumed once and never collapses an outer disclosure',()=>{
 const inner=fixture(),outer=fixture(),event=inner.event;NativeDisclosure({}).props.onKeyDown(event);event.currentTarget=outer.details;NativeDisclosure({}).props.onKeyDown(event);assert.equal(inner.details.open,false);assert.equal(outer.details.open,true);assert.deepEqual(outer.actions,[]);
});

test('complete Workspace, Studio and Atlas consumers retain their original source, routes, role checks and labels',()=>{
 const stage='F:/VisibleMedicine/staging/20261023-native-workspace-disclosures',transitions=JSON.parse(readFileSync(stage+'/TRANSITIONS.json')),prep=JSON.parse(readFileSync(stage+'/PREPARATION.json')),tests=JSON.parse(readFileSync(stage+'/TEST_TRANSITIONS.json'));
 for(const r of [...transitions.rows,...tests.rows]){
  let bytes=readFileSync(new URL('../'+r.path,import.meta.url));if(r.path==='components/StudioNavigation.tsx'&&sha(bytes)===studioRouteComponentSha256)bytes=restoreStudioRouteDisclosure(bytes);if(r.path==='components/AtlasWorkspaceNavigation.tsx'&&sha(bytes)===atlasRegionGuardSha256)bytes=restoreAtlasRegionGuardDisclosure(bytes);assert.equal(bytes.toString(),r.after);let inverse=r.after;
  for(const [a,b,n=1]of r.edits.toReversed()){assert.equal(inverse.split(b).length-1,n);inverse=inverse.split(b).join(a);}
  const old=[...prep.preimages,...tests.preimages].find(p=>p.path===r.path);assert(old);assert.equal(sha(readFileSync(old.file)),old.sha256);assert.deepEqual(Buffer.from(inverse),readFileSync(old.file));
 }
 assert.equal(transitions.rows.length+tests.rows.length,10);
});

test('foreign bytes, changed authorization and unknown consumer names cannot use the source inverse',()=>{
 for(const path of ['components/StudioNavigation.tsx','components/AtlasWorkspaceNavigation.tsx','app/workspace/page.tsx']){
  const bytes=readFileSync(new URL('../'+path,import.meta.url));assert(Buffer.isBuffer(restoreNativeDisclosureConsumer(path,bytes)));
  assert.throws(()=>restoreNativeDisclosureConsumer(path,Buffer.concat([bytes,Buffer.from('// foreign')])));
  const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>restoreNativeDisclosureConsumer(path,changed));
 }
 const page=readFileSync(new URL('../app/workspace/page.tsx',import.meta.url),'utf8');assert.throws(()=>restoreNativeDisclosureConsumer('app/workspace/page.tsx',page.replace('if (administrator) {','if (true) {')));
 assert.throws(()=>restoreNativeDisclosureConsumer('app/unknown.tsx','foreign'));
});

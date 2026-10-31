import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const website=process.env.VM_HEAD_TEST_ROOT||fileURLToPath(new URL('..',import.meta.url));
const source=(relative)=>readFileSync(path.join(website,relative),'utf8');
const compile=(text,jsx=false)=>ts.transpileModule(text,{compilerOptions:{jsx:jsx?ts.JsxEmit.ReactJSX:undefined,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const keyboardModule={exports:{}};
new Function('require','module','exports',compile(source('lib/head-disclosure-keyboard.ts')))((id)=>assert.fail(`Unexpected keyboard dependency: ${id}`),keyboardModule,keyboardModule.exports);
const {headDisclosureKeyDown}=keyboardModule.exports;
const jsx=(type,props,key)=>({type,props,key});
const hooks={useRef:(current)=>({current}),useState:(value)=>[value,()=>{}],useEffect:()=>{},useLayoutEffect:()=>{}};
const destination={conceptId:'brainstem-pons',label:'Pons',atlasHref:'/atlas/head-neck-3d?concept=brainstem-pons',src:'/atlas-runtime/head-neck/index.html?region=head-neck&presentation=compare',sourceRevision:'a'.repeat(40),headRevision:'b'.repeat(64),scope:'test-source-study',target:{kind:'root',id:'pons',source:'c'.repeat(64),laterality:'midline'}};
const imports={
  react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},
  '../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL:'selection',parseHeadSelection:()=>null},
  '../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL:'focus',headFocusResult:()=>null},
  '../lib/head-inline-comparison.ts':{headInlineDestination:()=>destination,headInlineMatches:()=>false,headInlineReverseConcept:()=>null},
  '../lib/head-disclosure-keyboard.ts':{headDisclosureKeyDown},
};
const componentModule={exports:{}};
const componentSource=readFileSync(process.env.VM_HEAD_COMPONENT_FILE||new URL('../components/HeadAtlasInlineComparison.tsx',import.meta.url),'utf8');
new Function('require','module','exports',compile(componentSource,true))((id)=>Object.hasOwn(imports,id)?imports[id]:assert.fail(`Unexpected component dependency: ${id}`),componentModule,componentModule.exports);
const {HeadAtlasInlineComparison}=componentModule.exports;
const outer=HeadAtlasInlineComparison({conceptId:destination.conceptId,revision:destination.headRevision,modality:'CT',onSelectConcept:()=>{},onClose:()=>{}});
const tree=outer.type(outer.props);
function walk(value,predicate){
  if(Array.isArray(value))return value.map(item=>walk(item,predicate)).find(Boolean);
  if(!value||typeof value!=='object'||!('props' in value))return null;
  return predicate(value)?value:walk(value.props.children,predicate);
}
const limits=walk(tree,node=>node.type==='details'&&node.props.className==='head-inline-limits');
const frame=walk(tree,node=>node.type==='iframe');
const summary=walk(limits,node=>node.type==='summary');
function fixture(overrides={}){
  const calls=[];
  const summaryNode={isConnected:true,focus:options=>calls.push(['focus',options])};
  const details={isConnected:true,open:true,querySelector:selector=>{assert.equal(selector,':scope > summary');return summaryNode;}};
  const event={key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false,keyCode:27},currentTarget:details,
    target:{closest:selector=>{assert.equal(selector,'details');return details;}},
    preventDefault(){this.defaultPrevented=true;calls.push(['prevent']);},stopPropagation(){calls.push(['stop']);},...overrides};
  return {details,summaryNode,event,calls};
}

test('inline limits retain semantic reference, model frame, and the real shared keyboard handler',()=>{
  assert.equal(tree.type,'section');
  assert.equal(tree.props['aria-label'],'3D Atlas comparison');
  assert(limits&&summary&&frame);
  assert.equal(limits.props.onKeyDown,headDisclosureKeyDown);
  assert.equal(summary.props.children,'Anatomical comparison · not spatial alignment');
  assert.match(walk(limits,node=>node.type==='p').props.children,/separate, unregistered subjects/);
  assert.equal(frame.props.src,destination.src);
  assert.equal(frame.props.title,'3D Atlas model comparison for Pons');
  assert.equal(frame.props.referrerPolicy,'same-origin');
  assert.equal(frame.props.allowFullScreen,true);
  assert.match(walk(tree,node=>node.props.role==='status').props.children,/Loading 3D model/);
});

test('Escape closes only the focused inline limits and restores summary focus',()=>{
  const f=fixture();
  limits.props.onKeyDown(f.event);
  assert.equal(f.details.open,false);
  assert.deepEqual(f.calls,[['prevent'],['stop'],['focus',{preventScroll:true}]]);
  limits.props.onKeyDown(f.event);
  assert.equal(f.calls.length,3,'handled repeat does not move focus again');
  const nested=fixture(),parent=fixture();
  nested.event.target.closest=()=>nested.details;
  parent.event.target=nested.event.target;
  limits.props.onKeyDown(nested.event);
  limits.props.onKeyDown({...parent.event,currentTarget:parent.details,target:nested.event.target});
  assert.equal(nested.details.open,false);
  assert.equal(parent.details.open,true);
  assert.deepEqual(parent.calls,[]);
});

test('non-Escape, IME, handled, detached, and non-live targets are inert',()=>{
  for(const mutate of [
    f=>{f.event.key='Enter';},f=>{f.event.nativeEvent.isComposing=true;},
    f=>{f.event.nativeEvent.keyCode=229;},f=>{f.event.defaultPrevented=true;},
    f=>{f.details.isConnected=false;},f=>{f.summaryNode.isConnected=false;},
    f=>{f.details.open=false;},f=>{f.event.target=null;},
    f=>{f.event.target={closest:()=>({isConnected:true,open:true})};},
  ]){
    const f=fixture();mutate(f);const before=f.details.open;
    limits.props.onKeyDown(f.event);
    assert.equal(f.details.open,before);
    assert.deepEqual(f.calls,[]);
  }
});

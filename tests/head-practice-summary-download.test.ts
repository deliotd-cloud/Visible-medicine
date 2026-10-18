import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

type Node={type:string;props:{children?:unknown;onClick?:()=>void;role?:string}};
function harness(){
  const source=readFileSync(new URL('../components/HeadPracticeSummaryDownload.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  let cursor=0,fail=false,calls=0,received:unknown;
  const state:unknown[]=[],props={marker:'current session'};
  const jsx=(type:string,props:Node['props'])=>({type,props});
  const module={exports:{} as {HeadPracticeSummaryDownload:(props:unknown)=>Node}};
  new Function('require','module','exports',compiled)((id:string)=>{
    if(id==='react')return {useState(initial:unknown){const slot=cursor++;if(!(slot in state))state[slot]=initial;return [state[slot],(next:unknown)=>{state[slot]=next;}];}};
    if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
    if(id==='../lib/head-practice-summary')return {
      createHeadPracticeSummary(input:unknown){received=input;return {safe:true};},
      downloadHeadPracticeSummary(input:unknown){assert.deepEqual(input,{safe:true});calls++;if(fail)throw Error('PRIVATE SOURCE PATH');},
    };
    throw Error(`Unexpected import ${id}`);
  },module,module.exports);
  function render(){cursor=0;return module.exports.HeadPracticeSummaryDownload(props);}
  function nodes(value:unknown):Node[]{
    if(Array.isArray(value))return value.flatMap(nodes);
    if(!value||typeof value!=='object'||!('props' in value))return [];
    const node=value as Node;return [node,...nodes(node.props.children)];
  }
  return {render,nodes,props,get calls(){return calls;},get received(){return received;},setFail(value:boolean){fail=value;},click(){nodes(render()).find(n=>n.type==='button')!.props.onClick!();}};
}

test('private summary is collapsed and only downloads after an explicit click',()=>{
  const h=harness(),tree=h.render();assert.equal(tree.type,'details');assert.equal(h.calls,0);
  assert(!Object.hasOwn(tree.props,'open'));
  h.click();assert.equal(h.calls,1);assert.equal(h.received,h.props);
  const message=h.nodes(h.render()).find(n=>n.props.role==='status');
  assert.match(String(message?.props.children),/Download requested/);
  assert.match(String(message?.props.children),/does not save results to your account/);
});

test('download failure is recoverable and does not expose the exception or claim a successful save',()=>{
  const h=harness();h.setFail(true);h.click();
  const tree=h.render();assert.equal(h.calls,1);
  assert.match(String(h.nodes(tree).find(n=>n.props.role==='alert')?.props.children),/results remain here/);
  assert(!JSON.stringify(tree).includes('PRIVATE SOURCE PATH'));
  h.setFail(false);h.click();assert.equal(h.calls,2);
  assert(h.nodes(h.render()).some(n=>n.props.role==='status'));
  assert(!h.nodes(h.render()).some(n=>n.props.role==='alert'));
});

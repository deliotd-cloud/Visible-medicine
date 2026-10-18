import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {PAIRED_DECISION_CONCEPTS,IMAGE_ONLY_DECISION_CONCEPTS,pairedDecisionContext,type PairedDecisionContext} from '../lib/head-paired-decision-contract.ts';

const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync(new URL('../components/HeadPairedDecisionPanel.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>;key?:string};
type Check={revision:string;concept:string;resolve:(context:PairedDecisionContext)=>void;reject:(error:Error)=>void};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'&&'props'in value?[value,...nodes(value.props.children)]:[];
function harness(concept:string){
  const slots:any[]=[],checks:Check[]=[],cleanups:Array<()=>void>=[];
  let cursor=0,alive=true,initial=true;
  const hooks={
    useState(initialValue:any){const index=cursor++;if(!(index in slots))slots[index]=initialValue;return [slots[index],(next:any)=>{assert(alive,'no update after unmount');slots[index]=next;}];},
    useRef(initialValue:any){const index=cursor++;if(!(index in slots))slots[index]={current:initialValue};return slots[index];},
    useEffect(create:()=>void|(()=>void)){if(initial){const cleanup=create();if(cleanup)cleanups.push(cleanup);}},
  };
  const form=()=>null,jsx=(type:unknown,props:Record<string,any>,key?:string)=>({type,props,key});
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},
    '../lib/head-paired-decision-contract':{pairedDecisionContext:(revision:string,concept:string)=>new Promise((resolve,reject)=>checks.push({revision,concept,resolve,reject}))},
    './HeadPairedDecisionForm':{HeadPairedDecisionForm:form}};
  const mod={exports:{} as {HeadPairedDecisionPanel:(props:{manifestRevision:string;conceptId:string;label:string})=>Node}};
  new Function('require','module','exports',code)((id:string)=>imports[id]??require(id),mod,mod.exports);
  function render(){cursor=0;const tree=mod.exports.HeadPairedDecisionPanel({manifestRevision:HEAD_LINK_REVISION,conceptId:concept,label:'Synthetic structure label'});initial=false;return tree;}
  function button(){const node=nodes(render()).find(n=>n.type==='button');assert(node);return node;}
  return {render,button,checks,form,open(){button().props.onClick();},async settle(){for(let i=0;i<8;i++)await Promise.resolve();},dispose(){for(const cleanup of cleanups)cleanup();alive=false;}};
}

test('each supported comparison checks its exact identity only on explicit open and coalesces repeated clicks',async()=>{
  for(const concept of [...PAIRED_DECISION_CONCEPTS,...IMAGE_ONLY_DECISION_CONCEPTS]){
    const h=harness(concept);try{
      assert.equal(h.button().props.children,'Review Synthetic structure label comparison');
      assert.equal(h.checks.length,0,'closed panels must not resolve context or mount a history form');
      h.open();h.open();assert.equal(h.checks.length,1);assert.equal(h.button().props.disabled,true);
      assert.equal(h.checks[0].revision,HEAD_LINK_REVISION);assert.equal(h.checks[0].concept,concept);
      const context=await pairedDecisionContext(HEAD_LINK_REVISION,concept);
      h.checks[0].resolve(context);await h.settle();const tree=h.render();
      assert.equal(tree.type,h.form);assert.deepEqual(tree.props.context,context);assert.equal(tree.key,JSON.stringify(context));
      assert.equal(tree.props.context.patientRegistration,false);assert.equal(tree.props.context.clinicalApproval,false);
      assert.equal(tree.props.context.publicationApproval,false);
    }finally{h.dispose();}
  }
});

test('failed source verification renders an alert and no decision form or automatic retry',async()=>{
  const h=harness('orbit-left-globe');try{
    h.open();h.checks[0].reject(Error('Synthetic stale source'));await h.settle();
    assert.equal(h.button().props.disabled,true);assert.equal(h.checks.length,1);
    const alerts=nodes(h.render()).filter(n=>n.props.role==='alert');assert.equal(alerts.length,1);
    assert.match(alerts[0].props.children,/source changed.*no substitute was used/);
    assert.notEqual(h.render().type,h.form);
  }finally{h.dispose();}
});

test('late verification success or failure does not update an unmounted panel',async()=>{
  for(const outcome of ['resolve','reject']){
    const h=harness('orbit-left-globe');h.open();h.dispose();
    if(outcome==='resolve')h.checks[0].resolve(await pairedDecisionContext(HEAD_LINK_REVISION,'orbit-left-globe'));
    else h.checks[0].reject(Error('Synthetic late failure'));
    await h.settle();assert.equal(h.checks.length,1);
  }
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
// Execute the actual JSX callback, not a second implementation of the handler.
const path='app/whole-body-guided-learning.tsx',source=readFileSync(path,'utf8');
const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(node){
 if(ts.isJsxOpeningElement(node)&&node.tagName.getText(ast)==='details'){
  const attrs=node.attributes.properties,cls=attrs.find(p=>p.name?.getText(ast)==='className');
  if(cls?.initializer?.text==='whole-body-tour-discovery'){
   assert.equal(callback,undefined,'Only the real tour-discovery disclosure is handled');
   const attr=attrs.find(p=>p.name?.getText(ast)==='onKeyDown');
   assert(attr&&ts.isJsxExpression(attr.initializer));callback=attr.initializer.expression.getText(ast);
  }
 }
 ts.forEachChild(node,visit);
}
visit(ast);assert(callback,'Missing tour finder keyboard recovery');
const handler=runInNewContext(ts.transpileModule('('+callback+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText);
function fixture(overrides={},withSummary=true){
 const calls=[];
 const details={open:true,isConnected:true,querySelector(selector){assert.equal(selector,'summary');return withSummary?{focus(options){assert.equal(details.open,false,'Close before focus handoff');assert.equal(options.preventScroll,true);assert.deepEqual(Object.keys(options),['preventScroll']);calls.push('focus');}}:null;}};
 const event={key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false},currentTarget:details,preventDefault(){calls.push('prevent');},stopPropagation(){calls.push('stop');},...overrides};
 return {event,details,calls};
}
test('Escape closes only the live open finder and focuses its summary without scrolling',()=>{
 const f=fixture();handler(f.event);assert.equal(f.details.open,false);assert.deepEqual(f.calls,['prevent','stop','focus']);
 handler(f.event);assert.deepEqual(f.calls,['prevent','stop','focus'],'A repeated Escape does not refocus or consume another key');
});
for(const key of ['Enter','Tab','ArrowDown'])test(key+' retains normal native control behavior',()=>{const f=fixture({key});handler(f.event);assert.equal(f.details.open,true);assert.deepEqual(f.calls,[]);});
test('an inner consumed Escape is not stolen',()=>{const f=fixture({defaultPrevented:true});handler(f.event);assert.equal(f.details.open,true);assert.deepEqual(f.calls,[]);});
test('input-method composition is not interrupted',()=>{const f=fixture({nativeEvent:{isComposing:true}});handler(f.event);assert.equal(f.details.open,true);assert.deepEqual(f.calls,[]);});
test('closed and detached disclosures cannot consume keys or steal focus',()=>{
 for(const change of [d=>d.open=false,d=>d.isConnected=false]){const f=fixture();change(f.details);const prior=f.details.open;handler(f.event);assert.equal(f.details.open,prior);assert.deepEqual(f.calls,[]);}
});
test('a missing summary cannot throw or focus an unrelated document control',()=>{const f=fixture({},false);handler(f.event);assert.equal(f.details.open,false);assert.deepEqual(f.calls,['prevent','stop']);});

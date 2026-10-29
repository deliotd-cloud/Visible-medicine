import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {registerReviewHistoryNavigation} from '../atlas-review/lib/review-history-navigation.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
test('current Review imports and binds the actual committed unsaved-history safeguard',()=>{
 const pin=validateCurrentAtlasDelivery();
 const root=currentAtlasDeliveryRoot(),manifest=JSON.parse(read('atlas-review/manifest.json')),inputs=JSON.parse(read('atlas-review/integration-inputs.json'));assert.equal(manifest.revision,pin.source);assert.equal(inputs.sourceCommit,pin.source);
 for(const p of ['lib/review-history-navigation.ts','app/review/review-dashboard.tsx']){
  const committed=execFileSync('git',['show',pin.source+':'+p],{cwd:root,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),row=manifest.files.find(r=>r.path===p);assert(row);assert.equal(row.sourceSha256,sha(committed));
  const imported=read('atlas-review/'+p);assert.equal(row.importedSha256,sha(imported));assert.equal(inputs.inputs.find(r=>r.path==='atlas-review/'+p)?.sha256,sha(imported));
  if(p.endsWith('review-history-navigation.ts'))assert.deepEqual(imported,committed,'the source-local guard is not rewritten or substituted');
 }
 const dashboard=read('atlas-review/app/review/review-dashboard.tsx').toString();assert.match(dashboard, /from '@\/atlas-review\/lib\/review-history-navigation'/);
 const ast=ts.createSourceFile('dashboard.tsx',dashboard,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),layouts=[];
 const visit=node=>{if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='useLayoutEffect')layouts.push(node);ts.forEachChild(node,visit);};visit(ast);assert.equal(layouts.length,1);assert.equal(layouts[0].arguments[1].getText(ast),'[hasUnsaved]');
 let handler,blocked=0,dirty=true;const view={location:{href:'https://review.example.test/workspace/atlas-review/shoulder?structure=synthetic'},navigation:{addEventListener(type,fn){assert.equal(type,'navigate');handler=fn;},removeEventListener(type,fn){assert.equal(type,'navigate');assert.equal(handler,fn);handler=null;}}};
 const cleanup=registerReviewHistoryNavigation(view,()=>dirty,()=>blocked++),event=()=>{const e=new Event('navigate',{cancelable:true});Object.defineProperties(e,{navigationType:{value:'traverse'},destination:{value:{sameDocument:true,url:'https://review.example.test/workspace/atlas-review'}}});return e;};
 const first=event();handler(first);assert.equal(first.defaultPrevented,true);assert.equal(blocked,1);
 for(const [label,modify] of [
  ['same URL hash only',e=>Object.defineProperty(e.destination,'url',{value:view.location.href+'#other'})],
  ['cross origin',e=>Object.defineProperty(e.destination,'url',{value:'https://other.example.test/workspace/atlas-review'})],
  ['full document',e=>Object.defineProperty(e.destination,'sameDocument',{value:false})],
  ['uncancelable',e=>{ /* constructed separately below */ }],
 ]){
  const candidate=label==='uncancelable'?new Event('navigate',{cancelable:false}):event();
  if(label==='uncancelable')Object.defineProperties(candidate,{navigationType:{value:'traverse'},destination:{value:{sameDocument:true,url:'https://review.example.test/workspace/atlas-review'}}});
  else modify(candidate);
  handler(candidate);assert.equal(candidate.defaultPrevented,false,label);assert.equal(blocked,1,label);
 }
 dirty=false;const clean=event();handler(clean);assert.equal(clean.defaultPrevented,false);
 const stale=handler;cleanup();cleanup();assert.equal(handler,null,'cleanup is idempotent');dirty=true;const retired=event();stale(retired);assert.equal(retired.defaultPrevented,false);assert.equal(blocked,1);
 for(const unsupported of [{location:view.location},{location:view.location,navigation:{addEventListener(){throw Error('unsupported API called');}}}]){
  const retire=registerReviewHistoryNavigation(unsupported,()=>true,()=>{throw Error('unsupported API blocked');});
  retire();retire();
 }
});

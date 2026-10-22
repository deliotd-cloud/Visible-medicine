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
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 const old=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-review-traversal-20261022.json'));assert.equal(old.source,'ea70b126efc1b9a4e9c9b576587f922650145e53');assert.notEqual(pin.reviewIntegration,old.reviewIntegration);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const root=currentAtlasDeliveryRoot(),manifest=JSON.parse(read('atlas-review/manifest.json')),inputs=JSON.parse(read('atlas-review/integration-inputs.json'));assert.equal(manifest.files.length,1562);assert.equal(inputs.inputs.length,1729);
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
 const first=event();handler(first);assert.equal(first.defaultPrevented,true);assert.equal(blocked,1);dirty=false;const clean=event();handler(clean);assert.equal(clean.defaultPrevented,false);
 const stale=handler;cleanup();dirty=true;const retired=event();stale(retired);assert.equal(retired.defaultPrevented,false);assert.equal(blocked,1);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../components/UltrasoundLocalAtlas.tsx',import.meta.url),'utf8'),tree=ts.createSourceFile('UltrasoundLocalAtlas.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),component=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='UltrasoundLocalAtlas');assert(component);
function fixture(){
 const drag={current:null},suppressPointerClick={current:false},pan=[],capture=new Set(),doc=new EventTarget(),win=new EventTarget();doc.hidden=false;doc.visibilityState='visible';doc.defaultView=win;
 const element={ownerDocument:doc,getBoundingClientRect:()=>({width:500,height:300}),setPointerCapture:id=>capture.add(id),hasPointerCapture:id=>capture.has(id),releasePointerCapture:id=>capture.delete(id)},svg={current:element},valid={current:true};
 const selected=['pointerDown','pointerMove','pointerEnd','pointerLost','endDrag'],functions=component.body.statements.filter(n=>ts.isFunctionDeclaration(n)&&selected.includes(n.name?.text)).map(n=>n.getText(tree)).join('\n');
 const effect=component.body.statements.find(n=>ts.isExpressionStatement(n)&&ts.isCallExpression(n.expression)&&n.expression.expression.getText(tree)==='useEffect'&&n.getText(tree).includes("addEventListener('blur'"));
 const install=effect?effect.expression.arguments[0].getText(tree):'()=>()=>{}';const output=ts.transpileModule(functions+'\nconst install='+install+';',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const handlers=new Function('drag','suppressPointerClick','validInteraction','zoom','imageWindow','width','height','capturedEpoch','centerOn','svg',output+';return{pointerDown,pointerMove,pointerEnd,pointerLost,endDrag,install};')(drag,suppressPointerClick,()=>valid.current,4,{x:.375,y:.375,width:.25,height:.25},1000,600,7,p=>pan.push(p),svg);
 const event=overrides=>({type:'pointerup',pointerId:1,button:0,buttons:1,isPrimary:true,currentTarget:element,clientX:10,clientY:10,preventDefault(){},...overrides});
 return{handlers,drag,suppressPointerClick,pan,capture,doc,win,element,valid,event};
}
test('a move without the primary button cannot continue a captured pan',()=>{
 const f=fixture();f.handlers.pointerDown(f.event());assert(f.drag.current);f.handlers.pointerMove(f.event({clientX:110,buttons:0}));assert.equal(f.pan.length,0);assert.equal(f.drag.current,null);assert.equal(f.capture.size,0);
});
test('window blur and pagehide retire capture and suppress a late click',()=>{
 for(const type of ['blur','pagehide']){const f=fixture(),cleanup=f.handlers.install();f.handlers.pointerDown(f.event());f.win.dispatchEvent(new Event(type));assert.equal(f.drag.current,null);assert.equal(f.capture.size,0);assert.equal(f.suppressPointerClick.current,true);f.handlers.pointerMove(f.event({clientX:150}));assert.equal(f.pan.length,0);cleanup();}
});
test('hidden documents cancel an existing drag and cannot start another',()=>{
 const f=fixture(),cleanup=f.handlers.install();f.handlers.pointerDown(f.event());f.doc.hidden=true;f.doc.visibilityState='hidden';f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.drag.current,null);assert.equal(f.capture.size,0);f.handlers.pointerDown(f.event());assert.equal(f.drag.current,null);cleanup();
});
test('ordinary image clicks remain usable while completed drags do not submit clicks',()=>{
 const f=fixture();f.handlers.pointerDown(f.event());f.handlers.pointerEnd(f.event());assert.equal(f.suppressPointerClick.current,false);f.handlers.pointerDown(f.event());f.handlers.pointerMove(f.event({clientX:100}));assert.equal(f.pan.length,1);f.handlers.pointerEnd(f.event());assert.equal(f.capture.size,0);assert.equal(f.suppressPointerClick.current,true);
});
test('secondary input cannot claim or replace the current primary drag',()=>{
 const f=fixture();for(const event of [{buttons:0},{buttons:2},{isPrimary:false}]){f.handlers.pointerDown(f.event(event));assert.equal(f.drag.current,null);}f.handlers.pointerDown(f.event());const start=f.drag.current;f.handlers.pointerDown(f.event({pointerId:2}));assert.equal(f.drag.current,start);assert.deepEqual([...f.capture],[1]);
});
test('obsolete callbacks do not move or cancel a newer source scope',()=>{
 const f=fixture(),cleanup=f.handlers.install();f.handlers.pointerDown(f.event());f.drag.current.epoch=8;const newer=f.drag.current;f.handlers.pointerMove(f.event({clientX:100,buttons:0}));f.handlers.pointerEnd(f.event());f.win.dispatchEvent(new Event('blur'));assert.equal(f.drag.current,newer);assert.equal(f.pan.length,0);cleanup();assert.equal(f.drag.current,newer);
});
test('pointer cancellation or lost capture retires the interaction',()=>{
 for(const lost of [false,true]){const f=fixture();f.handlers.pointerDown(f.event());if(lost){f.capture.clear();f.handlers.pointerLost(f.event());}else f.handlers.pointerEnd(f.event({type:'pointercancel'}));assert.equal(f.drag.current,null);assert.equal(f.capture.size,0);assert.equal(f.suppressPointerClick.current,true);}
});
test('cleanup removes window listeners as well as retiring its drag',()=>{
 const f=fixture(),cleanup=f.handlers.install();f.handlers.pointerDown(f.event());cleanup();assert.equal(f.drag.current,null);assert.equal(f.capture.size,0);f.handlers.pointerDown(f.event());const next=f.drag.current;f.win.dispatchEvent(new Event('blur'));assert.equal(f.drag.current,next);
});

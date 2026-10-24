import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import ts from 'typescript';
const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const prior=(p:string)=>readFileSync(new URL('./fixtures/head-pan-before/'+p+'.raw',import.meta.url),'utf8');
const sha=(s:string)=>createHash('sha256').update(s).digest('hex'),normal=(s:string)=>s.replaceAll('\r\n','\n');
// NATIVE_SLICE_ADAPTER_BEGIN: unwind only the four new test-harness seams before the historical pointer inverse.
const undoAdapter=(text:string,after:string,before:string)=>{
 assert.equal(text.split(after).length,2,'unique layout adapter seam');return text.replace(after,before);
};
const unwindKeyboard=(text:string)=>{
 text=undoAdapter(text,'  let currentCursor=[...cursor] as Vec3,hookIndex=0,layoutIndex=0,tree:Node,canvas:Node;','  let currentCursor=[...cursor] as Vec3,hookIndex=0,tree:Node,canvas:Node;');
 text=undoAdapter(text,'  const layoutEffects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),pendingLayout:Array<()=>void>=[];\n  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));\n','');
 text=undoAdapter(text,'    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const index=layoutIndex++,old=layoutEffects.get(index);if(!same(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();layoutEffects.set(index,{deps,cleanup:typeof cleanup===\'function\'?cleanup:undefined});});},\n','');
 text=undoAdapter(text,'    hookIndex=0;layoutIndex=0;pendingLayout.length=0;','    hookIndex=0;');
 return undoAdapter(text,'    for(const effect of pendingLayout)effect();\n','');
};
const unwindZoom=(text:string)=>{
 text=undoAdapter(text,'    const pendingLayout:Array<()=>void>=[],pending:Array<()=>void>=[];','    const pending:Array<()=>void>=[];');
 text=undoAdapter(text,'      useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const index=hook++,old=effects.get(index);if(!same(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup===\'function\'?cleanup:undefined});});},\n','');
 text=undoAdapter(text,'      hook=0;pendingLayout.length=0;pending.length=0;','      hook=0;pending.length=0;');
 return undoAdapter(text,'      for(const effect of pendingLayout)effect();\n      for(const effect of pending)effect();','      for(const effect of pending)effect();');
};
// NATIVE_SLICE_ADAPTER_END
test('original component and both complete legacy tests are immutable captured preimages',()=>{
 assert.equal(sha(prior('HeadAtlasViewer.tsx')),'97b93a4b7af313042a6a54e8f9983b42c3eb8beb8b30222e4ee2d5d9f4812d73');
 assert.equal(sha(prior('head-slice-keyboard.test.ts')),'b91b78e07bd2008101c2ce73bffd72b5544aeebf13bdb54fc56c596095acfd8c');
 assert.equal(sha(prior('head-slice-zoom.test.ts')),'000b5646f88041c82ed048469dc7c316adac2a134d4f9099fb8cdfe5125a4d76');
});
test('only NativeSlice changes; its whole-function inverse recovers the complete original component',()=>{
 const before=normal(prior('HeadAtlasViewer.tsx')),after=normal(read('components/HeadAtlasViewer.tsx'));
 const span=(text:string)=>{const file=ts.createSourceFile('viewer.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const matches=file.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='NativeSlice');assert.equal(matches.length,1);
  return {start:matches[0].getStart(file),end:matches[0].getEnd()};};
 const a=span(before),b=span(after);assert.equal(after.slice(0,b.start)+before.slice(a.start,a.end)+after.slice(b.end),before);
 assert.notEqual(after.slice(b.start,b.end),before.slice(a.start,a.end));
 const fullOld=prior('HeadAtlasViewer.tsx');assert.equal(normal(fullOld),before);
 // Exact raw preimage survives even when the text editor normalizes CRLF.
 assert.equal(sha(fullOld),'97b93a4b7af313042a6a54e8f9983b42c3eb8beb8b30222e4ee2d5d9f4812d73');
});
test('legacy assertions survive entire-file inverses; only three pointer factories gain real button bitmasks',()=>{
 const keyboard=unwindKeyboard(normal(read('tests/head-slice-keyboard.test.ts'))),zoom=unwindZoom(normal(read('tests/head-slice-zoom.test.ts')));
 const k1='({button,buttons:button===0?1:2,pointerId,clientX,clientY,currentTarget:element,preventDefault:()=>{}})';
 const k2='({button:0,buttons:1,pointerId:5,clientX,clientY,currentTarget:element,preventDefault:()=>{}})';
 const z='({button:0,buttons:1,pointerId:1,clientX:x,clientY:y,currentTarget:element,preventDefault:()=>{}})';
 for(const [text,needle]of [[keyboard,k1],[keyboard,k2],[zoom,z]])assert.equal(text.split(needle).length,2,'Unique complete event factory');
 assert.equal(keyboard.replace(k1,k1.replace('buttons:button===0?1:2,','')).replace(k2,k2.replace('buttons:1,','')),normal(prior('head-slice-keyboard.test.ts')));
 assert.equal(zoom.replace(z,z.replace('buttons:1,','')),normal(prior('head-slice-zoom.test.ts')));
});
test('the entire native raster/mask/label drawing effect and slice arithmetic are unchanged',()=>{
 const before=normal(prior('HeadAtlasViewer.tsx')),after=normal(read('components/HeadAtlasViewer.tsx'));
 const span=(s:string)=>{const start=s.indexOf('  useEffect(()=>{\n    const canvas=canvasRef.current,nativeCtx='),end=s.indexOf('  return <section ref={sectionRef}',start);assert(start>0&&end>start);return s.slice(start,end);};
 assert.equal(span(after),span(before));
});

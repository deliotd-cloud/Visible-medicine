import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {loadHeadEntry,type HeadEntry,type LoadedStudy,type LocalHeadPackage} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];

function fixture(maskBytes=new Uint8Array([1,0,0,0,0,0,0,0])){
  const shape=[2,2,2];
  const entry:HeadEntry={id:'test-mask',label:'Synthetic mask',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},
    mask:{file:'mask.bin',sha256:digest(maskBytes),dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine},
    mesh:{positions_file:'missing-positions.bin',indices_file:'missing-indices.bin',positions_dtype:'float32',indices_dtype:'uint32',point_count:3,triangle_count:1,positions_sha256:'a'.repeat(64),indices_sha256:'b'.repeat(64)}};
  const image={file:'image.bin',sha256:'c'.repeat(64),dtype:'uint8',shape_kji:shape,ijk_to_ras:affine};
  const study={definition:{image,entries:[entry]},data:new Uint8Array(8),geometry:createNativeVolumeGeometry(image),range:[0,1]} as LoadedStudy;
  const maskFile=new File([maskBytes as BlobPart],'mask.bin');
  const files=new Map<string,File>([['mask.bin',maskFile]]);
  const pkg={files} as LocalHeadPackage;
  return {entry,study,pkg,files};
}

function harness(initial:ReturnType<typeof fixture>){
  const slots:unknown[]=[],effects=new Map<number,{kind:'layout'|'passive';deps:unknown[];cleanup?:()=>void}>();
  const reads:Promise<unknown>[]=[];
  let index=0,dirty=true,pending:Array<()=>void>=[],pendingLayout:Array<()=>void>=[],pkg=initial.pkg,study:LoadedStudy|null=initial.study;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const hooks={
    useState(value:unknown){const i=index++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return [slots[i],(next:unknown)=>{const updated=typeof next==='function'?next(slots[i]):next;if(!Object.is(updated,slots[i])){slots[i]=updated;dirty=true;}}];},
    useRef(value:unknown){const i=index++;if(!(i in slots))slots[i]={current:value};return slots[i];},
    useMemo(make:()=>unknown,deps:unknown[]){const i=index++,prior=slots[i] as {deps:unknown[];value:unknown}|undefined;if(!equal(prior?.deps,deps))slots[i]={deps,value:make()};return (slots[i] as {value:unknown}).value;},
    useEffect(make:()=>void|(()=>void),deps:unknown[]){const i=index++,prior=effects.get(i);if(!equal(prior?.deps,deps))pending.push(()=>{prior?.cleanup?.();const cleanup=make();effects.set(i,{kind:'passive',deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(make:()=>void|(()=>void),deps:unknown[]){const i=index++,prior=effects.get(i);if(!equal(prior?.deps,deps))pendingLayout.push(()=>{prior?.cleanup?.();const cleanup=make();effects.set(i,{kind:'layout',deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const mod={exports:{} as Pick<typeof import('../components/HeadAtlasPractice'),'useHeadAtlasPractice'>};
  const trackedLoad:typeof loadHeadEntry=(...args)=>{const read=loadHeadEntry(...args);reads.push(read);return read;};
  const load=(name:string)=>name==='react'?hooks:name==='../lib/head-atlas-import'?{loadHeadEntry:trackedLoad}:name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:()=>null,HeadAtlasPracticeFeedback:()=>null}:name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:()=>null}:name.startsWith('../lib/')?require(name+'.ts'):require(name);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  let current:ReturnType<typeof mod.exports.useHeadAtlasPractice>;
  function flush(){let passes=0;do{assert(++passes<25,'effects settle');dirty=false;index=0;pending=[];pendingLayout=[];current=mod.exports.useHeadAtlasPractice(pkg,study);for(const effect of pendingLayout)effect();for(const effect of pending)effect();}while(dirty);return current!;}
  async function settle(){await Promise.allSettled(reads);await Promise.resolve();return flush();}
  return {flush,settle,get current(){return current!;},replace(next:ReturnType<typeof fixture>){pkg=next.pkg;study=next.study;return flush();},dispose(){for(const effect of effects.values())effect.cleanup?.();}};
}

test('practice opens and scores a verified mask without reading unavailable mesh buffers',async()=>{
  const f=fixture(),h=harness(f);
  try{
    h.flush();assert.equal(h.current.startTarget(f.entry),true);h.flush();await h.settle();
    assert.equal(h.current.error,'');assert.equal(h.current.target?.entry,f.entry);
    assert.deepEqual([...h.current.target!.mask!],[1,0,0,0,0,0,0,0]);
    assert.equal(h.current.target?.positions,undefined);
    h.current.acceptPick([0,0,0]);h.flush().submit();h.flush();
    assert.equal(h.current.outcome,'correct');
  }finally{h.dispose();}
});

test('practice rejects a bad mask hash despite mask-only loading',async()=>{
  const f=fixture();f.files.set('mask.bin',new File([new Uint8Array([0,1,0,0,0,0,0,0]) as BlobPart],'mask.bin'));
  const h=harness(f);
  try{
    h.flush();assert.equal(h.current.startTarget(f.entry),true);h.flush();await h.settle();
    assert.match(h.current.error,/checksum mismatch/i);assert.equal(h.current.target,null);
    h.current.acceptPick([0,0,0]);h.flush().submit();h.flush();
    assert.equal(h.current.outcome,null);
  }finally{h.dispose();}
});

test('retiring a question aborts its mask read and cannot surface a stale target',async()=>{
  const f=fixture(),h=harness(f);
  try{
    h.flush();assert.equal(h.current.startTarget(f.entry),true);h.flush();
    h.current.end();h.flush();await h.settle();
    assert.equal(h.current.active,false);assert.equal(h.current.target,null);assert.equal(h.current.error,'');
  }finally{h.dispose();}
});

test('practice still rejects a saved mask bound to a different native grid',async()=>{
  const f=fixture();f.entry.mask!.native_shape_kji=[3,2,2];
  const h=harness(f);
  try{
    h.flush();assert.equal(h.current.startTarget(f.entry),true);h.flush();await h.settle();
    assert.match(h.current.error,/geometry binding does not match/i);
    assert.equal(h.current.target,null);assert.equal(h.current.outcome,null);
  }finally{h.dispose();}
});

test('ordinary surface inspection still requires its mesh, unlike mask-only practice',async()=>{
  const f=fixture();
  await assert.rejects(loadHeadEntry(f.pkg,f.study,f.entry),/required asset is missing/);
  const loaded=await loadHeadEntry(f.pkg,f.study,f.entry,undefined,{maskOnly:true});
  assert.equal(loaded.entry,f.entry);assert(loaded.mask);assert(loaded.focus);
  assert.equal(loaded.positions,undefined);assert.equal(loaded.indices,undefined);
});

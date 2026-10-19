import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createHeadFolderSession,isHeadFolderSessionRoute} from '../lib/head-folder-session.ts';
import {HEAD_MANIFEST_SHA256,type LocalHeadPackage,type HeadStudy,type Modality} from '../lib/head-atlas-import.ts';

test('contrast is opt-in, package/study/revision-bound, copied and independently retained per modality',()=>{
 const revision=HEAD_MANIFEST_SHA256,session=createHeadFolderSession(revision);
 const ct={entries:[]} as unknown as HeadStudy,mri={entries:[]} as unknown as HeadStudy;
 const pkg={manifest:{studies:{CT:ct,MRI:mri}},files:new Map()} as LocalHeadPackage;
 const put=(value:[number,number])=>session.keepWindow(pkg,'CT',ct,revision,value);
 const read=()=>session.readWindow(pkg,'CT',ct,revision);
 assert.equal(put([500,2500]),false);assert.equal(read(),null);
 session.keep(pkg,revision);const value:[number,number]=[500,2500];assert(put(value));value[0]=0;
 assert.deepEqual(read(),[500,2500]);const copy=read()!;copy[1]=1;assert.deepEqual(read(),[500,2500]);
 assert.equal(session.readWindow(pkg,'MRI',mri,revision),null);
 assert(session.keepWindow(pkg,'MRI',mri,revision,[50,100]));session.keep(pkg,revision);
 assert.deepEqual(read(),[500,2500]);assert.deepEqual(session.readWindow(pkg,'MRI',mri,revision),[50,100]);
 for(const [p,mod,definition,rev] of [[{...pkg},'CT',ct,revision],[pkg,'CT',{...ct},revision],[pkg,'MRI',ct,revision],[pkg,'XR',ct,revision],[pkg,'CT',ct,'stale']] as const){
  assert.equal(session.readWindow(p,mod as Modality,definition,rev),null);
  assert.equal(session.keepWindow(p,mod as Modality,definition,rev,[1,2]),false);
 }
 for(const invalid of [[NaN,2],[0,Infinity],[0,0],[0,-1],[1],[1,2,3],null])assert.equal(put(invalid as [number,number]),false);
 assert.deepEqual(read(),[500,2500]);
 pkg.manifest.studies.CT={...ct};assert.equal(session.readWindow(pkg,'CT',pkg.manifest.studies.CT,revision),null);
 pkg.manifest.studies.CT=ct;
 session.keep({...pkg},revision);assert.equal(read(),null);
 session.keep(pkg,revision);assert.equal(read(),null);put([1,2]);session.keep(pkg,'stale');session.keep(pkg,revision);assert.equal(read(),null);
 put([1,2]);session.clear();session.keep(pkg,revision);assert.equal(read(),null);assert.equal(session.readWindow(pkg,'MRI',mri,revision),null);
});

test('isolated memory sessions fail closed on revisions and have no default retained package',()=>{
 const a=createHeadFolderSession(HEAD_MANIFEST_SHA256),b=createHeadFolderSession(HEAD_MANIFEST_SHA256),pkg={files:new Map()} as LocalHeadPackage;
 assert.equal(a.read(HEAD_MANIFEST_SHA256),null);a.keep(pkg,HEAD_MANIFEST_SHA256);
 assert.equal(a.read(HEAD_MANIFEST_SHA256),pkg);assert.equal(b.read(HEAD_MANIFEST_SHA256),null);
 assert.equal(a.read('stale'),null);a.keep(pkg,'stale');assert.equal(a.read(HEAD_MANIFEST_SHA256),null);
 a.keep(pkg,HEAD_MANIFEST_SHA256);a.clear();a.clear();assert.equal(a.read(HEAD_MANIFEST_SHA256),null);
 for(const path of ['/atlas/ct-head','/atlas/mri-head'])assert(isHeadFolderSessionRoute(path));
 for(const path of [null,'/atlas','/atlas/head-neck-3d','/workspace','/atlas/ct-head/','/atlas/ct-head?x=1','https://example.test/atlas/ct-head'])assert(!isHeadFolderSessionRoute(path));
});

test('actual provider retains across CT/MRI but clears on departure, pagehide and unmount',()=>{
 const source=readFileSync(new URL('../components/HeadFolderSessionProvider.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const require=createRequire(import.meta.url),refs:Array<{current:unknown}>=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),listeners=new Set<()=>void>();
 let path='/atlas/ct-head',cursor=0,pending:Array<()=>void>=[];
 const hooks={useRef(value:unknown){return refs[cursor++]??(refs[cursor-1]={current:value});},useEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!old||deps.some((v,j)=>v!==old.deps[j]))pending.push(()=>{old?.cleanup?.();const clean=create();effects.set(i,{deps,cleanup:typeof clean==='function'?clean:undefined});});}};
 const window={addEventListener(name:string,fn:()=>void){assert.equal(name,'pagehide');listeners.add(fn);},removeEventListener(name:string,fn:()=>void){assert.equal(name,'pagehide');listeners.delete(fn);}};
 const mod={exports:{} as {HeadFolderSessionProvider:(props:{children:string})=>{props:{value:ReturnType<typeof createHeadFolderSession>}}}};
 new Function('require','module','exports','window',code)((name:string)=>name==='react'?hooks:name==='next/navigation'?{usePathname:()=>path}:name==='../lib/head-folder-session'?{createHeadFolderSession,isHeadFolderSessionRoute}:name==='../lib/head-atlas-import'?{HEAD_MANIFEST_SHA256}:name==='./HeadFolderSessionContext'?{HeadFolderSessionContext:{Provider:'provider'}}:require(name),mod,mod.exports,window);
 const render=()=>{cursor=0;pending=[];const tree=mod.exports.HeadFolderSessionProvider({children:'synthetic'});pending.forEach(run=>run());return tree.props.value;};
 const session=render(),pkg={files:new Map()} as LocalHeadPackage;session.keep(pkg,HEAD_MANIFEST_SHA256);
 path='/atlas/mri-head';assert.equal(render(),session);assert.equal(session.read(HEAD_MANIFEST_SHA256),pkg);
 path='/atlas/head-neck-3d';render();assert.equal(session.read(HEAD_MANIFEST_SHA256),null);
 path='/atlas/ct-head';render();session.keep(pkg,HEAD_MANIFEST_SHA256);listeners.forEach(fn=>fn());assert.equal(session.read(HEAD_MANIFEST_SHA256),null);
 session.keep(pkg,HEAD_MANIFEST_SHA256);effects.forEach(effect=>effect.cleanup?.());assert.equal(session.read(HEAD_MANIFEST_SHA256),null);assert.equal(listeners.size,0);
 for(const file of ['components/HeadFolderSessionProvider.tsx','components/HeadFolderSessionContext.tsx','lib/head-folder-session.ts'])assert(!/localStorage|sessionStorage|indexedDB|fetch\(|postMessage|BroadcastChannel|arrayBuffer\(/.test(readFileSync(file,'utf8')),file);
 assert.match(readFileSync('app/atlas/layout.tsx','utf8'),/<HeadFolderSessionProvider>\{children\}<\/HeadFolderSessionProvider>/);
});

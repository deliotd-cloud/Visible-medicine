// Test-only immutable Atlas Git graph reader. No working-tree module is resolved.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname,extname,isAbsolute} from 'node:path';
import {createRequire} from 'node:module';

const inInstalledPackage=dir=>dir.replaceAll('\\','/').split('/').includes('node_modules');

export async function handHistoryApi(atlas,commit,entry){
  const root=process.cwd(),requireSite=createRequire(resolve(root,'package.json'));
  const {build}=requireSite('esbuild');
  const options={windowsHide:true,maxBuffer:256e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
  const git=(...args)=>execFileSync('git',['-C',atlas,...args],options);
  assert.match(commit,/^[a-f0-9]{40}$/);
  assert.equal(git('rev-parse',`${commit}^{commit}`).toString().trim(),commit);
  const paths=new Map(),cache=new Map();
  for(const row of git('ls-tree','-r','-z','--full-tree',commit).toString().split('\0')){
    const match=/^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);
    if(match)paths.set(match[3],match[2]);
  }
  const result=await build({stdin:{contents:entry,resolveDir:atlas,loader:'ts'},bundle:true,write:false,
    format:'esm',platform:'node',plugins:[{name:'immutable-atlas-hand-history',setup(api){
      api.onResolve({filter:/.*/},args=>{
        if(inInstalledPackage(args.resolveDir||''))return;
        let target;
        if(args.path.startsWith('@/'))target=resolve(atlas,args.path.slice(2));
        else if(args.path.startsWith('.')||isAbsolute(args.path))target=resolve(args.resolveDir||atlas,args.path);
        else return;
        const path=relative(atlas,target).replaceAll('\\','/');
        assert(path!=='..'&&!path.startsWith('../')&&!isAbsolute(path),'Historical import outside Atlas');
        for(const suffix of ['','.ts','.tsx','.json','.js','.mjs','/index.ts','/index.tsx'])
          if(paths.has(path+suffix))return {path:resolve(atlas,path+suffix),namespace:'immutable-atlas-hand-history'};
        throw Error('Missing historical Atlas module: '+path);
      });
      api.onLoad({filter:/.*/,namespace:'immutable-atlas-hand-history'},args=>{
        const path=relative(atlas,args.path).replaceAll('\\','/'),id=paths.get(path);assert(id,path);
        if(!cache.has(id))cache.set(id,git('cat-file','blob',id).toString());
        return {contents:cache.get(id),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
      });
    }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

// The imported Review graph comes only from the hash-checked recovered archive.
// Relative application imports cannot fall back to today's website working tree.
export async function handImportedArchiveApi(records,entry){
  const root=process.cwd(),requireSite=createRequire(resolve(root,'package.json'));
  const {build}=requireSite('esbuild');
  const paths=new Map([...records].filter(([path])=>path.startsWith('atlas-review/')));
  const result=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,
    format:'esm',platform:'node',plugins:[{name:'immutable-imported-hand-archive',setup(api){
      api.onResolve({filter:/.*/},args=>{
        if(inInstalledPackage(args.resolveDir||''))return;
        let target;
        if(args.path.startsWith('@/'))target=resolve(root,args.path.slice(2));
        else if(args.path.startsWith('.')||isAbsolute(args.path))target=resolve(args.resolveDir||root,args.path);
        else return;
        const path=relative(root,target).replaceAll('\\','/');
        assert(path.startsWith('atlas-review/'),'Historical imported application path outside Review archive');
        for(const suffix of ['','.ts','.tsx','.json','.js','.mjs','/index.ts','/index.tsx'])
          if(paths.has(path+suffix))return {path:resolve(root,path+suffix),namespace:'immutable-imported-hand-archive'};
        throw Error('Missing historical imported Review source: '+path);
      });
      api.onLoad({filter:/.*/,namespace:'immutable-imported-hand-archive'},args=>{
        const path=relative(root,args.path).replaceAll('\\','/'),bytes=paths.get(path);assert(bytes,path);
        return {contents:bytes.toString('utf8'),
          loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
      });
    }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

// Test-only immutable Atlas Git graph reader. No working-tree module is resolved.
import assert from 'node:assert/strict';
import {resolve,relative,dirname,extname,isAbsolute} from 'node:path';
import {createRequire} from 'node:module';
import {createGitObjectReader} from './git-object-reader.mjs';
import {openGitSnapshot} from './git-snapshot-reader.mjs';

const inInstalledPackage=dir=>dir.replaceAll('\\','/').split('/').includes('node_modules');

export async function handHistoryApi(atlas,commit,entry){
  const root=process.cwd(),requireSite=createRequire(resolve(root,'package.json'));
  const {build}=requireSite('esbuild');
  const snapshot=await openGitSnapshot({cwd:atlas,commit,createBlobReader:createGitObjectReader,
    maxMetadataBytes:64_000_000,maxObjectBytes:8_000_000,maxEntries:250_000,
    maxBlobBytes:32_000_000});
  try{
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
          if(path+suffix&&snapshot.oidFor(path+suffix))return {path:resolve(atlas,path+suffix),namespace:'immutable-atlas-hand-history'};
        throw Error('Missing historical Atlas module: '+path);
      });
      api.onLoad({filter:/.*/,namespace:'immutable-atlas-hand-history'},async args=>{
        const path=relative(atlas,args.path).replaceAll('\\','/');assert(snapshot.oidFor(path),path);
        return {contents:(await snapshot.read(path)).toString(),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
      });
    }}]});
   return await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  }finally{await snapshot.close();}
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

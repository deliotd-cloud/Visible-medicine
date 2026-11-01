import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import {facialAwareRequire,headFacialHookModule} from './head-facial-hook-loader.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url));

/** Render the production component and resolvers; only the asynchronous facial gate may be controlled. */
export function loadHeadComparisonTeaching(facialReady?:boolean){
  const source=readFileSync(new URL('../components/HeadAtlasTeaching.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as {HeadAtlasTeaching:React.ComponentType<any>}};
  new Function('require','module','exports',code)((id:string)=>{
    if(id==='./HeadAnatomyCheck')return headAnatomyCheckModule;
    if(id==='./useVerifiedFacialTeaching'){
      const hook=headFacialHookModule() as Record<string,unknown>;
      return facialReady===undefined?hook:{...hook,useVerifiedFacialTeaching:()=>facialReady};
    }
    return id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):require(id);
  },mod,mod.exports);
  return mod.exports.HeadAtlasTeaching;
}

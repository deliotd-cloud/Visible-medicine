import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as bookmarks from '../lib/head-learning-bookmark.ts';
const require=createRequire(import.meta.url);
const source=process.env.VM_BOOKMARK_ORIGINAL==='1'?'HeadLearningBookmark.original.tsx':'HeadLearningBookmark.tsx';
const code=ts.transpileModule(readFileSync(new URL('../components/'+source,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
export function loadHeadBookmark(hooks:any=React){
 const module={exports:{} as {HeadLearningBookmark:(props:any)=>React.ReactElement}};
 new Function('require','module','exports',code)((name:string)=>name==='react'?hooks:name==='../lib/head-learning-bookmark'?bookmarks:name.endsWith('.css')?{}:name==='next/link'?{default:({prefetch,...props}:any)=>React.createElement('a',props)}:require(name),module,module.exports);
 return module.exports;
}

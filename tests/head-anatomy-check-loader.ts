import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync(new URL('../components/HeadAnatomyCheck.tsx',import.meta.url),'utf8'),{
  compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const module={exports:{} as {HeadAnatomyCheck:React.ComponentType<{conceptId:string;revision:string;surface:'CT'|'MRI'|'3D'}>}};
new Function('require','module','exports',code)((id:string)=>id==='../lib/head-anatomy-checks.ts'?require('../lib/head-anatomy-checks.ts'):require(id),module,module.exports);
export const headAnatomyCheckModule=module.exports;

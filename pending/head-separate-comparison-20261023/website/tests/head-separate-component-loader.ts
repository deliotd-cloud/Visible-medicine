import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {headSeparateComparisonHref} from '../lib/head-separate-comparison.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadSeparateComparisonLink.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{} as {HeadSeparateComparisonLink:(props:{href:string|null|undefined;modality:'CT'|'MRI'})=>unknown}};
new Function('require','module','exports',code)((id:string)=>{
  if(id==='react/jsx-runtime')return require('react/jsx-runtime');
  if(id==='../lib/head-separate-comparison.ts')return {headSeparateComparisonHref};
  return assert.fail(`Unexpected separate-comparison dependency: ${id}`);
},module,module.exports);
export const {HeadSeparateComparisonLink}=module.exports;

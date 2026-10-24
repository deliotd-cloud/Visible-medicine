// Test-only source adapter. Executes the actual pure link component, not a mock.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import type {ReactElement} from 'react';
import ts from 'typescript';

const componentUrl=new URL('../components/HeadSeparateComparisonLink.tsx',import.meta.url);
const componentRequire=createRequire(componentUrl);
const hashes=new Map([
  ['components/HeadSeparateComparisonLink.tsx','51bee0fab7830d93eed5ba1ed8fc22ddbcc1a28b0750ccd83183e7c58202f437'],
  ['lib/head-separate-comparison.ts','4201c24e59631d1ad6dd16dbcd0bfa559a8868c994eec11a12883516729146be'],
]);
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
function checkSource(){
  for(const [file,expected]of hashes)assert.equal(sha(readFileSync(new URL('../'+file,import.meta.url))),expected,file);
}
type Props={href:string|undefined|null;modality:'CT'|'MRI'};
type LinkSource={HeadSeparateComparisonLink:(props:Props)=>ReactElement<Record<string,any>>|null};

export function loadHeadSeparateComparisonLink():LinkSource{
  checkSource();
  const source=readFileSync(componentUrl,'utf8');
  const syntax=ts.createSourceFile('HeadSeparateComparisonLink.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const runtimeImports=syntax.statements.filter(ts.isImportDeclaration)
    .filter(statement=>!statement.importClause?.isTypeOnly)
    .map(statement=>(statement.moduleSpecifier as ts.StringLiteral).text);
  assert.deepEqual(runtimeImports,['../lib/head-separate-comparison.ts'],'pure component import scope');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as LinkSource};
  const expected=new Set(['react/jsx-runtime','../lib/head-separate-comparison.ts']);
  new Function('require','module','exports',code)((name:string)=>{
    assert(expected.has(name),'Unexpected pure link dependency: '+name);
    return componentRequire(name);
  },mod,mod.exports);
  checkSource();
  return mod.exports;
}

/** Preserve the existing fixture fallback for every other dependency. */
export function separateComparisonAwareRequire(base:(name:string)=>any){
  return (name:string)=>name==='./HeadSeparateComparisonLink'?loadHeadSeparateComparisonLink():base(name);
}

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const expected=new Set([
  'react',
  '../lib/head-atlas-links.ts',
  '../lib/head-ct-facial-teaching.ts',
  '../lib/head-ct-facial-clinical.ts',
]);

/** Compile the real hook with its exact imports. Mounted harnesses can supply
 * their React adapter; default SSR retains React's initial unready state. */
export function headFacialHookModule(reactModule:unknown=require('react')){
  const source=readFileSync(new URL('../components/useVerifiedFacialTeaching.ts',import.meta.url),'utf8');
  const syntax=ts.createSourceFile('useVerifiedFacialTeaching.ts',source,ts.ScriptTarget.Latest,true);
  const imports=syntax.statements.filter(ts.isImportDeclaration)
    .filter(statement=>!statement.importClause?.isTypeOnly)
    .map(statement=>statement.moduleSpecifier.getText(syntax).slice(1,-1));
  assert.deepEqual(new Set(imports),expected,'facial hook import scope changed');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as Record<string,unknown>};
  new Function('require','module','exports',code)((name:string)=>{
    assert(expected.has(name),`Unexpected facial hook dependency: ${name}`);
    return name==='react'?reactModule:require(name);
  },mod,mod.exports);
  return mod.exports;
}

export function facialAwareRequire(base:ReturnType<typeof createRequire>){
  return (name:string)=>name==='./useVerifiedFacialTeaching'?headFacialHookModule():base(name);
}

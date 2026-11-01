import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {regionalTeachingImports} from '../lib/regional-teaching-imports.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);
assert.equal(config.error,undefined);
const parsed=ts.convertCompilerOptionsFromJson(config.config.compilerOptions,root);
assert.deepEqual(parsed.errors,[]);

test('compiler checks lazy imports through unknown declarations without inferring snapshot JSON',()=>{
 const program=ts.createProgram([path.join(root,'lib/regional-teaching-imports.ts')],{
  ...parsed.options,noEmit:true,incremental:false,types:[],lib:['lib.es2022.d.ts'],
 });
 const diagnostics=ts.getPreEmitDiagnostics(program);
 assert.deepEqual(diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[]);
 const sources=program.getSourceFiles();
 assert.equal(sources.filter(s=>/content[/\\]regional-teaching[/\\].+\.json$/.test(s.fileName)).length,0);
 const declarations=sources.filter(s=>/content[/\\]regional-teaching[/\\].+\.d\.json\.ts$/.test(s.fileName));
 assert.equal(declarations.length,Object.keys(regionalTeachingImports).length);
 const checker=program.getTypeChecker();
 for(const source of declarations){
  const symbol=checker.getSymbolAtLocation(source);
  const exported=checker.getExportsOfModule(symbol).find(s=>s.name==='default');
  assert(exported);
  assert.equal(checker.getTypeOfSymbolAtLocation(exported,source).flags,ts.TypeFlags.Unknown,source.fileName);
 }
});

test('real lazy JSON loading is unchanged for every region',async()=>{
 const entries=Object.entries(regionalTeachingImports);
 assert.equal(entries.length,11);
 for(const [region,load]of entries){
  const module=await load();
  const expected=JSON.parse(fs.readFileSync(path.join(root,'content/regional-teaching',region+'.json'),'utf8'));
  assert.deepEqual(module.default,expected,region);
 }
});

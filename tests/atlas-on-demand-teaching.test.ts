import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
import test from 'node:test';
import ts from 'typescript';

test('regional teaching is source-bound, deferred, reachable and within initial JS budget',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const files=manifest.files as {path:string;sha256:string;bytes:number}[];
 const read=(path:string)=>{
  const record=files.find(file=>file.path===path);assert(record,path);
  const bytes=readFileSync(base+path);assert.equal(bytes.length,record.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
  return bytes.toString();
 };
 const html=read('index.html');
 const entries=[...html.matchAll(/(?:src|href)="([^"\s]+\.js)"/g)].map(match=>match[1].replace('/atlas-runtime/head-neck/',''));
 assert(entries.length);
 const eager=new Set<string>(),dynamic=new Set<string>();
 function visit(path:string){
  assert(/^assets\/[\w.-]+\.js$/.test(path),path);
  if(eager.has(path))return;eager.add(path);
  const ast=ts.createSourceFile(path,read(path),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  for(const node of ast.statements)if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))visit(posix.join(posix.dirname(path),node.moduleSpecifier.text));
  function scan(node:ts.Node){
   if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments[0]&&(ts.isStringLiteral(node.arguments[0])||ts.isNoSubstitutionTemplateLiteral(node.arguments[0])))dynamic.add(posix.join(posix.dirname(path),node.arguments[0].text));
   ts.forEachChild(node,scan);
  }
  scan(ast);
 }
 entries.forEach(visit);
 const teaching=files.filter(file=>/^assets\/body-content-[\w-]+\.js$/.test(file.path));assert.equal(teaching.length,1);
 assert(!eager.has(teaching[0].path));assert(dynamic.has(teaching[0].path));
 assert(read(teaching[0].path).includes('radiologist'));
 assert([...eager].reduce((sum,path)=>sum+files.find(file=>file.path===path)!.bytes,0)<=5_000_000);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});

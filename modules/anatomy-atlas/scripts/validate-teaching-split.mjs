import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import ts from 'typescript';

// Run against a freshly built regional module, not source filenames alone.
const root=resolve('.sites-runtime/head-neck-module');
const html=await readFile(resolve(root,'index.html'),'utf8');
const entries=[...html.matchAll(/(?:src|href)="([^"\s]+\.js)"/g)].map(m=>resolve(root,m[1].replace('/atlas-runtime/head-neck/','')));
assert(entries.length,'Regional module entry scripts required');
const seen=new Set(),dynamic=new Set(),sizes=[];
async function visit(file){
 if(seen.has(file))return;
 const path=relative(root,file);assert(!path.startsWith('..')&&!path.includes(':'),'Bundle stays within output');
 seen.add(file);sizes.push({path:path.replaceAll('\\','/'),bytes:(await stat(file)).size});
 const ast=ts.createSourceFile(file,await readFile(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 for(const node of ast.statements)if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)){
  assert(node.moduleSpecifier.text.startsWith('.'),'Unexpected external module');
  await visit(resolve(dirname(file),node.moduleSpecifier.text));
 }
 function scan(node){
  if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments[0]&&(ts.isStringLiteral(node.arguments[0])||ts.isNoSubstitutionTemplateLiteral(node.arguments[0])))dynamic.add(resolve(dirname(file),node.arguments[0].text));
  ts.forEachChild(node,scan);
 }
 scan(ast);
}
for(const entry of entries)await visit(entry);
const teaching=(await readdir(resolve(root,'assets'))).filter(name=>/^body-content-[\w-]+\.js$/.test(name));
assert.equal(teaching.length,1,'One source-preserving teaching module');
const teachingPath=resolve(root,'assets',teaching[0]);
assert(!seen.has(teachingPath),'Teaching must not be statically imported or preloaded');
assert(dynamic.has(teachingPath),'Teaching must remain reachable on demand');
const eagerBytes=sizes.reduce((sum,file)=>sum+file.bytes,0);
// Baseline 7,631,095; current split 3,897,321. Allow modest feature growth but
// catch a silent all-curriculum eager-loading regression. Update by review only.
assert(eagerBytes<=5_000_000,'Regional eager JS exceeded reviewed 5 MB budget');
console.log(JSON.stringify({passed:true,eagerBytes,budget:5_000_000,teachingBytes:(await stat(teachingPath)).size,eager:sizes}));

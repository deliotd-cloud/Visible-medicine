import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname, relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import ts from 'typescript';

// Inspect freshly emitted code and Rollup's graph, not source filenames alone.
const root=resolve('.sites-runtime/head-neck-module');
const manifest=JSON.parse(await readFile(resolve(root,'teaching-chunks.json'),'utf8'));
assert.equal(manifest.schemaVersion,1);
const expected=(await readdir('content/regional-teaching')).filter(name=>name.endsWith('.json')).map(name=>name.slice(0,-5)).sort();
assert.equal(expected.length,11,'Reviewed root source regions');
assert.deepEqual(manifest.regions.map(row=>row.region).sort(),expected,'Every region emitted once');
assert.equal(manifest.fallback.length,1,'One complete original fallback resolver');
const chunks=new Map(manifest.chunks.map(row=>[row.path,row]));
const code=new Map(),dynamic=new Map(),staticImports=new Map();
for(const record of chunks.values()) {
  const file=resolve(root,record.path),path=relative(root,file);
  assert(!path.startsWith('..')&&!path.includes(':'),'Bundle stays within output');
  const bytes=await readFile(file);code.set(record.path,bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Graph binds exact emitted code');
  const ast=ts.createSourceFile(file,bytes.toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const imports=[],deferred=[];
  const local=name=>relative(root,resolve(dirname(file),name)).replaceAll('\\','/');
  for(const node of ast.statements)if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)) {
    assert(node.moduleSpecifier.text.startsWith('.'),'Unexpected external module');
    imports.push(local(node.moduleSpecifier.text));
  }
  function scan(node) {
    if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments[0]&&
      (ts.isStringLiteral(node.arguments[0])||ts.isNoSubstitutionTemplateLiteral(node.arguments[0])))deferred.push(local(node.arguments[0].text));
    ts.forEachChild(node,scan);
  }
  scan(ast);
  assert.deepEqual([...new Set(imports)].sort(),[...record.imports].sort(),'Static graph matches actual emitted code');
  assert.deepEqual([...new Set(deferred)].sort(),[...record.dynamicImports].sort(),'Dynamic graph matches actual emitted code');
  staticImports.set(record.path,imports);dynamic.set(record.path,deferred);
}
function closure(entries) {
  const seen=new Set();
  function visit(path) {if(seen.has(path))return;assert(chunks.has(path),'Known chunk');seen.add(path);for(const next of staticImports.get(path))visit(next);}
  entries.forEach(visit);return seen;
}
const html=await readFile(resolve(root,'index.html'),'utf8');
const entries=[...html.matchAll(/(?:src|href)="([^"\s]+\.js)"/g)].map(m=>m[1].replace('/atlas-runtime/head-neck/',''));
assert(entries.length,'Regional module entry scripts required');
const eager=closure(entries),deferred=new Set([...eager].flatMap(path=>dynamic.get(path)));
const sizes=paths=>[...paths].map(path=>({path,bytes:code.get(path).length,gzip:gzipSync(code.get(path)).length}));
const totals=paths=>sizes(paths).reduce((a,b)=>({raw:a.raw+b.bytes,gzip:a.gzip+b.gzip}),{raw:0,gzip:0});
const eagerBytes=totals(eager).raw;
assert(eagerBytes<=5_000_000,'Regional eager JS exceeded reviewed 5 MB budget');
const teaching=[...manifest.fallback,...manifest.regions.map(row=>row.path)];
for(const path of teaching) {
  assert(!eager.has(path),'Teaching must not be statically imported or preloaded');
  assert(deferred.has(path),'Teaching must remain reachable on demand');
}
const additional=path=>new Set([...closure([path])].filter(file=>!eager.has(file)));
const full=totals(additional(manifest.fallback[0]));
const regions=manifest.regions.map(row=>{
  const paths=additional(row.path);
  for(const other of teaching)if(other!==row.path)assert(!paths.has(other),'A region must not download other regions or the full resolver');
  const bytes=totals(paths);
  assert(bytes.gzip<full.gzip*.5,'Every region must save at least half the full resolver compressed bytes');
  return {...row,...bytes,files:sizes(paths)};
});
console.log(JSON.stringify({passed:true,eagerBytes,budget:5_000_000,full,regions,
  scope:'Exact emitted JS static-dependency closures; local per-file gzip, not HTTP bytes or browser timings',
  eager:sizes(eager),clinicalApproval:false}));

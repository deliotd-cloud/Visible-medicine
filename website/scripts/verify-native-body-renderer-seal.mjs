// Validate the saved renderer seal against committed Atlas bytes before import.
// The caller supplies a batch reader for its pinned Git revision; no worktree read.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
import ts from 'typescript';

const entries=[
  'app/body-explorer.tsx','app/layout.tsx','app/globals.css','vite.config.ts',
  'package.json','package-lock.json','scripts/compress-model-delivery.mjs',
  'scripts/glb-lossless-codec.mjs',
];
const suffixes=['','.ts','.tsx','.mjs','.js','.json','.css','/index.ts','/index.tsx'];
const destination='content/body-renderer-revision.json';
const sha=text=>createHash('sha256').update(text).digest('hex');
const safe=path=>typeof path==='string'&&path.length>0&&!path.includes('\\')&&
  !path.includes(':')&&!path.startsWith('/')&&!path.includes('\0')&&
  path.split('/').every(part=>part&&part!=='.'&&part!=='..');

export async function verifyNativeBodyRendererSeal({seal,names,read}){
  assert(seal&&typeof seal==='object'&&!Array.isArray(seal));
  assert.equal(seal.schemaVersion,1);
  assert.equal(seal.scope,'root-body-renderer');
  assert.deepEqual(seal.entrypoints,entries,'Renderer entrypoints changed');
  assert(Array.isArray(seal.dependencies)&&seal.dependencies.length>0,'Missing renderer dependencies');
  assert(names instanceof Set&&typeof read==='function','Committed source reader required');
  const paths=seal.dependencies.map(row=>{
    assert.deepEqual(Object.keys(row).sort(),['path','sha256']);
    assert(safe(row.path)&&row.path!==destination,'Invalid renderer dependency path');
    assert.match(row.sha256,/^[a-f0-9]{64}$/);
    return row.path;
  });
  assert.deepEqual(paths,[...new Set(paths)].sort((a,b)=>a.localeCompare(b)),
    'Renderer dependency list changed or duplicated');
  assert.equal(seal.sha256,sha(JSON.stringify(seal.dependencies)),'Renderer dependency digest changed');
  const expected=new Map(seal.dependencies.map(row=>[row.path,row.sha256]));
  const visited=new Set();let pending=new Set(entries);
  while(pending.size){
    const group=[...pending].filter(file=>!visited.has(file));pending=new Set();
    if(!group.length)break;
    for(const file of group)assert(names.has(file),`Missing committed renderer dependency: ${file}`);
    const bytes=await read(group);
    assert(bytes instanceof Map,'Committed reader must return a Map');
    for(const file of group){
      assert(safe(file)&&file!==destination,'Unsafe renderer traversal');
      const source=bytes.get(file);
      assert(typeof source==='string',`Missing committed renderer bytes: ${file}`);
      const text=source.replace(/\r\n/g,'\n');
      assert.equal(sha(text),expected.get(file),`Stale body renderer seal: ${file}`);
      visited.add(file);
      let imports=[];
      if(/\.[cm]?[jt]sx?$/.test(file)){
        imports=ts.preProcessFile(text,true,true).importedFiles.map(row=>row.fileName);
        const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
        const checkDynamic=node=>{
          if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)
            assert(node.arguments.length&&ts.isStringLiteral(node.arguments[0]),
              `Computed renderer import: ${file}`);
          ts.forEachChild(node,checkDynamic);
        };
        checkDynamic(ast);
      }else if(posix.extname(file)==='.css'){
        imports=[...text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)].map(match=>match[1]);
      }
      for(const specifier of imports){
        if(!specifier.startsWith('.')&&!specifier.startsWith('@/'))continue;
        const base=specifier.startsWith('@/')?specifier.slice(2):
          posix.normalize(posix.join(posix.dirname(file),specifier));
        assert(safe(base),`Unsafe renderer import: ${file} -> ${specifier}`);
        const dependency=suffixes.map(suffix=>base+suffix).find(candidate=>names.has(candidate));
        assert(dependency,`Unresolved renderer import: ${file} -> ${specifier}`);
        assert(dependency!==destination,`Circular renderer metadata import: ${file}`);
        pending.add(dependency);
      }
    }
  }
  assert.deepEqual([...visited].sort((a,b)=>a.localeCompare(b)),paths,
    'Renderer dependency graph differs from saved seal');
  return {dependencies:visited.size,sha256:seal.sha256};
}

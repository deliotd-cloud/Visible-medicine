import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {analyzeLiteralUrls} from './source-snapshot-literal-urls.mjs';

const rows=new Map([
  ['content/known.json',{mode:'100644',type:'blob'}],
  ['scripts/peer.mjs',{mode:'100644',type:'blob'}],
  ['content/held-candidate.json',{mode:'100644',type:'blob'}],
  ['content/link.json',{mode:'120000',type:'blob'}]
]);
const scan=(source,from='scripts/build.mjs',inventory=rows)=>{
  const ast=ts.createSourceFile(from,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  assert.equal(ast.parseDiagnostics.length,0);
  return [...analyzeLiteralUrls(ast,from,inventory).values()];
};

test('literal tracked file and direct immutable root const classify without directory contents',()=>{
  assert.deepEqual(scan("const root = new URL('../', import.meta.url);\nnew URL('content/known.json', root);\nnew URL('./peer.mjs', import.meta.url);"),[
    {kind:'root-directory',target:''},
    {kind:'file',target:'content/known.json'},
    {kind:'file',target:'scripts/peer.mjs'}
  ]);
  assert.deepEqual(scan("const root = new URL('../', import.meta.url); const read = p => new URL(p, root);"),[
    {kind:'root-directory',target:''}
  ],'current root declaration is classifiable, dynamic child is not');
});

test('shadowed URL, block-scoped base, duplicate or reassigned bases stay unresolved',()=>{
  const sources=[
    "function f(URL){ return new URL('./peer.mjs', import.meta.url) }",
    "const URL = class {}; new URL('./peer.mjs', import.meta.url)",
    "{ const root = new URL('../', import.meta.url); new URL('content/known.json', root) }",
    "const root = new URL('../', import.meta.url); function f(root){return new URL('content/known.json',root)}",
    "const root = new URL('../', import.meta.url); root.pathname='/elsewhere/'; new URL('content/known.json',root)",
    "const root = new URL('../', import.meta.url); root.searchParams.set('x','1'); new URL('content/known.json',root)",
    "const root = new URL('../', import.meta.url); eval('root.href=1'); new URL('content/known.json',root)",
    "let root = new URL('../', import.meta.url); new URL('content/known.json',root)"
  ];
  for(const source of sources)assert(!scan(source).some(row=>row.kind==='file'),source);
});

test('global constructors, meta base and imported URL cannot be rewritten within the classified subset',()=>{
  const sources=[
    "import * as URL from 'x'; new URL('./peer.mjs', import.meta.url)",
    "import {URL} from 'x'; new URL('./peer.mjs', import.meta.url)",
    "const f = function URL(){}; new URL('./peer.mjs', import.meta.url)",
    "const f = class URL{}; new URL('./peer.mjs', import.meta.url)",
    "globalThis.URL = Other; new URL('./peer.mjs', import.meta.url)",
    "URL.prototype.href = 'x'; new URL('./peer.mjs', import.meta.url)",
    "Object.defineProperty(globalThis, 'URL', {value: Other}); new URL('./peer.mjs', import.meta.url)",
    "Reflect.set(globalThis, 'URL', Other); new URL('./peer.mjs', import.meta.url)",
    "Object.defineProperty(import.meta, 'url', {value: 'x'}); new URL('./peer.mjs', import.meta.url)",
    "import.meta.url = 'x'; new URL('./peer.mjs', import.meta.url)",
    "with ({URL: Other}) { new URL('./peer.mjs', import.meta.url) }",
    "new URL('content/known.json', root); const root = new URL('../', import.meta.url)",
    "new URL('./peer.mjs', import.meta.url, 'extra')",
    "new URL(...['./peer.mjs', import.meta.url])"
  ];
  for(const source of sources)assert(!scan(source).some(row=>row.kind==='file'),source);
});

test('unsafe, absent, untracked and nonregular targets stay unresolved',()=>{
  for(const value of ['/content/known.json','https://example.invalid/x','C:/outside',
    '../outside.json','../../outside.json','content/known.json?x=1','content/known.json#x',
    'content/%6b%6eown.json','content\\known.json','content//known.json','content/held-candidate.json',
    'content/link.json','content/missing.json']){
    const source=`const root = new URL('../', import.meta.url); new URL(${JSON.stringify(value)}, root);`;
    assert(!scan(source).some(row=>row.kind==='file'),value);
  }
  assert.deepEqual(scan("new URL('./peer.mjs', import.meta.url)",'scripts/build.mjs',new Map()),[]);
});

test('other URL semantics and indirect or mutable bases remain unresolved',()=>{
  const sources=[
    "new URL(request.url)",
    "new URL('content/known.json', 'https://example.invalid')",
    "new URL('content/known.json', process.env.BASE)",
    "const root = getRoot(); new URL('content/known.json', root)",
    "const root = new URL('../', import.meta.url); const alias = root; new URL('content/known.json', alias)",
    "const root = new URL('../', import.meta.url); new URL('content/known.json', root.href)",
    "new URL(`./${name}.json`, import.meta.url)"
  ];
  for(const source of sources)assert(!scan(source).some(row=>row.kind==='file'),source);
});

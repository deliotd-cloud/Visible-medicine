import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {shoulderModuleHref} from '../lib/shoulder-navigation.ts';
import {structures} from '../atlas-review/app/anatomy-data.ts';

const require=createRequire(import.meta.url);
const root=new URL('../',import.meta.url);
const historical=new URL('./fixtures/git-b953ff3/',import.meta.url);
const sha256=value=>createHash('sha256').update(value).digest('hex');
const historicalHashes={
  'app__atlas__shoulder-3d__page.tsx.txt':'8b5399b9cad8f31844a34bb4c0e29d94647beccc259d1d306943501274724cb7',
  'tests__atlas-shoulder-navigation.test.ts.txt':'62cfa71a5833aaf57d9c86b9c10cda5307b8dca867ff86aac80d451e5fd93467',
  'lib__shoulder-navigation.ts.txt':'88faa8d5702a1874d721001e3282de27378067329690f94716fb6aab25cbd5ed',
  'atlas-review__app__anatomy-data.ts.txt':'9746f3bc65cef35b5b3054dc58fd9611168807ce4a1aa28de3cf35ff4c79ee13',
};
const oldRead="readFileSync('app/atlas/shoulder-3d/page.tsx','utf8')";
const fixtureRead="readFileSync(new URL('./fixtures/git-b953ff3/app__atlas__shoulder-3d__page.tsx.txt',import.meta.url),'utf8')";
function assertOnlyHistoricalReadSeamChanged(original,actual){
  assert.equal(original.split(oldRead).length,2,'the Git original has exactly one page-read seam');
  assert.equal(actual,original.replace(oldRead,fixtureRead),'every original assertion remains unchanged');
}

function compiled(path,imports={}){
  const source=readFileSync(new URL(path,root),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',js)(id=>{
    assert.ok(Object.hasOwn(imports,id),`unexpected import ${id} in ${path}`);
    return imports[id];
  },module,module.exports);
  return module.exports;
}

const {createAtlasDocumentAttempt}=compiled('components/atlas-runtime-state.ts');
const {AtlasRuntimeFrame}=compiled('components/AtlasRuntimeFrame.tsx',{
  react:React,
  './atlas-runtime-state':{createAtlasDocumentAttempt},
  './atlas-runtime-frame.css':{},
  'react/jsx-runtime':require('react/jsx-runtime'),
});
const {default:ShoulderModulePage}=compiled('app/atlas/shoulder-3d/page.tsx',{
  'next/link':{default:({href,children,...rest})=>React.createElement('a',{href,...rest},children)},
  '../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:({regionId})=>React.createElement('nav',{'data-region':regionId})},
  '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame},
  '../../../lib/shoulder-navigation':{shoulderModuleHref},
  './shoulder-module.css':{},
  'react/jsx-runtime':require('react/jsx-runtime'),
});

test('historical assertion preimages are byte-exact and only the read seam changed',()=>{
  for(const [file,hash] of Object.entries(historicalHashes))
    assert.equal(sha256(readFileSync(new URL(file,historical))),hash,file);
  assert.equal(sha256(readFileSync(new URL('lib/shoulder-navigation.ts',root))),historicalHashes['lib__shoulder-navigation.ts.txt']);
  const original=readFileSync(new URL('tests__atlas-shoulder-navigation.test.ts.txt',historical),'utf8');
  const actual=readFileSync(new URL('tests/atlas-shoulder-navigation.test.ts',root),'utf8');
  assertOnlyHistoricalReadSeamChanged(original,actual);
  assert.notEqual(sha256(Buffer.from(original+' ')),historicalHashes['tests__atlas-shoulder-navigation.test.ts.txt']);
  assert.throws(()=>assertOnlyHistoricalReadSeamChanged(original,actual.replace('assert.equal(iframe,1)','assert.equal(iframe,0)')));
  assert.throws(()=>assertOnlyHistoricalReadSeamChanged(original,actual.replace(fixtureRead,oldRead)));
});

test('current shoulder page binds the actual shared frame and full-screen link to one helper result',()=>{
  const source=readFileSync(new URL('app/atlas/shoulder-3d/page.tsx',root),'utf8');
  const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let importFrame=0,frame=0,fullScreen=0,helper=0,inlineFrame=0;
  function visit(node){
    if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text==='../../../components/AtlasRuntimeFrame'){
      importFrame++;
      assert.equal(node.importClause.namedBindings.elements[0].name.text,'AtlasRuntimeFrame');
    }
    if(ts.isCallExpression(node)&&node.expression.getText(ast)==='shoulderModuleHref'){
      helper++;
      assert.equal(node.arguments.length,1);
      assert.equal(node.arguments[0].getText(ast),'(await searchParams).structure');
    }
    if(ts.isJsxSelfClosingElement(node)){
      const tag=node.tagName.getText(ast);
      if(tag==='iframe')inlineFrame++;
      if(tag==='AtlasRuntimeFrame'){
        frame++;
        const src=node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(ast)==='src');
        assert.equal(src?.initializer?.getText(ast),'{moduleHref}');
      }
    }
    if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='a'&&node.getText(ast).includes('Open full screen')){
      fullScreen++;
      const href=node.openingElement.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(ast)==='href');
      assert.equal(href?.initializer?.getText(ast),'{moduleHref}');
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  assert.deepEqual({importFrame,frame,fullScreen,helper,inlineFrame},{importFrame:1,frame:1,fullScreen:1,helper:1,inlineFrame:0});
});

test('real shared frame renders one iframe and the matching full-screen destination for valid and refused input',async()=>{
  assert.equal(structures.length,9);
  const values=[...structures.map(s=>s.id),undefined,'unknown',
    [structures[0].id,structures[0].id],structures[0].id+'&approved=true'];
  for(const structure of values){
    const tree=await ShoulderModulePage({searchParams:Promise.resolve({structure})});
    const html=renderToStaticMarkup(tree);
    const frames=[...html.matchAll(/<iframe\b[^>]*>/g)];
    assert.equal(frames.length,1,JSON.stringify(structure));
    const links=[...html.matchAll(/<a\b[^>]*>Open full screen ↗<\/a>/g)];
    assert.equal(links.length,1,JSON.stringify(structure));
    const frameSrc=frames[0][0].match(/\bsrc="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');
    const linkHref=links[0][0].match(/\bhref="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');
    assert.equal(frameSrc,shoulderModuleHref(structure));
    assert.equal(linkHref,frameSrc);
    assert.match(frames[0][0],/referrerPolicy="same-origin"/);
    assert.match(frames[0][0],/allowFullScreen=""/);
    assert.match(html,/Opening the 3D Atlas/);
    assert.match(html,/data-region="shoulder"/);
  }
});

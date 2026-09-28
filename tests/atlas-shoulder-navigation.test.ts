import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {shoulderModuleHref} from '../lib/shoulder-navigation.ts';
import {structures} from '../atlas-review/app/anatomy-data.ts';
import ts from 'typescript';

test('all dedicated shoulder IDs survive a bookmark; unknown or duplicate input falls back safely',()=>{
  const base='/atlas-runtime/shoulder/index.html';
  assert.equal(structures.length,9);
  for(const s of structures){
    const url=new URL(shoulderModuleHref(s.id),'https://visiblemedicine.com');
    assert.equal(url.pathname,base);assert.deepEqual([...url.searchParams],[['structure',s.id]]);
  }
  for(const value of [undefined,'','unknown','https://other.test','//other.test','javascript:alert(1)',structures[0].id+'&approved=true',[structures[0].id],structures[0].id.replace(':right:',':left:'),'x'.repeat(10000)])
    assert.equal(shoulderModuleHref(value),base);
});

test('actual shoulder page uses one bounded destination for iframe and full-screen link',()=>{
  const source=readFileSync('app/atlas/shoulder-3d/page.tsx','utf8');
  const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let iframe=0,fullScreen=0,helper=0;
  function visit(node:ts.Node){
    if(ts.isCallExpression(node)&&node.expression.getText(ast)==='shoulderModuleHref'){
      helper++;assert.equal(node.arguments.length,1);
      assert.equal(node.arguments[0].getText(ast),'(await searchParams).structure');
    }
    if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='iframe'){
      iframe++;const src=node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(ast)==='src') as ts.JsxAttribute;
      assert.equal(src.initializer?.getText(ast),'{moduleHref}');
    }
    if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='a'&&node.getText(ast).includes('Open full screen')){
      fullScreen++;const href=node.openingElement.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(ast)==='href') as ts.JsxAttribute;
      assert.equal(href.initializer?.getText(ast),'{moduleHref}');
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);assert.equal(helper,1);assert.equal(iframe,1);assert.equal(fullScreen,1);
});

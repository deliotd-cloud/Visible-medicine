import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

test('both embedded review explorers use the responsive panel without losing shoulder identity',()=>{
  const source=readFileSync('scripts/clinical-review-viewer/main.tsx','utf8');
  const ast=ts.createSourceFile('review.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const explorers=new Map<string,ts.JsxSelfClosingElement>();
  function visit(node:ts.Node){
    if(ts.isJsxSelfClosingElement(node)&&['BodyExplorer','Shoulder'].includes(node.tagName.getText(ast)))explorers.set(node.tagName.getText(ast),node);
    ts.forEachChild(node,visit);
  }
  visit(ast);assert.equal(explorers.size,2);
  for(const name of ['BodyExplorer','Shoulder']){
    const attributes=explorers.get(name)!.attributes.properties;
    const presentation=attributes.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)==='presentation') as ts.JsxAttribute;
    assert(presentation?.initializer&&ts.isStringLiteral(presentation.initializer));
    assert.equal(presentation.initializer.text,'panel',name+' must not nest a standalone page inside Clinical Review');
  }
  const shoulder=explorers.get('Shoulder')!.getText(ast);
  assert(shoulder.includes("initialSelectedId={q.get('structure') ?? undefined}"));
  assert(shoulder.includes('assetBase="/atlas-runtime/shoulder"'));
});

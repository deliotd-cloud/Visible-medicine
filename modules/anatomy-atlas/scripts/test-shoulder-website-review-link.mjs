import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {structures} from '../app/anatomy-data.ts';
import {shoulderWebsiteReviewHref} from '../integration/shoulder/navigation.ts';
import ts from 'typescript';
const base='/workspace/atlas-review/shoulder';
test('all nine canonical shoulder selections stay on the website review route',()=>{
  assert.equal(structures.length,9);
  for(const s of structures){
    const actual=shoulderWebsiteReviewHref('/review?structure='+encodeURIComponent(s.id));
    const url=new URL(actual,'https://visiblemedicine.com');
    assert.equal(url.origin,'https://visiblemedicine.com');assert.equal(url.pathname,base);
    assert.deepEqual([...url.searchParams],[['structure',s.id]]);
  }
});
test('unknown, duplicate and redirect-like query data cannot become a review destination',()=>{
  assert.equal(shoulderWebsiteReviewHref('/review'),base);
  for(const query of ['structure=unknown','structure=https://other.test','structure=%2f%2fevil.test','structure=%','structure='+encodeURIComponent(structures[0].id)+'&structure='+encodeURIComponent(structures[1].id)])
    assert.equal(shoulderWebsiteReviewHref('/review?'+query),base);
  const id=structures[0].id;
  assert.equal(shoulderWebsiteReviewHref('/review?structure='+encodeURIComponent(id)+'&redirect=https://other.test#secret'),base+'?'+new URLSearchParams({structure:id}));
  for(const href of [undefined,'/review/body','/review-extra','//evil.test/review','https://evil.test/review','javascript:alert(1)','/review?'+ 'x'.repeat(2049)])
    assert.equal(shoulderWebsiteReviewHref(href),null);
});
test('actual framework adapter targets the host, not a nested or external review window',()=>{
  const text=readFileSync('integration/shoulder/framework.tsx','utf8');
  const ast=ts.createSourceFile('framework.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let link;
  function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='Link')link=node;ts.forEachChild(node,visit);}
  visit(ast);assert(link);
  const body=link.body.statements;
  assert(body[0].getText(ast).includes('shoulderWebsiteReviewHref(href)'));
  const branch=body[1];assert(ts.isIfStatement(branch));
  assert.equal(branch.expression.getText(ast),'review');
  assert.match(branch.getText(ast),/href=\{review\} target="_top"/);
});

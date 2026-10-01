import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Delivery contract, not a substitute for the Atlas actual-handler/browser tests.
test('review ships the tested scoped restoration handlers and bound viewer', () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const viewer = JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json', 'utf8'));
  assert.equal(review.revision, '31a6ae7d0a823374b97c21cd7e810070e056d352');
  assert.equal(viewer.sourceCommit, review.revision);
  assert.equal(viewer.websiteIntegrationSha256, review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(viewer.modelDelivery, 'existing-protected-inventory');
  const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
  const source = readFileSync('atlas-review/app/body-explorer.tsx', 'utf8');
  assert.equal(sha(source), review.files.find((f: {path:string}) => f.path === 'app/body-explorer.tsx').importedSha256);
  const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const printer = ts.createPrinter({ removeComments: true });
  const expected = new Map([
    ['restoreStructure', '46840cddce5f8d9c2c22b50f6d41062364b0c2d5d1069a453118819b492e5873'],
    ['restoreStructures', '84c29c7b1b9119011d3f7921ff302531b314b30dbca1095ebbccc57aefa07648'],
  ]);
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name && expected.has(node.name.text)) {
      assert.equal(sha(printer.printNode(ts.EmitHint.Unspecified, node, ast)), expected.get(node.name.text));
      expected.delete(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(expected.size, 0, 'Both exact tested handlers are present');
  for (const file of viewer.files) assert.equal(sha(readFileSync('public/atlas-review-viewer/' + file.path)), file.sha256, file.path);
});

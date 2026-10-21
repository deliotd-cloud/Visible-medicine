import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const root = import.meta.dirname;
const source = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const require = createRequire(source + '/package.json'), ts = require('typescript');
const read = p => fs.readFileSync(root + '/' + p, 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
const hint = "      {!active&&<p className=\"regional-tour-start-hint\">Choose Play full tour or Start guided tour to open each stop's notes. Imaging links and quick checks appear where available.</p>}\n";
const file = 'app/regional-guided-learning.tsx', text = read(file), original = read('originals/' + file + '.raw');
assert.equal(text.split(hint).length, 2, 'One exact pre-start-only message');
assert.equal(text.replace(hint, ''), original, 'Every original component byte and handler is preserved');
const syntax = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
assert.equal(syntax.parseDiagnostics.length, 0);
const paragraph = [];
function walk(node) {
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(a =>
    ts.isJsxAttribute(a) && a.name.getText(syntax) === 'className' && a.initializer?.text === 'regional-tour-start-hint')) paragraph.push(node);
  ts.forEachChild(node, walk);
}
walk(syntax); assert.equal(paragraph.length, 1);
const condition = paragraph[0].parent;
assert(ts.isBinaryExpression(condition)); assert.equal(condition.operatorToken.kind, ts.SyntaxKind.AmpersandAmpersandToken);
assert.equal(condition.left.getText(syntax), '!active');
assert(ts.isJsxExpression(condition.parent));
const testFile = 'scripts/test-regional-tour-player.mjs', testText = read(testFile), oldTest = read('originals/' + testFile + '.raw');
const start = testText.indexOf("test('Pre-start resources explain both entry controls");
const end = testText.indexOf("test('Missing exact source fails closed", start);
assert(start >= 0 && end > start);
assert.equal(testText.slice(0, start) + testText.slice(end), oldTest, 'All original player cases retained byte-for-byte');
for (const value of ['Play full tour', 'Start guided tour', 'Changed source returns', 'h.timers.size', 'h.unchanged(); h.unmount();']) assert(testText.slice(start, end).includes(value));
const report = { at: new Date().toISOString(), exactComponentInverse: true, preStartOnlyJsxAst: true,
  componentParsePass: true, originalNativeTestsPreserved: true, newNativeTestExecuted: false,
  componentSha256: hash(text), nativeTestSha256: hash(testText),
  limits: 'Static source/syntax/inverse check only. New real player test, source/renderer/export/Website pipeline and installed browser check remain. No source data, timing, controls, readiness or playback handlers changed.',
  installed: false, clinicalApproval: false };
fs.writeFileSync(root + '/TEXT_SCOPE.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));

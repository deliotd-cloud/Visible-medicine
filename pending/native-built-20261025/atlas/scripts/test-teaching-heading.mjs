import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { teachingHeading } from '../lib/teaching-heading.ts';

test('collapses only consecutive exact selected-structure segments at the start', () => {
  const name = 'Left scapula';
  assert.equal(teachingHeading('Left scapula · Left scapula · Anatomy', name),
    'Left scapula · Anatomy');
  assert.equal(teachingHeading('Left scapula · Left scapula · Left scapula · Course · draft', name),
    'Left scapula · Course · draft');
  assert.equal(teachingHeading('Left scapula · Left scapula · draft · Left scapula', name),
    'Left scapula · draft · Left scapula');
});

test('leaves distinct names, substructures, laterality, case and punctuation intact', () => {
  const name = 'Left scapula';
  for (const title of [
    'Left scapula · Right scapula · Anatomy',
    'Left scapula · Left scapular spine · Anatomy',
    'Left scapula · Scapula · Anatomy',
    'Left scapula · left scapula · Anatomy',
    'Left scapula · Left scapula: Anatomy',
    'Left scapula· Left scapula · Anatomy',
    'Left scapula ·Left scapula · Anatomy',
    'Left scapula - Left scapula · Anatomy',
    'Anatomy · Left scapula · Left scapula',
  ]) assert.equal(teachingHeading(title, name), title, title);
});

test('preserves empty input, exact remainder and repeated words without separator', () => {
  assert.equal(teachingHeading('', 'Left scapula'), '');
  assert.equal(teachingHeading('Left scapula · Left scapula · Anatomy', ''),
    'Left scapula · Left scapula · Anatomy');
  assert.equal(teachingHeading('Left scapula Left scapula · draft', 'Left scapula'),
    'Left scapula Left scapula · draft');
  assert.equal(teachingHeading('Left scapula · Left scapula · MRI  orientation · draft  ', 'Left scapula'),
    'Left scapula · MRI  orientation · draft  ');
  assert.equal(teachingHeading('Left scapula · Left scapula', 'Left scapula'),
    'Left scapula · Left scapula');
});

test('body explorer formats only the visible eyebrow after retrieving its lesson', async () => {
  const source = await readFile(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
  assert.match(source, /import\s*\{\s*teachingHeading\s*\}\s*from\s*['"]@\/lib\/teaching-heading['"]/);
  assert.match(source, /const content = bodyContent\(selected, value\);[\s\S]*?<div className="eyebrow">\{teachingHeading\(content\.title, selected\.name\)\}<\/div>/);
  assert.match(source, /<p>\{content\.body\}<\/p>/);
  assert.doesNotMatch(source, /content\.title\s*=/);
});

// The following checks render only the real, exported detail function and its
// two real lookup declarations. No application module graph is substituted.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const proposalRoot = fileURLToPath(new URL('..', import.meta.url));
const fromHere = createRequire(import.meta.url);
const ts = fromHere('typescript');
const React = fromHere('react');
const { renderToStaticMarkup } = fromHere('react-dom/server');

function exactReviewParts(source, fileName) {
  const tree = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(tree.parseDiagnostics.length, 0, `${fileName} parses`);
  const declaration = (name, predicate) => {
    const found = tree.statements.filter((node) => predicate(node) && (
      ts.isVariableStatement(node)
        ? node.declarationList.declarations.some((item) => ts.isIdentifier(item.name) && item.name.text === name)
        : node.name?.text === name
    ));
    assert.equal(found.length, 1, `${fileName}: one ${name}`);
    return source.slice(found[0].getStart(tree), found[0].getEnd());
  };
  const labels = declaration('labels', ts.isVariableStatement);
  const readiness = declaration('readiness', ts.isVariableStatement);
  const details = declaration('BodyReviewDetails', ts.isFunctionDeclaration);
  assert.match(details, /^export function BodyReviewDetails\(/);
  return { labels, readiness, details };
}

function detailRenderer(parts) {
  // This is a TypeScript/JSX translation of the exact three extracted nodes.
  const excerpt = `${parts.labels}\n${parts.readiness}\n${parts.details}`;
  const compiled = ts.transpileModule(excerpt, {
    fileName: 'body-review-details.tsx',
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      jsxFactory: 'React.createElement',
      jsxFragmentFactory: 'React.Fragment',
    },
    reportDiagnostics: true,
  });
  assert.deepEqual(compiled.diagnostics, []);
  const exports = {};
  new Function('React', 'teachingHeading', 'exports', compiled.outputText)(React, teachingHeading, exports);
  assert.equal(typeof exports.BodyReviewDetails, 'function');
  return (material) => renderToStaticMarkup(React.createElement(exports.BodyReviewDetails, { material }));
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function syntheticMaterial(title, structureName = 'Left scapula') {
  return deepFreeze({
    source: {
      structure: {
        id: 'synthetic-structure', name: structureName, fmaId: 'FMA-SYNTHETIC',
        laterality: 'left', sourceTree: 'synthetic-tree', coverageNote: 'Synthetic scope & limits',
        sources: [{ file: 'synthetic-part.glb', sha256: 'source-part-fingerprint' }],
      },
      credit: 'Synthetic credit', licence: 'Synthetic licence', sourceVersion: 'synthetic-v1',
      bundle: { sha256: 'bundle-fingerprint' },
    },
    atlasLink: 'https://example.invalid/synthetic?x=1&y=2',
    materialHash: 'worksheet-material-fingerprint',
    limits: ['Synthetic limit'],
    topics: [{
      tab: 'anatomy', readiness: 'draft', title, body: 'Synthetic body & <scope>',
      bullets: ['Synthetic bullet'], correctAnswer: 'Synthetic answer',
      explanation: 'Synthetic explanation', note: 'Synthetic note',
      citations: ['https://example.invalid/reference?a=1&b=2'],
    }],
    guidedTours: [], reasoning: null, checklist: { anatomy: ['Synthetic checklist item'] },
  });
}

test('Review source uses the shared heading only in the visible h4, without raw title mutation', async () => {
  const source = await readFile(resolve(proposalRoot, 'app/review/body/review-dashboard.tsx'), 'utf8');
  assert.match(source, /import\s*\{\s*teachingHeading\s*\}\s*from\s*['"]@\/lib\/teaching-heading['"]/);
  assert.match(source, /<h4>\{teachingHeading\(topic\.title, s\.name\)\}<\/h4>/);
  assert.doesNotMatch(source, /\b(?:topic\.title|material\.topics|s\.name)\s*(?:=(?!=)|\+\+|--)/);
  assert.match(source, /<p>\{topic\.body\}<\/p>/);
});

test('real Review detail render changes only the visible heading against its old-heading inverse, preserving complete markup and frozen material', async () => {
  const proposalSource = await readFile(resolve(proposalRoot, 'app/review/body/review-dashboard.tsx'), 'utf8');
  const formatted = '<h4>{teachingHeading(topic.title, s.name)}</h4>';
  assert.equal(proposalSource.split(formatted).length, 2, 'one display-only replacement');
  // This local inverse makes the regression portable to any checkout. Main's
  // separate source-bound check reconstructs the complete genuine prior file.
  const parentSource = proposalSource.replace(formatted, '<h4>{topic.title}</h4>');
  const parent = exactReviewParts(parentSource, 'parent-review-dashboard.tsx');
  const proposal = exactReviewParts(proposalSource, 'proposal-review-dashboard.tsx');
  assert.equal(proposal.labels, parent.labels);
  assert.equal(proposal.readiness, parent.readiness);
  assert.equal(parent.details.replace('<h4>{topic.title}</h4>', '<h4>{teachingHeading(topic.title, s.name)}</h4>'), proposal.details);
  const renderParent = detailRenderer(parent);
  const renderProposal = detailRenderer(proposal);
  const cases = [
    ['Left scapula · Left scapula · Anatomy', 'Left scapula', 'Left scapula · Anatomy'],
    ['Left scapula · Right scapula · Anatomy', 'Left scapula', 'Left scapula · Right scapula · Anatomy'],
    ['Left scapula · left scapula · Anatomy', 'Left scapula', 'Left scapula · left scapula · Anatomy'],
    ['Left scapula · Left scapula: Anatomy', 'Left scapula', 'Left scapula · Left scapula: Anatomy'],
    ['Anatomy · Left scapula · Left scapula', 'Left scapula', 'Anatomy · Left scapula · Left scapula'],
    ['Left <scapula> · Left <scapula> · Anatomy & scope', 'Left <scapula>', 'Left <scapula> · Anatomy & scope'],
  ];
  for (const [raw, name, visible] of cases) {
    const material = syntheticMaterial(raw, name);
    const before = JSON.stringify(material);
    const parentHtml = renderParent(material);
    const proposalHtml = renderProposal(material);
    const escaped = (text) => renderToStaticMarkup(React.createElement('h4', null, text));
    assert.equal(parentHtml.split(escaped(raw)).length, 2, `one raw h4: ${raw}`);
    assert.equal(proposalHtml, parentHtml.replace(escaped(raw), escaped(visible)), `whole HTML: ${raw}`);
    assert.equal(JSON.stringify(material), before, `material unchanged: ${raw}`);
    assert.equal(material.materialHash, 'worksheet-material-fingerprint');
    assert.equal(material.source.bundle.sha256, 'bundle-fingerprint');
    assert.equal(material.source.structure.sources[0].sha256, 'source-part-fingerprint');
    if (raw.includes('<')) {
      assert.match(parentHtml, /&lt;scapula&gt;/);
      assert.match(proposalHtml, /Anatomy &amp; scope/);
    }
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { plexusChecklists, plexusChecklistVersion } from '../lib/plexus-review-contract.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function worksheetModule() {
  const output = await build({
    entryPoints: [path.join(root, 'components/PlexusReviewWorksheet.tsx')],
    bundle: true, write: false, platform: 'node', format: 'cjs',
    packages: 'external',
    alias: { '@': root },
    loader: { '.css': 'empty' },
  });
  // Test-only access to Node's in-memory CJS compiler; no module is written.
  const bundled = new Module(path.join(root, 'components/.plexus-review-test.cjs')) as Module & {_compile(code:string,filename:string):void};
  bundled.filename = path.join(root, 'components/.plexus-review-test.cjs');
  bundled.paths = (Module as typeof Module & {_nodeModulePaths(path:string):string[]})._nodeModulePaths(path.join(root, 'components'));
  bundled._compile(output.outputFiles[0].text, bundled.filename);
  return bundled.exports as {
    PlexusReviewWorksheet: React.ComponentType<{ context: any }>;
    restoredPlexusDraft: (historical: any, latest: any, context: any, track: 'topology' | 'presentation') => any;
    retainDraftsOnPropChange: (states: any) => any;
  };
}

const hash = (character: string) => character.repeat(64);
const context = {
  catalogScope: 'independent-schematic', candidateId: 'vm:schematic:brachial-plexus:right',
  candidateName: 'Right brachial plexus', sourceCommit: 'de82626457fb60c3b92b4e4d87a0016b6c3c09ce',
  frame: { kind: 'diagrammatic', units: 'arbitrary', patientRegistration: false },
  partCount: 35, connectionCount: 38, clinicalApproved: false, learnerCatalogAdmission: false,
  materialHash: hash('a'), topologyHash: hash('d'), presentationHash: hash('e'),
  checklistVersion: plexusChecklistVersion, checklists: plexusChecklists,
  revisions: { topology: hash('d'), presentation: hash('e') },
};

test('server render is private, schematic-specific, and offers independent compact tracks', async () => {
  const { PlexusReviewWorksheet } = await worksheetModule();
  const html = renderToStaticMarkup(React.createElement(PlexusReviewWorksheet, { context }));
  for (const phrase of [
    'Private review worksheet', 'Account and institution access required',
    '35 named parts', '38 named connections', 'arbitrary units',
    'not a validated spatial nerve mesh', 'Topology', 'Presentation',
    'Save changes required', 'Export working copy', 'Version history',
  ]) assert.ok(html.includes(phrase), `missing ${phrase}`);
  assert.match(html, /disabled=""[^>]*>Record topology review/);
  assert.ok(html.includes('Complete every checklist item.'));
  assert.ok(!html.includes('Invalid schematic review scope.'));
  assert.doesNotMatch(html, /patient identifier|clinical approval recorded|learner admission granted/i);
});

test('restoring an older decision resets attestation and keeps later issue IDs', async () => {
  const { restoredPlexusDraft } = await worksheetModule();
  const issue = (id: string) => ({ id, title: id, severity: 'major', resolved: false, resolution: '' });
  const base = {
    status: 'approved', reviewer: 'Reviewer', qualification: 'Radiologist', scope: 'Schematic topology only',
    notes: '', checks: { identity: true }, evidence: [{ title: 'Reference', url: 'https://example.org', note: '' }],
    issues: [issue('older')], attested: true,
  };
  const historical = { ...base, context, track: 'topology', revisionHash: context.revisions.topology };
  const restored = restoredPlexusDraft(historical as any, { ...historical, issues: [issue('older'), issue('later')] } as any, context, 'topology');
  assert.equal(restored.status, 'draft');
  assert.equal(restored.attested, false);
  assert.deepEqual(restored.issues.map((entry: { id: string }) => entry.id), ['older', 'later']);
});

test('a historical revision loses completed checks when restored against current material', async () => {
  const { restoredPlexusDraft } = await worksheetModule();
  const old = {
    status: 'approved', reviewer: 'Reviewer', qualification: 'Radiologist', scope: 'Original schematic only',
    notes: '', checks: Object.fromEntries(plexusChecklists.topology.map((check) => [check.id, true])),
    evidence: [], issues: [], attested: true, context: { ...context, materialHash: hash('f'),
      topologyHash: hash('g'), revisions: { ...context.revisions, topology: hash('g') } },
    track: 'topology', revisionHash: hash('g'),
  };
  const restored = restoredPlexusDraft(old as any, null, context, 'topology');
  assert.equal(restored.status, 'draft');
  assert.equal(restored.attested, false);
  assert.deepEqual(restored.checks, Object.fromEntries(plexusChecklists.topology.map((check) => [check.id, false])));
});

test('changed server props retain typed working drafts while pausing saves', async () => {
  const { retainDraftsOnPropChange } = await worksheetModule();
  const typed = { reviewer: 'Unsent name', notes: 'Unsent correction', attested: false };
  const states = {
    topology: { draft: typed, dirty: true, ready: true, busy: true, needsReconcile: false, freshAfterConflict: true },
    presentation: { draft: { ...typed, reviewer: 'Other track' }, dirty: true, ready: true, busy: false, needsReconcile: false, freshAfterConflict: true },
  };
  const retained = retainDraftsOnPropChange(states);
  assert.equal(retained.topology.draft, typed);
  assert.equal(retained.presentation.draft.reviewer, 'Other track');
  assert.equal(retained.topology.ready, false);
  assert.equal(retained.presentation.needsReconcile, true);
  assert.equal(retained.topology.busy, false);
});

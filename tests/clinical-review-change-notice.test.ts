import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { build } from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readNoticeHistoricalImport} from './review-change-import-history.mjs';

const atlas = currentAtlasDeliveryRoot();
const noticeRevision = 'd4016ff9988064552e464980aaea1913b25d5114';
const currentRevision = CURRENT_ATLAS_REVISION;
const previous = '3035db2e2ec5e022c295176fc2cf731cce6de9bc';
const frozen = 'F:/VisibleMedicine/recovery/checkpoints/20261014-nested-duct-website/website-current-source/source';
const notice = 'F:/VisibleMedicine/recovery/checkpoints/20261014-review-change-website/website-current-source/source';
const newPaths = [
  'app/review/review-change-notice.css',
  'app/review/review-change-notice.tsx',
  'lib/review-change-summary.ts',
];
const editedPaths = [
  'app/review/body/body-decision-editor.tsx',
  'app/review/nested/workspace.tsx',
  'app/review/specimens/workspace.tsx',
];
const sourcePaths = [...newPaths, ...editedPaths];
const sha = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const git = (commit: string, path: string) => execFileSync('git',
  ['--no-replace-objects', 'show', `${commit}:${path}`],
  { cwd: atlas, windowsHide: true, maxBuffer: 64e6 });
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const altered = (value: string) => (value[0] === 'a' ? 'b' : 'a') + value.slice(1);
const states = (summary: any) => Object.fromEntries(summary.comparisons.map((row: any) => [row.key, row.state]));
const secret = 'PRIVATE-REVIEW-TEXT-DO-NOT-RENDER';

function saved(kind: 'body' | 'nested' | 'specimen', context: any, track: 'geometry' | 'teaching' = 'geometry') {
  return {
    eventSchema: `vm-${kind}-review-event-1`, catalogScope: context.catalogScope,
    structureId: context.structureId,
    ...(kind === 'nested' ? { nestedKey: context.nestedKey, sourceFrame: context.sourceFrame } : {}),
    ...(kind === 'specimen' ? { specimenKey: context.specimenKey, sourceFrame: context.sourceFrame } : {}),
    track, version: 1, savedAt: '2026-10-14T00:00:00.000Z', reviewedAt: null,
    revisionHash: context.revisions[track], checklistVersion: context.checklistVersion,
    checklist: clone(context.checklists[track]),
    material: Object.fromEntries(['sourceHash', 'teachingHash', 'rendererHash', 'materialHash', 'teachingTabs']
      .map(key => [key, clone(context[key])])),
    status: 'draft', reviewer: secret, qualification: '', scope: '', notes: secret,
    checks: Object.fromEntries(context.checklists[track].map((row: any) => [row.id, false])),
    evidence: [], issues: [], attested: false,
  };
}

async function imported(root = process.cwd(), verifyFrozen = false) {
  const contents = [
    ...(verifyFrozen ? [] : [
      "export {bodyReviewChanges,nestedReviewChanges,specimenReviewChanges} from './atlas-review/lib/review-change-summary';",
    ]),
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {bodyReviewSummaries} from './atlas-review/lib/body-review-material';",
    "export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';",
    "export {specimenReviewRows,specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';",
    "export {bodyReviewStale} from './atlas-review/lib/body-review-decisions';",
    "export {nestedReviewStale} from './atlas-review/lib/nested-review';",
    "export {specimenReviewStale} from './atlas-review/lib/specimen-review';",
  ].join('\n');
  const frozenManifest = verifyFrozen ? json(frozen + '/atlas-review/manifest.json') : null;
  const known = new Map<string, string>(frozenManifest?.files.map((file: any) =>
    [file.path, file.importedSha256]) ?? []);
  const noticeKnown = root === notice ? new Map<string, string>(
    json(notice + '/atlas-review/manifest.json').files.map((file: any) =>
      [file.path, file.importedSha256])) : null;
  if (verifyFrozen) {
    assert.equal(frozenManifest.revision, previous);
    assert.equal(frozenManifest.files.length, 1444);
    // Validate the complete historical import before compilation. A single
    // altered frozen dependency must abort instead of mixing old/current code.
    for (const [path, expected] of known)
      assert.equal(sha(readFileSync(frozen + '/atlas-review/' + path)), expected,
        `Frozen prior Review file changed: ${path}`);
  }
  const result = await build({
    stdin: { contents, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    nodePaths: [resolve(process.cwd(), 'node_modules')],
    plugins: noticeKnown ? [{ name: 'verified-notice-review', setup(plugin) {
      plugin.onResolve({ filter: /^@\/atlas-review\// }, args => {
        const stem = resolve(root, args.path.slice(2));
        const path = ['', '.ts', '.tsx', '.json', '.css', '.js'].map(ext => stem + ext).find(existsSync);
        assert(path, `Missing notice Review module: ${args.path}`);
        return { path };
      });
      plugin.onLoad({ filter: /[\\/]atlas-review[\\/]/ }, args => {
        const rel = relative(root, args.path).replaceAll('\\', '/');
        assert(rel.startsWith('atlas-review/'), `Mixed current Review dependency: ${args.path}`);
        const expected = noticeKnown.get(rel.slice('atlas-review/'.length));
        assert(expected, `Unrecorded notice Review dependency: ${rel}`);
        const bytes = readFileSync(args.path);
        assert.equal(sha(bytes), expected, `Notice Review dependency changed: ${rel}`);
        return { contents: bytes.toString(), resolveDir: dirname(args.path),
          loader: args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.json') ? 'json'
            : args.path.endsWith('.css') ? 'empty' : 'ts' };
      });
    } }] : verifyFrozen ? [{ name: 'verified-frozen-review', setup(plugin) {
      plugin.onResolve({ filter: /^@\// }, args => {
        if (args.path.startsWith('@/atlas-review/')) return undefined;
        throw Error(`Frozen compilation cannot import current website alias: ${args.path}`);
      });
      plugin.onResolve({ filter: /^(\.\/atlas-review\/|@\/atlas-review\/)/ }, args => {
        const suffix = args.path.replace(/^(\.\/|@\/)/, '');
        const stem = resolve(root, suffix);
        assert(!relative(root, stem).startsWith('..'));
        const path = ['', '.ts', '.tsx', '.json', '.css', '.js'].map(ext => stem + ext).find(existsSync);
        assert(path, `Missing frozen Review module: ${args.path}`);
        return { path };
      });
      plugin.onLoad({ filter: /\.(ts|tsx|json|css|js)$/ }, args => {
        const rel = relative(root, args.path).replaceAll('\\', '/');
        if (!rel.startsWith('atlas-review/')) {
          assert(!args.path.replaceAll('\\', '/').includes('/atlas-review/'),
            `Frozen compilation mixed in a current Review dependency: ${args.path}`);
          return;
        }
        const expected = known.get(rel.slice('atlas-review/'.length));
        assert(expected, `Unrecorded frozen Review dependency: ${rel}`);
        const bytes = readFileSync(args.path);
        assert.equal(sha(bytes), expected, `Frozen Review dependency changed: ${rel}`);
        return { contents: bytes.toString(), resolveDir: dirname(args.path),
          loader: args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.json') ? 'json'
            : args.path.endsWith('.css') ? 'empty' : 'ts' };
      });
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('exact source delta reaches all Review closure paths and current website bindings',
  { timeout: 180000 }, () => {
    assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: atlas, windowsHide: true }).toString().trim(), currentRevision);
    assert.equal(execFileSync('git', ['rev-parse', `${noticeRevision}^{tree}`], { cwd: atlas, windowsHide: true }).toString().trim(),
      '01b069537a441c5940e105d40bfe200f8a79962a');
    const actual = execFileSync('git', ['diff', '--name-only', previous, noticeRevision],
      { cwd: atlas, windowsHide: true }).toString().trim().split(/\r?\n/);
    assert.deepEqual(actual.sort(), [...sourcePaths, 'docs/REVIEW_CHANGE_NOTICES.md',
      'scripts/test-review-change-notice.mjs'].sort());
    for (const path of newPaths)
      assert.equal(execFileSync('git', ['ls-tree', '--name-only', previous, '--', path],
        { cwd: atlas, windowsHide: true }).toString().trim(), '', `${path} must be new`);
    const manifest = json(notice + '/atlas-review/manifest.json');
    const inputs = json(notice + '/atlas-review/integration-inputs.json');
    const viewer = json(notice + '/public/atlas-review-viewer/manifest.json');
    const priorManifest = json(frozen + '/atlas-review/manifest.json');
    assert.equal(manifest.revision, noticeRevision);
    assert.equal(sha(readFileSync(notice + '/atlas-review/manifest.json')),
      '140763c5a473067ee171c5c2ab9c4bea6c2f7cc83694d070994fec0b9b65bd50');
    for (const file of manifest.files)
      assert.equal(sha(readFileSync(notice + '/atlas-review/' + file.path)), file.importedSha256,
        `Saved notice Review file changed: ${file.path}`);
    assert.equal(inputs.sourceCommit, noticeRevision);
    assert.equal(viewer.sourceCommit, noticeRevision);
    assert.equal(manifest.websiteIntegrationSha256, inputs.sha256);
    assert.equal(viewer.websiteIntegrationSha256, inputs.sha256);
    assert.equal(viewer.personalRecordsIncluded, false);
    assert.equal(manifest.files.length, priorManifest.files.length + 3);
    const added = manifest.files.map((file: any) => file.path)
      .filter((path: string) => !priorManifest.files.some((old: any) => old.path === path));
    assert.deepEqual(added.sort(), [...newPaths].sort());
    for (const path of sourcePaths) {
      const record = manifest.files.find((file: any) => file.path === path);
      assert(record, `Review closure omitted ${path}`);
      assert.equal(record.sourceSha256, sha(git(noticeRevision, path)), `Source hash: ${path}`);
      assert.equal(record.importedSha256, sha(readFileSync(notice + '/atlas-review/' + path)), `Imported hash: ${path}`);
    }
    for (const [path, helper] of [
      [editedPaths[0], 'bodyReviewChanges'],
      [editedPaths[1], 'nestedReviewChanges'],
      [editedPaths[2], 'specimenReviewChanges'],
    ]) {
      const code = readFileSync(notice + '/atlas-review/' + path, 'utf8');
      assert(code.includes(`import { ${helper} }`), `${path}: actual helper import`);
      assert(code.includes(`<ReviewChangeNotice change={${helper}(`),
        `${path}: loaded selected-track notice wiring`);
    }
    const passiveCode = newPaths.map(path => readFileSync(notice + '/atlas-review/' + path, 'utf8').toString());
    assert.match(passiveCode[1], /<details>/);
    assert.match(passiveCode[1], /role="note"/);
    assert.doesNotMatch(passiveCode.join('\n'), /\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b/);
    const runtimeNames = ['female-pelvis', 'head-neck', 'lower-limb', 'shoulder'];
    for (const name of runtimeNames) {
      const runtime = json(`${notice}/public/atlas-runtime/${name}/manifest.json`);
      assert.equal(runtime.sourceCommit, noticeRevision, name);
      assert.equal(runtime.patientDataIncluded, false, name);
      assert.equal(runtime.clinicalApproved, false, name);
    }
    for (const path of ['lib/review-change-summary.ts', ...newPaths.filter(p => p.startsWith('app/')),
      ...editedPaths]) {
      const input = inputs.inputs.find((item: any) => item.path === 'atlas-review/' + path);
      assert(input, `Bound Review input missing: ${path}`);
      assert.equal(input.sha256, sha(readFileSync(notice + '/atlas-review/' + path)));
    }
    assert.equal(sha(JSON.stringify(inputs.inputs)), inputs.sha256);
    // Retain the complete original 1499/55 import proof at its closed4087 epoch.
    // Current87ed delivery is checked separately below, never rebased into it.
    {
    const currentRevision = '408759d57644b05402e98a937e7cf6338b5509cf';
    const readFileSync = (path: string) => readNoticeHistoricalImport(path);
    const json = (path: string) => JSON.parse(readFileSync(path).toString());
    const liveManifest = json('atlas-review/manifest.json');
    const liveInputs = json('atlas-review/integration-inputs.json');
    const liveViewer = json('public/atlas-review-viewer/manifest.json');
    assert.equal(liveManifest.revision, currentRevision);
    assert.equal(liveInputs.sourceCommit, currentRevision);
    assert.equal(liveViewer.sourceCommit, currentRevision);
    assert.equal(liveManifest.websiteIntegrationSha256, liveInputs.sha256);
    assert.equal(liveViewer.websiteIntegrationSha256, liveInputs.sha256);
    assert.equal(liveViewer.personalRecordsIncluded, false);
    assert.equal(liveManifest.files.length, 1499);
    const liveAdded = liveManifest.files.map((file: any) => file.path)
      .filter((path: string) => !priorManifest.files.some((old: any) => old.path === path));
    assert.equal(liveAdded.length, 55);
    for (const path of [...newPaths, 'lib/nasal-cartilage-mri.ts', 'content/nasal-cartilage-mri.ts',
      'lib/connective-projection-xray.ts', 'content/connective-projection-xray.ts'])
      assert(liveAdded.includes(path), `Current Review closure omitted new source: ${path}`);
    for (const path of sourcePaths) {
      const record = liveManifest.files.find((file: any) => file.path === path);
      assert(record, `Current Review closure omitted ${path}`);
      assert.equal(record.sourceSha256, sha(git(currentRevision, path)), `Current source: ${path}`);
      assert.equal(record.importedSha256, sha(readFileSync('atlas-review/' + path)), `Current import: ${path}`);
    }
    }
    const pin = validateCurrentAtlasDelivery();
    const delivered = json('atlas-review/manifest.json');
    assert.equal(delivered.revision, currentRevision);
    assert.equal(delivered.files.length, pin.reviewSourceFiles);
    const currentAdded = delivered.files.map((file: any) => file.path)
      .filter((path: string) => !priorManifest.files.some((old: any) => old.path === path));
    assert.equal(currentAdded.length, pin.reviewSourceFiles - priorManifest.files.length);
    for (const path of sourcePaths) {
      const record = delivered.files.find((file: any) => file.path === path);assert(record);
      assert.equal(record.sourceSha256, sha(git(currentRevision, path)), `Exact current source: ${path}`);
      assert.equal(record.importedSha256, sha(readFileSync('atlas-review/' + path)), `Exact current import: ${path}`);
    }
  });

test('imported helpers explain source-bound old/current states without private content or approval reuse',
  { timeout: 180000 }, async () => {
    for (const api of [await imported(notice), await imported()]) {
    const firstBody = api.bodyReviewSummaries[0];
    const body = await api.bodyReviewContext(firstBody.id);
    const nestedRow = api.nestedReviewRows.find((row: any) => row.surfaces.length);
    const nested = (await api.nestedReviewMaterial(nestedRow.key, nestedRow.surfaces[0].id))?.context;
    const specimenRow = api.specimenReviewRows.find((row: any) => row.surfaces.length);
    const specimen = (await api.specimenReviewMaterial(specimenRow.key, specimenRow.surfaces[0].id))?.context;
    assert(body && nested && specimen);
    const scopes = [
      ['body', body, api.bodyReviewChanges, api.bodyReviewStale],
      ['nested', nested, api.nestedReviewChanges, api.nestedReviewStale],
      ['specimen', specimen, api.specimenReviewChanges, api.specimenReviewStale],
    ] as const;
    for (const [kind, context, explain, stale] of scopes) {
      assert.equal(explain(undefined, context, 'geometry'), null);
      const current = saved(kind, context);
      assert.equal(explain(current, context, 'geometry'), null);
      assert.equal(stale(current, context), false);
      const currentTeaching = saved(kind, context, 'teaching');
      currentTeaching.material.rendererHash = altered(currentTeaching.material.rendererHash);
      assert.equal(explain(currentTeaching, context, 'teaching'), null);
      assert.equal(stale(currentTeaching, context), false);
      const old = saved(kind, context);
      old.revisionHash = altered(old.revisionHash);
      old.material.rendererHash = altered(old.material.rendererHash);
      const explanation = explain(old, context, 'geometry');
      assert(explanation);
      assert.equal(states(explanation).source, 'same');
      assert.equal(states(explanation).teaching, 'same');
      assert.equal(states(explanation).renderer, 'changed');
      assert.match(explanation.headline.toLowerCase(), /viewer/);
      assert.equal(stale(old, context), true);
      const unavailable = clone(context);
      unavailable.revisions.geometry = null;
      assert.equal(states(explain(current, unavailable, 'geometry')).track, 'unavailable');
      for (const patch of [{ eventSchema: 'foreign-schema' }, { structureId: 'foreign-id' },
        { track: 'teaching' }, { material: { sourceHash: secret } },
        ...(kind === 'body' ? [] : [{ sourceFrame: 'foreign-frame' }])]) {
        const result = explain({ ...old, ...patch }, context, 'geometry');
        assert(result);
        assert.match(result.headline.toLowerCase(), /cannot be compared/);
        assert.equal(result.comparisons.length, 0);
        const text = JSON.stringify(result);
        for (const forbidden of [secret, context.structureId, context.sourceHash,
          context.teachingHash, context.rendererHash, context.materialHash])
          assert(!text.includes(forbidden), `Private metadata disclosed by ${kind}`);
      }
      assert(!JSON.stringify(explanation).includes(secret));
    }
    }
  });

test('real prior imported context gives a viewer-only reason; SSR disclosure is collapsed and inert',
  { timeout: 180000 }, async () => {
    const old = await imported(frozen, true);
    const current = await imported(notice);
    const oldRow = old.nestedReviewRows.find((row: any) => row.surfaces.length);
    const oldPacket = await old.nestedReviewMaterial(oldRow.key, oldRow.surfaces[0].id);
    const currentPacket = await current.nestedReviewMaterial(oldRow.key, oldRow.surfaces[0].id);
    assert(oldPacket && currentPacket);
    const before = oldPacket.context, after = currentPacket.context;
    assert.equal(before.sourceHash, after.sourceHash);
    assert.equal(before.teachingHash, after.teachingHash);
    assert.notEqual(before.rendererHash, after.rendererHash);
    assert.notEqual(before.revisions.geometry, after.revisions.geometry);
    assert.equal(before.revisions.teaching, after.revisions.teaching);
    const savedBefore = saved('nested', before);
    const summary = current.nestedReviewChanges(savedBefore, after, 'geometry');
    assert(summary);
    assert.deepEqual([states(summary).source, states(summary).teaching, states(summary).renderer],
      ['same', 'same', 'changed']);
    assert.equal(current.nestedReviewStale(savedBefore, after), true);
    assert.equal(current.nestedReviewChanges(saved('nested', before, 'teaching'), after, 'teaching'), null);
    const rendered = await build({
      stdin: { contents: [
        "import React from 'react';",
        "import {renderToStaticMarkup} from 'react-dom/server';",
        "import {ReviewChangeNotice} from './atlas-review/app/review/review-change-notice';",
        'export const render = change => renderToStaticMarkup(React.createElement(ReviewChangeNotice,{change}));',
      ].join('\n'), resolveDir: process.cwd(), loader: 'tsx' },
      bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
      loader: { '.css': 'empty' },
      banner: { js: `import {createRequire as nodeRequire} from 'node:module';const require=nodeRequire(${JSON.stringify(process.cwd() + '/package.json')});` },
    });
    const ssr = await import('data:text/javascript;base64,' + Buffer.from(rendered.outputFiles[0].text).toString('base64'));
    const html = ssr.render(summary);
    assert.match(html, /role="note"/);
    assert.match(html, /<details(?:\s|>)/);
    assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
    assert.match(html, /<summary/);
    assert.match(html, /<table/);
    assert.doesNotMatch(html, /<(?:button|a|form|iframe)\b/i);
    assert(!html.includes(secret));
    const escaped = ssr.render({ headline: '<script>unsafe</script>', explanation: '&private',
      comparisons: [{ key: 'source', label: '<img src=x>', state: 'changed' }] });
    assert(!escaped.includes('<script>') && !escaped.includes('<img src=x>'));
    assert(escaped.includes('&lt;script&gt;') && escaped.includes('&lt;img src=x&gt;'));
  });

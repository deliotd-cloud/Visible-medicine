import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../', import.meta.url));
const moduleAt = (name) => import(pathToFileURL(join(site, 'node_modules/vinext/dist/server', name)).href);
const { AppBrowserHistoryController } = await moduleAt('app-browser-history-controller.js');
const history = await moduleAt('app-history-state.js');
const { shouldCommitPopstateUrlWithoutNavigation } = await moduleAt('app-browser-popstate.js');
const { createBasePathStrippedPathAndSearch, createSnapshotPathAndSearch } = await moduleAt('app-browser-navigation-controller.js');
const candidate = readFileSync(join(site, 'components/StudioCourseEditor.tsx'), 'utf8').replaceAll('\r\n', '\n').trimEnd();
// Explicit copied-state mutant preserves the known v3 failure without an E path.
const baseline = candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,');
assert.notEqual(baseline, candidate);
const initial = '/studio/courses/course-1?source=workspace#detail';
const path = '/studio/courses/course-1';
const origin = 'https://example.test';

function fixture() {
  let url = new URL(initial, origin);
  let state = { __vinext_historyIndex: 7, host: 'old-caller-data' };
  const controller = new AppBrowserHistoryController({
    initialHistoryState: state,
    maxHistoryStateSnapshots: 8,
    readHistoryState: () => state,
    readCurrentHref: () => url.href,
    replaceHistoryState: (next, href) => { state = next; if (href) url = new URL(href, origin); },
    pushHistoryState: (next, href) => { state = next; if (href) url = new URL(href, origin); },
    readVisibleNavigationMetadata: () => null,
  });
  const formTree = { navigationSnapshot: { pathname: path, search: '?source=workspace', params: {} }, unsavedForm: { value: 'draft' } };
  controller.rememberHistoryStateSnapshot(formTree);
  return {
    controller, formTree,
    get state() { return state; }, get url() { return url; },
    nativePush(nextState, nextHref) { state = nextState; url = new URL(nextHref, origin); },
    visit(nextState, nextHref) { state = nextState; url = new URL(nextHref, origin); },
  };
}

function popDecision(app, entry, href) {
  app.visit(entry, href);
  // The installed browser entry uses path+search equality. The current visible
  // tree still has the original path+search throughout these raw writes.
  const isSameAppRouteTarget = createBasePathStrippedPathAndSearch(app.url, '') === '/studio/courses/course-1?source=workspace';
  return shouldCommitPopstateUrlWithoutNavigation({
    historyState: entry,
    isCurrentExternalHistoryTree: app.controller.isCurrentExternalHistoryTree(entry),
    isSameAppRouteTarget,
  });
}

test('candidate is one public History API argument change and keeps the local pane setter', () => {
  assert.equal(candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,'), baseline);
  assert.match(candidate, /window\.history\.pushState\(null, "",/);
  assert.match(candidate, /\n    setSection\(next\);/);
  assert.match(candidate, /url\.searchParams\.set\("pane", next\)/);
  assert.match(candidate, /\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}/);
});

test('v2 hook-only mutant retains its known app-owned failure', () => {
  const v2 = baseline.replace('    setSection(next);', '    // Deliberate v2 mutation');
  assert.notEqual(v2, baseline);
  assert.match(v2, /window\.history\.pushState\(window\.history\.state/);
  assert.doesNotMatch(v2, /\n    setSection\(next\);/);
  assert.equal(history.isAppOwnedHistoryState({ __vinext_historyIndex: 7 }), true);
  // Installed patchedPushState omits the search-store commit for this branch.
  assert.match(readFileSync(join(site, 'node_modules/vinext/dist/shims/navigation.js'), 'utf8'), /if \(isAppOwnedHistoryState\(data\)\) \{[\s\S]*?commitAppOwnedHistoryStateWrite\?\.\("push", previousHistoryState\);[\s\S]*?return;/);
});

test('v3 copied app-owned state aliases index and refuses mismatched snapshot', () => {
  assert.match(baseline, /window\.history\.pushState\(window\.history\.state/);
  const app = fixture();
  const content = app.state;
  const previewHref = `${path}?source=workspace&pane=preview#detail`;
  app.nativePush(content, previewHref);
  app.controller.commitAppOwnedHistoryStateWrite('push', content);
  const preview = app.state;
  assert.equal(history.readHistoryStateTraversalIndex(content), 7);
  assert.equal(history.readHistoryStateTraversalIndex(preview), 7);
  assert.equal(popDecision(app, preview, previewHref), false);
  let offered = null;
  const restored = app.controller.restoreHistorySnapshot({
    historyState: preview,
    preferExternalSnapshot: false,
    stageClientParams: () => {},
    approveVisibleRestore: ({ state }) => {
      offered = state;
      return createBasePathStrippedPathAndSearch(app.url, '') === createSnapshotPathAndSearch(state.navigationSnapshot);
    },
  });
  assert.equal(offered, app.formTree);
  assert.equal(restored, false);
});

test('v4 external pane entries get unique indices and stay on the current tree', () => {
  const app = fixture();
  const content = app.state;
  const previewHref = `${path}?source=workspace&pane=preview#detail`;
  const reviewHref = `${path}?source=workspace&pane=review#detail`;
  // Exact installed patched external path: caller-owned null is wrapped with
  // metadata, then the full history controller claims the live tree.
  app.nativePush(history.createExternalHistoryStatePreservingMetadata(null, content), previewHref);
  app.controller.claimCurrentHistoryTreeSnapshot('push', content);
  const preview = app.state;
  assert.equal(history.readHistoryStateTraversalIndex(preview), 8);
  assert.equal(history.isExternalHistoryState(preview), true);
  assert.equal(app.controller.isCurrentExternalHistoryTree(preview), true);
  assert.equal(popDecision(app, preview, previewHref), true);
  app.controller.commitTraversalIndexFromHistoryState(preview);

  app.nativePush(history.createExternalHistoryStatePreservingMetadata(null, preview), reviewHref);
  app.controller.claimCurrentHistoryTreeSnapshot('push', preview);
  const review = app.state;
  assert.equal(history.readHistoryStateTraversalIndex(review), 9);
  assert.equal(popDecision(app, review, reviewHref), true);
  app.controller.commitTraversalIndexFromHistoryState(review);

  assert.equal(popDecision(app, preview, previewHref), true);
  app.controller.commitTraversalIndexFromHistoryState(preview);
  assert.equal(popDecision(app, content, initial), true);
  app.controller.commitTraversalIndexFromHistoryState(content);
  assert.equal(popDecision(app, preview, previewHref), true);
  app.controller.commitTraversalIndexFromHistoryState(preview);
  assert.equal(popDecision(app, review, reviewHref), true);
  assert.equal(app.formTree.unsavedForm.value, 'draft');
  assert.equal(history.readHistoryStateTraversalIndex(content), 7);
  assert.equal(history.readHistoryStateTraversalIndex(preview), 8);
  assert.equal(history.readHistoryStateTraversalIndex(review), 9);
  assert.equal(new URL(reviewHref, origin).hash, '#detail');
  assert.equal(new URL(reviewHref, origin).searchParams.get('source'), 'workspace');
  assert.equal('host' in review, false); // arbitrary caller data is not promised
});

test('installed external snapshot restore offers the retained tree when it is not current', () => {
  const app = fixture();
  const content = app.state;
  const previewHref = `${path}?source=workspace&pane=preview#detail`;
  app.nativePush(history.createExternalHistoryStatePreservingMetadata(null, content), previewHref);
  app.controller.claimCurrentHistoryTreeSnapshot('push', content);
  const preview = app.state;
  app.controller.commitNavigationHistory({
    href: '/elsewhere', historyUpdateMode: 'push', activeRoutePaths: ['/elsewhere'],
    bfcacheIds: null, previousNextUrl: null, stageClientParams: () => {},
  });
  app.controller.rememberHistoryStateSnapshot({ navigationSnapshot: { pathname: '/elsewhere', search: '', params: {} } });
  assert.equal(app.controller.isCurrentExternalHistoryTree(preview), false);
  let offered = null;
  const restored = app.controller.restoreHistorySnapshot({
    historyState: preview,
    preferExternalSnapshot: true,
    stageClientParams: () => {},
    approveVisibleRestore: ({ state, beforeCommit }) => {
      offered = state;
      beforeCommit();
      return true; // visible-state approval is a separate, unexercised seam
    },
  });
  assert.equal(restored, true);
  assert.equal(offered, app.formTree);
  assert.equal(app.controller.currentHistoryTraversalIndex, 8);
});

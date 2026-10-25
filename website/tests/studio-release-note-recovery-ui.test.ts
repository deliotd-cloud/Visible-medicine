import assert from 'node:assert/strict';
import test from 'node:test';
import { keyFor, release, releaseFixture as fixtureReleaseFixture, revision, scope, store as fixtureStore, words } from './studio-release-note-recovery-fixture.mjs';
import type { StudioDraftScope } from '../lib/studio-draft-scope.ts';
import type { Entry as ReleaseNoteEntry } from '../lib/studio-release-note-recovery.ts';

// compile() evaluates this actual module but its JS export object infers as {}.
const store = fixtureStore as typeof import('../lib/studio-release-note-recovery.ts');
type ReleaseFixtureOptions = {
  // The fixture initializes visibilityState/listeners on the supplied identity.
  document?: object;
  current?: StudioDraftScope | null | 'unavailable';
};
// These are existing runtime branches of the JS fixture, not a new adapter.
const releaseFixture = fixtureReleaseFixture as
  (options?: ReleaseFixtureOptions) => ReturnType<typeof fixtureReleaseFixture>;

const evidence = 'Independent reviewer evidence';
const different = (changes: Record<string, unknown>) => release(changes);

test('same-document remount offers explicit exact-bound recovery and a fresh decision choice', async () => {
  const fixture = releaseFixture();
  try {
    const first = fixture.mount();
    await first.ready();
    first.editNotes(evidence);
    const key = keyFor();
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, key)?.notes, evidence);
    first.unmount();

    const second = fixture.mount();
    await second.ready();
    assert.equal(second.notes()?.props.value, '');
    assert.equal(second.held() !== undefined, true);
    assert.equal(fixture.requests.length, 0);
    second.button('Recover unsent notes')!.props.onClick();
    second.render();
    assert.equal(second.notes()?.props.value, evidence);
    assert.equal(second.decision()?.props.value, '');
    second.submit();
    await second.settle();
    assert.equal(fixture.requests.length, 0);
    second.decision()?.props.onChange({ target: { value: 'changes-requested' } });
    second.render();
    second.submit();
    await second.settle();
    assert.equal(fixture.requests.length, 1);
    assert.equal(fixture.requests[0].body.decision, 'changes-requested');
    second.unmount();
  } finally { fixture.dispose(); }
});

test('held notes isolate release revision, actor, organization and Document', async () => {
  const owner = {};
  const fixture = releaseFixture({ document: owner });
  try {
    const writer = fixture.mount();
    await writer.ready();
    writer.editNotes(evidence);
    writer.unmount();
    for (const [item, person] of [
      [different({ version: 3 }), scope],
      [different({ materialRevision: 'b'.repeat(64) }), scope],
      [release(), { ...scope, actorId: 'edu:reviewer-b' }],
      [release(), { ...scope, organizationId: 'school-b' }],
    ] as const) {
      const view = fixture.mount(item, person);
      await view.ready();
      assert.equal(view.held(), undefined);
      assert.equal(view.notes()?.props.value ?? '', '');
      assert.equal(words(view.tree).includes(evidence), false);
      view.unmount();
    }
    const other = releaseFixture({ document: {} });
    try {
      const view = other.mount();
      await view.ready();
      assert.equal(view.held(), undefined);
      view.unmount();
    } finally { other.dispose(); }
    assert.equal(store.readUnsentReleaseNotes(owner, keyFor())?.notes, evidence);
  } finally { fixture.dispose(); }
});

test('stale recover and discard callbacks cannot take a replaced held copy', async () => {
  const fixture = releaseFixture();
  try {
    const key = keyFor();
    const held = store.retainUnsentReleaseNotes(fixture.owner, key, null, evidence, false);
    assert.ok(held);
    const view = fixture.mount();
    await view.ready();
    const oldRecover = view.button('Recover unsent notes')!.props.onClick;
    const oldDiscard = view.button('Discard held notes')!.props.onClick;
    const replacement = store.retainUnsentReleaseNotes(fixture.owner, key, held, 'Newer independent notes', false);
    assert.ok(replacement);
    oldRecover(); oldDiscard(); view.render();
    assert.equal(view.notes()?.props.value, '');
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, key), replacement);
    assert.equal(fixture.requests.length, 0);
    view.unmount();
  } finally { fixture.dispose(); }
});

test('foreign copy prevents overwrite and submission from a second mounted copy', async () => {
  const fixture = releaseFixture();
  try {
    const first = fixture.mount();
    await first.ready();
    const second = fixture.mount();
    await second.ready();
    first.editNotes(evidence);
    const held = store.readUnsentReleaseNotes(fixture.owner, keyFor());
    second.editNotes('Different reviewer notes');
    second.submit();
    await second.settle();
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, keyFor()), held);
    assert.equal(fixture.requests.length, 0);
    first.unmount(); second.unmount();
  } finally { fixture.dispose(); }
});

test('pending POST stores uncertainty; remount requires reconciliation before recovery', async () => {
  const fixture = releaseFixture();
  try {
    const first = fixture.mount();
    await first.ready();
    first.editNotes(evidence);
    first.submit();
    await first.settle();
    assert.equal(fixture.requests.length, 1);
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, keyFor())?.uncertain, true);
    first.unmount();
    const second = fixture.mount();
    await second.ready();
    assert.equal(second.notes()?.props.value, '');
    assert.equal(second.button('Recover unsent notes'), undefined);
    assert.equal(second.button('I checked the release') !== undefined, true);
    second.submit(); await second.settle();
    assert.equal(fixture.requests.length, 1);
    second.button('I checked the release')!.props.onClick();
    second.render();
    assert.equal(second.button('Recover unsent notes') !== undefined, true);
    assert.equal(fixture.requests.length, 1);
    second.unmount();
  } finally { fixture.dispose(); }
});

test('success preserves newer pending edits and clears only the sent generation', async () => {
  const fixture = releaseFixture();
  try {
    const view = fixture.mount();
    await view.ready();
    view.editNotes(evidence);
    view.submit(); await view.settle();
    const sent = store.readUnsentReleaseNotes(fixture.owner, keyFor());
    assert.equal(sent?.uncertain, true);
    view.editNotes('Additional evidence after submit');
    const newer = store.readUnsentReleaseNotes(fixture.owner, keyFor());
    assert.notEqual(newer, sent);
    fixture.finishPost(); await view.settle(); view.render();
    assert.equal(view.notes()?.props.value, 'Additional evidence after submit');
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, keyFor()), newer);
    assert.equal(fixture.refreshes, 1);
    view.unmount();
  } finally { fixture.dispose(); }
});

test('confirmed success clears its owned exact generation', async () => {
  const fixture = releaseFixture();
  try {
    const view = fixture.mount();
    await view.ready();
    view.editNotes(evidence);
    view.submit(); await view.settle();
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, keyFor())?.uncertain, true);
    fixture.finishPost(); await view.settle(); view.render();
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, keyFor()), null);
    assert.equal(view.notes()?.props.value, '');
    assert.equal(fixture.refreshes, 1);
    view.unmount();
  } finally { fixture.dispose(); }
});

test('unavailable and retired contexts do not expose held notes', async () => {
  const owner = {};
  const held = store.retainUnsentReleaseNotes(owner, keyFor(), null, evidence, false);
  assert.ok(held);
  for (const current of [null, 'unavailable'] as const) {
    const fixture = releaseFixture({ document: owner, current });
    try {
      const view = fixture.mount();
      await view.ready();
      assert.equal(view.held(), undefined);
      assert.equal(view.notes()?.props.value ?? '', '');
      assert.equal(words(view.tree).includes(evidence), false);
      view.unmount();
    } finally { fixture.dispose(); }
  }
});

test('confirmation races never recover or discard a changed copy', async () => {
  for (const action of ['Recover unsent notes', 'Discard held notes']) {
    for (const race of ['edit', 'context', 'unmount', 'replace']) {
      const fixture = releaseFixture();
      let view: ReturnType<typeof fixture.mount> | undefined;
      try {
        const key = keyFor();
        const held = store.retainUnsentReleaseNotes(fixture.owner, key, null, evidence, false);
        assert.ok(held);
        view = fixture.mount();
        await view.ready();
        const callback = view.button(action)!.props.onClick;
        let expected: ReleaseNoteEntry | null = held;
        fixture.onConfirm = () => {
          if (race === 'edit') view!.editNotes('Different local notes');
          if (race === 'context') { view!.props.release = release({ version: 3 }); view!.render(); }
          if (race === 'unmount') view!.unmount();
          if (race === 'replace') expected = store.retainUnsentReleaseNotes(fixture.owner, key, held,
            'Another mounted copy', false);
        };
        callback();
        assert.equal(store.readUnsentReleaseNotes(fixture.owner, key), expected, `${action}/${race}`);
        if (race !== 'unmount') {
          view.render();
          assert.notEqual(view.notes()?.props.value, evidence, `${action}/${race}`);
        }
        assert.equal(fixture.requests.length, 0);
      } finally { view?.unmount(); fixture.dispose(); }
    }
  }
});

test('reconciliation acknowledgement refuses races during confirmation', async () => {
  for (const race of ['edit', 'context', 'unmount', 'replace']) {
    const fixture = releaseFixture();
    let view: ReturnType<typeof fixture.mount> | undefined;
    try {
      const key = keyFor();
      const held = store.retainUnsentReleaseNotes(fixture.owner, key, null, evidence, true);
      assert.ok(held);
      view = fixture.mount();
      await view.ready();
      const callback = view.button('I checked the release')!.props.onClick;
      let expected: ReleaseNoteEntry | null = held;
      fixture.onConfirm = () => {
        if (race === 'edit') view!.editNotes('Different local notes');
        if (race === 'context') { view!.props.release = release({ version: 3 }); view!.render(); }
        if (race === 'unmount') view!.unmount();
        if (race === 'replace') expected = store.retainUnsentReleaseNotes(fixture.owner, key, held,
          'Another uncertain copy', true);
      };
      callback();
      assert.equal(store.readUnsentReleaseNotes(fixture.owner, key), expected, race);
      assert.equal(expected.uncertain, true, race);
      if (race !== 'unmount' && race !== 'context') {
        view.render();
        assert.equal(view.button('I checked the release') !== undefined, true, race);
      }
      assert.equal(fixture.requests.length, 0);
    } finally { view?.unmount(); fixture.dispose(); }
  }
});

test('store capacity refusal gives no false held-copy assurance', async () => {
  const fixture = releaseFixture();
  try {
    for (let index = 0; index < 8; index++) {
      const key = keyFor(scope, release({ id: `other-${index}` }));
      assert.ok(store.retainUnsentReleaseNotes(fixture.owner, key, null, `Held ${index}`, false));
    }
    const view = fixture.mount();
    await view.ready();
    view.editNotes(evidence);
    assert.equal(store.readUnsentReleaseNotes(fixture.owner, keyFor()), null);
    assert.match(words(view.tree), /tab-only copy is not available/i);
    assert.equal(words(view.tree).includes('Unsent notes are held only in this tab'), false);
    view.unmount();
  } finally { fixture.dispose(); }
});

test('capability and workflow status bind keys; alternate authenticated scopes remain isolated', async () => {
  const owner = {};
  const originalKey = keyFor();
  assert.ok(store.retainUnsentReleaseNotes(owner, originalKey, null, evidence, false));
  const variants = [
    { item: release(), person: scope, canPublish: false },
    { item: release({ status: 'approved', approvalCurrent: false }), person: scope, canPublish: true },
    { item: release({ approvalCurrent: true }), person: scope, canPublish: true },
    { item: release(), person: { ...scope, actorId: 'edu:reviewer-b' }, canPublish: true },
    { item: release(), person: { ...scope, organizationId: 'school-b' }, canPublish: true },
  ];
  for (const variant of variants) {
    const alternateKey = keyFor(variant.person, variant.item, variant.canPublish);
    assert.ok(alternateKey && alternateKey !== originalKey);
    const fixture = releaseFixture({ document: owner, current: variant.person });
    try {
      const view = fixture.mount(variant.item, variant.person, variant.canPublish);
      await view.ready();
      assert.equal(view.held(), undefined);
      assert.equal(words(view.tree).includes(evidence), false);
      view.unmount();
    } finally { fixture.dispose(); }
  }
  assert.equal(keyFor(scope, release({ status: 'approved', approvalCurrent: true })), null);
  assert.equal(store.readUnsentReleaseNotes(owner, originalKey)?.notes, evidence);
});

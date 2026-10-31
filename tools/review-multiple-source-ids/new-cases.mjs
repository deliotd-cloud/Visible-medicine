
test('dedicated shoulder multi-ID source groups have readable labels without losing exact review context', () => {
  // clinical-review-index builds shoulder context with sourceFmaIds.join(' ').
  const scope = 'Dedicated shoulder · Lateral shoulder · muscles · FMA34680 FMA34682 FMA34684 · right';
  for (const track of ['Anatomy', 'Teaching']) {
    const source = make('deltoid', 're-review', { title: 'Deltoid · source group', scopeLabel: scope,
      href: '/workspace/atlas-review/shoulder?structure=deltoid' + (track === 'Teaching' ? '&t=teaching' : ''), trackLabel: track });
    const result = selectQuickReview([source], track, 'shoulder', scope, false);
    assert.equal(result.groupOptions[0].label, 'Deltoid · source group · Dedicated shoulder · Lateral shoulder · muscles · right');
    assert.equal(result.groupOptions[0].key, scope);
    assert.strictEqual(result.item, source);
    assert.equal(result.item.revision, revision);
    assert.equal(result.partial, true);
    assert.equal(result.count, 1);
  }
});

test('different multi-ID source groups with identical titles remain individually selectable', () => {
  const first = make('first', 'not-started', { title: 'Deltoid', scopeLabel: 'Dedicated shoulder · Lateral shoulder · muscles · FMA34680 FMA34682 · right', href: '/workspace/atlas-review/shoulder?structure=one' });
  const second = make('second', 'changes-required', { title: 'Deltoid', scopeLabel: 'Dedicated shoulder · Lateral shoulder · muscles · FMA34680 FMA34684 · right', href: '/workspace/atlas-review/shoulder?structure=two' });
  const all = selectQuickReview([first, second], 'Anatomy', 'shoulder', null, true);
  assert.equal(all.groupOptions.length, 2);
  for (const option of all.groupOptions) {
    assert(!option.label.includes('Unrecognized source scope'));
    assert(option.label.includes(option.key), 'Collisions retain the exact source scope');
    assert.strictEqual(selectQuickReview([first, second], 'Anatomy', 'shoulder', option.key, true).item, [first, second].find(row => row.scopeLabel === option.key));
  }
  assert.strictEqual(all.item, second);
});

test('malformed source ID lists remain explicit and whole-body single-ID schema stays strict', () => {
  for (const ids of ['', 'FMA123,FMA456', 'FMA123  FMA456', 'FMA123 FM456', 'FMA123 note', 'FMA123\tFMA456', ' FMA123', 'FMA123 ']) {
    const scope = `Dedicated shoulder · Lateral shoulder · muscles · ${ids} · right`;
    const item = make(ids || 'empty', 'not-started', { scopeLabel: scope, href: '/workspace/atlas-review/shoulder?structure=one' });
    const result = selectQuickReview([item], 'Anatomy', 'shoulder', null, true);
    assert(result.groupOptions[0].label.includes(`Unrecognized source scope: ${scope}`));
    assert.strictEqual(result.item, item);
  }
  const body = make('body', 'not-started', { scopeLabel: 'Whole body · shoulder-arm · muscles · FMA34680 FMA34682 · right' });
  assert(selectQuickReview([body], 'Anatomy', null, null, true).groupOptions[0].label.includes('Unrecognized source scope'));
});

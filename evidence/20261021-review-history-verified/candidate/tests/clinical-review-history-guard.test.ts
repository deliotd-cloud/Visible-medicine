import assert from 'node:assert/strict';
import test from 'node:test';
import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard.ts';

const current = 'https://visiblemedicine.test/atlas/head-learning?mode=review#top';

class TrackedTarget extends EventTarget {
  listeners = new Set<EventListener>();
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    if (type === 'navigate' && typeof listener === 'function') this.listeners.add(listener);
    super.addEventListener(type, listener, options);
  }
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    if (type === 'navigate' && typeof listener === 'function') this.listeners.delete(listener);
    super.removeEventListener(type, listener, options);
  }
}

function makeDocument(navigation?: object) {
  let confirmations = 0;
  let allow = false;
  const view = {
    location: {href: current},
    navigation,
    confirm(message: string) {
      assert.equal(message, 'This review has unsaved or uncertain work. Leave this page?');
      confirmations++;
      return allow;
    },
  };
  const document = new EventTarget() as EventTarget & {defaultView: typeof view; closest?: () => object};
  document.defaultView = view;
  return {document: document as unknown as Document, view,
    confirmations: () => confirmations, allow: (value: boolean) => { allow = value; }};
}

function traverse(url = 'https://visiblemedicine.test/clinical-review', options: {
  navigationType?: string; cancelable?: boolean; sameDocument?: boolean; alreadyPrevented?: boolean;
} = {}) {
  const event = new Event('navigate', {cancelable: options.cancelable ?? true});
  Object.assign(event, {navigationType: options.navigationType ?? 'traverse', destination: {url, sameDocument: options.sameDocument ?? true}});
  if (options.alreadyPrevented) event.preventDefault();
  return event;
}

test('one real navigate listener protects dirty or uncertain copies and rechecks callbacks each traversal', () => {
  const navigation = new TrackedTarget();
  const fixture = makeDocument(navigation);
  let dirty = false;
  let uncertain = true;
  const first = registerClinicalReviewNavigationGuard(fixture.document, () => dirty);
  const second = registerClinicalReviewNavigationGuard(fixture.document, () => uncertain);
  assert.equal(navigation.listeners.size, 1);
  const blocked = traverse();
  assert.equal(navigation.dispatchEvent(blocked), false);
  assert.equal(blocked.defaultPrevented, true);
  assert.equal(fixture.confirmations(), 1);
  uncertain = false;
  assert.equal(navigation.dispatchEvent(traverse()), true);
  assert.equal(fixture.confirmations(), 1);
  dirty = true;
  fixture.allow(true);
  assert.equal(navigation.dispatchEvent(traverse()), true);
  assert.equal(fixture.confirmations(), 2);
  fixture.allow(false);
  first();
  assert.equal(navigation.listeners.size, 1);
  uncertain = true;
  assert.equal(navigation.dispatchEvent(traverse()), false);
  assert.equal(fixture.confirmations(), 3);
  fixture.view.navigation = new TrackedTarget();
  second();
  assert.equal(navigation.listeners.size, 0, 'cleanup must use the original Navigation target');
  assert.equal(navigation.dispatchEvent(traverse()), true);
  assert.equal(fixture.confirmations(), 3);
});

test('only cancelable, unhandled, same-document path or query traversals of this origin prompt', () => {
  const navigation = new TrackedTarget();
  const fixture = makeDocument(navigation);
  const stop = registerClinicalReviewNavigationGuard(fixture.document, () => true);
  const ignored = [
    traverse('/clinical-review', {navigationType: 'push'}),
    traverse('/clinical-review', {navigationType: 'replace'}),
    traverse('/clinical-review', {cancelable: false}),
    traverse('/clinical-review', {alreadyPrevented: true}),
    traverse('/clinical-review', {sameDocument: false}),
    traverse(current),
    traverse('https://visiblemedicine.test/atlas/head-learning?mode=review#other'),
    traverse('https://elsewhere.test/clinical-review'),
    traverse('not a URL'),
  ];
  for (const event of ignored) {
    const wasPrevented = event.defaultPrevented;
    navigation.dispatchEvent(event);
    assert.equal(event.defaultPrevented, wasPrevented);
  }
  assert.equal(fixture.confirmations(), 0);
  for (const destination of [
    'https://visiblemedicine.test/clinical-review',
    'https://visiblemedicine.test/atlas/head-learning?mode=other',
  ]) {
    const event = traverse(destination);
    assert.equal(navigation.dispatchEvent(event), false);
  }
  assert.equal(fixture.confirmations(), 2);
  stop();
});

test('unsupported or partial Navigation API stays inert; separate documents remain independent', () => {
  const unsupported = makeDocument();
  const partial = makeDocument({addEventListener() { throw new Error('partial target attached'); }});
  const stopUnsupported = registerClinicalReviewNavigationGuard(unsupported.document, () => true);
  const stopPartial = registerClinicalReviewNavigationGuard(partial.document, () => true);
  assert.equal(unsupported.confirmations(), 0);
  assert.equal(partial.confirmations(), 0);
  stopUnsupported();
  stopPartial();

  const firstTarget = new TrackedTarget();
  const secondTarget = new TrackedTarget();
  const first = makeDocument(firstTarget);
  const second = makeDocument(secondTarget);
  const stopFirst = registerClinicalReviewNavigationGuard(first.document, () => true);
  const stopSecond = registerClinicalReviewNavigationGuard(second.document, () => true);
  assert.equal(firstTarget.listeners.size, 1);
  assert.equal(secondTarget.listeners.size, 1);
  firstTarget.dispatchEvent(traverse());
  assert.equal(first.confirmations(), 1);
  assert.equal(second.confirmations(), 0);
  stopFirst();
  assert.equal(firstTarget.listeners.size, 0);
  assert.equal(secondTarget.listeners.size, 1);
  stopSecond();
  assert.equal(secondTarget.listeners.size, 0);
});

test('a traversal never synthesizes a click or adds duplicate click handling', () => {
  const navigation = new TrackedTarget();
  const fixture = makeDocument(navigation);
  const document = fixture.document as Document & {closest: () => object};
  document.closest = () => ({href: 'https://visiblemedicine.test/clinical-review', target: '', hasAttribute: () => false});
  const stop = registerClinicalReviewNavigationGuard(document, () => true);
  navigation.dispatchEvent(traverse());
  assert.equal(fixture.confirmations(), 1);
  const click = new Event('click', {cancelable: true});
  Object.assign(click, {button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false});
  document.dispatchEvent(click);
  assert.equal(click.defaultPrevented, true);
  assert.equal(fixture.confirmations(), 2);
  stop();
});

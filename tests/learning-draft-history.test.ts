import assert from "node:assert/strict";
import test from "node:test";
import { registerLearningDraftGuard } from "../lib/learning-draft-navigation.ts";

const current = "https://visiblemedicine.test/my-learning?view=notes#top";

type Listener = (event: any) => void;

class TestEventTarget {
  private listeners = new Map<string, { callback: Listener; capture: boolean }[]>();

  addEventListener(type: string, callback: Listener, options?: boolean | AddEventListenerOptions) {
    const capture = typeof options === "boolean" ? options : !!options?.capture;
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), {callback, capture}]);
  }

  removeEventListener(type: string, callback: Listener, options?: boolean | EventListenerOptions) {
    const capture = typeof options === "boolean" ? options : !!options?.capture;
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry.callback !== callback || entry.capture !== capture));
  }

  callbacks(type: string) { return [...(this.listeners.get(type) ?? [])]; }

  dispatch(type: string, event: any) {
    for (const entry of this.callbacks(type).sort((a, b) => Number(b.capture) - Number(a.capture))) {
      if (event.immediatelyStopped) break;
      entry.callback(event);
    }
  }
}

function harness(supportsNavigation = true) {
  const document = Object.assign(new TestEventTarget(), {location: {href: current}});
  const navigation = new TestEventTarget();
  const windowEvents = new TestEventTarget();
  let dirty = true;
  let confirmed = false;
  let prompts = 0;
  let nextTimer = 1;
  const timers = new Map<number, () => void>();
  const forbidden = () => { throw new Error("guard must not mutate navigation or history"); };
  const window = {
    document,
    ...(supportsNavigation ? {navigation: Object.assign(navigation, {navigate: forbidden, traverseTo: forbidden, back: forbidden, forward: forbidden})} : {}),
    history: {go: forbidden, pushState: forbidden, replaceState: forbidden, back: forbidden, forward: forbidden},
    location: {href: current, assign: forbidden, replace: forbidden},
    confirm() { prompts++; return confirmed; },
    setTimeout(callback: () => void) { const id = nextTimer++; timers.set(id, callback); return id; },
    clearTimeout(id: number) { timers.delete(id); },
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
  } as unknown as Window;

  function traverse(url: unknown, options: Record<string, unknown> = {}) {
    const event = {
      navigationType: "traverse", destination: {url, sameDocument: true},
      isTrusted: true, cancelable: true, defaultPrevented: false,
      signal: {aborted: false}, prevented: false, stopped: false, immediatelyStopped: false,
      preventDefault() { if (this.cancelable) { this.prevented = true; this.defaultPrevented = true; } },
      stopPropagation() { this.stopped = true; },
      stopImmediatePropagation() { this.immediatelyStopped = true; },
      ...options,
    };
    navigation.dispatch("navigate", event);
    return event;
  }

  return {
    window, navigation, document, windowEvents, traverse,
    dirty: () => dirty, setDirty(value: boolean) { dirty = value; document.dispatch("input", {}); },
    setConfirm(value: boolean) { confirmed = value; }, prompts: () => prompts,
    listenerCount: () => navigation.callbacks("navigate").length,
  };
}

test("dirty same-document back/forward route changes can be rejected or accepted without replaying history", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  assert.equal(h.listenerCount(), 1);
  assert.equal(h.navigation.callbacks("navigate")[0]?.capture, true);
  let laterHandlerCalls = 0;
  h.navigation.addEventListener("navigate", () => { laterHandlerCalls++; });

  const rejected = h.traverse("https://visiblemedicine.test/atlas?view=notes");
  assert.equal(h.prompts(), 1);
  assert.equal(rejected.prevented, true);
  assert.equal(rejected.immediatelyStopped, true);
  assert.equal(laterHandlerCalls, 0);

  h.setConfirm(true);
  const accepted = h.traverse("https://visiblemedicine.test/my-learning?view=plan");
  assert.equal(h.prompts(), 2);
  assert.equal(accepted.prevented, false);
  assert.equal(accepted.stopped, false);
  assert.equal(accepted.immediatelyStopped, false);
  assert.equal(laterHandlerCalls, 1);

  h.setDirty(false);
  assert.equal(h.traverse("https://visiblemedicine.test/atlas").prevented, false);
  assert.equal(h.prompts(), 2);
  h.setDirty(true);
  h.setConfirm(false);
  assert.equal(h.traverse("https://visiblemedicine.test/atlas").prevented, true);
  assert.equal(h.prompts(), 3);
  cleanup();
});

test("hash, identical, external, malformed and non-document routes stay outside native traversal confirmation", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  const cases: [unknown, Record<string, unknown>?][] = [
    [current],
    ["https://visiblemedicine.test/my-learning?view=notes#other"],
    ["https://elsewhere.test/atlas"],
    ["http://[invalid"],
    ["/atlas"],
    ["https://visiblemedicine.test/atlas", {destination: {url: "https://visiblemedicine.test/atlas", sameDocument: false}}],
    ["https://visiblemedicine.test/atlas", {navigationType: "push"}],
    ["https://visiblemedicine.test/atlas", {navigationType: "replace"}],
    ["https://visiblemedicine.test/atlas", {downloadRequest: "lesson.pdf"}],
    ["https://visiblemedicine.test/atlas", {formData: {}}],
  ];
  for (const [url, options] of cases) {
    const event = h.traverse(url, options);
    assert.equal(event.prevented, false, String(url));
  }
  assert.equal(h.prompts(), 0);
  cleanup();
});

test("uncancelable, untrusted, aborted and already-cancelled events are left alone", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  const url = "https://visiblemedicine.test/atlas";
  for (const options of [
    {cancelable: false}, {isTrusted: false}, {signal: {aborted: true}},
    {defaultPrevented: true}, {destination: null},
  ]) {
    const event = h.traverse(url, options);
    assert.equal(event.prevented, false);
    assert.equal(event.immediatelyStopped, false);
  }
  assert.equal(h.prompts(), 0);
  cleanup();
});

test("unsupported API retains click/unload protection, and cleanup makes captured native callbacks inert", () => {
  const legacy = harness(false);
  const legacyCleanup = registerLearningDraftGuard(legacy.window, legacy.dirty);
  assert.equal(legacy.listenerCount(), 0);
  const click = {
    target: {closest: () => ({href: "https://visiblemedicine.test/atlas", target: "", hasAttribute: () => false})},
    button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
    defaultPrevented: false, prevented: false,
    preventDefault() { this.prevented = true; this.defaultPrevented = true; },
    stopPropagation() {}, stopImmediatePropagation() {},
  };
  legacy.document.dispatch("click", click);
  assert.equal(click.prevented, true);
  assert.equal(legacy.prompts(), 1);
  const unload = {prevented: false, returnValue: "", preventDefault() { this.prevented = true; }};
  legacy.windowEvents.dispatch("beforeunload", unload);
  assert.equal(unload.prevented, true);
  legacyCleanup();

  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  const captured = h.navigation.callbacks("navigate")[0]?.callback;
  assert.ok(captured);
  cleanup();
  assert.equal(h.listenerCount(), 0);
  const staleEvent = h.traverse("https://visiblemedicine.test/atlas");
  captured(staleEvent);
  assert.equal(staleEvent.prevented, false);
  assert.equal(staleEvent.immediatelyStopped, false);
  assert.equal(h.prompts(), 0);
});

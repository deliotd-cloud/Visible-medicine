import assert from "node:assert/strict";
import test from "node:test";
import { registerLearningDraftGuard } from "../lib/learning-draft-navigation.ts";

const current = "https://visiblemedicine.test/my-learning?view=notes#top";

function harness() {
  const documentListeners = new Map<string, Set<(event: any) => void>>();
  const windowListeners = new Map<string, Set<(event: any) => void>>();
  const timers = new Map<number, () => void>();
  let nextTimer = 1;
  let confirmations = 0;
  let confirmResult = false;
  let dirty = true;

  const document = {
    location: { href: current },
    addEventListener(name: string, listener: (event: any) => void, capture: boolean) {
      assert(["click","input","change"].includes(name));
      assert.equal(capture, true);
      (documentListeners.get(name) ?? documentListeners.set(name, new Set()).get(name)!).add(listener);
    },
    removeEventListener(name: string, listener: (event: any) => void, capture: boolean) {
      assert.equal(capture, true);
      documentListeners.get(name)?.delete(listener);
    },
  };
  const window = {
    document,
    confirm() { confirmations++; return confirmResult; },
    setTimeout(callback: () => void, delay: number) {
      assert.equal(delay, 0);
      const id = nextTimer++;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id: number) { timers.delete(id); },
    addEventListener(name: string, listener: (event: any) => void) {
      (windowListeners.get(name) ?? windowListeners.set(name, new Set()).get(name)!).add(listener);
    },
    removeEventListener(name: string, listener: (event: any) => void) {
      windowListeners.get(name)?.delete(listener);
    },
  };

  function click(href: string, options: Partial<Pick<MouseEvent,"button"|"ctrlKey"|"metaKey"|"shiftKey"|"altKey"|"defaultPrevented">> & { target?: string; download?: boolean; textNode?: boolean } = {}) {
    const {target: linkTarget,download,textNode,...mouseOptions}=options;
    const anchor = { href, target: options.target ?? "", hasAttribute: (name: string) => name === "download" && !!options.download };
    const element = { closest: () => anchor };
    const event = {
      button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
      defaultPrevented: false, prevented: false, stopped: false, immediatelyStopped: false,
      target: textNode ? { parentElement: element } : element,
      preventDefault() { this.prevented = true; this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; },
      stopImmediatePropagation() { this.immediatelyStopped = true; },
      ...mouseOptions,
    };
    for (const listener of documentListeners.get("click") ?? []) listener(event);
    return event;
  }

  function unload() {
    const event = { prevented: false, returnValue: undefined as string | undefined,
      preventDefault() { this.prevented = true; } };
    for (const listener of windowListeners.get("beforeunload") ?? []) listener(event);
    return event;
  }

  return {
    window: window as unknown as Window, click, unload,
    setDirty(value: boolean) { dirty = value;for(const listener of documentListeners.get("input")??[])listener({}); },
    dirty: () => dirty,
    setConfirm(value: boolean) { confirmResult = value; },
    confirmations: () => confirmations,
    fireTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); },
    timers: () => timers.size,
    listeners: () => ({ click: documentListeners.get("click")?.size ?? 0, unload: windowListeners.get("beforeunload")?.size ?? 0 }),
  };
}

test("cancelled in-app navigation stops the click, while live clean state passes", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  const cancelled = h.click("/atlas", { textNode: true });
  assert.equal(cancelled.prevented, true);
  assert.equal(cancelled.stopped, true);
  assert.equal(cancelled.immediatelyStopped, true);
  assert.equal(h.confirmations(), 1);
  assert.equal(h.timers(), 0);
  h.setDirty(false);
  assert.equal(h.click("/atlas").prevented, false);
  assert.equal(h.confirmations(), 1);
  assert.equal(h.unload().prevented, false);
  cleanup();
});

test("confirmed hard link gets one immediate unload without duplicate warning, then permission expires", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  h.setConfirm(true);
  assert.equal(h.click("/atlas").prevented, false);
  assert.equal(h.confirmations(), 1);
  assert.equal(h.unload().prevented, false);
  assert.equal(h.unload().prevented, true, "the exemption covers only one unload event");
  assert.equal(h.click("/learn").prevented, false);
  h.fireTimers();
  assert.equal(h.unload().prevented, true, "failed or client-side navigation must not leave a permanent exemption");
  cleanup();
});

test("cancel after an earlier confirmation clears its pending permission", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  h.setConfirm(true);
  h.click("/atlas");
  h.setConfirm(false);
  assert.equal(h.click("/learn").prevented, true);
  assert.equal(h.timers(), 0);
  assert.equal(h.unload().prevented, true);
  cleanup();
});

test("hash, same URL, modified, new-tab, download, and already-cancelled clicks do not confirm", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  for (const href of ["#notes", current, "/my-learning?view=notes#other", "https://elsewhere.test/atlas"]) {
    assert.equal(h.click(href).prevented, false);
  }
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true },
    { button: 1 }, { target: "_blank" }, { download: true }, { defaultPrevented: true }]) {
    assert.equal(h.click("/atlas", options).prevented, false);
  }
  assert.equal(h.confirmations(), 0);
  assert.equal(h.unload().prevented, true, "native external, reload and close navigation still warn");
  cleanup();
});

test("callback changes during an in-flight draft save remain visible; cleanup removes listeners and timer", () => {
  const h = harness();
  const cleanup = registerLearningDraftGuard(h.window, h.dirty);
  assert.deepEqual(h.listeners(), { click: 1, unload: 1 });
  h.setDirty(false);
  assert.equal(h.unload().prevented, false);
  h.setDirty(true);
  assert.equal(h.unload().prevented, true);
  h.setConfirm(true);
  h.click("/atlas");
  assert.equal(h.timers(), 1);
  cleanup();
  assert.equal(h.timers(), 0);
  assert.deepEqual(h.listeners(), { click: 0, unload: 0 });
  assert.equal(h.unload().prevented, false);
});

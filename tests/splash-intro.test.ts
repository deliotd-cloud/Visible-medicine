import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { SPLASH_BOOTSTRAP_SCRIPT, SPLASH_STORAGE_KEY, SPLASH_VIDEO_SRC } from "../lib/splash-intro.ts";

function bootstrap({ pathname = "/", seen = [] as string[], storageBlocked = false, hasContent = true } = {}) {
  const root = { dataset: { visibleMedicineSplash: "" } };
  const classes = new Set(["splash-open"]);
  const attributes = new Set(["aria-hidden"]);
  const content = { inert: true, removeAttribute: (name: string) => attributes.delete(name) };
  const timers: { callback: () => void; delay: number }[] = [];
  runInNewContext(SPLASH_BOOTSTRAP_SCRIPT, {
    document: {
      documentElement: root,
      body: { classList: { remove: (name: string) => classes.delete(name) } },
      getElementById: () => hasContent ? content : null,
    },
    location: { pathname },
    localStorage: {
      getItem(key: string) {
        if (storageBlocked) throw new Error("Storage disabled");
        return seen.includes(key) ? "seen" : null;
      },
    },
    setTimeout(callback: () => void, delay: number) { timers.push({ callback, delay }); },
  });
  return { root, classes, attributes, content, timers };
}

test("the homepage selects Glide once per current browser-storage key", () => {
  assert.equal(bootstrap().root.dataset.visibleMedicineSplash, "show");
  const returning = bootstrap({ seen: [SPLASH_STORAGE_KEY] });
  assert.equal(returning.root.dataset.visibleMedicineSplash, "hidden");
  assert.equal(returning.timers.length, 0);
  assert.equal(bootstrap({ seen: ["visible-medicine-splash-v5"] }).root.dataset.visibleMedicineSplash, "show");
});

test("courses, workbooks and the comparison page do not trigger the home intro", () => {
  for (const pathname of ["/courses", "/studio/workbooks", "/splash-preview", "/learn/course/workbook"]) {
    const result = bootstrap({ pathname });
    assert.equal(result.root.dataset.visibleMedicineSplash, "hidden");
    assert.equal(result.timers.length, 0);
  }
});

test("unavailable storage does not block either the homepage or a deep link", () => {
  assert.equal(bootstrap({ storageBlocked: true }).root.dataset.visibleMedicineSplash, "show");
  assert.equal(bootstrap({ storageBlocked: true, pathname: "/courses" }).root.dataset.visibleMedicineSplash, "hidden");
});

test("the independent failsafe restores content if the player never hydrates", () => {
  const result = bootstrap();
  assert.equal(result.timers.length, 1);
  assert.equal(result.timers[0].delay, 10000);
  result.timers[0].callback();
  assert.equal(result.root.dataset.visibleMedicineSplash, "hidden");
  assert.equal(result.content.inert, false);
  assert.equal(result.attributes.has("aria-hidden"), false);
  assert.equal(result.classes.has("splash-open"), false);
  assert.doesNotThrow(() => bootstrap({ hasContent: false }).timers[0].callback());
});

test("the selected splash uses the lightweight silent Glide asset", () => {
  assert.equal(SPLASH_VIDEO_SRC, "/media/splash/glide-silent-v8.mp4");
  const asset = new URL(`../public${SPLASH_VIDEO_SRC}`, import.meta.url);
  assert.ok(statSync(asset).size < 512 * 1024);
  assert.equal(new TextDecoder().decode(readFileSync(asset).subarray(4, 8)), "ftyp");
});

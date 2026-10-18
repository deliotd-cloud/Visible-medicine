import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  installLocalAtlasDiagnostics, isFrameLoadTarget, isLocalAtlasUrl,
  isObservedTypeError, isPublicAtlasFrame, sanitizeObserverStack, sanitizeScriptUrl,
} from "../lib/local-atlas-diagnostics.ts";

const hostUrl = "http://localhost:3000/atlas/head-neck-3d?case=private#notes";
const errorMessage = "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.";

test("scope includes only development loopback Atlas page boundaries", () => {
  for (const url of [hostUrl, "http://127.0.0.1:3000/atlas", "http://[::1]:3000/atlas/x"]) assert.equal(isLocalAtlasUrl(url), true);
  for (const url of ["https://localhost/atlas", "http://localhost/atlas-runtime/x", "http://localhost/atlasish", "http://localhost/cases/atlas", "http://visiblemedicine.com/atlas"]) assert.equal(isLocalAtlasUrl(url), false);
  assert.equal(isPublicAtlasFrame("/atlas-runtime/head-neck/index.html?case=private", hostUrl), true);
  for (const src of ["/atlas-runtime", "/api/cases", "https://elsewhere.test/atlas-runtime/x", "//127.0.0.1:3000/atlas-runtime/x"]) assert.equal(isPublicAtlasFrame(src, hostUrl), false);
});

test("whitelist accepts only the observed TypeError and prints script locations without private URLs", () => {
  assert.equal(isObservedTypeError(new TypeError(errorMessage), errorMessage), true);
  assert.equal(isObservedTypeError(new TypeError(errorMessage), "Uncaught TypeError: " + errorMessage), true);
  assert.equal(isObservedTypeError(new TypeError(errorMessage), "Uncaught Error: " + errorMessage), false);
  assert.equal(isObservedTypeError(new Error(errorMessage), errorMessage), false);
  assert.equal(isObservedTypeError(new TypeError("other"), "other"), false);
  assert.equal(isObservedTypeError(null, errorMessage), false);
  assert.equal(sanitizeScriptUrl("http://localhost:3000/atlas-runtime/a.js?patient=secret#identity"), "http://localhost:3000/atlas-runtime/a.js");
  assert.equal(sanitizeScriptUrl("http://localhost:3000/api/cases/secret"), null);
  assert.equal(sanitizeScriptUrl("http://localhost:3000/api/auth/private.js"), null);
  const stack = ["TypeError: secret", ...Array.from({ length: 12 }, (_, i) => `at private (http://localhost:3000/atlas-runtime/a.js:${i + 1}:2)`), "at auth (http://localhost:3000/api/auth/secret)"].join("\n");
  const cleaned = sanitizeObserverStack(stack);
  assert.equal(cleaned.split("\n").length, 8);
  assert.ok(cleaned.includes("a.js:1:2"));
  assert.ok(!cleaned.includes("secret"));
  assert.ok(cleaned.length <= 3072);
});

type Handler = (event: Event) => void;
class Target {
  handlers = new Map<string, Set<Handler>>();
  addEventListener(name: string, fn: Handler) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name)!.add(fn); }
  removeEventListener(name: string, fn: Handler) { this.handlers.get(name)?.delete(fn); }
  fire(name: string, event: object) { for (const fn of this.handlers.get(name) ?? []) fn(event as Event); }
  count(name: string) { return this.handlers.get(name)?.size ?? 0; }
}

function fixture() {
  const warnings: string[] = [];
  const document = new Target() as Target & { querySelectorAll: () => unknown[] };
  const host = new Target() as Target & { location: URL; document: typeof document; console: { warn: (message: string) => void } };
  host.location = new URL(hostUrl);
  host.document = document;
  host.console = { warn: message => warnings.push(message) };
  const frameWindow = new Target() as Target & { location: URL };
  frameWindow.location = new URL("http://localhost:3000/atlas-runtime/head-neck/index.html?private=secret");
  const frame = { tagName: "IFRAME", isConnected: true, getAttribute: () => "/atlas-runtime/head-neck/index.html?private=secret", contentWindow: frameWindow };
  document.querySelectorAll = () => [frame];
  return { host, document, frame, frameWindow, warnings };
}

test("disabled installs nothing; current and loaded valid frames deduplicate and clean up", () => {
  const f = fixture();
  assert.equal(isFrameLoadTarget(f.frame), true);
  assert.equal(isFrameLoadTarget({ tagName: "DIV" }), false);
  const disabledCleanup = installLocalAtlasDiagnostics(f.host as unknown as Window, false);
  assert.equal(f.host.count("error"), 0);
  assert.equal(f.document.count("load"), 0);
  disabledCleanup();

  const cleanup = installLocalAtlasDiagnostics(f.host as unknown as Window, true);
  assert.equal(f.host.count("error"), 1);
  assert.equal(f.document.count("load"), 1);
  assert.equal(f.frameWindow.count("error"), 1);
  const event = { error: new TypeError(errorMessage), message: errorMessage, filename: "http://localhost:3000/atlas-runtime/a.js?token=private", target: f.frameWindow };
  f.host.fire("error", event);
  f.frameWindow.fire("error", event);
  assert.equal(f.warnings.length, 1);
  assert.ok(f.warnings[0].startsWith("[VM local atlas diagnostic] http://localhost:3000/atlas-runtime/a.js"));
  assert.ok(!f.warnings[0].includes("private"));
  f.document.fire("load", { target: f.frame });
  assert.equal(f.frameWindow.count("error"), 1);
  f.frameWindow.location = new URL("https://elsewhere.test/atlas-runtime/x");
  f.document.fire("load", { target: f.frame });
  assert.equal(f.frameWindow.count("error"), 0);
  cleanup();
  assert.equal(f.host.count("error"), 0);
  assert.equal(f.document.count("load"), 0);
});

test("removed and cross-origin frames are cleaned without creating another error", () => {
  const f = fixture();
  const cleanup = installLocalAtlasDiagnostics(f.host as unknown as Window, true);
  f.frame.isConnected = false;
  f.document.fire("load", { target: { tagName: "IMG" } });
  assert.equal(f.frameWindow.count("error"), 0);
  cleanup();
  const g = fixture();
  const cleanCrossOrigin = installLocalAtlasDiagnostics(g.host as unknown as Window, true);
  g.frameWindow.removeEventListener = () => { throw new Error("Synthetic cross-origin WindowProxy access refusal"); };
  g.frameWindow.location = new URL("https://other.test/atlas-runtime/x");
  assert.doesNotThrow(() => g.document.fire("load", { target: g.frame }));
  assert.doesNotThrow(cleanCrossOrigin);
  assert.equal(g.warnings.length, 0);
});

test("private route transitions stop logging and production never mounts the diagnostic", () => {
  const f = fixture();
  const cleanup = installLocalAtlasDiagnostics(f.host as unknown as Window, true);
  f.host.location = new URL("http://localhost:3000/workspace/cases/private");
  f.host.fire("error", { error: new TypeError(errorMessage), message: "Uncaught TypeError: " + errorMessage, filename: "http://localhost:3000/atlas-runtime/a.js?patient=secret" });
  assert.equal(f.warnings.length, 0);
  cleanup();
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /process\.env\.NODE_ENV === "development" && <LocalAtlasDiagnostics enabled \/>/);
  assert.equal(sanitizeScriptUrl("http://localhost:3000/api/%63ases/secret.js"), null);
  assert.equal(sanitizeScriptUrl("data:text/javascript,private"), null);
});

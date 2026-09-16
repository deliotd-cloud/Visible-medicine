import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runFocusedChecks } from "./run-focused-checks.mjs";

async function fixture(t) {
  const cwd = await mkdtemp(join(tmpdir(), "focused-checks-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: {
    "alpha:test": "node -e \"process.stdout.write('real stdout\\\\n');process.stderr.write('real stderr\\\\n')\"",
    "beta:check": "node beta.mjs", "unsafe:export": "node export.mjs",
  }}));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

function output() {
  let text = "";
  return { stream: { write(chunk) { text += chunk; } }, read: () => text };
}

function child(code, signal = null) {
  const proc = new EventEmitter();
  queueMicrotask(() => proc.emit("close", code, signal));
  return proc;
}

test("runs validated scripts in requested order and writes unique records", async (t) => {
  const cwd = await fixture(t);
  const calls = [];
  const out = output();
  const spawnImpl = (exe, args, options) => {
    calls.push({ exe, args, options });
    return child(0);
  };
  assert.equal(await runFocusedChecks({ argv: ["beta:check", "alpha:test"], cwd, spawnImpl, npmCli: "fake-npm-cli.js", stdout: out.stream }), 0);
  assert.deepEqual(calls.map((call) => call.args.at(-1)), ["beta:check", "alpha:test"]);
  assert.ok(calls.every((call) => call.exe === process.execPath && call.options.shell === false));
  assert.match(out.read(), /^PASS beta:check \d+ms\nPASS alpha:test \d+ms\nLOG /);
  const dir = join(cwd, ".local", "test-logs");
  let files = await readdir(dir);
  const log = await readFile(join(dir, files.find((name) => name.endsWith(".log"))), "utf8");
  const manifest = JSON.parse(await readFile(join(dir, files.find((name) => name.endsWith(".json"))), "utf8"));
  assert.match(log, /===== beta:check =====[\s\S]*===== alpha:test =====/);
  assert.deepEqual(manifest.requested, ["beta:check", "alpha:test"]);
  assert.deepEqual(Object.keys(manifest.scripts), ["beta:check", "alpha:test"]);
  assert.equal(manifest.runtime.node, process.version);
  assert.equal(manifest.runtime.cwd, cwd);
  assert.equal(manifest.status, "pass");
  assert.equal(await runFocusedChecks({ argv: ["alpha:test"], cwd, spawnImpl, npmCli: "fake-npm-cli.js", stdout: output().stream }), 0);
  files = await readdir(dir);
  assert.equal(files.length, 4);
  assert.equal(new Set(files).size, 4);
});

test("a real harmless package subprocess writes complete stdout and stderr", async (t) => {
  const cwd = await fixture(t);
  assert.equal(await runFocusedChecks({ argv: ["alpha:test"], cwd, stdout: output().stream }), 0);
  const dir = join(cwd, ".local", "test-logs");
  const files = await readdir(dir);
  const log = await readFile(join(dir, files.find((name) => name.endsWith(".log"))), "utf8");
  assert.match(log, /real stdout/);
  assert.match(log, /real stderr/);
});

test("rejects duplicates, unknown options, unknown scripts, and unsafe package scripts before execution", async (t) => {
  const cwd = await fixture(t);
  for (const argv of [
    ["alpha:test", "alpha:test"], ["--wat", "alpha:test"], ["missing:test"], ["unsafe:export"],
  ]) {
    let spawned = false;
    const err = output();
    const code = await runFocusedChecks({ argv, cwd, npmCli: "fake", spawnImpl() { spawned = true; }, stderr: err.stream });
    assert.equal(code, 2);
    assert.equal(spawned, false);
    assert.match(err.read(), /^ERROR /);
  }
  await assert.rejects(readdir(join(cwd, ".local")), { code: "ENOENT" });
});

test("child failures and spawn errors cannot report success and retain full diagnostics", async (t) => {
  const cwd = await fixture(t);
  const out = output();
  let call = 0;
  const code = await runFocusedChecks({
    argv: ["alpha:test", "beta:check"], cwd, npmCli: "fake", stdout: out.stream,
    spawnImpl() {
      call += 1;
      if (call === 1) return child(null, "SIGTERM");
      const proc = new EventEmitter();
      queueMicrotask(() => proc.emit("error", new Error("npm unavailable")));
      return proc;
    },
  });
  assert.equal(code, 1);
  assert.match(out.read(), /^FAIL alpha:test \d+ms\nFAIL beta:check \d+ms/m);
  const dir = join(cwd, ".local", "test-logs");
  const files = await readdir(dir);
  const log = await readFile(join(dir, files.find((name) => name.endsWith(".log"))), "utf8");
  const manifest = JSON.parse(await readFile(join(dir, files.find((name) => name.endsWith(".json"))), "utf8"));
  assert.match(log, /spawn error.*npm unavailable/);
  assert.equal(manifest.status, "fail");
  assert.deepEqual(manifest.results.map((result) => result.status), ["fail", "fail"]);
  assert.equal(manifest.results[0].exitCode, null);
  assert.equal(manifest.results[0].signal, "SIGTERM");
});

test("--list and --dry-run create no logs", async (t) => {
  const cwd = await fixture(t);
  for (const argv of [["--list"], ["--dry-run", "alpha:test"]]) {
    assert.equal(await runFocusedChecks({ argv, cwd, stdout: output().stream }), 0);
  }
  await assert.rejects(readdir(join(cwd, ".local")), { code: "ENOENT" });
});

test("nonzero exit and synchronous spawn failure remain failures", async (t) => {
  const cwd = await fixture(t);
  for (const spawnImpl of [() => child(7), () => { throw new Error("spawn failed"); }]) {
    const out = output();
    assert.equal(await runFocusedChecks({
      argv: ["alpha:test"], cwd, npmCli: "fake", spawnImpl, stdout: out.stream,
    }), 1);
    assert.match(out.read(), /^FAIL alpha:test /);
  }
});

test("log open and write failures are nonzero and never spawn", async (t) => {
  const cwd = await fixture(t);
  for (const failure of ["open", "write"]) {
    let opened = 0;
    let spawned = false;
    const err = output();
    const openImpl = async (...args) => {
      opened += 1;
      if (failure === "open" && opened === 2) throw new Error("log open failed");
      if (failure === "write" && opened === 2) return { fd: 99, write: async () => { throw new Error("log write failed"); }, close: async () => {} };
      const { open } = await import("node:fs/promises");
      return open(...args);
    };
    const code = await runFocusedChecks({ argv: ["alpha:test"], cwd, npmCli: "fake", openImpl, spawnImpl() { spawned = true; }, stderr: err.stream });
    assert.equal(code, 2);
    assert.equal(spawned, false);
    assert.match(err.read(), new RegExp(`${failure} failed`));
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { assertExportSpace } from "./export-space-preflight.mjs";

const target = resolve("synthetic-export", "nested");
const source = resolve("synthetic-source.bin");
const copies = [[source, "models/source.bin"]];
const allowance = 129n * 1024n * 1024n;
const errorWith = (code) => Object.assign(new Error(code), { code });
function fixture({ size = 1n, bsize = 4096n, availableBytes = 1024n ** 3n } = {}) {
  const calls = [];
  const fs = {
    async lstat(path, options) {
      calls.push(["lstat", path, options]);
      return { size, isSymbolicLink: () => false, isFile: () => true };
    },
    async statfs(path, options) {
      calls.push(["statfs", path, options]);
      const blocks = availableBytes / bsize;
      return { bsize, bavail: blocks, bfree: blocks, blocks };
    },
  };
  return { fs, calls };
}

await test("sufficient space uses block allocation, allowance and reserve; budget is serializable", async () => {
  const { fs, calls } = fixture();
  const budget = await assertExportSpace(target, [...copies, [source, "second.bin"]], fs);
  assert.equal(budget.sourceBytes, "2");
  assert.equal(budget.allocatedBytes, "8192");
  assert.equal(budget.requiredBytes, String(allowance + 8192n));
  assert.equal(JSON.parse(JSON.stringify(budget)).fileCount, 2);
  assert.ok(calls.every(([, , options]) => options.bigint === true));
});

await test("exact threshold passes and one byte below fails before a writer can run", async () => {
  const required = allowance + 1n;
  await assertExportSpace(target, copies, fixture({ bsize: 1n, availableBytes: required }).fs);
  let writerCalled = false;
  await assert.rejects(async () => {
    await assertExportSpace(target, copies, fixture({ bsize: 1n, availableBytes: required - 1n }).fs);
    writerCalled = true;
  }, (error) => error.code === "EXPORT_INSUFFICIENT_SPACE" && /short by 1 bytes/.test(error.message));
  assert.equal(writerCalled, false);
});

await test("values above Number precision retain exact arithmetic", async () => {
  const size = 2n ** 60n + 1n;
  const budget = await assertExportSpace(target, copies, fixture({ size, bsize: 1n, availableBytes: size + allowance }).fs);
  assert.equal(budget.sourceBytes, String(size));
  assert.equal(budget.requiredBytes, String(size + allowance));
});

await test("missing target walks only to nearest existing ancestor", async () => {
  const { fs, calls } = fixture();
  const realStatfs = fs.statfs.bind(fs);
  fs.statfs = async (path, options) => {
    if (path === target) { calls.push(["statfs", path, options]); throw errorWith("ENOENT"); }
    return realStatfs(path, options);
  };
  const budget = await assertExportSpace(target, copies, fs);
  assert.equal(budget.filesystemAncestor, dirname(target));
  assert.deepEqual(calls.filter(([op]) => op === "statfs").map(([, path]) => path), [target, dirname(target)]);
});

await test("permission and unsupported errors fail closed without ancestor fallback", async () => {
  for (const code of ["EACCES", "EPERM", "ENOSYS", "ENOTSUP"]) {
    const { fs } = fixture();
    let calls = 0;
    fs.statfs = async () => { calls++; throw errorWith(code); };
    await assert.rejects(assertExportSpace(target, copies, fs), new RegExp(code));
    assert.equal(calls, 1);
  }
});

await test("malformed, negative, zero-block and inconsistent stats fail closed", async () => {
  for (const override of [{ bsize: 0n }, { bsize: 4096 }, { bavail: -1n }, { blocks: undefined }, { bfree: 0n, bavail: 1n }, { blocks: 0n, bfree: 1n }]) {
    const { fs } = fixture();
    const original = fs.statfs.bind(fs);
    fs.statfs = async (...args) => ({ ...await original(...args), ...override });
    await assert.rejects(assertExportSpace(target, copies, fs), /invalid|inconsistent/);
  }
});

await test("symlinks, directories and malformed sizes are rejected before statfs", async () => {
  for (const override of [{ isSymbolicLink: () => true }, { isFile: () => false }, { size: -1n }, { size: 1 }]) {
    const { fs, calls } = fixture();
    const original = fs.lstat.bind(fs);
    fs.lstat = async (...args) => ({ ...await original(...args), ...override });
    await assert.rejects(assertExportSpace(target, copies, fs), /nonregular|invalid/);
    assert.equal(calls.some(([op]) => op === "statfs"), false);
  }
});

await test("preflight has no writer operations and leaves synthetic filesystem unchanged", async () => {
  const { fs, calls } = fixture();
  const originalState = JSON.stringify({ files: [{ path: source, size: "1" }], destinationExists: false });
  const state = JSON.parse(originalState);
  for (const operation of ["mkdir", "writeFile", "copyFile", "rm", "unlink", "rename"]) {
    fs[operation] = () => { throw new Error(`Unexpected writer ${operation}`); };
  }
  await assertExportSpace(target, copies, fs);
  assert.equal(JSON.stringify(state), originalState);
  assert.deepEqual(calls.map(([op]) => op), ["lstat", "statfs"]);
});

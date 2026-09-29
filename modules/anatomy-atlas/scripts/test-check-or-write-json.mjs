import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkOrWriteJson } from './check-or-write-json.mjs';

test('generated JSON checks detect drift without repairing evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vm-json-check-'));
  const path = join(directory, 'record.json');
  try {
    await assert.rejects(checkOrWriteJson(path, { count: 207 }, true), { code: 'ENOENT' });
    await checkOrWriteJson(path, { count: 207 });
    await checkOrWriteJson(path, { count: 207 }, true);
    const correct = await readFile(path, 'utf8');
    await writeFile(path, correct.replaceAll('\n', '\r\n'));
    await checkOrWriteJson(path, { count: 207 }, true);
    const stale = JSON.stringify({ count: 193 }, null, 2);
    await writeFile(path, stale);
    await assert.rejects(checkOrWriteJson(path, { count: 207 }, true), /is stale/);
    assert.equal(await readFile(path, 'utf8'), stale);
    await writeFile(path, '{broken');
    await assert.rejects(checkOrWriteJson(path, { count: 207 }, true), /is stale/);
    assert.equal(await readFile(path, 'utf8'), '{broken');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

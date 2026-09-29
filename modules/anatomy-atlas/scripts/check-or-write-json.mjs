import { readFile, writeFile } from 'node:fs/promises';

/** Check never repairs files: stale generated evidence must fail visibly. */
export async function checkOrWriteJson(path, value, check = false) {
  const expected = JSON.stringify(value, null, 2);
  if (check) {
    const actual = await readFile(path, 'utf8');
    if (actual.replaceAll('\r\n', '\n') !== expected) {
      throw new Error(`${path} is stale; regenerate and review its diff.`);
    }
  } else {
    await writeFile(path, expected);
  }
}

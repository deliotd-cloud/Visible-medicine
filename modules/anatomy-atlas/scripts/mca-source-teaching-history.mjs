import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';
const ids = ['mca-source-fj1662', 'mca-source-fj1663', 'mca-source-fj1692'];
const keys = ['mcaSourceParentAnatomy', 'mcaSourceAngiography'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Test-only historical projection; no production content or decisions migrate. */
export function beforeMCASourceTeaching(api) {
  const additions = api.nestedConcepts.filter(c => ids.includes(c.id));
  assert.deepEqual(JSON.parse(JSON.stringify(additions.map(c => c.id))), ids);
  assert.equal(hash(additions), '83d73534ca3a5aacf8a06be8d0482baae272a7faf95677f86c6f4ea9f7ac13b2', 'Unrecorded MCA source lesson change');
  const refs = Object.fromEntries(keys.map(key => [key, api.nestedTeachingReferences[key]]));
  assert.equal(hash(refs), '0eaea9fb8442ea8b9a6797322466a00d28ab48b279d0339f9da63233989cd91b', 'Unrecorded MCA source reference change');
  return {...api, nestedConcepts: api.nestedConcepts.filter(c => !ids.includes(c.id)),
    nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([key]) => !keys.includes(key)))};
}
if (process.argv.includes('--hash')) {
  const result = await build({stdin: {contents: "export * from './content/mca-source-teaching';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  console.log(JSON.stringify({concepts: hash(api.mcaSourceConcepts), references: hash(api.mcaSourceTeachingReferences)}));
}

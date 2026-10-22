import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const website = 'F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const staged = 'F:/VisibleMedicine/staging/20261022-loading-head-live-roles/CODE';
const names = [
  'head-native-history-current-transition.test.mjs',
  'head-manual-recovery-54-to-55-closed.test.mjs',
  'head-history-role-preservation.test.mjs',
  'closed54-55-provider-preservation.test.mjs',
];
const code = new Map(names.map(name => [pathToFileURL(`${website}/tests/${name}`).href,
  `${staged}/tests/${name}`]));

export async function load(url, context, nextLoad) {
  const source = code.get(url);
  if (source) return { format: 'module', shortCircuit: true, source: readFileSync(source, 'utf8') };
  return nextLoad(url, context);
}

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const website = 'F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const staged = 'F:/VisibleMedicine/staging/20261022-loading-ui-consumer-closures/CODE';
const names = [
  'craniofacial-ct-current-delivery.test.mjs',
  'ui-teaching-lifecycle-contract.test.mjs',
  'head-disclosure-role-preservation-20261021.test.mjs',
];
const code = new Map(names.map(name => [pathToFileURL(`${website}/tests/${name}`).href,
  `${staged}/tests/${name}`]));

export async function load(url, context, nextLoad) {
  const source = code.get(url);
  if (source) return { format: 'module', shortCircuit: true, source: readFileSync(source, 'utf8') };
  return nextLoad(url, context);
}

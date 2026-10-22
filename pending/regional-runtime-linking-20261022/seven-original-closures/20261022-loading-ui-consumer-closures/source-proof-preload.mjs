import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const website = 'F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const staged = 'F:/VisibleMedicine/staging/20261022-loading-ui-consumer-closures/CODE';
const names = [
  'craniofacial-ct-current-delivery.test.mjs',
  'ui-teaching-lifecycle-contract.test.mjs',
  'head-disclosure-role-preservation-20261021.test.mjs',
];
const paths = new Map(names.map(name => [resolve(website, 'tests', name).toLowerCase(),
  resolve(staged, 'tests', name)]));
const original = fs.readFileSync;
fs.readFileSync = function (path, ...args) {
  const key = resolve(path instanceof URL ? fileURLToPath(path) : String(path)).toLowerCase();
  return original.call(this, paths.get(key) ?? path, ...args);
};
syncBuiltinESMExports();

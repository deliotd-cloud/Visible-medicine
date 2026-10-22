import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const website = 'F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const staged = 'F:/VisibleMedicine/staging/20261022-loading-head-live-roles/CODE';
const names = [
  'head-native-history-current-transition.test.mjs',
  'head-manual-recovery-54-to-55-closed.test.mjs',
  'head-history-role-preservation.test.mjs',
  'closed54-55-provider-preservation.test.mjs',
];
const paths = new Map(names.map(name => [resolve(website, 'tests', name).toLowerCase(),
  resolve(staged, 'tests', name)]));
const original = fs.readFileSync;
fs.readFileSync = function (path, ...args) {
  const key = resolve(path instanceof URL ? fileURLToPath(path) : String(path)).toLowerCase();
  return original.call(this, paths.get(key) ?? path, ...args);
};
syncBuiltinESMExports();

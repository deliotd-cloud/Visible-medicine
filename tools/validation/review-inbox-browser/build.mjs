import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const website = resolve(root, '../20261029-combined-website/website');
const source = join(website, 'components/ClinicalReviewInbox.tsx');
const expectedSourceHash = '90e06effdd02d0552a1e6303e34e1bb8599e1392f956baa974980bb450bd2559';
const hash = value => createHash('sha256').update(value).digest('hex');
const actualSourceHash = hash(readFileSync(source));
if (actualSourceHash !== expectedSourceHash) throw new Error('Pinned inbox component changed; browser QA build refused.');

const requireFromWebsite = createRequire(join(website, 'package.json'));
const { build } = requireFromWebsite('esbuild');
const result = await build({
  absWorkingDir: website,
  entryPoints: [join(root, 'entry.tsx')],
  outdir: root,
  entryNames: 'bundle',
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2022'],
  jsx: 'automatic',
  nodePaths: [join(website, 'node_modules')],
  packages: 'bundle',
  metafile: true,
  legalComments: 'eof',
  sourcemap: false,
  logLevel: 'silent',
});
const inputs = Object.fromEntries(Object.keys(result.metafile.inputs).sort().map(name => {
  const absolute = resolve(website, name);
  return [name.replaceAll('\\', '/'), hash(readFileSync(absolute))];
}));
const outputs = Object.fromEntries(Object.keys(result.metafile.outputs).sort().map(name => {
  const absolute = resolve(website, name);
  return [name.replaceAll('\\', '/'), hash(readFileSync(absolute))];
}));
const receipt = {
  schema: 'vm-clinical-inbox-synthetic-browser-build/1',
  pinnedComponent: { path: source, sha256: expectedSourceHash },
  entry: join(root, 'entry.tsx'),
  inputSha256: inputs,
  outputSha256: outputs,
  metafile: result.metafile,
  syntheticOnly: true,
};
writeFileSync(join(root, 'BUILD_RESULT.json'), JSON.stringify(receipt, null, 2) + '\n');
process.stdout.write(JSON.stringify({ inputs: Object.keys(inputs).length, outputs }) + '\n');

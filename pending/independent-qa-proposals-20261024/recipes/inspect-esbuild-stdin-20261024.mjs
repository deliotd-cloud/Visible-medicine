// Bounded API control only: no application module or historical test is loaded.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const website = 'F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const requireSite = createRequire(website + '/package.json'), esbuild = requireSite('esbuild');
const lock = JSON.parse(fs.readFileSync(website + '/package-lock.json', 'utf8'));
assert.equal(esbuild.version, lock.packages['node_modules/esbuild'].version);
const observed = [];
const output = await esbuild.build({
  stdin: { contents: "import assert from 'node:assert/strict'; export default assert;", loader: 'js', resolveDir: website },
  write: false, bundle: true, platform: 'node', format: 'esm', metafile: true, tsconfigRaw: {},
  plugins: [{ name: 'inspect-stdin-ABI-only', setup(api) { api.onResolve({ filter: /.*/ }, args => {
    observed.push({ namespace: args.namespace, importer: args.importer, path: args.path, kind: args.kind });
    assert.equal(args.path, 'node:assert/strict'); return { path: args.path, external: true };
  }); } }],
});
assert.deepEqual(Object.keys(output.metafile.inputs), ['<stdin>']);
const record = { at: new Date().toISOString(), esbuildVersion: esbuild.version, observed, metafile: output.metafile, compiledControlSha256: createHash('sha256').update(output.outputFiles[0].contents).digest('hex'), applicationInputs: 0, outputExecuted: false, sourceOrPreviewChanged: false };
const path = 'F:/VisibleMedicine/staging/20261024-eye-epoch-repair-main/STDIN_ABI_CONTROL.json';
fs.writeFileSync(path, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ receipt: path, observed, applicationInputs: 0 }));

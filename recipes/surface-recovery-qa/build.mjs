import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join, resolve, relative} from 'node:path';
import {pathToFileURL} from 'node:url';

const sourceRoot = process.env.SOURCE_ROOT;
const target = process.argv[2];
if (!sourceRoot || !['before', 'after'].includes(target)) {
  throw new Error('Usage: SOURCE_ROOT=<exact website checkout> node build.mjs before|after');
}
const root = resolve(sourceRoot);
const out = resolve(import.meta.dirname, target);
if (!existsSync(join(root, 'components', 'HeadAtlasSurface.tsx')) || !existsSync(join(root, 'node_modules', 'esbuild', 'lib', 'main.js'))) {
  throw new Error('SOURCE_ROOT must contain the exact website component and existing esbuild dependency');
}
if (existsSync(out)) throw new Error(`Create-only output exists: ${out}`);
const sha = value => createHash('sha256').update(value).digest('hex');
const esbuild = await import(pathToFileURL(join(root, 'node_modules', 'esbuild', 'lib', 'main.js')).href);
const fixture = readFileSync(join(import.meta.dirname, 'fixture.tsx'), 'utf8');
// Resolve the fixture as if it lived in the source checkout, so all package imports
// use the checkout's installed dependency tree. It never writes into that checkout.
const result = await esbuild.build({
  stdin: {contents: fixture, resolveDir: root, sourcefile: 'fixture.tsx', loader: 'tsx'},
  bundle: true, write: false, metafile: true, format: 'esm', platform: 'browser',
  target: 'es2022', entryNames: 'fixture', outdir: out, loader: {'.css': 'css'},
  absWorkingDir: root, logLevel: 'warning',
});
mkdirSync(out, {recursive: false});
for (const file of result.outputFiles) writeFileSync(file.path, file.contents, {flag: 'wx'});
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Head surface recovery fixture</title><link rel="stylesheet" href="/fixture.css"><style>html,body{margin:0;background:#0b1413;color:#edf5f1;font:16px system-ui}main{padding:12px}.fixture-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.fixture-controls button,.fixture-controls input{font:inherit}output{display:block;margin:10px 0}.fixture-surface{width:min(900px,95vw);height:500px;border:1px solid #658b82}</style></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`;
writeFileSync(join(out, 'index.html'), html, {flag: 'wx'});
const inputs = Object.entries(result.metafile.inputs).map(([path, meta]) => {
  const absolute = path === 'fixture.tsx' ? join(import.meta.dirname, 'fixture.tsx') : resolve(root, path);
  return {path: path === 'fixture.tsx' ? 'fixture.tsx' : relative(root, absolute).replaceAll('\\', '/'), bytes: meta.bytes, sha256: sha(readFileSync(absolute))};
}).sort((a, b) => a.path.localeCompare(b.path));
const packageNames = ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', 'three', 'three-stdlib', 'esbuild'];
const packages = Object.fromEntries(packageNames.map(name => [name, JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version]));
const outputs = result.outputFiles.map(file => ({path: relative(out, file.path).replaceAll('\\', '/'), bytes: file.contents.length, sha256: sha(file.contents)}));
outputs.push({path: 'index.html', bytes: Buffer.byteLength(html), sha256: sha(html)});
const receipt = {schema: 'head-surface-recovery-fixture/1', target, sourceRoot: root, fixtureSha256: sha(fixture), inputs, packages, outputs};
writeFileSync(join(out, 'BUILD_RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({output: out, inputs: inputs.length, packages, outputs}, null, 2));

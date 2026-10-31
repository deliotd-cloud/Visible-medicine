import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = 'public/licenses/native-website-NOTICES.txt';
const MANIFEST = 'LICENSES/native-website/distribution-notices.json';
const EXPECTED = new Set([
  "@babel/runtime@7.29.7",
  "@base-ui/react@1.7.0",
  "@base-ui/utils@0.3.2",
  "@bufbuild/protobuf@1.10.1",
  "@floating-ui/core@1.8.0",
  "@floating-ui/dom@1.8.0",
  "@floating-ui/react-dom@2.1.9",
  "@floating-ui/utils@0.2.12",
  "@livekit/components-react@2.9.24",
  "@livekit/components-styles@1.2.0",
  "@livekit/protocol@1.48.0",
  "@noble/hashes@2.4.0",
  "@react-three/drei@10.7.8",
  "@react-three/fiber@9.7.0",
  "@vitejs/plugin-rsc@0.5.34",
  "class-variance-authority@0.7.1",
  "clsx@2.1.1",
  "its-fine@2.1.1",
  "jose@5.10.0",
  "livekit-client@2.22.0",
  "livekit-server-sdk@2.18.0",
  "lucide-react@1.31.0",
  "react-dom@19.2.8",
  "react-server-dom-webpack@19.2.8",
  "react-use-measure@2.1.7",
  "react@19.2.8",
  "scheduler@0.27.0",
  "suspend-react@0.1.3",
  "tailwind-merge@3.6.0",
  "three-stdlib@2.36.1",
  "three@0.185.1",
  "use-sync-external-store@1.7.0",
  "vinext@1.0.0-beta.8",
  "zustand@5.0.15"
]);
const sha = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const options = { root: DEFAULT_ROOT, manifest: null, output: null, mode: null };
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--check' || arg === '--write') {
    if (options.mode) fail('Choose one mode');
    options.mode = arg;
  } else if (['--root', '--manifest', '--output'].includes(arg)) {
    if (!process.argv[i + 1]) fail(`Missing value for ${arg}`);
    options[arg.slice(2)] = process.argv[++i];
  } else fail(`Unknown argument: ${arg}`);
}
if (!options.mode) fail('Use --check or --write');
const root = resolve(options.root);
const manifestPath = resolve(options.manifest ?? resolve(root, MANIFEST));
const outputPath = resolve(options.output ?? resolve(root, OUTPUT));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.schema !== 'vm-native-website-distribution-notices/1' || manifest.packages.length !== 34) fail('Unexpected manifest schema or count');
if (!/^[a-f0-9]{64}$/.test(manifest.distributionInventorySha256)) fail('Invalid distribution inventory hash');
const names = new Set();
const parts = [Buffer.from('VISIBLE MEDICINE NATIVE WEBSITE — THIRD-PARTY SOFTWARE NOTICES\n\n' +
  'Scope: 34 emitted JavaScript packages in the pinned client, RSC and SSR inventory. Other website assets and hosted services require separate review.\n' +
  `Distribution inventory SHA-256: ${manifest.distributionInventorySha256}\n\n`, 'utf8')];
function source(path) {
  if (typeof path !== 'string' || path.includes('\\') || path.startsWith('/') || /^[A-Za-z]:/.test(path)) fail(`Invalid relative source path: ${path}`);
  const absolute = resolve(root, path);
  if (relative(root, absolute).startsWith('..')) fail(`Source escapes root: ${path}`);
  return absolute;
}
for (const item of manifest.packages) {
  const id = `${item.name}@${item.version}`;
  if (!EXPECTED.has(id) || names.has(id)) fail(`Unexpected or duplicate package: ${id}`);
  names.add(id);
  const metadataPath = source(item.packageJsonPath);
  if (!item.packageJsonPath.endsWith('/package.json') || !(item.packageJsonPath.startsWith('node_modules/') || item.packageJsonPath.includes('/node_modules/'))) fail(`Invalid metadata path: ${id}`);
  const metadataBytes = readFileSync(metadataPath);
  if (sha(metadataBytes) !== item.packageJsonSha256) fail(`Metadata changed: ${id}`);
  const metadata = JSON.parse(metadataBytes.toString('utf8'));
  if (metadata.name !== item.name || metadata.version !== item.version || metadata.license !== item.license) fail(`Package identity or licence changed: ${id}`);
  const packageRoot = dirname(metadataPath);
  const actualRootNotices = readdirSync(packageRoot).filter(n => /^(?:licen[sc]e|notice|copying)(?:\.|$)/i.test(n)).sort();
  const declaredRootNotices = item.texts.filter(t => resolve(source(t.path), '..') === packageRoot).map(t => t.path.split('/').at(-1)).sort();
  if (JSON.stringify(actualRootNotices) !== JSON.stringify(declaredRootNotices)) fail(`Root licence/NOTICE set changed: ${id}`);
  if (!Array.isArray(item.texts) || item.texts.length === 0) fail(`Missing licence text: ${id}`);
  parts.push(Buffer.from(`================================================================================\n${id}\nLicence metadata: ${item.license}\n${item.repository ? `Repository: ${item.repository}\n` : ''}\n`, 'utf8'));
  const seenPaths = new Set();
  for (const entry of item.texts) {
    if (seenPaths.has(entry.path)) fail(`Duplicate source text: ${id}`);
    seenPaths.add(entry.path);
    const bytes = readFileSync(source(entry.path));
    if (sha(bytes) !== entry.sha256) fail(`Licence/NOTICE text changed: ${id}: ${entry.path}`);
    parts.push(Buffer.from(`--- ${entry.path.split('/').at(-1)}${entry.sourceUrl ? ` | ${entry.sourceUrl}` : ''} ---\n`, 'utf8'));
    parts.push(bytes);
    parts.push(Buffer.from('\n\n', 'utf8'));
  }
}
if (names.size !== EXPECTED.size) fail(`Missing inventory entries: ${[...EXPECTED].filter(x => !names.has(x)).join(', ')}`);
const generated = Buffer.concat(parts);
if (options.mode === '--write') {
  writeFileSync(outputPath, generated);
  console.log(`Wrote ${OUTPUT}: ${names.size} packages, SHA-256 ${sha(generated)}`);
} else {
  const current = readFileSync(outputPath);
  if (!current.equals(generated)) fail(`Public notice drifted: ${OUTPUT}`);
  console.log(`Verified ${OUTPUT}: ${names.size} packages, SHA-256 ${sha(generated)}`);
}

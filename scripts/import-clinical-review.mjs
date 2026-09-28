// Reproducible, read-only import from the separately versioned Atlas handoff.
// Run with the Atlas repository path; never read its changing working tree.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const repository = process.argv[2];
if (!repository) throw Error('Supply the Atlas repository path');
const revision = 'bf5c3964677ff866b166404355349267dbf2c503';
const git = (...args) => execFileSync('git', ['-C', repository, ...args], { maxBuffer: 64 * 1024 * 1024 });
const names = new Set(git('ls-tree', '-r', '--name-only', revision).toString().trim().split('\n'));
const output = 'atlas-review';
const files = new Map(), packages = new Set();
const seeds = ['app/review/overview/page.tsx', 'app/review/page.tsx', 'app/review/body/page.tsx', 'app/review/nested/page.tsx', 'app/review/specimens/page.tsx',
  'app/body-explorer.tsx', 'app/shoulder-explorer.tsx', 'app/globals.css', 'app/abdominal-wall-study.tsx', 'app/back-layers-study.tsx', 'app/hra-renal-study.tsx', 'app/hra-pelvis-study.tsx', 'app/um-limb-study.tsx', 'db/schema.ts', 'LICENSES/THIRD_PARTY_NOTICES.md',
  ...['reviews', 'body-review', 'body-review/decisions', 'nested-review', 'specimen-review', 'review-overview'].map(p => `app/api/${p}/route.ts`)];
function resolveImport(file, specifier) {
  const base = specifier.startsWith('@/') ? specifier.slice(2) : posix.normalize(posix.join(posix.dirname(file), specifier));
  const found = [base, ...['.ts', '.tsx', '.json', '.css', '/index.ts', '/index.tsx'].map(ext => base + ext)].find(p => names.has(p));
  if (!found) throw Error(`Missing import ${file}: ${specifier}`);
  return found;
}
function visit(file) {
  if (files.has(file)) return;
  const original = git('show', `${revision}:${file}`).toString();
  files.set(file, original);
  if (!/\.[cm]?[jt]sx?$/.test(file)) return;
  for (const { fileName: specifier } of ts.preProcessFile(original, true, true).importedFiles) {
    if (specifier.startsWith('.') || specifier.startsWith('@/')) visit(resolveImport(file, specifier));
    else packages.add(specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]);
  }
}
seeds.forEach(visit);
const routes = [
  ['/review/overview', '/workspace/atlas-review'],
  ['/review/body', '/workspace/atlas-review/body'],
  ['/review/nested', '/workspace/atlas-review/nested'],
  ['/review/specimens', '/workspace/atlas-review/specimens'],
  ['/review', '/workspace/atlas-review/shoulder'],
];
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = [];
for (const [file, original] of files) {
  let text = original;
  if (/\.[cm]?[jt]sx?$/.test(file)) {
    text = text.replace(/(['"])@\//g, '$1@/atlas-review/');
    // Keep transport separate from source/material/checklist content.
    for (const [from, to] of routes) text = text.replace(new RegExp(`(['"\x60])${from}(?=[?'"\x60])`, 'g'), `$1${to}`);
    for (const endpoint of ['review-overview', 'body-review', 'nested-review', 'specimen-review', 'reviews'])
      text = text.replaceAll('/api/' + endpoint, '/api/atlas-review/' + endpoint);
    for (const table of ['nested_review_events', 'specimen_review_events', 'body_review_events', 'review_events'])
      text = text.replace(new RegExp(`\\b${table}\\b`, 'g'), 'atlas_personal_' + table);
    // Website-owned links are adapted at the navigation boundary; fingerprints
    // and the source-bound query fields remain owned by the Atlas source.
    if (file.startsWith('app/review/')) {
      // This unadmitted source candidate has no website route or registered
      // model. Keep its independent Atlas inspector out of the approval UI.
      if (file === 'app/review/overview/page.tsx') text = text.replace(
        '        <p><Link href="/review/candidates/skin">Inspect the skin candidate (read-only)</Link> — separate from approval-ready selections.</p>\n',
        '',
      );
      if (text.includes('fetch(')) {
        text = text.replaceAll('fetch(', 'clinicalReviewFetch(')
          .replace(/(import )/, "import { clinicalReviewFetch } from '@/lib/clinical-review-fetch';\n$1");
      }
      text = text.replace(/(<(?:Link|a) href=)(\{(?:material|packet)\.atlasLink\})/g, '$1{reviewModelHref($2)}');
      text = text.replaceAll('reviewModelHref({material.atlasLink})', 'reviewModelHref(material.atlasLink)')
        .replaceAll('reviewModelHref({packet.atlasLink})', 'reviewModelHref(packet.atlasLink)');
      if (text.includes('reviewModelHref(')) text = text.replace(/(import )/, "import { reviewModelHref } from '@/lib/clinical-review-links';\n$1");
      text = text.replaceAll('<Link href="/imaging/local">Local CT study</Link>', '')
        .replaceAll('href="/shoulder"', 'href="/workspace/atlas-review/model?kind=shoulder"')
        .replaceAll('`/shoulder?structure=', '`/workspace/atlas-review/model?kind=shoulder&structure=')
        .replaceAll('href="/"', 'href="/atlas"')
        .replaceAll('href="/models/bodyparts3d/credits.html"', 'href="/atlas-runtime/shoulder/models/bodyparts3d/credits.html"');
    }
    if (file.startsWith('app/api/')) {
      text = text.replaceAll('authenticatedReviewer(request.headers)', 'await authenticatedReviewer(request.headers)');
      text = text.replaceAll('return env.DB;', "return env.DB.withSession('first-primary') as unknown as D1Database;")
        .replaceAll('(request, env.DB)', "(request, env.DB.withSession('first-primary') as unknown as D1Database)");
    }
  }
  if (file === 'app/globals.css') text = text.replace("@import 'shadcn/tailwind.css';", "@import '../../components/review-ui-variants.css';");
  const path = output + '/' + file;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  manifest.push({ path: file, sourceSha256: sha(original), importedSha256: sha(text) });
}
writeFileSync(output + '/manifest.json', JSON.stringify({ revision, files: manifest, packages: [...packages].sort() }, null, 2) + '\n');
console.log(JSON.stringify({ revision, files: files.size, bytes: [...files.values()].reduce((n,t)=>n+Buffer.byteLength(t),0), packages: [...packages].sort() }));

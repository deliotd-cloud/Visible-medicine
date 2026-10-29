import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { collectRenderedPackages, renderThirdPartyNotices } from './review-license-notices.mjs';
const root = process.cwd();
let packages = [];
await build({ configFile: false, root: resolve('scripts/clinical-review-viewer'), base: '/atlas-review-viewer/', publicDir: false,
  resolve: { alias: { '@': root } }, css: { postcss: { plugins: [tailwind({ base: root })] } },
  plugins: [react(), { name: 'review-license-notices', generateBundle(_options, bundle) {
    packages = collectRenderedPackages(bundle);
  } }, { name: 'review-framework-boundary', enforce: 'pre',
    resolveId(id) { if (['next/link', 'next/image', 'next/dynamic'].includes(id)) return '\0review-' + id; },
    load(id) { if (id.startsWith('\0review-next/')) return 'export { ' + ({link:'Link',image:'Image',dynamic:'dynamic'}[id.split('/').at(-1)]) + ' as default } from ' + JSON.stringify(resolve('scripts/clinical-review-viewer/framework.tsx')) + ';'; },
  }], build: { outDir: resolve('public/atlas-review-viewer'), emptyOutDir: true, sourcemap: false, minify: !process.argv.includes('--debug') },
  define: { 'process.env.NODE_ENV': JSON.stringify(process.argv.includes('--debug') ? 'development' : 'production') } });
const manifest = JSON.parse(readFileSync('atlas-review/manifest.json'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
writeFileSync('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt',
  renderThirdPartyNotices(packages, manifest.revision,
    readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md', 'utf8')));
const files = ['index.html', 'THIRD_PARTY_NOTICES.txt', ...readdirSync('public/atlas-review-viewer/assets').map(n => 'assets/' + n)].map(path => ({path,sha256:sha(readFileSync('public/atlas-review-viewer/'+path))}));
writeFileSync('public/atlas-review-viewer/manifest.json', JSON.stringify({ sourceCommit: manifest.revision, websiteIntegrationSha256: manifest.websiteIntegrationSha256, mode: process.argv.includes('--debug') ? 'debug' : 'production', files, packages: packages.map(p=>({name:p.name,version:p.version,license:p.license})), personalRecordsIncluded: false, modelDelivery: 'existing-protected-inventory' }, null, 2)+'\n');

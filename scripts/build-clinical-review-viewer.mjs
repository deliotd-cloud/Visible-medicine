import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { resolve, dirname } from 'node:path';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = process.cwd();
const packages = new Map();
await build({ configFile: false, root: resolve('scripts/clinical-review-viewer'), base: '/atlas-review-viewer/', publicDir: false,
  resolve: { alias: { '@': root } }, css: { postcss: { plugins: [tailwind({ base: root })] } },
  plugins: [react(), { name: 'review-license-notices', generateBundle(_options, bundle) {
    const modules = new Set(Object.values(bundle).filter(item=>item.type==='chunk').flatMap(item=>Object.entries(item.modules).filter(([,info])=>info.renderedLength>0).map(([id])=>id)));
    for (const id of modules) {
      if (!id.includes('node_modules') || id.startsWith('\0')) continue;
      let directory = dirname(id.split('?')[0]);
      while (directory !== dirname(directory)) {
        const path = resolve(directory, 'package.json');
        if (existsSync(path)) {
          const pkg = JSON.parse(readFileSync(path, 'utf8'));
          if (pkg.name && pkg.version) { packages.set(pkg.name, { ...pkg, directory }); break; }
        }
        directory = dirname(directory);
      }
    }
  } }, { name: 'review-framework-boundary', enforce: 'pre',
    resolveId(id) { if (['next/link', 'next/image', 'next/dynamic'].includes(id)) return '\0review-' + id; },
    load(id) { if (id.startsWith('\0review-next/')) return 'export { ' + ({link:'Link',image:'Image',dynamic:'dynamic'}[id.split('/').at(-1)]) + ' as default } from ' + JSON.stringify(resolve('scripts/clinical-review-viewer/framework.tsx')) + ';'; },
  }], build: { outDir: resolve('public/atlas-review-viewer'), emptyOutDir: true, sourcemap: false, minify: !process.argv.includes('--debug') },
  define: { 'process.env.NODE_ENV': JSON.stringify(process.argv.includes('--debug') ? 'development' : 'production') } });
const manifest = JSON.parse(readFileSync('atlas-review/manifest.json'));
if (packages.has('next')) throw Error('Framework adapter failed: Next.js must not be bundled in the standalone review viewer.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const notices = ['# Clinical Review third-party notices', 'Atlas source: ' + manifest.revision,
  readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md', 'utf8')];
for (const [name, pkg] of [...packages].sort()) {
  const licenses = readdirSync(pkg.directory).filter(n => /^(license|licence|notice|copying|ofl)(\.|$)/i.test(n));
  const fallback = name === '@react-three/fiber' && pkg.version === '9.7.0' ? 'LICENSES/clinical-review/react-three-fiber-LICENSE.txt' : null;
  if (!licenses.length && !fallback) throw Error('Missing bundled dependency licence: ' + name);
  notices.push('## ' + name + ' ' + pkg.version + ' (' + pkg.license + ')',
    ...licenses.map(n => readFileSync(resolve(pkg.directory, n), 'utf8')),
    ...(fallback ? ['https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/LICENSE', readFileSync(fallback, 'utf8')] : []));
}
writeFileSync('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt', notices.join('\n\n')+'\n');
const files = ['index.html', 'THIRD_PARTY_NOTICES.txt', ...readdirSync('public/atlas-review-viewer/assets').map(n => 'assets/' + n)].map(path => ({path,sha256:sha(readFileSync('public/atlas-review-viewer/'+path))}));
writeFileSync('public/atlas-review-viewer/manifest.json', JSON.stringify({ sourceCommit: manifest.revision, websiteIntegrationSha256: manifest.websiteIntegrationSha256, mode: process.argv.includes('--debug') ? 'debug' : 'production', files, packages: [...packages.values()].map(p=>({name:p.name,version:p.version,license:p.license})), personalRecordsIncluded: false, modelDelivery: 'existing-protected-inventory' }, null, 2)+'\n');

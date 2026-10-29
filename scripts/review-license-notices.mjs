import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const identity = pkg => JSON.stringify([pkg.name, pkg.version]);

export function collectRenderedPackages(bundle) {
  const packages = new Map();
  const modules = new Set(Object.values(bundle)
    .filter(item => item.type === 'chunk')
    .flatMap(item => Object.entries(item.modules)
      .filter(([, info]) => info.renderedLength > 0)
      .map(([id]) => id)));
  for (const id of modules) {
    if (!id.includes('node_modules') || id.startsWith('\0')) continue;
    let directory = dirname(id.split('?')[0]);
    while (directory !== dirname(directory)) {
      const path = resolve(directory, 'package.json');
      if (existsSync(path)) {
        const pkg = JSON.parse(readFileSync(path, 'utf8'));
        if (pkg.name && pkg.version) {
          const key = identity(pkg);
          const found = packages.get(key);
          if (found) {
            if (found.license !== pkg.license) {
              throw Error('Conflicting bundled dependency licence: ' + pkg.name + ' ' + pkg.version);
            }
            if (!found.directories.includes(directory)) found.directories.push(directory);
          } else {
            packages.set(key, { name: pkg.name, version: pkg.version,
              license: pkg.license, directories: [directory] });
          }
          break;
        }
      }
      directory = dirname(directory);
    }
  }
  if ([...packages.values()].some(pkg => pkg.name === 'next')) {
    throw Error('Framework adapter failed: Next.js must not be bundled in the standalone review viewer.');
  }
  return [...packages.values()].sort((a, b) => compare(a.name, b.name) || compare(a.version, b.version));
}

export function renderThirdPartyNotices(packages, manifestRevision, projectNotices,
  fiberFallbackPath = 'LICENSES/clinical-review/react-three-fiber-LICENSE.txt') {
  const notices = ['# Clinical Review third-party notices', 'Atlas source: ' + manifestRevision,
    projectNotices];
  for (const pkg of packages) {
    const fallback = pkg.name === '@react-three/fiber' && pkg.version === '9.7.0';
    const licenseTexts = new Set();
    for (const directory of [...pkg.directories].sort(compare)) {
      const licenseFiles = readdirSync(directory)
        .filter(name => /^(license|licence|notice|copying|ofl)(\.|$)/i.test(name))
        .sort(compare);
      if (!licenseFiles.length && !fallback) {
        throw Error('Missing bundled dependency licence: ' + pkg.name + ' ' + pkg.version);
      }
      for (const name of licenseFiles) licenseTexts.add(readFileSync(resolve(directory, name), 'utf8'));
    }
    notices.push('## ' + pkg.name + ' ' + pkg.version + ' (' + pkg.license + ')',
      ...licenseTexts,
      ...(fallback ? ['https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/LICENSE',
        readFileSync(fiberFallbackPath, 'utf8')] : []));
  }
  return notices.join('\n\n') + '\n';
}

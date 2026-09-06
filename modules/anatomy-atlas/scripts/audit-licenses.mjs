import { readFile, mkdir, writeFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
const reviewedOverrides = new Map([
  ['webgl-constants@1.1.1', { license: 'MIT', evidence: 'node_modules/webgl-constants/LICENSE' }],
]);
const packages = Object.entries(lock.packages ?? {})
  .filter(([path]) => path.length > 0)
  .map(([path, metadata]) => {
    const name = metadata.name ?? path.replace(/^.*node_modules\//, '');
    const version = metadata.version ?? 'unknown';
    const override = reviewedOverrides.get(`${name}@${version}`);
    return {
      name,
      version,
      license: metadata.license ?? override?.license ?? 'NOT_DECLARED_IN_LOCKFILE',
      licenseEvidence: metadata.license ? 'package-lock.json' : override?.evidence ?? null,
      developmentOnly: metadata.dev === true,
      optional: metadata.optional === true,
    };
  })
  .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));

const acceptedCommercialLicenses = new Set([
  '0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BlueOak-1.0.0',
  'CC-BY-4.0', 'CC0-1.0', 'ISC', 'MIT', 'MIT AND ISC', 'MIT OR Apache-2.0',
  'MPL-2.0', 'Python-2.0', 'LGPL-3.0-or-later',
  'Apache-2.0 AND LGPL-3.0-or-later',
  'Apache-2.0 AND LGPL-3.0-or-later AND MIT',
]);

const flagged = packages.filter((item) => !acceptedCommercialLicenses.has(item.license));
const report = {
  schemaVersion: 1,
  generatedFrom: 'package-lock.json',
  packageCount: packages.length,
  result: flagged.length === 0 ? 'PASS_WITH_NOTICE_OBLIGATIONS' : 'MANUAL_REVIEW_REQUIRED',
  policy: {
    prohibited: ['non-commercial-only', 'source-available-with-field-of-use-restrictions', 'mandatory paid runtime'],
    note: 'MPL/LGPL dependencies are commercial-compatible but retain notice and source/relinking obligations. See THIRD_PARTY_NOTICES.md.',
  },
  flagged,
  packages,
};

await mkdir(new URL('../LICENSES/', import.meta.url), { recursive: true });
await writeFile(new URL('../LICENSES/dependency-license-audit.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.result}: ${packages.length} installed packages, ${flagged.length} unclassified.`);

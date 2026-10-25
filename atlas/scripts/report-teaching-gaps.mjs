import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { buildTeachingGapReport } from './teaching-gap-report.mjs';

// Read-only local authoring tool. No patient input, export or clinical decision.
const root = fileURLToPath(new URL('../', import.meta.url));
const options = {};
for (const arg of process.argv.slice(2)) {
  if (arg === '--help' && process.argv.length === 3) {
    console.log('node scripts/report-teaching-gaps.mjs [--region=thorax | --display-region=shoulder-arm] [--topic=ultrasound] [--readiness=pending] [--limit=20]\n--region selects primary ownership; --display-region selects catalog display membership. They are mutually exclusive. Reports current root-body teaching only; writes JSON to stdout. No clinical approval or anatomical completeness implied.');
    process.exit(0);
  }
  const match = /^--(region|display-region|topic|readiness|limit)=(.+)$/.exec(arg);
  if (!match || Object.hasOwn(options, match[1])) throw Error('Unknown, empty or duplicate option: ' + arg);
  options[match[1]] = match[2];
}
if (options.region && options['display-region']) throw Error('--region and --display-region are mutually exclusive');
if (options.limit && (!/^[1-9]\d*$/.test(options.limit) || !Number.isSafeInteger(Number(options.limit)))) throw Error('Limit must be a positive safe integer');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 16e6 }).trim();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceRevision = git(['rev-parse', 'HEAD']);
const bundled = await build({
  stdin: {
    contents: `export {bodyLesson} from './app/body-content.ts';
export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';
export {contentTabs} from './lib/content-types.ts';`,
    resolveDir: root, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const resolver = bundled.outputFiles[0].text;
const api = await import('data:text/javascript;base64,' + Buffer.from(resolver).toString('base64'));
const catalogBytes = await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url));
const catalog = api.bodyDisplayCatalog(JSON.parse(catalogBytes));
const report = buildTeachingGapReport({ structures: catalog.structures, topics: api.contentTabs, lessonFor: api.bodyLesson, sourceRevision });
const choices = {
  region: new Set(catalog.structures.map(s => s.region)),
  'display-region': new Set(catalog.regions.map(region => region.id)),
  topic: new Set(api.contentTabs),
  readiness: new Set(['pending', 'identity-only', 'generated-identification']),
};
for (const key of Object.keys(choices)) if (options[key] && !choices[key].has(options[key])) throw Error('Unknown ' + key + ': ' + options[key]);
const displayedIds = options['display-region']
  ? new Set(catalog.structures.filter(structure => structure.regions.includes(options['display-region'])).map(structure => structure.id))
  : null;
const matching = report.rows.filter(row =>
  (!options.region || row.region === options.region) &&
  (!displayedIds || displayedIds.has(row.id)) &&
  (!options.topic || row.topic === options.topic) &&
  (!options.readiness || row.readiness === options.readiness));
if (git(['rev-parse', 'HEAD']) !== sourceRevision) throw Error('Source commit changed during inventory; rerun');
console.log(JSON.stringify({
  ...report,
  evidence: {
    sourceRevision,
    workingTreeDirty: Boolean(git(['status', '--porcelain', '--untracked-files=normal'])),
    resolverSha256: sha256(resolver),
    catalogSha256: sha256(catalogBytes),
    displayedStructuresSha256: sha256(JSON.stringify(catalog.structures)),
    inventorySha256: sha256(await readFile(new URL('./teaching-gap-report.mjs', import.meta.url))),
    runnerSha256: sha256(await readFile(new URL('./report-teaching-gaps.mjs', import.meta.url))),
    note: 'Working-copy snapshot, not a clean-commit attestation. Hashes identify evaluated inputs; filters never alter full-scope totals.',
  },
  filters: options,
  selectedRegion: options.region
    ? { id: options.region, meaning: 'primary-ownership' }
    : options['display-region']
      ? { id: options['display-region'], meaning: 'catalog-display-membership' }
      : null,
  matchingRows: matching.length,
  rows: matching.slice(0, options.limit ? Number(options.limit) : undefined),
}, null, 2));

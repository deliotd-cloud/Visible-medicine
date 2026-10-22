// Read-only, JSON-only source inventory for ANAT-03. No meshes, builds or validators.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas');
const expected = { head: '2381efe43b75f8a7fb768a069eecd7268c508dac', tree: 'db21ed3dee259c390878450b3495468996a3af85' };
const bodyPath = 'public/models/bodyparts3d/full-body/catalog.json';
const specimenPaths = ['public/models/um-limb/catalog.json', 'public/models/um-knee/catalog.json'];
const target = ['thigh', 'leg', 'foot'];
const bytes = p => readFileSync(join(root, p));
const sha = b => createHash('sha256').update(b).digest('hex');
const source = p => ({ path: p, sha256: sha(bytes(p)) });
const json = p => JSON.parse(bytes(p).toString('utf8'));
const git = (...args) => {
  const run = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
  if (run.status !== 0) throw Error(`Git identity read failed: ${args.join(' ')}: ${run.stderr.trim()}`);
  return run.stdout.trim();
};
const head = git('rev-parse', 'HEAD');
const tree = /^tree ([a-f0-9]{40})$/m.exec(git('cat-file', '-p', 'HEAD'))?.[1];
const status = git('status', '--porcelain');
if (head !== expected.head || tree !== expected.tree || status) throw Error('Atlas HEAD/tree/clean identity differs from the pinned source');
const body = json(bodyPath);
const regionSet = s => [...new Set([s.region, ...(s.regions ?? [])].filter(Boolean))];
const nervous = s => s.system === 'nerves' || s.tissue === 'nerves' || s.tissue === 'nerve' || s.category === 'nerve';
const inTarget = s => regionSet(s).some(r => target.includes(r));
const meshKey = (s, f) => `${s.sourceTree ?? 'specimen'}:${f.file}:${f.sha256}`;
const row = (s, path, scope) => ({ scope, path, id: s.id, fmaId: s.fmaId ?? null, name: s.name, regions: regionSet(s).filter(r => target.includes(r)), sourceMeshKeys: (s.sources ?? []).map(f => meshKey(s, f)) });
const main = body.structures.filter(s => nervous(s) && inTarget(s)).map(s => row(s, bodyPath, 'main-body root'));

// These 20 catalogues are imported by the display composition. Reading their
// rows does not execute admission guards or establish an actual display count.
const displayPath = 'lib/body-display-catalog.ts';
const displayText = bytes(displayPath).toString('utf8');
const libraryPaths = [...displayText.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)]
  .map(m => `lib/${m[1].slice(2)}${m[1].endsWith('.ts') ? '' : '.ts'}`)
  .filter(p => existsSync(join(root, p)));
const augmentationPaths = [...new Set(libraryPaths.flatMap(p => [...bytes(p).toString('utf8')
  .matchAll(/from\s+['"]\.\.\/(public\/models\/[^'"]+\/catalog\.json)['"]/g)]
  .map(m => m[1])))].sort();
if (augmentationPaths.length !== 20) throw Error(`Expected 20 display augmentation catalogues, found ${augmentationPaths.length}`);
const augmentations = augmentationPaths.map(path => {
  const records = json(path).structures ?? [];
  return { ...source(path), rows: records.length, lowerLimbNervousCandidates: records.filter(s => nervous(s) && inTarget(s)).map(s => row(s, path, 'display augmentation candidate')) };
});
const correctionPaths = [...displayText.matchAll(/from\s+['"]\.\.\/(public\/models\/[^'"]+display-correction\.json)['"]/g)].map(m => m[1]).sort();
if (correctionPaths.length !== 3) throw Error('Expected three display corrections');

// All BodyParts3D subcatalogues are screened. Catalogue candidates do not
// prove the nested-anatomy resolver exposes them as a live placement.
const nestedBase = join(root, 'public/models/bodyparts3d');
const nestedPaths = readdirSync(nestedBase, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'full-body')
  .map(d => `public/models/bodyparts3d/${d.name}/catalog.json`)
  .filter(p => existsSync(join(root, p))).sort();
const nestedCatalogues = nestedPaths.map(path => {
  const records = json(path).structures ?? [];
  return { ...source(path), rows: records.length, lowerLimbNervousCandidates: records.filter(s => nervous(s) && inTarget(s)).map(s => row(s, path, 'nested catalogue candidate')) };
});

const specimens = specimenPaths.map(path => {
  const c = json(path), records = c.structures;
  const tissueCounts = Object.fromEntries([...new Set(records.map(s => s.tissue))].sort().map(t => [t, records.filter(s => s.tissue === t).length]));
  const nameHits = records.filter(s => /nerve|nervous|plexus|ganglion/i.test([s.id, s.name, s.sourceName, s.slug].join(' ')));
  const tissueHits = records.filter(nervous);
  return { ...source(path), specimenId: c.specimenId, registeredToBodyParts3D: c.registeredToBodyParts3D,
    rows: records.length, rowsWithRegionField: records.filter(s => Object.hasOwn(s, 'region')).length,
    tissueCounts, nervousTissueRows: tissueHits.map(s => row(s, path, 'independent specimen')),
    nerveNameHits: nameHits.map(s => s.id),
    lowerLimbNervousEntries: records.filter(s => (nervous(s) || nameHits.includes(s)) && (!Object.hasOwn(s, 'region') || inTarget(s))).map(s => row(s, path, 'independent specimen')) };
});
const extra = augmentations.flatMap(a => a.lowerLimbNervousCandidates);
const nested = nestedCatalogues.flatMap(a => a.lowerLimbNervousCandidates);
const specimenRows = specimens.flatMap(s => s.lowerLimbNervousEntries);
const includedCandidates = [...main, ...extra, ...nested, ...specimenRows];
const byRegion = Object.fromEntries(target.map(region => [region, {
  mainRoots: main.filter(r => r.regions.includes(region)).map(r => r.id),
  augmentationCandidates: extra.filter(r => r.regions.includes(region)).map(r => r.id),
  nestedCatalogueCandidates: nested.filter(r => r.regions.includes(region)).map(r => r.id),
  independentSpecimenEntries: specimenRows.filter(r => r.regions.includes(region)).map(r => r.id),
}]));
const docQuotes = [
  ['docs/FULL_BODY_COVERAGE.md', 'No limb peripheral nerves or brachial/lumbosacral plexuses are present.'],
  ['docs/LIMB_NERVE_CHECKS.md', 'This teaches usual motor relationships, not a new peripheral-nerve model.'],
  ['docs/PERIPHERAL_NERVE_CANDIDATES.md', 'No candidate below is imported.'],
  ['docs/PERIPHERAL_NERVE_CANDIDATES.md', 'Next assess component provenance and an explicitly separate schematic prototype;'],
  ['docs/SOURCE_HOLD_SAFEGUARDS.md', 'no-known-source-hold'],
  ['docs/NEURAL_ANATOMY_CURRICULUM.md', 'No new roots, fibres, territories, nuclei, branches or tissue interiors are modelled.'],
  ['docs/UM_LIMB_DISSECTION.md', 'Missing nerves, vessels, fascia'],
];
const references = docQuotes.map(([path, quote]) => {
  const lines = bytes(path).toString('utf8').split(/\r?\n/);
  const at = lines.findIndex(line => line.includes(quote));
  if (at < 0) throw Error(`Missing quoted evidence: ${path}: ${quote}`);
  return { ...source(path), line: at + 1, quote, historical: path === 'docs/PERIPHERAL_NERVE_CANDIDATES.md' };
});
const result = {
  schema: 'visible-medicine.anat-03-lower-limb-nerve-inventory/2',
  sourceIdentity: { head, tree, clean: status === '' },
  method: 'Read-only JSON catalogue scan. Display composition, nested resolver and mesh bytes were not executed or inspected.',
  sourceFiles: [source(bodyPath), source(displayPath), source('lib/body-source-additions.ts'), source('lib/nested-anatomy.ts'), ...libraryPaths.map(source), ...correctionPaths.map(source)],
  mainCatalog: { ...source(bodyPath), roots: body.structures.length, nervousRootsAllRegions: body.structures.filter(nervous).length, lowerLimbNervousRoots: main },
  displayScope: { status: 'NOT_INVENTORIED', reason: 'bodyDisplayCatalog was not executed; catalogue augmentation rows are candidate inputs, not verified display rows.', augmentationCatalogues: augmentations, candidateRowsAcrossCatalogues: augmentations.reduce((n, a) => n + a.rows, 0), correctionFiles: correctionPaths.map(source), lowerLimbNervousCandidateRows: extra },
  nestedScope: { status: 'LIVE_PLACEMENTS_NOT_INVENTORIED', catalogues: nestedCatalogues, lowerLimbNervousCatalogueCandidates: nested },
  independentSpecimens: specimens,
  byRegion, counts: { lowerLimbMainRoots: main.length, lowerLimbAugmentationCandidates: extra.length, lowerLimbNestedCatalogueCandidates: nested.length, lowerLimbSpecimenEntries: specimenRows.length, lowerLimbRegionMembershipsInScannedRows: Object.values(byRegion).reduce((n, x) => n + Object.values(x).reduce((m, y) => m + y.length, 0), 0), distinctSourceMeshKeysInScannedRows: new Set(includedCandidates.flatMap(r => r.sourceMeshKeys)).size },
  classification: { meshKey: 'Source tree + source filename + recorded source SHA-256; region membership is counted separately.', namedBranch: 'A branch label is not an additional source-file part unless the catalogue records that exact source selection.', textOnly: 'Motor relationship teaching does not enter geometry counts.', specimen: 'UM knee and lower limb remain independent and unregistered to BodyParts3D.' },
  documentedStatus: { mainBodyAbsence: 'The pinned archival main-body catalogue has no lower-limb nervous roots.', candidateNote: 'The peripheral-nerve candidate document is historical; its no-import sentence is quoted as dated context, not asserted to describe all current sources.', missingTargetSet: 'An exhaustive named thigh/leg/foot nerve, branch and course target list was not inventoried.', holdPolicy: 'No-known-source-hold does not establish admission or anatomical accuracy.' },
  references,
  limits: ['No full display count or live nested-placement claim.', 'No mesh geometry, source archives, source licensing adjudication or clinical review.', 'Catalogue rows and memberships are not unique clinical structures.'],
};
console.log(JSON.stringify(result));

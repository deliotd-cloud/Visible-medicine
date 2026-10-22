// Read-only, JSON-only ANAT-03 catalogue inventory. No mesh or generated-output access.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas');
const rel = {
  body: 'public/models/bodyparts3d/full-body/catalog.json',
  umLimb: 'public/models/um-limb/catalog.json',
  umKnee: 'public/models/um-knee/catalog.json',
};
const targetRegions = ['thigh', 'leg', 'foot'];
const read = (path) => readFileSync(join(root, path));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (path) => JSON.parse(read(path).toString('utf8'));
const memberships = (s) => [...new Set([s.region, ...(s.regions ?? [])].filter(Boolean))];
const nervous = (s) => s.system === 'nerves' || s.tissue === 'nerves' || s.category === 'nerve';
const meshKey = (s, source) => [s.sourceTree ?? 'specimen-source', source.file, source.sha256].join(':');
const compact = (s, scope, catalog) => ({
  scope, catalog, id: s.id, fmaId: s.fmaId ?? null, name: s.name,
  primaryRegion: s.region ?? null, regionMemberships: memberships(s).filter(r => targetRegions.includes(r)),
  sourceMeshKeys: (s.sources ?? []).map(source => meshKey(s, source)),
});
const body = json(rel.body);
const main = body.structures.filter(s => nervous(s) && memberships(s).some(r => targetRegions.includes(r)));
const nestedDir = join(root, 'public/models/bodyparts3d');
const nestedFiles = readdirSync(nestedDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'full-body')
  .map(d => `public/models/bodyparts3d/${d.name}/catalog.json`)
  .filter(p => existsSync(join(root, p))).sort();
const nested = nestedFiles.flatMap(p => (json(p).structures ?? [])
  .filter(s => nervous(s) && memberships(s).some(r => targetRegions.includes(r)))
  .map(s => compact(s, 'catalogue-defined nested candidate', p)));
const specimen = [rel.umLimb, rel.umKnee].flatMap(p => json(p).structures
  .filter(s => nervous(s) && memberships(s).some(r => targetRegions.includes(r)))
  .map(s => compact(s, 'independent specimen', p)));
const mainRows = main.map(s => compact(s, 'main-body root', rel.body));
const rows = [...mainRows, ...nested, ...specimen];
const unique = [...new Set(rows.flatMap(r => r.sourceMeshKeys))].sort();
const byRegion = Object.fromEntries(targetRegions.map(region => [region, {
  mainRoots: mainRows.filter(r => r.regionMemberships.includes(region)).map(r => r.id),
  nestedPlacements: nested.filter(r => r.regionMemberships.includes(region)).map(r => r.id),
  independentSpecimenEntries: specimen.filter(r => r.regionMemberships.includes(region)).map(r => r.id),
}]));
const docs = [
  ['docs/FULL_BODY_COVERAGE.md', 'No limb peripheral nerves or brachial/lumbosacral plexuses are present.'],
  ['docs/LIMB_NERVE_CHECKS.md', 'This teaches usual motor relationships, not a new peripheral-nerve model.'],
  ['docs/PERIPHERAL_NERVE_CANDIDATES.md', 'No candidate below is imported.'],
  ['docs/SOURCE_HOLD_SAFEGUARDS.md', 'no-known-source-hold'],
  ['docs/NEURAL_ANATOMY_CURRICULUM.md', 'No new roots, fibres, territories, nuclei, branches or tissue interiors are modelled.'],
  ['docs/UM_LIMB_DISSECTION.md', 'Missing nerves, vessels, fascia'],
];
const references = docs.map(([path, quote]) => {
  const bytes = read(path);
  const lines = bytes.toString('utf8').split(/\r?\n/);
  const line = lines.findIndex(s => s.includes(quote));
  return { path, sha256: hash(bytes), line: line < 0 ? null : line + 1, quote };
});
const sources = Object.fromEntries(Object.entries(rel).map(([key, path]) => [key, { path, sha256: hash(read(path)) }]));
const output = {
  schema: 'visible-medicine.anat-03-lower-limb-nerve-inventory/1',
  sourceIdentity: { expectedHead: '2381efe43b75f8a7fb768a069eecd7268c508dac', expectedTree: 'db21ed3dee259c390878450b3495468996a3af85', gitVerifiedSeparately: true },
  sources, inspectedNestedCatalogs: nestedFiles.length,
  counts: { bodyCatalogRoots: body.structures.length, bodyNervousRootsAllRegions: body.structures.filter(nervous).length, lowerLimbMainNervousRoots: mainRows.length, lowerLimbNestedNervousPlacements: nested.length, lowerLimbIndependentSpecimenNervousEntries: specimen.length, lowerLimbRegionMemberships: Object.values(byRegion).reduce((n, r) => n + r.mainRoots.length + r.nestedPlacements.length + r.independentSpecimenEntries.length, 0), uniqueSourceMeshIdentities: unique.length },
  byRegion, included: rows, uniqueSourceMeshIdentities: unique,
  classification: {
    root: 'A catalogue nervous-system structure in the main BodyParts3D body only.',
    nested: 'A nervous-system structure in a separate BodyParts3D subcatalogue; catalogue presence alone does not prove live nested placement.',
    independentSpecimen: 'UM lower-limb/knee geometry is a separate, unregistered specimen and is never counted as main-body anatomy.',
    meshIdentity: 'Deduplicated by source tree, source filename and recorded source SHA-256; region membership is a separate display relationship.',
    namedBranch: 'A named branch would count as a structure only when its exact catalogue identity and source selection exist; a name is not an extra source-file part.',
    textOnly: 'Motor-innervation teaching is excluded from geometry counts.',
  },
  documentedStatus: {
    absentMainBody: 'No included thigh/leg/foot nervous root or nested entry found in inventoried catalogues; documentation also says limb peripheral nerves and plexuses are absent.',
    specimen: 'The two independent UM specimen catalogues contain no nervous entries; they are not registered to the main body.',
    heldCandidates: 'Peripheral-nerve candidate notes retain SPARC path files and other leads outside live geometry; source/provenance, rights and spatial review remain separate gates.',
    heldSourcePolicy: 'A no-known-source-hold result would not establish anatomical accuracy or admission.',
    namedMissingList: 'Not inventoried here: an exhaustive list of named missing thigh, leg and foot nerves, branches or courses. The catalogue cannot define a complete target set.',
  },
  references,
  limits: ['Metadata only: no mesh bytes, spatial continuity, source archive, current live renderer or clinical review inspected.', 'A catalogue row, region placement and source mesh identity are different units; none is a count of unique clinical structures.'],
};
console.log(JSON.stringify(output, null, 2));

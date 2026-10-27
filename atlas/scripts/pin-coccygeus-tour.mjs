import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

const baseline='6ce2153ec403e2abdd41a1cce897dc08f5caf338';
const catalogSha256='109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7';
const tourRevision='coccygeus-pelvic-landmarks-20261027-r1';
const ids=[
  ['FMA46443','vm:anatomy:body:pelvis:right:muscle:right-coccygeus','pelvis-muscles','right'],
  ['FMA46444','vm:anatomy:body:pelvis:left:muscle:left-coccygeus','pelvis-muscles','left'],
  ['FMA16586','vm:anatomy:body:pelvis:right:bone:right-hip-bone','pelvis-skeleton','right'],
  ['FMA16587','vm:anatomy:body:pelvis:left:bone:left-hip-bone','pelvis-skeleton','left'],
  ['FMA16202','vm:anatomy:body:spine:midline:bone:sacrum','spine-skeleton','midline'],
];
const args=process.argv.slice(2);
const rootFlag=args.find(arg=>arg.startsWith('--atlas-root='));
assert(args.every(arg=>arg==='--check'||arg==='--write'||arg.startsWith('--atlas-root=')));
assert.equal(args.filter(arg=>arg==='--check'||arg==='--write').length,1,'Select --check or --write.');
const root=resolve(rootFlag?.slice('--atlas-root='.length)??process.cwd());
const pinPath=fileURLToPath(new URL('../content/coccygeus-tour-pins.json',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=readFileSync(join(root,'public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(sha(raw),catalogSha256,'Exact baseline catalogue changed.');
const {bodyDisplayCatalog}=await import(pathToFileURL(join(root,'lib/body-display-catalog.ts')).href);
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const records=ids.map(([fma,id,bundle,side])=>{
  const found=catalog.structures.filter(entry=>entry.fmaId===fma||entry.id===id);
  assert.equal(found.length,1,`${fma}: exact display identity`);
  const record=found[0];
  assert.equal(record.id,id);assert.equal(record.fmaId,fma);assert.equal(record.bundle,bundle);
  assert.equal(record.laterality,side);assert(record.regions.includes('pelvis'));
  assert.deepEqual(record.validation,{status:'unvalidated',anatomicalReview:false});
  assert(record.sources.length>0&&record.bounds.min.every((n,i)=>Number.isFinite(n)&&n<record.bounds.max[i]));
  return record;
});
assert.equal(new Set(records.map(record=>record.id)).size,5);
const bundleIds=['pelvis-muscles','pelvis-skeleton','spine-skeleton'];
const bundles=bundleIds.map(id=>{
  const found=catalog.bundles.filter(bundle=>bundle.id===id);assert.equal(found.length,1,id);
  const bundle=found[0];
  assert(/^\/models\/bodyparts3d\/full-body\/[a-z-]+\.glb$/.test(bundle.url));
  const bytes=readFileSync(join(root,'public',bundle.url.slice(1)));
  assert.equal(bytes.length,bundle.bytes,id);assert.equal(sha(bytes),bundle.sha256,id);
  return bundle;
});
const pins={schemaVersion:1,baseline,catalogSha256,tourRevision,sourceVersion:catalog.sourceVersion,
  coordinateSystem:catalog.coordinateSystem,license:catalog.license,
  entries:records.slice(0,2),contextEntries:records.slice(2),bundles};
if(args.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(pinPath,'utf8')),pins);
else {assert(!existsSync(pinPath),'Never overwrite source pins.');writeFileSync(pinPath,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({mode:args.includes('--check')?'check':'write',targets:2,context:3,bundles:3,pinsSha256:sha(Buffer.from(JSON.stringify(pins)))}));

import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {sourceObjShape} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';
import {geometryFingerprint} from './anatomy-inventory.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync('docs/ocular-detail-source-audit.json');
assert.equal(sha(bytes),'cb82aa915ae30dfb1ad0e2b7f0f1044d44ea6c4ac83bca096c4920a80cb31960');
const report=JSON.parse(bytes),state=await loadCurrentSourceHolds();
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(state.catalog);
const rawOption=process.argv.find(a=>a.startsWith('--raw-source='))?.slice('--raw-source='.length);
test('new ocular source evidence retains exact rights, frame scope and four non-admissions',()=>{
 assert.equal(report.sourceVersion,'4.0');assert.equal(report.license,'CC-BY-4.0');assert.equal(report.credit,state.inventory.credit);assert.deepEqual(report.evidence,state.evidence);
 assert.equal(report.directorySha256,state.inventory.archives.find(a=>a.tree==='isa').directorySha256);
 assert.deepEqual(report.groups.map(g=>[g.id,g.file]),[['FMA59541','FJ1352'],['FMA59542','FJ1301'],['FMA58483','FJ1338'],['FMA58484','FJ1287']]);
 assert.equal(report.admitted,false);assert.equal(report.clinicalApproved,false);assert.equal(report.sourceOrCatalogueChanged,false);
 for(const row of report.groups){
  const definition=state.records.find(r=>r.tree==='isa'&&r.id===row.id);assert.deepEqual(row.definition,definition);assert.deepEqual(row.aliases,state.records.filter(r=>r.files.includes(row.file)));
  assert.equal(row.allVerticesNamedSide,true);assert.equal(row.admitted,false);assert.equal(row.clinicalApproved,false);assert.match(row.sha256,/^[a-f0-9]{64}$/);
  assert(!catalog.structures.some(s=>s.sources.some(input=>input.file===row.file)),'Candidate must remain outside learner catalogue until separately admitted');
  const owners=catalog.structures.filter(s=>s.region==='head-neck'&&s.laterality===row.side&&/eyeball|lacrimal|canaliculus|nasolacrimal|tarsal|ciliary/i.test(s.name));assert.equal(owners.length,row.contextOwnerCount);assert.equal(row.contextOwnerCount,13);assert.deepEqual(row.notCached,[]);assert(row.comparisons.length>=8);
  for(const pair of row.comparisons){const owner=owners.find(s=>s.id===pair.owner);assert(owner);assert.equal(owner.name,pair.name);assert(owner.sources.some(input=>input.file===pair.file&&input.sha256===pair.sha256));assert.equal(pair.sharedExactTriangles,0);assert(pair.candidateToContext.samples>0);assert(Number.isFinite(pair.candidateToContext.medianMm));}
  if(rawOption){const raw=readFileSync(rawOption+'/'+row.file+'.obj');assert.equal(sha(raw),row.sha256);assert.equal(raw.length,row.bytes);assert.equal(geometryFingerprint(raw),row.geometrySha256);const shape=sourceObjShape(raw);assert.deepEqual(sourceTopology(shape),row.topology);assert.deepEqual({min:shape.min,max:shape.max,centre:shape.centre},row.sourceBounds);}
 }
});
test('lake candidates are bounded closed originals; fragmented ciliary candidates are not repaired or relabelled',()=>{
 for(const row of report.groups.slice(0,2)){assert.equal(row.topology.triangles,248);assert.equal(row.topology.components.length,1);assert.equal(row.topology.closedOrientedManifold,true);assert.equal(row.topology.duplicateFaces,0);assert.equal(row.topology.degenerateFaces,0);state.policy.assertNoKnownHolds([row.definition]);assert(row.comparisons.some(p=>/lacrimal canaliculus/i.test(p.name)&&p.candidateToContext.withinQuarterMm>0));}
 const [right,left]=report.groups.slice(2);assert.equal(right.topology.components.length,53);assert.equal(left.topology.components.length,52);assert.equal(right.topology.duplicateFaces,9);assert.equal(left.topology.duplicateFaces,18);assert.equal(right.topology.degenerateFaces,11);assert.equal(left.topology.degenerateFaces,62);
 for(const row of [right,left]){assert.equal(row.topology.closedOrientedManifold,false);assert.equal(row.admitted,false);assert(row.aliases.some(a=>a.id===row.id));}
});

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {loadCurrentSourceHolds,preflightCurrentSourceHolds,composeSourceHoldPolicy} from './current-source-holds.mjs';
import {loadSourceHolds} from './load-source-holds.mjs';
import {tibialRecurrentSources} from './tibial-recurrent-sources.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile('docs/tibial-recurrent-source-audit.json');
assert.equal(sha(bytes),'78d221460bddf648d3f1ef5eab3183fb594e3a515b93a0e8c70beeea848ace26');
const audit=JSON.parse(bytes),current=await loadCurrentSourceHolds(),archive=await loadSourceHolds();
assert.equal(audit.admissionApproved,false);
assert.equal(audit.clinicalApproval,false);
assert.equal(audit.heldComponentCount,59); // Historical evidence, not today's count.
assert.deepEqual(tibialRecurrentSources.map(s=>s.id),['FMA43908','FMA43907']);
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(current.catalog);
assert.equal(catalog.structures.length,1104,'Review packet must be rebound to a changed display baseline');
let aliases=0;
for(const source of tibialRecurrentSources){
  const definition=current.records.find(r=>r.tree==='isa'&&r.id===source.id);
  assert(definition);
  assert.equal(current.policy.inspect(definition).status,'blocked-known-source-hold');
  await assert.rejects(preflightCurrentSourceHolds([definition]),/Source hold blocks/);
  assert.equal(archive.policy.inspect(definition).status,'no-known-source-hold');
  const group=audit.groups.find(g=>g.id===source.id);
  assert.equal(group.sha256,source.files[0].sha256);
  assert.equal(group.topology.closedOrientedManifold,true);
  assert.equal(group.admissionApproved,false); // A closed mesh never overrides hold.
  assert.equal(catalog.structures.some(s=>s.sourceTree==='isa'&&s.sources.some(f=>definition.files.includes(f.file))),false);
  for(const alias of current.records.filter(r=>r.tree==='isa'&&r.id!==source.id&&r.files.some(f=>definition.files.includes(f)))){
    await assert.rejects(preflightCurrentSourceHolds([alias]),/Source hold blocks/);aliases++;
  }
  assert.throws(()=>current.policy.inspect({...definition,name:'corrected artery'}));
  assert.throws(()=>current.policy.inspect({...definition,files:['FJ999999']}));
  const review=JSON.parse(await readFile(`docs/reviews/tibial-recurrent-${source.side}.json`));
  assert.equal(review.target,group.sha256);
  assert.equal(review.sourceId,source.id);
  assert.equal(review.auditSha256,sha(bytes));
  assert.equal(review.imageSha256,sha(await readFile(`docs/reviews/tibial-recurrent-${source.side}.png`)));
  assert.equal(review.projection.candidateClipped,false);
  assert.equal(review.geometryModified,false);
  assert.equal(review.clinicalApproved,false);
}
// Fail closed when a hold's official membership is changed.
assert.equal(aliases,28,'Source-sharing alias coverage changed');
const bad=structuredClone(current.supplemental);
bad.find(s=>s.id==='FMA43907').files[0].file='FJ2066';
assert.throws(()=>composeSourceHoldPolicy(archive.policy,current.records,bad),/membership changed/);
// Recheck every currently displayed definition, not only an unrelated sample.
for(const s of catalog.structures){
  current.policy.assertNoKnownHolds([{tree:s.sourceTree,id:s.fmaId,name:s.sourceName,files:s.sources.map(f=>f.file)}]);
}
console.log(JSON.stringify({heldCandidates:2,blockedAliases:aliases,displayedDefinitionsUnchanged:catalog.structures.length,reviewFiguresVerified:2,clinicalApproval:false}));

import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import test from 'node:test';
import {restoreRegionalScopeCatalogue,regionalScopeCatalogueHashes} from './regional-scope-catalogue-inverse.mjs';
import {restoreRegionalDurationCatalogue} from './regional-duration-source-inverse.mjs';
const current=readFileSync('lib/regional-learning-catalogue.ts','utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
test('scope projection restores the entire original duration source before its unchanged inverse',()=>{
 const prior=restoreRegionalScopeCatalogue(current);
 assert.equal(sha(prior),regionalScopeCatalogueHashes.prior);
 assert.equal(restoreRegionalDurationCatalogue(current),restoreRegionalDurationCatalogue(prior));
 assert.equal(sha(restoreRegionalDurationCatalogue(current)),'ce8ed296310c459fac979b4d8f1f52745e46a0877ec10801a728aeaebeedba93');
});
test('altered scope admission, visibility, destination and duration cannot enter the projection',()=>{
 for(const [from,to] of [['new Set(scopeRegionIds).size!==scopeRegionIds.length','false'],['tour.scopeRegions??[]','[]'],['regionalTourMatchesRegion(tour,region.id)','true'],['href:destination.href','href:"/wrong"'],['guidedPlaybackDuration(step.caption,step.durationMs,1)','0']]){
  assert(current.includes(from));const changed=current.replace(from,to);
  assert.throws(()=>restoreRegionalScopeCatalogue(changed));assert.throws(()=>restoreRegionalDurationCatalogue(changed));
 }
 assert.throws(()=>restoreRegionalScopeCatalogue(current+'\n// foreign\n'));
 assert.throws(()=>restoreRegionalScopeCatalogue(restoreRegionalScopeCatalogue(current)));
});

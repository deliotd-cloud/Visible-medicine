import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=text=>createHash('sha256').update(text).digest('hex');
export const regionalScopeCatalogueHashes=Object.freeze({current:'8dbc29f38348e1446d807518d0093253a2b4087ff887b8c8f03d807ed7549f60',prior:'84aef27d93e941ef938a0a63bb3bc3eebe7b4ee689ad179968d465bde282272d'});

/** Exact historical projection of authored discovery-scope additions only.
 * Current scope behavior is exercised by regional-scope-discovery.test.mjs. */
export function restoreRegionalScopeCatalogue(source){
  assert.equal(sha(source),regionalScopeCatalogueHashes.current,'Exact scope-aware catalogue');
  const seams=[
    ["import {regionalTourMatchesRegion,type RegionalLearningCatalogueData,type RegionalLearningTour}","import type {RegionalLearningCatalogueData,RegionalLearningTour}"],
    ["      const scopeRegionIds=tour.scopeRegions??[];\n      if(!Array.isArray(scopeRegionIds)||scopeRegionIds.length>atlasBodyRegions.length||\n        new Set(scopeRegionIds).size!==scopeRegionIds.length||\n        scopeRegionIds.some(id=>!atlasBodyRegions.some(region=>region.id===id)))throw Error('Scope unavailable');\n",''],
    ['        ...(scopeRegionIds.length?{scopeRegionIds:[...scopeRegionIds]}:{}),\n',''],
    ['result.some(tour=>regionalTourMatchesRegion(tour,region.id))','result.some(tour=>tour.regionId===region.id)'],
  ];
  for(const [after,before] of seams){assert.equal(source.split(after).length,2,'One exact authored scope seam');source=source.replace(after,before);}
  assert.equal(sha(source),regionalScopeCatalogueHashes.prior,'Entire duration-aware predecessor');
  return source;
}

import fs from 'node:fs';
import assert from 'node:assert/strict';
import {clonePinnedWebsite} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/clone-pinned-website-stage-20261026.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261028-regional-scope-discovery';
const pf='F:/VisibleMedicine/staging/20261028-tour-delivery-website/SOURCE_CANDIDATE_V2.json',ph='f81c4fd2c2907f573804530905d01a5aedd87c1c7b9ca07d9315fbaf82a5d61b';
const {parent,site}=clonePinnedWebsite({stage,parentFile:pf,parentSha256:ph});
const changed=['lib/regional-learning-discovery.ts','lib/regional-learning-catalogue.ts','components/RegionalLearningCatalogue.tsx'];
const protectedInputs=json(site+'/atlas-review/integration-inputs.json');
assert(changed.every(p=>!protectedInputs.inputs.some(r=>r.path===p)));
const seams=[];
function edit(file,before,after){const full=site+'/'+file,text=fs.readFileSync(full,'utf8');assert.equal(text.split(before).length,2,file);fs.writeFileSync(full,text.replace(before,after));seams.push({file,before,after});}
edit(changed[0],'  continuousPlaybackMs?:number;',`  /** Authored framing regions, including contextual structures. Discovery only:
   * these do not change the launch region or imply imaging coverage. */
  scopeRegionIds?:string[];
  continuousPlaybackMs?:number;`);
fs.appendFileSync(site+'/'+changed[0],`\n/** Related regions never replace the canonical launch destination. */
export function regionalTourMatchesRegion(tour:RegionalLearningTour,regionId:string):boolean {
  return tour.regionId===regionId || tour.scopeRegionIds?.includes(regionId)===true;
}
`);
edit(changed[1],"import type {RegionalLearningCatalogueData,RegionalLearningTour} from './regional-learning-discovery';","import {regionalTourMatchesRegion,type RegionalLearningCatalogueData,type RegionalLearningTour} from './regional-learning-discovery';");
edit(changed[1],"      if(!destination)throw Error('Region unavailable');",`      if(!destination)throw Error('Region unavailable');
      const scopeRegionIds=tour.scopeRegions??[];
      if(!Array.isArray(scopeRegionIds)||scopeRegionIds.length>atlasBodyRegions.length||
        new Set(scopeRegionIds).size!==scopeRegionIds.length||
        scopeRegionIds.some(id=>!atlasBodyRegions.some(region=>region.id===id)))throw Error('Scope unavailable');`);
edit(changed[1],'        limitations:regionalTourLimitations(tour),steps,','        limitations:regionalTourLimitations(tour),steps,\n        ...(scopeRegionIds.length?{scopeRegionIds:[...scopeRegionIds]}:{}),');
edit(changed[1],'result.some(tour=>tour.regionId===region.id)','result.some(tour=>regionalTourMatchesRegion(tour,region.id))');
edit(changed[2],"import type { RegionalLearningCatalogueData } from '../lib/regional-learning-discovery';","import { regionalTourMatchesRegion, type RegionalLearningCatalogueData } from '../lib/regional-learning-discovery';");
edit(changed[2],"if (current.region !== 'all' && tour.regionId !== current.region) return false;","if (current.region !== 'all' && !regionalTourMatchesRegion(tour, current.region)) return false;");
edit(changed[2],'<span>{tour.regionLabel} · {tour.steps.length}',"<span>{current.region !== 'all' && tour.regionId !== current.region ? 'Opens in ' : ''}{tour.regionLabel} · {tour.steps.length}");
edit(changed[2],'<p className="regional-learning-catalogue-instructions">Duration estimates','<p className="regional-learning-catalogue-instructions">Region filters also include tours whose framing uses structures from that region. A tour may open in Whole body to keep those relationships visible; its named steps describe what it teaches.</p>\n    <p className="regional-learning-catalogue-instructions">Duration estimates');
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
for(const r of protectedInputs.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
fs.writeFileSync(stage+'/PRODUCT_CHANGE.json',JSON.stringify({at:new Date().toISOString(),parent:{path:pf,sha256:ph},changed,seams,protectedInputsUnchanged:true,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,site,changed,sourceRows:parent.sourceRows.length}));

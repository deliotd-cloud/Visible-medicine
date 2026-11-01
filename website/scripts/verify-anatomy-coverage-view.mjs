import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';

/** Check the actual read-only Review projection; never relax its source pins. */
export async function verifyAnatomyCoverageView({
  snapshot=JSON.parse(readFileSync(new URL('../docs/anatomy-coverage/index.json',import.meta.url))),
  manifest=JSON.parse(readFileSync(new URL('../atlas-review/manifest.json',import.meta.url))),
}={}){
  // Retain the project's Node22.13 minimum without requiring native TS flags.
  // Only the data projection is called; its private UI loader is not invoked.
  const source=readFileSync(new URL('../lib/anatomy-coverage-view.ts',import.meta.url),'utf8');
  const {code}=await transform(source,{loader:'ts',format:'esm',target:'es2022'});
  const {projectCoverageView}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const view=await projectCoverageView(snapshot,manifest);
  assert(view,'Anatomy coverage is unavailable for this Atlas source. Regenerate and review the four scoped inventories, then rebind the exact Review projection; do not copy an older revision forward.');
  assert.equal(view.sourceRevision,manifest.revision,'Coverage must match the imported Atlas');
  return {sourceRevision:view.sourceRevision,inventoryRevision:view.inventoryRevision,
    scopes:4,clinicalApprovalAsserted:false,anatomicalCompletenessProven:false};
}

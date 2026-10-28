import fs from 'node:fs';import assert from 'node:assert/strict';
import {clonePinnedWebsite} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/clone-pinned-website-stage-20261026.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261028-head-search-comparison',pf='F:/VisibleMedicine/staging/20261028-regional-scope-discovery/SOURCE_CANDIDATE.json',ph='c795572081397c2d5ea5f62b038c87426bc97d16001c97eacaae56953e92d6c4';
const {parent,site}=clonePinnedWebsite({stage,parentFile:pf,parentSha256:ph});
const file='components/HeadAtlasLearningLibrary.tsx',seams=[];
assert(!json(site+'/atlas-review/integration-inputs.json').inputs.some(r=>r.path===file));
const original=fs.readFileSync(site+'/'+file,'utf8'),before=hash(site+'/'+file);let text=original;
function edit(a,b){assert.equal(text.split(a).length,2,a);text=text.replace(a,b);seams.push([a,b]);}
edit('      {visible.map(match=><div className=', '      {visible.map(match=>{\n        const comparison=match.links&&hasSelectedView(match.links,modality)?headGuidedComparisonForStep(sequence.id,match.id):null;\n        return <div className=');
edit('        </nav>:<span>Exact comparison unavailable in the selected view</span>}\n      </div>)}', '          {comparison&&<a href={comparison.activityHref} aria-label={`Compare views for ${match.label} at step ${match.index+1}`}>Compare views</a>}\n        </nav>:<span>Exact comparison unavailable in the selected view</span>}\n      </div>;})}');
fs.writeFileSync(site+'/'+file,text);const after=hash(site+'/'+file);
const fixture='tests/fixtures/head-search-comparison-source.json';fs.writeFileSync(site+'/'+fixture,JSON.stringify({path:file,before,after,seams},null,2)+'\n',{flag:'wx'});
const helper='tests/head-search-comparison-predecessor.mjs';
fs.writeFileSync(site+'/'+helper,`import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/head-search-comparison-source.json',import.meta.url)));
const sha=text=>createHash('sha256').update(text).digest('hex');
export function headSearchComparisonPredecessor(current){
 assert.equal(sha(current),spec.after,'Exact current comparison UI');
 let old=current;for(const[a,b]of spec.seams.toReversed()){assert.equal(old.split(b).length,2);old=old.replace(b,a);}
 assert.equal(sha(old),spec.before,'Complete predecessor UI retained');
 let rebuilt=old;for(const[a,b]of spec.seams){assert.equal(rebuilt.split(a).length,2);rebuilt=rebuilt.replace(a,b);}assert.equal(rebuilt,current);
 return old;
}
`,{flag:'wx'});
const test='tests/guided-catalogue-compact.test.mjs',oldTest=fs.readFileSync(site+'/'+test,'utf8');
const insertion="  const source=headSearchComparisonPredecessor(readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8'));\n";
assert.equal(oldTest.split('function beforeComparisonSource(){\n').length,2);
const nextTest="import {headSearchComparisonPredecessor} from './head-search-comparison-predecessor.mjs';\n"+oldTest.replace('function beforeComparisonSource(){\n','function beforeComparisonSource(){\n'+insertion);
assert.equal(nextTest.replace("import {headSearchComparisonPredecessor} from './head-search-comparison-predecessor.mjs';\n",'').replace(insertion,''),oldTest);
fs.writeFileSync(site+'/'+test,nextTest);
const changed=[file,test],added=[fixture,helper];
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
fs.writeFileSync(stage+'/PRODUCT_CHANGE.json',JSON.stringify({at:new Date().toISOString(),parent:{path:pf,sha256:ph},changed,added,sourcePredecessor:{before,after,seams},originalCompactTestSha256:parent.sourceRows.find(r=>r.path===test).sha256,compactTestInsertion:insertion,allOriginalTestAssertionsPreserved:true,protectedReviewInputsUnchanged:true,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,site,changed,added}));

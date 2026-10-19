import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const pins={colic:'76efe78cb9e237ac51d961390c762be364bbcad4ad18c448482a4c4552e16d0b',hepatic:'55b2f98bb5e9436419f2db2a4e8e46195d0b91cbf0478105cecf57df597c5a74'};
const seams=[
 ["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';","import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 [`const liveCommit='${historical}';`,`const historicalLiveCommit='${historical}';\nconst liveCommit=CURRENT_ATLAS_REVISION;`],
 ["const atlas='F:/VisibleMedicine/atlas';","const atlas=currentAtlasDeliveryRoot();"],
 ["  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);","  assert.equal(revision,liveCommit,'Exact pinned current Review source');\n  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);"],
 ["  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit,'Exact live source head');","  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit,'Exact live source head');\n  git(['merge-base','--is-ancestor',historicalLiveCommit,liveCommit]);\n  for(const path of paths)assert.deepEqual(committed(liveCommit,path),committed(historicalLiveCommit,path),`${path}: historical 9f teaching/source bytes preserved at current admission`);"],
];
for(const [name,pin]of Object.entries(pins)){
 const file='clinical-review-'+name+'-arterial-xray.test.ts';
 const original=readFileSync(new URL('./fixtures/vascular-live-before-20261019/'+file+'.raw',import.meta.url));
 const actual=readFileSync(new URL('./'+file,import.meta.url)).toString('utf8');
 assert.equal(sha(original),pin,'Exact whole original '+name);
 let expected=original.toString('utf8');for(const [from,to]of seams){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}
 const prove=text=>assert.deepEqual(Buffer.from(text),Buffer.from(expected));
 test(name+' retains the complete original proof outside five explicit current-admission seams',()=>prove(actual));
 test(name+' refuses historical, source, mapping, Review, model, emitted, population and security guard deletion',()=>{
  for(const needle of [`historicalLiveCommit='${historical}'`,
   'for(const path of paths)assert.deepEqual(committed(liveCommit,path),committed(historicalLiveCommit,path)',
   "assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog)",
   'for(const bundle of catalog.bundles)',
   'const livePacket=wire(await live.bodyReviewMaterial(id))',
   "assert.equal((await saveLive(forgedLiveDecision)).status,422",
   'const emitted=[emittedTeaching(learner.base,learner.manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)]',
   "for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])assert.deepEqual(after[key],before[key])",
   'assert.deepEqual({placements,changed,packets,changedPackets,storageCalls}',
  ]){assert(actual.includes(needle));assert.throws(()=>prove(actual.replace(needle,'')),needle);}
  assert.throws(()=>prove(actual.replace('const liveCommit=CURRENT_ATLAS_REVISION;',`const liveCommit='${historical}';`)));
 });
}

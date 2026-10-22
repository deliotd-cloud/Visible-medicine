import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const css=readFileSync('app/whole-body-guided-learning.css','utf8');
assert.match(css,/\.whole-body-tour-picker\{[^}]*grid-template-columns:minmax\(0,1fr\) auto;/);
assert.match(css,/\.whole-body-tour-choice\{[^}]*grid-template-columns:auto minmax\(0,1fr\);/);
assert.match(css,/@media\(max-width:700px\)\{\.whole-body-tour-picker\{[^}]*\}\.whole-body-tour-choice\{grid-template-columns:minmax\(0,1fr\);/);
assert.match(css,/\.whole-body-tour-picker input,\.whole-body-tour-picker select[^}]*min-height:44px;/);
const built=await build({stdin:{contents:"export * from './app/whole-body-guided-learning'; export {regionalTours} from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {nestedGuidedStudyOptions} from './lib/nested-guided-learning'; export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'observable-child-boundaries',setup(api){
 api.onLoad({filter:/[\\/]app[\\/]regional-guided-learning\.tsx$/},()=>({loader:'js',contents:'export const RegionalGuidedLearning="RegionalGuidedLearning";'}));
 api.onLoad({filter:/[\\/]app[\\/]eye-layers\.tsx$/},()=>({loader:'js',contents:'export const EyeLayerView="EyeLayerView";'}));
}}]});
const deferred=[],hooks=[];
let hookIndex=0,suspends=0,exits=0;
const mod={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,require(id){return id==='next/dynamic'?(_loader,options)=>{deferred.push(options);return deferred.length===1?'EyeLayerView':'VentricularView';}:id==='react'?{...React,useId:()=>':tour-picker:',useState:initial=>{const index=hookIndex++;if(!(index in hooks))hooks[index]=initial;return[hooks[index],next=>{hooks[index]=next;}];}}:require(id);}});
const api=mod.exports,plain=value=>JSON.parse(JSON.stringify(value));
assert.equal(deferred.length,2,'Nested viewers stay deferred');
for(const [options,pendingText] of [[deferred[0],'Loading eye layers…'],[deferred[1],'Loading anatomy spaces…']]){
 const pending=options.loading({error:null,isLoading:true});
 assert.equal(pending.props.role,'status');assert.equal(pending.props.children,pendingText);
 const failed=options.loading({error:new Error('private-loader-detail')});
 assert.equal(failed.props.role,'alert');assert.match(failed.props.children,/choose another tour or Exit tour/i);
 assert.doesNotMatch(failed.props.children,/private-loader-detail|retry|reload/i);
}
const emptyCatalog={structures:[],bundles:[]};
const props={catalog:emptyCatalog,assetBase:'/atlas-runtime/head-neck',onExit:()=>{exits++;},pausedImaging:{suspend:()=>{suspends++;}}};
const nodes=value=>!value||typeof value!=='object'?[]:Array.isArray(value)?value.flatMap(nodes):[value,...nodes(value.props?.children)];
let tree;
const render=()=>{hookIndex=0;tree=api.WholeBodyGuidedLearning(props);};
const reset=()=>{hooks.length=0;render();};
const find=(type,predicate=()=>true)=>{const found=nodes(tree).filter(node=>node.type===type&&predicate(node));assert.equal(found.length,1,`Expected one ${type}`);return found[0];};
const tourSelect=()=>find('select',node=>node.props.id===':tour-picker:-tour');
const regionSelect=()=>find('select',node=>node.props.id===':tour-picker:-region');
const choices=()=>nodes(tourSelect()).filter(node=>node.type==='option'&&node.props.value&&!node.props.disabled).map(node=>node.props.value);
const select=id=>{tourSelect().props.onChange({target:{value:id}});render();};
const search=value=>{find('input').props.onChange({target:{value}});render();};
const filter=value=>{regionSelect().props.onChange({target:{value}});render();};
const current=()=>tourSelect().props.value;
const currentOption=()=>nodes(tourSelect()).find(node=>node.type==='option'&&node.props.value===current());
const status=()=>find('p',node=>node.props.role==='status').props.children;
const player=()=>find('RegionalGuidedLearning');

render();
const tours=api.wholeBodyTourOptions;
const legacyTours=tours.filter(t=>!['portal-hepatic-venous-relationships','cervical-whole-discs-orientation','right-medial-thigh-orientation','right-posterior-calf-achilles-orientation'].includes(t.id));
assert.equal(legacyTours.length,47);assert.equal(new Set(legacyTours.map(t=>t.id)).size,47);
// Same47tour IDs; the expanded lower-venous sequence adds exactly three stops.
assert.equal(legacyTours.reduce((count,tour)=>count+tour.steps.length,0),285);
assert.equal(legacyTours.find(t=>t.id==='right-lower-limb-venous-orientation').steps.length,9);
assert.deepEqual(plain(legacyTours.map(t=>t.region)),['whole-body','whole-body','whole-body','whole-body','whole-body','whole-body','whole-body','whole-body','head-neck','head-neck','head-neck','head-neck','head-neck','head-neck','head-neck','head-neck','spine','spine','spine','thorax','thorax','thorax','thorax','thorax','abdomen','abdomen','abdomen','abdomen','abdomen','pelvis','pelvis','pelvis','pelvis','shoulder-arm','shoulder-arm','forearm','forearm','forearm','hand','hand','hand','hand','hand','thigh','leg','foot','foot']);
assert.equal(tours.length,51);assert.equal(new Set(tours.map(t=>t.id)).size,51);
assert.equal(tours.reduce((count,tour)=>count+tour.steps.length,0),309);
const posteriorCalf=tours.find(t=>t.id==='right-posterior-calf-achilles-orientation');assert(posteriorCalf);
assert.equal(posteriorCalf.region,'whole-body');assert.equal(posteriorCalf.revision,'right-posterior-calf-20261015-r1');
assert.deepEqual(plain(posteriorCalf.scopeRegions),['leg','foot']);assert.equal(posteriorCalf.steps.length,5);
const medialThigh=tours.find(t=>t.id==='right-medial-thigh-orientation');assert(medialThigh);
assert.equal(medialThigh.region,'thigh');assert.equal(medialThigh.revision,'right-medial-thigh-20261015-r1');
assert.equal(medialThigh.steps.length,5);
const cervicalDiscs=tours.find(t=>t.id==='cervical-whole-discs-orientation');assert(cervicalDiscs);
assert.equal(cervicalDiscs.title,'Cervical spine: whole discs');assert.equal(cervicalDiscs.region,'spine');
assert.equal(cervicalDiscs.revision,'cervical-whole-discs-20261014-r1');
assert.equal(cervicalDiscs.steps.length,6);
const portal=tours.find(t=>t.id==='portal-hepatic-venous-relationships');assert(portal);
assert.equal(portal.region,'abdomen');assert.equal(portal.steps.length,8);
assert.equal(portal.revision,'portal-hepatic-venous-relationships-20261014-r1');
assert.equal(tours.filter(t=>t.id==='cardiac-venous-surface-orientation').length,1);
const pulmonary=tours.find(t=>t.id==='pulmonary-venous-hilar-relationships');assert(pulmonary);
assert.equal(tours.filter(t=>t.id===pulmonary.id).length,1);assert.equal(pulmonary.region,'thorax');
assert.equal(pulmonary.revision,'pulmonary-venous-hilar-relationships-20261011-r1');
const pancreatic=tours.find(t=>t.id==='pancreatic-arterial-relationships');assert(pancreatic);
assert.equal(tours.filter(t=>t.id===pancreatic.id).length,1);assert.equal(pancreatic.region,'abdomen');
assert.equal(pancreatic.revision,'pancreatic-arterial-relationships-20261012-r1');assert.equal(pancreatic.steps.length,9);
const elbow=tours.find(t=>t.id==='right-elbow-arterial-pairs');assert(elbow);
assert.equal(tours.filter(t=>t.id===elbow.id).length,1);assert.equal(elbow.region,'forearm');
assert.equal(elbow.title,'Right elbow: collateral & recurrent arteries');
assert.equal(elbow.revision,'right-elbow-arterial-pairs-20261012-r1');assert.equal(elbow.steps.length,8);
assert.deepEqual(plain(tours.slice(0,4).map(t=>t.id)),['right-lower-limb-bone-orientation','right-upper-limb-bone-orientation','right-lower-limb-venous-orientation','right-lower-limb-arterial-orientation']);
assert.deepEqual([...tours.map(t=>t.id)].sort(),[...api.regionalTours.map(t=>t.id)].sort());
assert.deepEqual(plain(choices()),plain(tours.map(t=>t.id)),'Default order stays unchanged');
assert.equal(current(),tours[0].id);
assert.equal(currentOption().props.children,tours[0].title,'The native select names the current tour');
assert.equal(player().key,`${tours[0].id}:${tours[0].revision}`);
assert.equal(find('input').props.type,'search');
assert.equal(tourSelect().props['aria-label'],'Choose a tour');
const disclosure=find('details');
assert.equal(disclosure.props.open,undefined,'Discovery is closed by default');
assert.match(find('summary').props.children[0],/Find a tour/);
const originalKey=player().key;
for(const term of ['Achilles','Calcaneal tendon','Soleus','Gastrocnemius']){
 search(term);assert(choices().includes(posteriorCalf.id),`${term}: calf-to-heel tour discoverable`);
 assert.equal(player().key,originalKey);assert.equal(suspends,0,'Search does not start or move the camera');
}
filter('leg');assert(!choices().includes(posteriorCalf.id),'Cross-region tour keeps its Whole body scope');
filter('whole-body');assert(choices().includes(posteriorCalf.id));filter('all');
search('Trachea');
assert(choices().includes('thoracic-airways-vessels'),'Step titles are searchable');
assert.equal(player().key,originalKey);assert.equal(suspends,0);
search('Right superior pulmonary vein');
assert(choices().includes(pulmonary.id),'Pulmonary vein stop is discoverable without starting');
assert.equal(player().key,originalKey);assert.equal(suspends,0);
filter('thorax');assert(choices().includes(pulmonary.id),'Pulmonary tour is in the thorax filter');
filter('abdomen');
for(const name of ['Anterior superior pancreaticoduodenal artery','Anterior inferior pancreaticoduodenal artery',
 'Posterior superior pancreaticoduodenal artery','Posterior inferior pancreaticoduodenal artery',
 'Inferior pancreaticoduodenal artery','Dorsal pancreatic artery','Inferior pancreatic artery',
 'Great pancreatic artery','Caudal pancreatic artery']){
 search(name);assert(choices().includes(pancreatic.id),`${name} is searchable within Abdomen`);
 assert.equal(player().key,originalKey,'Searching does not start the pancreatic tour');assert.equal(suspends,0);
}
filter('thorax');assert(!choices().includes(pancreatic.id),'Thorax excludes the pancreatic tour');
filter('abdomen');
for(const step of portal.steps){
 search(step.title);assert(choices().includes(portal.id),`${step.title} is searchable within Abdomen`);
 assert.equal(player().key,originalKey,'Portal discovery does not move the active camera');assert.equal(suspends,0);
}
filter('thorax');assert(!choices().includes(portal.id),'Thorax excludes the portal/hepatic tour');
filter('forearm');
search('Right elbow: collateral & recurrent arteries');assert(choices().includes(elbow.id),'Elbow title is searchable in Forearm');
for(const name of ['Right inferior ulnar collateral artery','Right anterior ulnar recurrent artery',
 'Right superior ulnar collateral artery','Right posterior ulnar recurrent artery',
 'Radial collateral branch of right deep brachial artery','Right radial recurrent artery',
 'Middle collateral branch of right deep brachial artery','Right recurrent interosseous artery']){
 search(name);assert(choices().includes(elbow.id),`${name} is searchable within Forearm`);
 assert.equal(player().key,originalKey,'Searching does not start the elbow tour');assert.equal(suspends,0);
}
filter('abdomen');assert(!choices().includes(elbow.id),'Abdomen excludes the elbow tour');
search('Right superior pulmonary vein');
for(const region of new Set(tours.map(t=>t.region).filter(region=>region!=='thorax'))){
 filter(region);assert(!choices().includes(pulmonary.id),'Other region filters exclude the pulmonary tour');
}
filter('all');
search('Appendix');
assert(choices().includes('digestive-tract-orientation'),'Cross-region digestive tour is discoverable from its appendix stop');
assert.equal(player().key,originalKey,'Searching does not move the active camera');
search('Right lateral sacral');
assert(choices().includes('pelvic-venous-tributaries-orientation'),'Pelvic venous tour is discoverable from its specific source stop');
assert.equal(player().key,originalKey,'Pelvic discovery does not move the active camera');
search('Cranial vault');
assert(choices().includes('cranial-vault-orientation'),'Cranial guide is discoverable without starting it');
assert.equal(player().key,originalKey,'Cranial discovery does not move the active camera');
filter('head-neck');
assert(choices().includes('cranial-vault-orientation'),'Cranial guide remains in Head and neck');
filter('all');
search('Diaphragm');
assert(choices().includes('diaphragm-boundary-orientation'),'Boundary tour is discoverable without starting it');
assert.equal(player().key,originalKey,'Diaphragm discovery does not move the active camera');
search('Cervical spine: whole discs');
assert(choices().includes(cervicalDiscs.id),'Cervical whole-disc guide is discoverable by title');
assert.equal(player().key,originalKey);assert.equal(suspends,0);
filter('spine');assert(choices().includes(cervicalDiscs.id));
for(const step of cervicalDiscs.steps){
 search(step.title);assert(choices().includes(cervicalDiscs.id),`${step.title} is searchable in Spine`);
 assert.equal(player().key,originalKey);assert.equal(suspends,0);
}
filter('thorax');assert(!choices().includes(cervicalDiscs.id));
filter('all');search(medialThigh.title);
assert(choices().includes(medialThigh.id),'Medial thigh guide is discoverable by title');
assert.equal(player().key,originalKey);assert.equal(suspends,0);
filter('thigh');assert(choices().includes(medialThigh.id));
for(const step of medialThigh.steps){
 search(step.title);assert(choices().includes(medialThigh.id),`${step.title} is searchable in Thigh`);
 assert.equal(player().key,originalKey);assert.equal(suspends,0);
}
filter('thorax');assert(!choices().includes(medialThigh.id));
search('Trachea');
filter('head-neck');
assert.deepEqual(choices(),[],'Combined filters can produce no results');
assert.match(status(),/No tours match/);
assert.equal(tourSelect().props.disabled,true);
assert.equal(current(),tours[0].id,'The active selection persists with no results');
assert.equal(currentOption().props.disabled,true);
assert.match(currentOption().props.children.join(''),/Current tour: .*outside filters/,'The active title stays visible outside results');
select('thoracic-airways-vessels');
assert.equal(player().key,originalKey,'Hidden result cannot be selected');assert.equal(suspends,0);
find('button',node=>node.props.children==='Clear filters').props.onClick();render();
assert.equal(choices().filter(id=>id!==portal.id&&id!==cervicalDiscs.id&&id!==medialThigh.id&&id!==posteriorCalf.id).length,47,'All legacy choices remain');
assert.equal(choices().length,51);assert.equal(current(),tours[0].id);
assert.equal(currentOption().props.disabled,undefined,'Clear filters restores the normal option');
assert.equal(player().key,originalKey);assert.equal(suspends,0);
filter('thorax');
assert.deepEqual(choices(),plain(tours.filter(t=>t.region==='thorax').map(t=>t.id)));
const thorax=tours.find(t=>t.region==='thorax');
select(thorax.id);
assert.equal(player().props.tour,thorax);assert.equal(player().key,`${thorax.id}:${thorax.revision}`);
assert.equal(current(),thorax.id);assert.equal(currentOption().props.children,thorax.title);
assert.equal(suspends,1,'Actual selection suspends imaging once');
select(thorax.id);assert.equal(suspends,1,'Re-selecting current tour is inert');
select(tours.find(t=>t.region==='hand').id);
assert.equal(player().props.tour,thorax,'A filtered-out cross-region selection is refused');assert.equal(suspends,1);
filter('hand');
assert.deepEqual(choices(),plain(tours.filter(t=>t.region==='hand').map(t=>t.id)),'Filtering keeps only matching choices');
assert.equal(current(),thorax.id);assert.match(currentOption().props.children.join(''),/outside filters/);
assert.equal(player().key,`${thorax.id}:${thorax.revision}`);assert.equal(suspends,1);
search('no-match-ever');
assert.equal(current(),thorax.id);assert.equal(player().key,`${thorax.id}:${thorax.revision}`);
assert.equal(tourSelect().props.disabled,true);assert.equal(choices().length,0);
assert.match(currentOption().props.children.join(''),/outside filters/);
find('button',node=>node.props.children==='Clear filters').props.onClick();render();
assert.equal(player().key,`${thorax.id}:${thorax.revision}`);assert.equal(suspends,1);
assert.equal(current(),thorax.id);assert.equal(currentOption().props.children,thorax.title);
select(null);assert.equal(player().props.tour,thorax);assert.equal(suspends,1);

props.region='whole-body';reset();
const keys=new Set();
search('ureter');
assert.deepEqual(choices(),['urinary-tract-orientation'],'Urinary tour is discoverable by a step title');
select('urinary-tract-orientation');
assert.equal(player().key,'urinary-tract-orientation:urinary-tract-tour-20261010-r1');
assert.deepEqual(plain(player().props.tour.scopeRegions),['abdomen','pelvis']);
find('button',node=>node.props.children==='Clear filters').props.onClick();render();
for(const tour of tours){
 select(tour.id);
 const child=player();
 assert.equal(child.props.tour,tour,'Reuse the actual reviewed object, not a whole-body clone');
 assert.equal(child.props.catalog,emptyCatalog);assert.equal(child.props.assetBase,props.assetBase);
 assert.equal(child.props.onExit,props.onExit);assert.equal(child.key,`${tour.id}:${tour.revision}`);
 assert.equal(child.props.initialStep,undefined);assert.equal(child.props.autoplay,undefined);
 assert(!keys.has(child.key),'Each source/revision gets its own player key');keys.add(child.key);
 for(const invalid of [null,undefined,'missing','whole-body','__proto__']){
  select(invalid);assert.equal(player().key,child.key);
 }
 select(tour.id);assert.equal(player().key,child.key,'Re-selecting preserves the player');
}
player().props.onExit();assert.equal(exits,1);
assert.equal(nodes(tree).filter(node=>node.type==='RegionalGuidedLearning').length,1);
assert.equal(nodes(tree).filter(node=>node.type==='iframe'||node.type==='a').length,0,'No pop-out or cross-product navigation');

props.region='thorax';reset();
const thoracic=tours.filter(t=>t.region==='thorax');assert.equal(thoracic.length,5);
assert.deepEqual(choices(),plain(thoracic.map(t=>t.id)));
assert.equal(player().props.tour,thoracic[0]);
select(thoracic[1].id);assert.equal(player().props.tour,thoracic[1]);
select(tours.find(t=>t.region==='head-neck').id);
assert.equal(player().props.tour,thoracic[1],'A regional library rejects a valid but out-of-region tour');
const coronary=thoracic.find(t=>t.id==='coronary-arterial-orientation');assert(coronary);
select(coronary.id);assert.equal(player().props.tour,coronary);
assert.equal(player().key,'coronary-arterial-orientation:coronary-arterial-orientation-v1');
select(tours.find(t=>t.region==='head-neck').id);
assert.equal(player().props.tour,coronary,'Coronary library keeps regional scope');
select(pulmonary.id);assert.equal(player().props.tour,pulmonary,'Thorax library passes the exact pulmonary source object');
assert.equal(player().key,'pulmonary-venous-hilar-relationships:pulmonary-venous-hilar-relationships-20261011-r1');
assert.equal(player().props.onExit,props.onExit,'Pulmonary exit preserves the parent workspace restoration callback');
assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
select(tours.find(t=>t.region==='head-neck').id);
assert.equal(player().props.tour,pulmonary,'Pulmonary selection retains regional scope');

props.region='head-neck';reset();
const orbital=tours.filter(t=>t.region==='head-neck');assert.equal(orbital.length,8);
assert.equal(player().props.tour.id,'laryngeal-framework-orientation','Existing head-neck default retained');
select(orbital[1].id);assert.equal(player().props.tour,orbital[1]);
select(thoracic[0].id);assert.equal(player().props.tour,orbital[1]);
select(orbital[2].id);assert.equal(player().props.tour,orbital[2]);
assert.equal(player().key,`${orbital[2].id}:${orbital[2].revision}`);
select(orbital[3].id);assert.equal(player().props.tour.id,'deep-brain-commissures-limbic-landmarks');
select('right-orbital-nerve-orientation');assert.equal(player().props.tour.id,'right-orbital-nerve-orientation');
assert.equal(player().props.tour.steps.length,6);assert.equal(player().key,'right-orbital-nerve-orientation:right-orbital-nerve-orientation-v1');
props.region='spine';render();assert.equal(player().props.tour.region,'spine','Changed region cannot retain an out-of-scope selection');
assert.equal(current(),player().props.tour.id,'Changed region updates the native selection');
assert.equal(currentOption().props.disabled,undefined);
const spine=tours.filter(t=>t.region==='spine');assert.equal(spine.length,4);
assert.equal(player().props.tour.id,'cervical-spine-orientation');
select(cervicalDiscs.id);assert.equal(player().props.tour,cervicalDiscs);
assert.equal(player().key,'cervical-whole-discs-orientation:cervical-whole-discs-20261014-r1');
assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
select(cervicalDiscs.id);assert.equal(player().props.tour,cervicalDiscs);
select('lower-lumbar-sacral-orientation');assert.equal(player().props.tour.id,'lower-lumbar-sacral-orientation');
assert.equal(player().key,'lower-lumbar-sacral-orientation:lower-lumbar-sacral-orientation-v1');
const thoracicSpine=spine.find(t=>t.id==='thoracic-spine-discs-orientation');assert(thoracicSpine);
select(thoracicSpine.id);assert.equal(player().props.tour,thoracicSpine);
assert.equal(player().key,'thoracic-spine-discs-orientation:thoracic-spine-discs-orientation-v1');
select(coronary.id);assert.equal(player().props.tour,thoracicSpine,'Spine library keeps regional scope');

props.region='thigh';reset();
const thigh=tours.filter(t=>t.region==='thigh');assert.equal(thigh.length,2);
assert.equal(player().props.tour.id,'right-thigh-muscle-orientation','Existing thigh default retained');
assert.deepEqual(choices(),plain(thigh.map(t=>t.id)));
select(medialThigh.id);assert.equal(player().props.tour,medialThigh);
assert.equal(player().key,'right-medial-thigh-orientation:right-medial-thigh-20261015-r1');
assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
select(coronary.id);assert.equal(player().props.tour,medialThigh,'Thigh library keeps regional scope');

props.region='pelvis';reset();
const pelvic=tours.filter(t=>t.region==='pelvis');assert.equal(pelvic.length,4);
assert.equal(player().props.tour.id,'male-pelvic-viscera-orientation');
const duct=pelvic.find(t=>t.id==='male-pelvic-duct-landmarks');assert(duct);
select(duct.id);assert.equal(player().props.tour,duct);assert.equal(player().key,`${duct.id}:${duct.revision}`);
select(orbital[0].id);assert.equal(player().props.tour,duct);
const ring=pelvic.find(t=>t.id==='pelvic-ring-hip-orientation');assert(ring);
select(ring.id);assert.equal(player().props.tour,ring);assert.equal(player().key,`${ring.id}:${ring.revision}`);
select(orbital[0].id);assert.equal(player().props.tour,ring);

props.region='hand';reset();
assert.equal(nodes(tree).filter(node=>node.type==='input').length,0,'Regional picker has no discovery controls');
assert.equal(nodes(tree).filter(node=>node.type==='select').length,1);
const hand=tours.filter(t=>t.region==='hand');assert.equal(hand.length,5);
assert.equal(player().props.tour.id,'right-hand-muscle-orientation','Intrinsic hand tour remains default');
assert.equal(current(),player().props.tour.id,'Regional selection shows its default');
assert.deepEqual(choices(),plain(hand.map(t=>t.id)));
select('right-carpal-row-orientation');assert.equal(player().props.tour.id,'right-carpal-row-orientation');
assert.equal(player().key,'right-carpal-row-orientation:right-carpal-row-orientation-v1');
for(const id of ['right-hand-venous-orientation','left-hand-venous-orientation']){
 select(id);assert.equal(player().props.tour,hand.find(t=>t.id===id));
 assert.equal(player().key,`${id}:${id}-v1`);
 select(orbital[0].id);assert.equal(player().props.tour.id,id,'Cross-region selection remains rejected');
}

props.region='abdomen';reset();
const abdominal=tours.filter(t=>t.region==='abdomen');
assert.equal(abdominal.filter(t=>t.id!==portal.id).length,5,'All legacy abdominal tours remain');assert.equal(abdominal.length,6);
assert.equal(player().props.tour.id,'celiac-branches-orientation','Coeliac tour remains default');
select('renal-organs-arteries-orientation');assert.equal(player().props.tour.id,'renal-organs-arteries-orientation');
assert.equal(player().key,'renal-organs-arteries-orientation:renal-organs-arteries-orientation-20261022-source-bound-draft');
select('hepatobiliary-surface-orientation');assert.equal(player().props.tour.id,'hepatobiliary-surface-orientation');
assert.equal(player().key,'hepatobiliary-surface-orientation:hepatobiliary-surface-orientation-v1');
select(orbital[0].id);assert.equal(player().props.tour.id,'hepatobiliary-surface-orientation','Reject out-of-region tour');
select('mesenteric-arterial-branch-orientation');assert.equal(player().props.tour.id,'mesenteric-arterial-branch-orientation');
assert.equal(player().key,'mesenteric-arterial-branch-orientation:mesenteric-arterial-branch-orientation-v1');
select(orbital[0].id);assert.equal(player().props.tour.id,'mesenteric-arterial-branch-orientation','Mesenteric tour keeps regional scope');
select(pancreatic.id);assert.equal(player().props.tour,pancreatic);assert.equal(player().key,`${pancreatic.id}:${pancreatic.revision}`);
assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
select(orbital[0].id);assert.equal(player().props.tour,pancreatic,'Pancreatic tour keeps regional scope');
select(portal.id);assert.equal(player().props.tour,portal);assert.equal(player().key,`${portal.id}:${portal.revision}`);
assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined,'Portal tour waits for explicit Start');
select(orbital[0].id);assert.equal(player().props.tour,portal,'Portal tour keeps regional scope');
props.region='hand';reset();
assert.deepEqual(choices(),plain(hand.map(t=>t.id)));
assert.equal(player().props.tour.id,'right-hand-muscle-orientation');
select('right-hand-arterial-orientation');assert.equal(player().props.tour.id,'right-hand-arterial-orientation');
assert.equal(player().key,'right-hand-arterial-orientation:right-hand-arterial-orientation-v1');
select(abdominal[0].id);assert.equal(player().props.tour.id,'right-hand-arterial-orientation','Reject out-of-region selection');
props.region='missing';render();assert.equal(nodes(tree).filter(node=>node.type==='RegionalGuidedLearning').length,0);
find('button',node=>node.props.children==='Exit tour').props.onClick();assert.equal(exits,2);

props.catalog=api.bodyDisplayCatalog(api.raw);props.region='forearm';reset();
assert.equal(player().props.tour.id,'right-forearm-muscle-orientation','Forearm default is retained');
assert.deepEqual(choices(),plain(tours.filter(t=>t.region==='forearm').map(t=>t.id)));
select('right-forearm-arterial-orientation');
assert.equal(player().props.tour.id,'right-forearm-arterial-orientation');
assert.equal(player().key,'right-forearm-arterial-orientation:right-forearm-arterial-orientation-v1');
select(elbow.id);assert.equal(player().props.tour,elbow);
assert.equal(currentOption().props.children,elbow.title);
assert.equal(player().key,`${elbow.id}:${elbow.revision}`);
assert.equal(player().props.initialStep,undefined);assert.equal(player().props.autoplay,undefined);
select('mesenteric-arterial-branch-orientation');
assert.equal(player().props.tour,elbow,'Reject foreign regional tour');
props.catalog=api.bodyDisplayCatalog(api.raw);props.region='head-neck';reset();
assert.equal(player().props.tour.id,'laryngeal-framework-orientation','Head/neck default remains unchanged');
select('right-lower-neck-vessel-scalene-orientation');
assert.equal(player().props.tour.id,'right-lower-neck-vessel-scalene-orientation');
assert.equal(player().key,'right-lower-neck-vessel-scalene-orientation:right-lower-neck-vessel-scalene-orientation-v1');
select('mesenteric-arterial-branch-orientation');
assert.equal(player().props.tour.id,'right-lower-neck-vessel-scalene-orientation','Reject a foreign regional tour');
reset();
const nested=api.nestedGuidedStudyOptions(props.catalog,'head-neck');
assert.deepEqual(plain(nested.map(item=>item.kind).sort()),['eye','eye','ventricles']);
assert.deepEqual(choices(),plain([...tours.filter(t=>t.region==='head-neck').map(t=>t.id),...nested.map(t=>t.id)]));
const nestedSuspends=suspends;
for(const choice of [nested.find(item=>item.kind==='eye'),nested.find(item=>item.kind==='ventricles')]){
 select(choice.id);
 assert.equal(find(choice.kind==='eye'?'EyeLayerView':'VentricularView').props.parent.id,choice.parent.id);
 const nestedNode=find('div',node=>node.props.className==='whole-body-nested-guidance');
 assert.equal(nestedNode.key,`${choice.id}:${choice.parentHash}:${choice.sourceHash}:${JSON.stringify(choice.guide)}`);
 assert.equal(current(),choice.id);assert.equal(currentOption().props.children,choice.title);
 const boundaries=nodes(tree).filter(node=>typeof node.type==='function'&&typeof node.type.getDerivedStateFromError==='function');
 assert.equal(boundaries.length,1);const boundary=boundaries[0],instance=new boundary.type(boundary.props);
 assert.equal(instance.render(),boundary.props.children,'A successful deferred child is preserved');
 instance.state={...instance.state,...boundary.type.getDerivedStateFromError(new Error('private-render-detail'))};
 const failed=instance.render();assert.equal(failed.props.role,'alert');
 assert.match(failed.props.children,/choose another tour or Exit tour/i);
 assert.doesNotMatch(failed.props.children,/private-render-detail|retry|reload/i);
 assert.equal(current(),choice.id,'Picker remains outside the failure boundary');
 const exit=nodes(tree).find(node=>node.type==='button'&&node.props.children==='Exit tour');
 assert(exit);exit.props.onClick();
}
assert.equal(suspends,nestedSuspends+2,'Each explicit nested selection suspends imaging once');
assert.equal(exits,4,'Exit remains available for both nested viewer failures');
props.region='whole-body';reset();
assert.equal(choices().filter(id=>id!==portal.id&&id!==cervicalDiscs.id&&id!==medialThigh.id&&id!==posteriorCalf.id).length,51,'Legacy whole-body scope admits 47 regional and four exact-bound nested tours');
assert.equal(choices().length,55,'Whole-body scope admits 51 regional and four exact-bound nested tours');
const beforePortalSelection=suspends,priorTour=player().props.tour;
search('Hepatic portal vein');assert(choices().includes(portal.id));
assert.equal(player().props.tour,priorTour,'Search alone cannot start the tour');
select(portal.id);assert.equal(player().props.tour,portal);
assert.equal(player().key,`${portal.id}:${portal.revision}`);
assert.equal(suspends,beforePortalSelection+1,'Explicit portal selection suspends imaging once');
select(portal.id);assert.equal(suspends,beforePortalSelection+1,'Redundant portal selection is inert');
find('button',node=>node.props.children==='Clear filters').props.onClick();render();
const eye=nested.find(item=>item.kind==='eye');assert(eye);
search(eye.guide.steps[0].title);
assert(choices().includes(eye.id),'Nested guide step titles are searchable');
filter('thorax');assert(!choices().includes(eye.id),'Nested tours respect regional filtering');
search('');
const cardiac=api.nestedGuidedStudyOptions(props.catalog,'thorax')[0];
assert.equal(cardiac.kind,'cardiac');assert(choices().includes(cardiac.id));
select(cardiac.id);
assert.equal(find('VentricularView').props.study,'cardiac','Shared nested viewer receives cardiac rather than ventricular study');
assert.equal(find('VentricularView').props.parent.id,cardiac.parent.id);
assert(find('VentricularView').props.initialGuidedLearningExpanded);
assert.equal(find('VentricularView').props.autoplay,undefined,'Cardiac guidance waits for explicit Start');
props.region='thorax';reset();
assert(choices().includes(cardiac.id));assert(!choices().includes(eye.id));
select(cardiac.id);assert.equal(find('VentricularView').props.study,'cardiac');
console.log(JSON.stringify({regionalTours:tours.length,nestedTours:nested.length,filters:true,regionalAssertions:true,lazyFailurePrivacy:true,sharedExit:true}));

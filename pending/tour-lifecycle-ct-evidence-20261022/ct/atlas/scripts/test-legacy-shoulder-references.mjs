import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const stage=path.resolve(import.meta.dirname,'..'),baseline=path.resolve(stage,'../20261022-review-traversal-candidate/atlas');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p,'utf8');
const require=createRequire(baseline+'/package.json'),{build}=require('esbuild'),ts=require('typescript');
const git=(...args)=>execFileSync('git',args,{cwd:baseline,encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
assert.equal(git('rev-parse','HEAD'),'2381efe43b75f8a7fb768a069eecd7268c508dac');assert.equal(git('status','--porcelain'),'');
for(const file of ['anatomy-data','body-content'])assert.equal(read(stage+'/preimage/'+file+'.ts.raw'),read(baseline+'/app/'+file+'.ts'));
const protectedPaths=['app/body-explorer.tsx','app/shoulder-explorer.tsx','lib/body-review-material.ts','lib/body-review-context.ts','lib/body-review-decisions.ts','lib/content-types.ts','lib/xray-teaching.ts','lib/shoulder-soft-tissue-xray.ts'];
const unchanged=protectedPaths.map(p=>({path:p,sha256:sha(read(baseline+'/'+p))}));
const plugin=modified=>({name:'explicit-source-overlay',setup(api){
  api.onResolve({filter:/^(?:\.|@\/)/},args=>{
    const target=args.path.startsWith('@/')?path.resolve(baseline,args.path.slice(2)):path.resolve(args.resolveDir,args.path);
    const baseRel=path.relative(baseline,target),stageRel=path.relative(stage,target);
    const inside=rel=>!rel.startsWith('..')&&!path.isAbsolute(rel);
    const rel=inside(stageRel)?stageRel:inside(baseRel)?baseRel:null;
    if(rel===null)return;
    const roots=modified?[path.resolve(stage,rel),path.resolve(baseline,rel)]:[path.resolve(baseline,rel)];
    for(const root of roots)for(const suffix of ['','.ts','.tsx','.mjs','.js','.json'])if(fs.existsSync(root+suffix)&&fs.statSync(root+suffix).isFile())return {path:root+suffix};
    throw Error('Unresolved source import: '+args.path);
  });
  api.onLoad({filter:/\.(glb|gltf|obj|png|jpe?g|webp|nii|dcm)$/i},()=>{throw Error('Binary/model reads refused');});
}});
async function load(modified){
  const entry="export {structures} from './app/anatomy-data'; export {bodyLesson} from './app/body-content'; export {contentTabs} from './lib/content-types'; export {bodyReviewMaterial} from './lib/body-review-material'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; import {bodyDisplayCatalog} from './lib/body-display-catalog'; export const catalog=bodyDisplayCatalog(raw as any);"+(modified?"export {legacyShoulderReferences} from './lib/legacy-shoulder-references';":'');
  const result=await build({stdin:{contents:entry,resolveDir:baseline,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{},plugins:[plugin(modified)]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const before=await load(false),after=await load(true);
const changes={
  'VM-SHO-R-BON-HUM:mri':{body:'MRI can assess marrow, articular cartilage and cuff insertions at the proximal humerus. The long-head biceps anchor is assessed separately at the superior glenoid–labral region.'},
  'VM-SHO-R-MUS-DELT:mri':{body:'Review deltoid bulk and fluid-sensitive signal, especially after dislocation or suspected axillary-nerve injury. Denervation may produce oedema; muscle signal alone does not establish the cause.'},
  'VM-SHO-R-MUS-DELT:ultrasound':{body:'Identify deltoid superficial to the subacromial-subdeltoid bursa and rotator cuff using neighbouring tendon and bony landmarks. The 3D surface does not reproduce sonographic internal architecture.'},
  'VM-SHO-R-MUS-DELT:pathology':{body:'Deltoid tears and axillary-nerve injury are patterns to consider. Denervation may alter muscle signal and lead to atrophy; findings require clinical correlation.'},
  'VM-SHO-R-MUS-SSP:pathology':{body:'Supraspinatus pathology includes tendinopathy and partial- or full-thickness tears. Describe the observed location and extent on imaging; do not infer a preferred tear site from this intact source surface.'},
  'VM-SHO-R-MUS-ISP:ct':{body:'CT soft-tissue review can assess infraspinatus bulk and fatty replacement. Adjacent bone is assessed separately; this source surface does not establish a segmented tendon footprint.'},
  'VM-SHO-R-MUS-SUBS:mri':{body:'Evaluate tendon and muscle quality on axial and sagittal-oblique images; assess the associated biceps pulley when adequately visualised.'},
  'VM-SHO-R-MUS-LHB:anatomy':{bullets:['Tendon and muscle cannot be selected as independent substructures in this entry','Muscle innervation: musculocutaneous nerve','Distal biceps insertion: radial tuberosity and bicipital aponeurosis'],note:'This entry has one selectable source identity, not an independently validated tendon segmentation. Cropping and visible extent depend on the active viewer.'},
  'VM-SHO-R-MUS-LHB:ct':{body:'CT arthrography can assess selected intra-articular long-head biceps lesions, with diagnostic limitations. This does not establish reliable groove-tendon visibility or stability assessment on routine unenhanced CT.'},
  'VM-SHO-R-MUS-DELT:ct':{body:'CT can assess deltoid bulk and fatty change. Muscle attenuation depends on reconstruction settings and measurement method; this surface model supplies no patient-specific CT measurement or normal threshold.'},
  'VM-SHO-R-MUS-TMIN:ct':{body:'Review teres minor size and fatty change with the posterior cuff on CT. Muscle appearance varies across rotator-cuff tear patterns; this surface model supplies neither a patient-specific CT grade nor a normal quantitative threshold.'},
};
const brainReference='https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system';
let authoredSections=0,placements=0,changedPlacements=0,newCitationPlacements=0;
const missingBefore=[],missingAfter=[],affected=new Set();

await test('exact legacy catalog identities, quiz answers and all unedited fields remain unchanged',()=>{
  assert.equal(before.structures.length,9);assert.equal(after.structures.length,9);
  for(const [index,s] of before.structures.entries()){
    const expected=structuredClone(s);
    for(const topic of before.contentTabs){
      const links=after.legacyShoulderReferences(s.shortId,topic);
      if(links){assert.equal(s.sections[topic].citations,undefined);expected.sections[topic].citations=links;authoredSections++;}
      Object.assign(expected.sections[topic],changes[s.shortId+':'+topic]??{});
    }
    assert.deepEqual(after.structures[index],expected);
    assert.deepEqual(after.structures[index].sections.xray,s.sections.xray);
  }
  assert.equal(authoredSections,72);assert.equal(Object.keys(changes).length,11);
});

await test('all 9936 real resolved placements preserve readiness and unrelated lessons; 89 citation-field gaps close',()=>{
  assert.deepEqual(after.catalog,before.catalog);assert.equal(after.catalog.structures.length,1104);
  for(const s of before.catalog.structures)for(const topic of before.contentTabs){
    placements++;
    const old=before.bodyLesson(s,topic),actual=after.bodyLesson(s,topic),expected=structuredClone(old);
    if(old.readiness==='draft'&&!old.citations?.length)missingBefore.push([s.id,topic]);
    const legacy=before.structures.find(item=>item.sourceFmaIds?.includes(s.fmaId));
    if(legacy&&topic!=='xray'){
      const links=after.legacyShoulderReferences(legacy.shortId,topic);
      if(links)expected.citations=links;
      Object.assign(expected,changes[legacy.shortId+':'+topic]??{});
    }
    if(s.fmaId==='FMA50801'&&topic==='function')expected.citations=[brainReference];
    assert.deepEqual(actual,expected,s.id+':'+topic);
    assert.equal(actual.readiness,old.readiness);
    if(actual.readiness==='draft'&&!actual.citations?.length)missingAfter.push([s.id,topic]);
    if(!old.citations?.length&&actual.citations?.length)newCitationPlacements++;
    if(JSON.stringify(old)!==JSON.stringify(actual)){changedPlacements++;affected.add(s.id);}
  }
  assert.equal(placements,9936);assert.equal(missingBefore.length,89);assert.equal(newCitationPlacements,89);
  assert.equal(missingAfter.length,0);assert.equal(changedPlacements,89);assert.equal(affected.size,12);
});

await test('reference lookup refuses unknown identity/topic, preserves X-ray and binds the exact new CT evidence',()=>{
  for(const id of ['', 'VM-SHO-L-MUS-DELT','__proto__','constructor','toString'])for(const topic of after.contentTabs)assert.equal(after.legacyShoulderReferences(id,topic),undefined);
  for(const s of before.structures){
    for(const topic of ['xray','unknown','constructor','__proto__'])assert.equal(after.legacyShoulderReferences(s.shortId,topic),undefined);
    for(const topic of before.contentTabs){
      const a=after.legacyShoulderReferences(s.shortId,topic);if(!a)continue;
      assert(a.every(url=>new URL(url).protocol==='https:'));assert.equal(new Set(a).size,a.length);
      const copy=[...a];a.push('https://example.invalid');assert.deepEqual(after.legacyShoulderReferences(s.shortId,topic),copy);
    }
  }
  assert.deepEqual(after.legacyShoulderReferences('VM-SHO-R-MUS-DELT','ct'),['https://pubmed.ncbi.nlm.nih.gov/38592118/']);
  assert.deepEqual(after.legacyShoulderReferences('VM-SHO-R-MUS-TMIN','ct'),['https://pubmed.ncbi.nlm.nih.gov/21604212/','https://pubmed.ncbi.nlm.nih.gov/41049670/']);
});

await test('both unchanged viewer reference fragments render each new lesson URL using real React server rendering',()=>{
  const {renderToStaticMarkup}=require('react-dom/server');
  for(const [file,identifier] of [['app/body-explorer.tsx','content'],['app/shoulder-explorer.tsx','section']]){
    const text=read(baseline+'/'+file),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),nodes=[];
    function walk(node){if(ts.isConditionalExpression(node)&&node.condition.getText(tree)===identifier+'.citations?.length')nodes.push(node);ts.forEachChild(node,walk);}walk(tree);assert.equal(nodes.length,1);
    const js=ts.transpileModule('export const render=('+identifier+':any)=>('+nodes[0].getText(tree)+');',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    const module={exports:{}};new Function('require','module','exports',js)(require,module,module.exports);
    assert.equal(renderToStaticMarkup(module.exports.render({})), '');
    for(const s of after.structures)for(const topic of after.contentTabs){
      if(topic==='xray')continue;const section=s.sections[topic],html=renderToStaticMarkup(module.exports.render(section));
      if(!section.citations?.length){assert.equal(html,'');continue;}
      assert.equal((html.match(/<a /g)??[]).length,section.citations.length);
      for(const url of section.citations)assert(html.includes('href="'+url.replaceAll('&','&amp;')+'"'));
      assert(html.includes('rel="noreferrer"'));assert(html.includes('target="_blank"'));
    }
  }
});

await test('actual Review material changes teaching hashes without transferring clinical approval or changing source geometry',async()=>{
  const unaffected=before.catalog.structures.find(s=>!affected.has(s.id)&&s.region==='foot');assert(unaffected);
  for(const id of [...affected,unaffected.id]){
    const old=await before.bodyReviewMaterial(id),actual=await after.bodyReviewMaterial(id);assert(old&&actual);
    assert.equal(actual.approval,false);assert.equal(actual.status,'worksheet-not-submitted');
    assert.deepEqual(actual.source,old.source);assert.equal(actual.fingerprints.source,old.fingerprints.source);
    if(affected.has(id)){
      assert.notEqual(actual.fingerprints.teaching,old.fingerprints.teaching,id);
      assert.notEqual(actual.materialHash,old.materialHash,id);
    }else assert.deepEqual(actual,old);
  }
});

for(const row of unchanged)assert.equal(sha(read(baseline+'/'+row.path)),row.sha256);assert.equal(git('status','--porcelain'),'');
fs.writeFileSync(stage+'/FOCUSED_RESULT.json',JSON.stringify({at:new Date().toISOString(),source:git('rev-parse','HEAD'),originalSourceClean:true,authoredSectionsWithNewReferences:authoredSections,editedAuthoredSections:Object.keys(changes).length,resolvedPlacements:placements,changedPlacements,newCitationPlacements,remainingCitationGaps:missingAfter,affectedSourceSelections:affected.size,unchangedRendererAndReviewSource:unchanged,rendererEvidence:'Exact existing conditional JSX only, real React server rendering; not full component/browser/GPU evidence.',reviewEvidence:'Actual bodyReviewMaterial evaluated for12changed selections and1unaffected selection; no decision writes or clinical approval.',fullTypesBuildBrowserPending:true,reviewRuntimeBindingPending:true,integrated:false,previewChanged:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});

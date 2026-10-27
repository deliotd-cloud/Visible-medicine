import fs from 'node:fs';
import assert from 'node:assert/strict';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-saved-step-comparison';
const {site}=clonePinnedWebsite({stage,parentFile:'F:/VisibleMedicine/staging/20261027-learner-history/SOURCE_CANDIDATE_V2.json',parentSha256:'68d252eb43e0b62890fc051ecb7eedd3ca4a1d48bdda29f476ec22a36baf261f'});
const file=site+'/components/HeadLearningBookmark.tsx';
let source=fs.readFileSync(file,'utf8');
const needle='  const saved=parseHeadLearningBookmark(raw),navigation=saved?resolveHeadLearningBookmark(saved):null;';
assert(source.includes(needle));
source=source.replace(needle,needle+'\n  // Only the imaging viewer supplies its modality and in-view resume callback.\n  // Keep that scan open when comparing the saved step with the separate 3D Atlas.\n  const preserveScan=!!modality&&!!onOpenCurrent;');
const before='<a href={navigation.current.atlasHref} aria-label={`Open saved ${navigation.label} step in the 3D Atlas`}>3D</a>';
const after='<a href={navigation.current.atlasHref} target={preserveScan?\'_blank\':undefined} rel={preserveScan?\'noopener noreferrer\':undefined} aria-label={`Open saved ${navigation.label} step in the 3D Atlas${preserveScan?\' in a new tab\':\'\'}`}>3D{preserveScan?\' (new tab)\':\'\'}</a>';
assert(source.includes(before));source=source.replace(before,after);
fs.writeFileSync(file,source);
const tests=site+'/tests/head-learning-bookmark-ui.test.ts';
fs.appendFileSync(tests,`
test('saved 3D comparison keeps each imaging viewer open, with the same revision-bound destination',()=>{
 const raw=JSON.stringify(createHeadLearningBookmark(pons));
 const plain=fixture(raw);let expected:string;
 try{expected=plain.link('Open saved Pons step in the 3D Atlas').props.href;}finally{plain.close();}
 for(const modality of ['CT','MRI'] as const){
  let resumed=0;
  const f=fixture(raw,pons,false,true,{modality,onOpenCurrent:()=>{resumed++;return true;}});
  try{
   const anchor=f.link('Open saved Pons step in the 3D Atlas in a new tab');
   assert.equal(anchor.type,'a');assert.equal(anchor.props.href,expected!);
   assert.equal(anchor.props.target,'_blank');assert.equal(anchor.props.rel,'noopener noreferrer');
   assert.match(renderToStaticMarkup(anchor as any),/3D \(new tab\)/);
   assert.equal(anchor.props.onClick,undefined,'native anchor semantics retain keyboard and modifier actions');
   for(const target of ['CT','MRI'])assert.equal(f.link('Open saved Pons step in '+target).props.target,undefined);
   assert.equal(resumed,0);assert.equal(f.writes,0);assert.equal(f.removes,0);
  }finally{f.close();}
 }
});

test('library and 3D saved-step links keep their existing in-tab navigation',()=>{
 const raw=JSON.stringify(createHeadLearningBookmark(pons));
 for(const position of [undefined,pons]){
  const f=fixture(raw,position);
  try{
   const anchor=f.link('Open saved Pons step in the 3D Atlas');
   assert.equal(anchor.props.target,undefined);assert.equal(anchor.props.rel,undefined);
   assert.doesNotMatch(renderToStaticMarkup(anchor as any),/new tab/);
   assert.equal(f.writes,0);
  }finally{f.close();}
 }
});
`);
console.log(JSON.stringify({stage,changed:['components/HeadLearningBookmark.tsx','tests/head-learning-bookmark-ui.test.ts'],parentProductionBuildPending:true}));

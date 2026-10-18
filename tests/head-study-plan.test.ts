import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {createHeadStudyPlan,parseHeadStudyPlan,resolveHeadStudyPlan,
  HEAD_STUDY_PLAN_KEY,type HeadStudyPlan} from '../lib/head-study-plan.ts';
import {type HeadStudySet} from '../lib/head-study-set.ts';

const revision=HEAD_MANIFEST_SHA256;
const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id:string,label:string,representation:'mask'|'partial-mask',laterality:string,index:number):HeadEntry{
  return {id,label,family:'synthetic',representation,laterality,color:[1,0,0],opacity:{fill:.2,outline:1},
    mask:{file:`private-synthetic-${index}.bin`,sha256:index.toString(16).padStart(64,'0'),
      dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}};
}
function study(entries:HeadEntry[]):LoadedStudy{
  return {definition:{image:{file:'private-image.bin',sha256:'f'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries}} as LoadedStudy;
}
const pons=entry('cth.bst.pons','Pons — regional mask','partial-mask','midline_or_unpaired',1);
const cerebellum=entry('cth.cer.cerebellar_hemisphere.left','Left cerebellar hemisphere — regional mask','mask','left',2);
const vermis=entry('cth.cer.cerebellar_vermis','Cerebellar vermis — regional mask','mask','midline_or_unpaired',3);
const bone=entry('cth.skl.parietal_bone.left','Left parietal bone — regional mask','partial-mask','left',4);
const unmapped=entry('cth.local.synthetic','Unmapped synthetic mask','mask','left',5);
const mriCerebellum=entry('mrb.cer.cerebellar_hemisphere.left','Left cerebellar hemisphere — regional mask','mask','left',6);
const mriVermis=entry('mrb.cer.cerebellar_vermis','Cerebellar vermis — regional mask','partial-mask','midline_or_unpaired',7);
const mriAmygdala=entry('mrb.dgm.amygdala.left','Left amygdala — regional mask','mask','left',8);
const selected=(active:LoadedStudy,entries:HeadEntry[]):HeadStudySet=>({study:active,revision,entries});
const parse=(value:unknown)=>parseHeadStudyPlan(JSON.stringify(value)??null);

test('explicit CT plan saves only canonical ordered concepts and restores available MRI masks',()=>{
  assert.equal(HEAD_STUDY_PLAN_KEY,'vm.head-study-plan.v1');
  assert.equal(headLinksCurrent(),true);
  const ct=study([pons,cerebellum,vermis,bone,unmapped]);
  const plan=createHeadStudyPlan(selected(ct,[cerebellum,unmapped,bone,vermis,pons]),ct,revision,'CT');
  assert.deepEqual(plan,{schema:1,headRevision:revision,
    conceptIds:['cerebellum-left-hemisphere','bone-left-parietal','cerebellum-vermis','brainstem-pons']});
  const raw=JSON.stringify(plan);
  for(const secret of ['cth.','mrb.','private-synthetic','private-image','regional mask','correct','patient','score'])
    assert(!raw.includes(secret),`serialized plan contains ${secret}`);
  const parsed=parseHeadStudyPlan(raw);assert.deepEqual(parsed,plan);
  assert.notEqual(parsed,plan);assert.notEqual(parsed!.conceptIds,plan!.conceptIds);
  const mri=study([mriVermis,mriCerebellum,mriAmygdala]);
  assert.deepEqual(resolveHeadStudyPlan(parsed,mri,revision,'MRI'),[mriCerebellum,mriVermis]);
  assert.deepEqual(resolveHeadStudyPlan(parsed,ct,revision,'CT'),[cerebellum,bone,vermis,pons]);
  const first=resolveHeadStudyPlan(parsed,ct,revision,'CT');first.pop();
  assert.deepEqual(resolveHeadStudyPlan(parsed,ct,revision,'CT'),[cerebellum,bone,vermis,pons]);
  assert.deepEqual(parsed!.conceptIds,plan!.conceptIds);
});

test('MRI-only and image-only concepts are allowed without inventing an unavailable CT mask',()=>{
  const mri=study([mriAmygdala,mriVermis,mriCerebellum]);
  const plan=createHeadStudyPlan(selected(mri,[mriAmygdala,mriVermis,mriCerebellum]),mri,revision,'MRI');
  assert.deepEqual(plan?.conceptIds,['limbic-left-amygdala','cerebellum-vermis','cerebellum-left-hemisphere']);
  const ct=study([cerebellum,vermis]);
  assert.deepEqual(resolveHeadStudyPlan(plan,ct,revision,'CT'),[vermis,cerebellum]);
  assert.deepEqual(resolveHeadStudyPlan(plan,mri,revision,'MRI'),[mriAmygdala,mriVermis,mriCerebellum]);
});

test('creation requires the exact current shortlist, revision and modality',()=>{
  const active=study([pons,unmapped]);
  const state=selected(active,[pons]);
  assert.equal(createHeadStudyPlan(null,active,revision,'CT'),null);
  assert.equal(createHeadStudyPlan(selected(active,[unmapped]),active,revision,'CT'),null);
  assert.equal(createHeadStudyPlan(state,study([pons]),revision,'CT'),null);
  assert.equal(createHeadStudyPlan(state,active,'stale','CT'),null);
  assert.equal(createHeadStudyPlan(state,null,revision,'CT'),null);
  assert.equal(createHeadStudyPlan(state,active,revision,'PET' as 'CT'),null);
  assert.equal(createHeadStudyPlan(selected(active,[{...pons}]),active,revision,'CT'),null);
  assert.equal(createHeadStudyPlan(selected(active,[pons,pons]),active,revision,'CT'),null);
});

test('aliases, duplicate full-study mappings, altered identities and nonmasks fail closed',()=>{
  const alias={...pons,source:{geometry_alias_of:'cth.other'},mask:{...pons.mask!,sha256:'a'.repeat(64)}};
  const duplicate={...pons,mask:{...pons.mask!,sha256:'b'.repeat(64)}};
  const altered={...pons,label:'Altered pons — regional mask'};
  const noMask={...pons,mask:undefined};
  for(const candidate of [alias,altered,noMask]){
    const active=study([candidate]);
    assert.equal(createHeadStudyPlan(selected(active,[candidate]),active,revision,'CT'),null);
    assert.deepEqual(resolveHeadStudyPlan({schema:1,headRevision:revision,conceptIds:['brainstem-pons']},active,revision,'CT'),[]);
  }
  const active=study([pons,duplicate]);
  assert.equal(createHeadStudyPlan(selected(active,[pons]),active,revision,'CT'),null);
  assert.deepEqual(resolveHeadStudyPlan({schema:1,headRevision:revision,conceptIds:['brainstem-pons']},active,revision,'CT'),[]);
});

test('strict parser rejects stale, duplicate, unknown, extra, malformed and oversized storage values',()=>{
  const plan:HeadStudyPlan={schema:1,headRevision:revision,conceptIds:['brainstem-pons']};
  assert.deepEqual(parse(plan),plan);
  for(const raw of [null,'','{','not json',' '.repeat(8193)])assert.equal(parseHeadStudyPlan(raw),null);
  for(const value of [null,[],{},
    {...plan,schema:2},{...plan,headRevision:'stale'},
    {...plan,conceptIds:[]},{...plan,conceptIds:['brainstem-pons','brainstem-pons']},
    {...plan,conceptIds:['unknown']},{...plan,conceptIds:[3]},
    {...plan,conceptIds:Array.from({length:51},()=>plan.conceptIds[0])},
    {...plan,studyId:'private'},{...plan,scanPath:'private-image.bin'},
    {...plan,score:10},{...plan,labels:['Pons']},
  ])assert.equal(parse(value),null);
  const accessor=Object.defineProperty({...plan},'headRevision',{get:()=>revision});
  assert.deepEqual(resolveHeadStudyPlan(accessor as HeadStudyPlan,study([pons]),revision,'CT'),[]);
  const inherited=Object.assign(Object.create({source:'private'}),plan);
  assert.deepEqual(resolveHeadStudyPlan(inherited as HeadStudyPlan,study([pons]),revision,'CT'),[]);
  const extra=Object.defineProperty({...plan},'private',{value:'hidden'});
  assert.deepEqual(resolveHeadStudyPlan(extra as HeadStudyPlan,study([pons]),revision,'CT'),[]);
  const sparse={...plan,conceptIds:Array(1)} as HeadStudyPlan;
  assert.deepEqual(resolveHeadStudyPlan(sparse,study([pons]),revision,'CT'),[]);
});

test('restoration is bounded to current revision, current modality and available masks',()=>{
  const plan:HeadStudyPlan={schema:1,headRevision:revision,conceptIds:['brainstem-pons','cerebellum-vermis']};
  const active=study([pons]);
  assert.deepEqual(resolveHeadStudyPlan(plan,active,revision,'CT'),[pons]);
  assert.deepEqual(resolveHeadStudyPlan(plan,study([vermis]),revision,'CT'),[vermis]);
  assert.deepEqual(resolveHeadStudyPlan(plan,active,'stale','CT'),[]);
  assert.deepEqual(resolveHeadStudyPlan({...plan,headRevision:'stale'},active,revision,'CT'),[]);
  assert.deepEqual(resolveHeadStudyPlan(plan,null,revision,'CT'),[]);
  assert.deepEqual(resolveHeadStudyPlan(plan,active,revision,'PET' as 'CT'),[]);
  assert.deepEqual(resolveHeadStudyPlan(null,active,revision,'CT'),[]);
});

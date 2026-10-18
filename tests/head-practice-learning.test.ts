import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION,headAtlasConcept,type HeadEntry} from '../lib/head-atlas-links.ts';
import {headPracticeGuides} from '../lib/head-practice-learning.ts';
import {parseHeadLearningIntent,headLearningNavigation} from '../lib/head-atlas-learning.ts';

const entries:Array<[HeadEntry,'CT'|'MRI',string,number]>=[
  [{id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask'},'CT','brainstem',1],
  [{id:'mrb.vnt.fourth_ventricle',label:'Fourth ventricle — regional mask',laterality:'midline_or_unpaired',representation:'mask'},'MRI','ventricles',3],
  [{id:'cth.dgm.thalamus.right',label:'Right thalamus — regional mask',laterality:'right',representation:'mask'},'CT','deep-grey',7],
  [{id:'mrb.ctx.occipital_lobe.right',label:'Right occipital lobe — regional mask',laterality:'right',representation:'mask'},'MRI','cerebral-lobes',7],
  [{id:'cth.dgm.hippocampus.right',label:'Right hippocampus — regional mask',laterality:'right',representation:'mask'},'CT','hippocampi',1],
  [{id:'mrb.dgm.amygdala.right',label:'Right amygdala — regional mask',laterality:'right',representation:'mask'},'MRI','mri-amygdalae',1],
  [{id:'mrb.wmt.corpus_callosum',label:'Corpus callosum — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask'},'MRI','mri-midline-landmarks',0],
  [{id:'mrb.ctx.insula.right',label:'Right insula — regional mask',laterality:'right',representation:'partial-mask'},'MRI','insulae',1],
  [{id:'cth.orb.globe.right',label:'Right globe — regional mask',laterality:'right',representation:'mask'},'CT','globes',1],
];

test('all nine existing tours open at the answered structure, not an unrelated first step',()=>{
  for(const [entry,modality,tour,step] of entries){
    const concept=headAtlasConcept(entry,modality);assert(concept);
    const guides=headPracticeGuides(entry,modality,HEAD_LINK_REVISION);assert.equal(guides.length,1);
    assert.equal(guides[0].id,tour);
    assert.deepEqual(guides[0].position,{sequenceId:tour,conceptId:concept.conceptId});
    const query=new URL(guides[0].href,'https://example.invalid').searchParams;
    assert.equal(query.get('headStep'),String(step));
    assert.deepEqual(parseHeadLearningIntent(query,'atlas'),guides[0].position);
    const nav=headLearningNavigation({sequenceId:tour,conceptId:concept.conceptId});assert(nav);
    assert.equal(nav.index,step);assert.equal(nav.current.atlasHref,guides[0].href);
    assert.equal(query.get('headRevision'),HEAD_LINK_REVISION);
    assert(!/score|answer|patient|file|slice|voxel/i.test([...query.keys()].join(' ')));
  }
});

test('stale or mismatched source identity cannot suggest a tour',()=>{
  for(const [entry,modality] of entries){
    assert.deepEqual(headPracticeGuides(entry,modality,'stale'),[]);
    for(const change of [{id:'unknown'},{label:'Different structure'},{laterality:'unsupported'},{representation:'point'}])
      assert.deepEqual(headPracticeGuides({...entry,...change},modality,HEAD_LINK_REVISION),[]);
    assert.deepEqual(headPracticeGuides(entry,modality==='CT'?'MRI':'CT',HEAD_LINK_REVISION),[]);
  }
});

test('CT-only bone feedback opens its exact new tour step, never an MRI equivalent',()=>{
  const entry={id:'cth.skl.occipital_bone',label:'Occipital bone — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask'};
  assert(headAtlasConcept(entry,'CT'),'fixture must be a real mapped CT-only concept');
  const guides=headPracticeGuides(entry,'CT',HEAD_LINK_REVISION);
  assert.equal(guides.length,1);assert.equal(guides[0].id,'ct-parietal-occipital');
  const query=new URL(guides[0].href,'https://example.invalid').searchParams;
  assert.equal(query.get('concept'),'bone-occipital');assert.equal(query.get('headStep'),'2');
  assert.deepEqual(headPracticeGuides(entry,'MRI',HEAD_LINK_REVISION),[]);
});

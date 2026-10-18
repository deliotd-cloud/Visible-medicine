import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {indexHeadAnatomy,filterHeadAnatomyIndex} from '../lib/head-atlas-index.ts';
import {headImageOnlyComparisonPacket} from '../lib/head-image-only-links.ts';

test('image-only canonical concepts are searchable but never pass the 3D-linked filter',()=>{
  for(const modality of ['CT','MRI'] as const){
    for(const binding of headImageOnlyComparisonPacket().bindings){
      const exact={...binding[modality==='CT'?'ct':'mri'],family:'cer'};
      const altered=[{...exact,id:'foreign'}, {...exact,label:'Altered label'}, {...exact,laterality:'unknown'}, {...exact,representation:'point'}];
      const entries=[exact,...altered],before=structuredClone(entries);
      const rows=indexHeadAnatomy(entries,modality,HEAD_LINK_REVISION);
      const options={query:binding.conceptId,family:'All systems',linkedOnly:false};
      assert.deepEqual(filterHeadAnatomyIndex(rows,options),[rows[0]]);
      assert.equal(rows[0].imageConcept?.conceptId,binding.conceptId);
      assert.equal(rows[0].imageConcept?.atlasHref,undefined);
      assert(rows.every(row=>row.concept===null));
      assert(rows.slice(1).every(row=>row.imageConcept===null));
      assert.deepEqual(filterHeadAnatomyIndex(rows,{...options,linkedOnly:true}),[]);
      assert.deepEqual(filterHeadAnatomyIndex(rows,{...options,family:'bst'}),[]);
      assert.deepEqual(filterHeadAnatomyIndex(rows,{...options,side:'unknown'}),[]);
      for(const revision of ['', '0'.repeat(64)]){
        const stale=indexHeadAnatomy(entries,modality,revision);
        assert(stale.every(row=>row.imageConcept===null&&row.concept===null));
        assert.deepEqual(filterHeadAnatomyIndex(stale,options),[]);
      }
      assert(indexHeadAnatomy(entries,modality==='CT'?'MRI':'CT',HEAD_LINK_REVISION).every(row=>row.imageConcept===null));
      assert.deepEqual(entries,before);assert.equal(rows[0].entry,exact);
    }
  }
});

const ids=[
  ['brainstem-midbrain','bst.midbrain','Midbrain'],['brainstem-pons','bst.pons','Pons'],['brainstem-medulla','bst.medulla_oblongata','Medulla oblongata'],
  ['ventricle-left-lateral','vnt.lateral_ventricle.left','Left lateral ventricle'],['ventricle-right-lateral','vnt.lateral_ventricle.right','Right lateral ventricle'],
  ['ventricle-third','vnt.third_ventricle','Third ventricle'],['ventricle-fourth','vnt.fourth_ventricle','Fourth ventricle'],
  ...(['left','right'] as const).flatMap(side=>[
    [`deep-${side}-caudate`,`dgm.caudate_nucleus.${side}`,`${side==='left'?'Left':'Right'} caudate nucleus`],
    [`deep-${side}-putamen`,`dgm.putamen.${side}`,`${side==='left'?'Left':'Right'} putamen`],
    [`deep-${side}-globus-pallidus`,`dgm.globus_pallidus.${side}`,`${side==='left'?'Left':'Right'} globus pallidus`],
    [`deep-${side}-thalamus`,`dgm.thalamus.${side}`,`${side==='left'?'Left':'Right'} thalamus`],
  ]),
] as Array<[string,string,string]>;
type Entry={id:string;label:string;family:string;laterality:string;representation:string};
const entry=(conceptId:string,suffix:string,label:string,modality:'CT'|'MRI'):Entry=>({
  id:`${modality==='CT'?'cth':'mrb'}.${suffix}`,label:`${label} — regional mask`,family:conceptId.split('-')[0],
  laterality:conceptId.includes('-left-')?'left':conceptId.includes('-right-')?'right':'midline_or_unpaired',
  representation:conceptId.startsWith('brainstem-')?'partial-mask':'mask',
});

test('side and representation are exact intersecting discovery filters, never inferred from names',()=>{
  const entries=[
    entry('deep-left-caudate','dgm.caudate_nucleus.left','Left caudate nucleus','CT'),
    entry('deep-right-caudate','dgm.caudate_nucleus.right','Right caudate nucleus','CT'),
    {...entry('brainstem-pons','bst.pons','Pons','CT'),representation:'point'},
    {id:'unknown',label:'Left caudate',family:'deep',representation:'mask'},
  ];
  const before=structuredClone(entries),rows=indexHeadAnatomy(entries,'CT',HEAD_LINK_REVISION);
  const find=(extra:{side?:string;representation?:string;query?:string;family?:string;linkedOnly?:boolean})=>filterHeadAnatomyIndex(rows,{query:'',family:'All systems',linkedOnly:false,...extra});
  assert.deepEqual(find({side:'left'}),[rows[0]]);
  assert.deepEqual(find({side:''}),[rows[3]],'missing side is not inferred from its label');
  assert.deepEqual(find({representation:'mask'}),[rows[0],rows[1],rows[3]]);
  assert.deepEqual(find({representation:'point',side:'midline_or_unpaired'}),[rows[2]]);
  assert.deepEqual(find({side:'left',representation:'mask',query:'caudate',family:'deep',linkedOnly:true}),[rows[0]]);
  assert.deepEqual(find({side:'LEFT'}),[]);assert.deepEqual(find({representation:'unknown'}),[]);
  assert.deepEqual(find({side:'left',representation:'partial-mask'}),[]);
  assert.deepEqual(find({}),rows);assert.deepEqual(entries,before);
});

test('exact source IDs yield all fifteen pinned concepts in CT and MRI without changing input identity',()=>{
  assert.equal(ids.length,15);assert.equal(new Set(ids.map(row=>row[0])).size,15);
  for(const modality of ['CT','MRI'] as const){
    const entries=ids.map(([id,suffix,label])=>entry(id,suffix,label,modality));
    const snapshot=structuredClone(entries),rows=indexHeadAnatomy(entries,modality,HEAD_LINK_REVISION);
    assert.equal(rows.length,15);assert.deepEqual(entries,snapshot);
    for(let index=0;index<entries.length;index++){
      assert.equal(rows[index].entry,entries[index],'row keeps exact entry object and order');
      assert.equal(rows[index].concept?.conceptId,ids[index][0]);
      assert.deepEqual(rows[index].concept,headConceptById(ids[index][0]));
      assert.equal(rows[index].concept?.headRevision,HEAD_LINK_REVISION);
    }
    const stale=indexHeadAnatomy(entries,modality,'0'.repeat(64));
    assert(stale.every(row=>row.concept===null),'stale source cannot inherit concept links');
    assert.deepEqual(entries,snapshot);
  }
});

test('strict source tuple rejects altered ID, label, side, representation and modality',()=>{
  const exact=entry('deep-left-caudate','dgm.caudate_nucleus.left','Left caudate nucleus','CT');
  const wrong:Entry[]=[
    {...exact,id:'cth.dgm.caudate_nucleus.right'},
    {...exact,label:'Right caudate nucleus — regional mask'},
    {...exact,laterality:'right'},
    {...exact,representation:'partial-mask'},
    {...exact,id:'mrb.dgm.caudate_nucleus.left'},
    {...exact,id:'unknown-source'},
  ];
  const rows=indexHeadAnatomy([exact,...wrong],'CT',HEAD_LINK_REVISION);
  assert.equal(rows[0].concept?.conceptId,'deep-left-caudate');
  assert(rows.slice(1).every(row=>row.concept===null),'no side or source substitution');
  assert(indexHeadAnatomy([exact],'PET' as 'CT',HEAD_LINK_REVISION).every(row=>row.concept===null));
});

test('search combines family and linked-only filters while retaining raw and canonical exact matches',()=>{
  const pons=entry('brainstem-pons','bst.pons','Pons','CT');
  const left=entry('deep-left-caudate','dgm.caudate_nucleus.left','Left caudate nucleus','CT');
  const right=entry('deep-right-caudate','dgm.caudate_nucleus.right','Right caudate nucleus','CT');
  const unlinked:Entry={id:'cth.extra',label:'Unmapped caudate',family:'deep',laterality:'left',representation:'mask'};
  const entries=[pons,left,unlinked,right],rows=indexHeadAnatomy(entries,'CT',HEAD_LINK_REVISION),original=[...rows];
  const filtered=(query:string,family='All systems',linkedOnly=false)=>filterHeadAnatomyIndex(rows,{query,family,linkedOnly});
  assert.deepEqual(filtered(''),rows);
  assert.deepEqual(filtered('  LEFT CAUDATE  '),[rows[1],rows[2]],'all-term discovery also uses the unmapped row\'s declared left side');
  assert.deepEqual(filtered('  LEFT CAUDATE  ','All systems',true),[rows[1]],'discovery does not confer mapping');
  assert.deepEqual(filtered('  deep-left-caudate  '),[rows[1]],'canonical ID searchable even though raw source ID differs');
  assert.deepEqual(filtered('cth.dgm.caudate_nucleus.right'),[rows[3]]);
  assert.deepEqual(filtered('regional mask','brainstem'),[rows[0]]);
  assert.deepEqual(filtered('caudate','deep',true),[rows[1],rows[3]],'AND intersection preserves source order');
  assert.deepEqual(filtered('caudate','deep',false),[rows[1],rows[2],rows[3]]);
  assert.deepEqual(filtered('unmapped','deep',true),[]);
  assert.deepEqual(filtered('right','deep',true),[rows[3]]);
  assert.deepEqual(filtered('unknown-concept','All systems',true),[]);
  assert.equal(filtered('caudate','deep',true)[0],rows[1],'filter preserves row object identity');
  assert.deepEqual(rows,original);assert.deepEqual(rows.map(row=>row.entry),entries);
});

test('multiword discovery accepts any word order and spacing without widening source bindings',()=>{
  for(const modality of ['CT','MRI'] as const){
    const left=entry('deep-left-caudate','dgm.caudate_nucleus.left','Left caudate nucleus',modality);
    const right=entry('deep-right-caudate','dgm.caudate_nucleus.right','Right caudate nucleus',modality);
    const unlinked={...left,id:'local.unmapped',label:'Unmapped caudate',representation:'unknown'};
    const rows=indexHeadAnatomy([left,right,unlinked],modality,HEAD_LINK_REVISION),snapshot=structuredClone(rows);
    const search=(query:string,linkedOnly=false,family='All systems')=>filterHeadAnatomyIndex(rows,{query,family,linkedOnly});
    for(const query of ['caudate left','  NUCLEUS\t left\n caudate  ','left left caudate','caudate\u00a0left']){
      assert.deepEqual(search(query,true),[rows[0]],query);
    }
    assert.deepEqual(search('caudate right',true),[rows[1]]);
    assert.deepEqual(search(`${left.id} left`,true),[rows[0]],'raw ID stays searchable with a side term');
    assert.deepEqual(search('deep-left-caudate nucleus',true),[rows[0]],'canonical ID stays literal');
    assert.deepEqual(search('left right'),[],'all terms must match one row, not separate sides');
    assert.deepEqual(search('left caudate',true,'brainstem'),[],'system filter still intersects');
    assert.deepEqual(search('unmapped left',true),[],'text never grants a concept link');
    assert.deepEqual(search('unmapped left'),[rows[2]]);
    assert.deepEqual(search(' \t\n '),rows);
    for(const query of ['caudate.*','[left]','caudate OR pons'])assert.deepEqual(search(query),[],'no regex or query language');
    const stale=indexHeadAnatomy([left,right],modality,'0'.repeat(64));
    assert.deepEqual(filterHeadAnatomyIndex(stale,{query:'caudate left',family:'All systems',linkedOnly:true}),[]);
    assert.deepEqual(rows,snapshot);assert.equal(search('nucleus left')[0],rows[0]);
  }
});

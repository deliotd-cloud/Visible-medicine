import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {headImageConcept} from '../lib/head-image-only-links.ts';
import {headStudyComparisons} from '../lib/head-study-comparison.ts';
import {headStudySetEntries,type HeadStudySet} from '../lib/head-study-set.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';

const revision=HEAD_MANIFEST_SHA256;
const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id:string,label:string,representation:'mask'|'partial-mask',laterality:'left'|'midline_or_unpaired',index:number):HeadEntry{
  return {id,label,family:'synthetic',representation,laterality,color:[1,0,0],opacity:{fill:.2,outline:1},
    mask:{file:`synthetic-${index}.bin`,sha256:index.toString(16).padStart(64,'0'),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}};
}
function study(entries:HeadEntry[]):LoadedStudy{
  return {definition:{image:{file:'synthetic-image.bin',sha256:'f'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries}} as LoadedStudy;
}
const pons=entry('cth.bst.pons','Pons — regional mask','partial-mask','midline_or_unpaired',1);
const cerebellum=entry('cth.cer.cerebellar_hemisphere.left','Left cerebellar hemisphere — regional mask','mask','left',2);
const bone=entry('cth.skl.parietal_bone.left','Left parietal bone — regional mask','partial-mask','left',3);
const unmapped=entry('local.synthetic','Unmapped synthetic mask','mask','left',4);
const amygdala=entry('mrb.dgm.amygdala.left','Left amygdala — regional mask','mask','left',5);

test('study comparisons retain exact shortlist order and only mapped 3D or opposite-image destinations',()=>{
  for(const [modality,entries] of [['CT',[pons,cerebellum,bone,unmapped]],['MRI',[amygdala]]] as const){
    const active=study([...entries]);
    const state:HeadStudySet={study:active,revision,entries:[...entries]};
    const rows=headStudyComparisons(state,active,revision,modality);
    assert.deepEqual(rows.map(row=>row.entry),headStudySetEntries(state,active,revision));
    assert(rows.every((row,index)=>row.entry===entries[index]));
    for(const row of rows){
      const concept=headImageConcept(row.entry,modality);
      if(!concept){assert.deepEqual(row.links,[]);continue;}
      const other=modality==='CT'?'MRI':'CT';
      const expected=[...(concept.atlasHref?[{modality:'3D',href:concept.atlasHref}]:[]),
        ...(headImageHref(other,concept.conceptId,null,revision)?[{modality:other,href:headImageHref(other,concept.conceptId,null,revision)!}]:[])];
      assert.deepEqual(row.links,expected);
      assert.equal(typeof row.scopeNote,'string');
      for(const link of row.links){
        assert(!/private|synthetic-|patient|scan\.nii|token=|source=private/.test(link.href));
        if(link.modality!=='3D')assert.deepEqual([...new URL(link.href,'https://example.invalid').searchParams.keys()],['concept','headRevision']);
      }
    }
    if(modality==='CT'){
      assert.deepEqual(rows.find(row=>row.entry===cerebellum)?.links.map(link=>link.modality),['MRI']);
      assert.deepEqual(rows.find(row=>row.entry===bone)?.links.map(link=>link.modality),['3D']);
    }else assert.deepEqual(rows.find(row=>row.entry===amygdala)?.links.map(link=>link.modality),['3D']);
  }
});

test('altered mapped identity, duplicate whole-study identity and unknown mask remain unlinked',()=>{
  const altered={...pons,label:'Pons — altered regional mask',mask:{...pons.mask!,sha256:'a'.repeat(64)}};
  const duplicate={...pons,mask:{...pons.mask!,sha256:'b'.repeat(64)}};
  for(const [entries,selected] of [
    [[altered],altered],
    [[pons,duplicate],pons],
    [[unmapped],unmapped],
  ] as const){
    const active=study([...entries]),state:HeadStudySet={study:active,revision,entries:[selected]};
    assert.deepEqual(headStudyComparisons(state,active,revision,'CT'),[{entry:selected,links:[]}]);
  }
});

test('foreign study, changed revision and foreign shortlist identities fail closed',()=>{
  const active=study([pons]),state:HeadStudySet={study:active,revision,entries:[pons]};
  assert.equal(headStudyComparisons(state,study([pons]),revision,'CT').length,0);
  assert.equal(headStudyComparisons(state,active,'stale','CT').length,0);
  assert.equal(headStudyComparisons({...state,revision:'stale'},active,revision,'CT').length,0);
  assert.equal(headStudyComparisons({...state,entries:[{...pons}]},active,revision,'CT').length,0);
  assert.equal(headStudyComparisons(state,null,revision,'CT').length,0);
  assert.equal(headStudyComparisons(state,active,revision,'PET' as 'CT').length,0);
});

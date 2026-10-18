import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById,headConceptFromAtlasQuery,resolveHeadConcept} from '../lib/head-atlas-links.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import {conceptForHeadSelection} from '../lib/head-live-selection.ts';
import {headTeachingForConcept} from '../lib/head-atlas-teaching.ts';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';

const sourceHash='c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4';
const rows=[
  ['bone-left-parietal','cth.skl.parietal_bone.left','Left parietal bone','left','left:bone:left-parietal-bone'],
  ['bone-right-parietal','cth.skl.parietal_bone.right','Right parietal bone','right','right:bone:right-parietal-bone'],
  ['bone-left-nasal','cth.fac.nasal_bone.left','Left nasal bone','left','left:bone:left-nasal-bone'],
  ['bone-right-nasal','cth.fac.nasal_bone.right','Right nasal bone','right','right:bone:right-nasal-bone'],
  ['bone-occipital','cth.skl.occipital_bone','Occipital bone','midline_or_unpaired','midline:bone:occipital-bone'],
  ['bone-ethmoid','cth.skl.ethmoid_bone','Ethmoid bone','midline_or_unpaired','midline:bone:ethmoid'],
] as const;
const entries=rows.map(([,id,label,laterality])=>({id,label:label+' — regional mask',laterality,representation:'partial-mask'}));

test('six CT-only mappings bind exact existing licensed generic bone identities and bundle bytes',()=>{
  const runtime=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
  const catalog=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
  const bytes=readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/head-neck-skeleton.glb',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sourceHash);
  rows.forEach(([conceptId,,,side,suffix],index)=>{
    const structureId='vm:anatomy:body:head-neck:'+suffix;
    const structure=catalog.structures.find((item:{id:string})=>item.id===structureId);assert(structure);
    assert.equal(structure.bundle,'head-neck-skeleton');assert(runtime.regionalIds.includes(structureId));
    assert.equal(runtime.modelBundles.find((item:{id:string})=>item.id===structure.bundle).sha256,sourceHash);
    const link=headConceptById(conceptId)!;assert(link);assert.equal(link.headRevision,HEAD_LINK_REVISION);
    assert.equal(link.ctHref,`/atlas/ct-head?concept=${conceptId}`);assert(!Object.hasOwn(link,'mriHref'));
    const query=new URLSearchParams({study:'1',structure:structureId,side:side==='midline_or_unpaired'?'both':side,source:sourceHash,concept:conceptId});
    assert.equal(link.atlasHref,`/atlas/head-neck-3d?${query}`);
    assert.equal(headConceptFromAtlasQuery(query)?.conceptId,conceptId);
    assert.deepEqual(headAtlasConcept(entries[index],'CT'),link);
    assert.equal(resolveHeadConcept(entries,conceptId,'CT'),entries[index]);
    assert.equal(headAtlasConcept(entries[index],'MRI'),null);
    assert.equal(resolveHeadConcept(entries,conceptId,'MRI'),null);
    assert.match(link.scopeNote,/CT-only/);assert.match(link.scopeNote,/regional portion, not the whole bone/);assert.match(link.scopeNote,/unregistered/);
    assert.equal(conceptForHeadSelection({kind:'root',id:structureId,source:sourceHash,laterality:structure.laterality})?.conceptId,conceptId);
    assert.equal(conceptForHeadSelection({kind:'root',id:structureId,source:'a'.repeat(64),laterality:structure.laterality}),null);
    for(const key of ['source','structure','side','study','concept']){
      const altered=new URLSearchParams(query);altered.set(key,'changed');assert.equal(headConceptFromAtlasQuery(altered),null);
      const duplicate=new URLSearchParams(query);duplicate.append(key,query.get(key)!);assert.equal(headConceptFromAtlasQuery(duplicate),null);
    }
    for(const key of ['id','label','laterality','representation'])assert.equal(headAtlasConcept({...entries[index],[key]:'changed'},'CT'),null);
  });
});

test('CT-only routes refuse MRI navigation and inherit neither head teaching nor guided sequences',()=>{
  rows.forEach(([conceptId])=>{
    const query=new URLSearchParams({concept:conceptId});
    assert.deepEqual(parseHeadImageNavigation(query,HEAD_LINK_REVISION,'CT'),{conceptId,position:null,invalid:false});
    assert.deepEqual(parseHeadImageNavigation(query,HEAD_LINK_REVISION,'MRI'),{conceptId:null,position:null,invalid:true});
    assert.equal(headImageHref('MRI',conceptId,null,HEAD_LINK_REVISION),null);
    assert.equal(headImageHref('CT',conceptId,null,HEAD_LINK_REVISION),`${headConceptById(conceptId)!.ctHref}&headRevision=${HEAD_LINK_REVISION}`);
    assert.equal(parseHeadImageNavigation(query,'stale','CT').invalid,true);
    const duplicate=new URLSearchParams(query);duplicate.append('concept',conceptId);assert.equal(parseHeadImageNavigation(duplicate,HEAD_LINK_REVISION,'CT').invalid,true);
    assert.equal(headTeachingForConcept(conceptId,'CT',HEAD_LINK_REVISION),null);
    assert.equal(headLearningLinks({sequenceId:'brainstem',conceptId}),null);
  });
  // Divided frontal/temporal masks and whole cerebellum are not equivalent targets.
  for(const concept of ['bone-left-frontal','bone-left-temporal','cerebellum'])assert.equal(headConceptById(concept),null);
});

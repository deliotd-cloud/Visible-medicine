import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as facial from '../lib/head-ct-facial-learning.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {HEAD_LINK_REVISION,headAtlasConceptOptions,headConceptFromAtlasQuery} from '../lib/head-atlas-links.ts';
import {headCtFacialComparisonPacket} from '../lib/head-ct-facial-comparison-review.ts';
import {headRelatedLearning} from '../lib/head-related-learning.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const ids=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];
const require=createRequire(import.meta.url);
const source=readFileSync('components/HeadCtFacialLearningReview.tsx','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{} as {HeadCtFacialLearningReview:(props:{manifestRevision:string})=>Promise<React.ReactNode>}};
new Function('require','module','exports',code)((id:string)=>id==='../lib/head-ct-facial-learning.ts'?facial:id==='../lib/head-atlas-learning.ts'?learning:require(id),mod,mod.exports);

test('one independent appended guide fills all three mapped omissions without changing earlier ordered guides',()=>{
  const sequences=learning.headLearningSequencesForModality();
  assert.deepEqual(sequences.slice(0,-1).map(s=>s.id),['brainstem','ventricles','deep-grey','cerebral-lobes','hippocampi','mri-amygdalae','mri-midline-landmarks','insulae','globes','ct-parietal-occipital','ct-nasal-ethmoid','cerebellar-orientation']);
  assert.equal(sequences.at(-1)?.id,'ct-facial-coverage');
  assert.deepEqual(sequences.at(-1)?.concepts,ids);
  const mapped=headAtlasConceptOptions();
  assert.equal(mapped.length,42);
  assert.deepEqual(mapped.filter(c=>!sequences.some(s=>s.concepts.includes(c.conceptId))),[]);
  assert.deepEqual(mapped.filter(c=>!sequences.slice(0,-1).some(s=>s.concepts.includes(c.conceptId))).map(c=>c.conceptId),ids);
  assert.equal(createHash('sha256').update(JSON.stringify(learning.headLearningPacket())).digest('hex'),'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
});

test('facial handoffs round-trip exact source and canonical slots; MRI and extra URL payloads refuse',()=>{
  for(const [index,conceptId] of ids.entries()){
    const position={sequenceId:'ct-facial-coverage',conceptId},links=learning.headLearningLinks(position);
    assert(links?.ctHref&&links.atlasHref);assert.equal(links.mriHref,undefined);
    assert.equal(headImageHref('CT',conceptId,position,HEAD_LINK_REVISION),links.ctHref);
    assert.equal(headImageHref('MRI',conceptId,position,HEAD_LINK_REVISION),null);
    assert.equal(learning.headLearningNavigation(position,'MRI'),null);
    for(const [href,surface] of [[links.ctHref,'image'],[links.atlasHref,'atlas']] as const){
      const query=new URL(href,'https://test.invalid').searchParams;
      assert.equal(query.get('headStep'),String(index));
      assert.deepEqual(learning.parseHeadLearningIntent(query,surface),position);
      if(surface==='atlas'){
        assert.equal(query.get('source'),'c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4');
        assert.equal(headConceptFromAtlasQuery(query)?.conceptId,conceptId);
      }else assert.deepEqual(parseHeadImageNavigation(query,HEAD_LINK_REVISION,'MRI'),{conceptId:null,position:null,invalid:true});
      for(const [key,value] of [['headRevision','0'.repeat(64)],['headStep','03'],['headStep','9'],['score','100'],['answer','mandible'],['x','14'],['redirect','https://foreign.invalid']]){
        const altered=new URLSearchParams(query);altered.set(key,value);
        assert.equal(learning.parseHeadLearningIntent(altered,surface),null,key);
      }
      const duplicate=new URLSearchParams(query);duplicate.append('concept',conceptId);
      assert.equal(learning.parseHeadLearningIntent(duplicate,surface),null);
    }
  }
});

test('related learning requires the exact retained facial entry and never substitutes or offers MRI',()=>{
  const entries=headCtFacialComparisonPacket().items.map(item=>({...item.ct,family:'fac',color:[1,0,0],opacity:{fill:.2,outline:1}} as HeadEntry));
  for(const [index,entry] of entries.entries()){
    const related=headRelatedLearning(entries,entry,'CT',HEAD_LINK_REVISION);
    assert.equal(related.length,1);assert.deepEqual(related[0].position,{sequenceId:'ct-facial-coverage',conceptId:ids[index]});
    assert.deepEqual(headRelatedLearning(entries,entry,'MRI',HEAD_LINK_REVISION),[]);
    assert.deepEqual(headRelatedLearning(entries,{...entry,laterality:'wrong'},'CT',HEAD_LINK_REVISION),[]);
    assert.deepEqual(headRelatedLearning(entries,entry,'CT','stale'),[]);
  }
});

test('private facial guide evidence stays collapsed and inspection-only with independently verified exact links',async()=>{
  const render=mod.exports.HeadCtFacialLearningReview;
  const html=renderToStaticMarkup(await render({manifestRevision:HEAD_LINK_REVISION}));
  assert.match(html,/<details id="ct-facial-learning">/);
  assert.equal((html.match(/Inspect CT step/g)??[]).length,3);
  assert.equal((html.match(/Inspect 3D step/g)??[]).length,3);
  assert(html.includes(facial.HEAD_CT_FACIAL_LEARNING_REVISION));
  assert.match(html,/Inspection only/);assert.match(html,/not record approval/);
  assert.doesNotMatch(html,/<form|<iframe|<details[^>]* open|mri-head/);
  for(const conceptId of ids){
    const links=learning.headLearningLinks({sequenceId:'ct-facial-coverage',conceptId})!;
    assert(html.includes(links.ctHref!.replaceAll('&','&amp;')));assert(html.includes(links.atlasHref!.replaceAll('&','&amp;')));
  }
  const stale=renderToStaticMarkup(await render({manifestRevision:'stale'}));
  assert.match(stale,/role="alert"/);assert.doesNotMatch(stale,/href=/);
  const route=readFileSync('app/workspace/atlas-review/head-learning/page.tsx','utf8');
  assert(route.indexOf('await authorizeClinicalReview()')<route.indexOf('await verifiedHeadCtFacialLearningRevision'));
  assert.match(route,/<HeadCtFacialLearningReview manifestRevision=\{HEAD_MANIFEST_SHA256\}/);
  assert.match(route,/ctFacialLearningRevision\?\[\{id:'ct-facial-learning'/);
  const binder=readFileSync('scripts/bind-clinical-review.mjs','utf8');
  for(const path of ['lib/head-atlas-learning.ts','lib/head-ct-facial-learning.ts','components/HeadCtFacialLearningReview.tsx'])assert(binder.includes(`'${path}'`),path);
});

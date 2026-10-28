import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-body-structure-guides',old=stage+'/SOURCE_CANDIDATE.json',s=json(old),rel='tests/body-structure-guides.test.mjs',file=s.website+'/'+rel;
assert.equal(hash(old),'7d0932b90e08fea548c351142b921a0c8b8267b6c40ff97d5085bb96afe9619b');for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
const before=fs.readFileSync(file,'utf8'),edits=[
 [";}`,loader:'ts'}));",";}`,loader:'ts',resolveDir:website}));"],
 ["default:({href,children,...props})=>jsx.jsx('a',{href,...props,children})","default:({href,children,prefetch,...props})=>jsx.jsx('a',{href,...props,children})"],
 ["assert(empty.includes(guide.label));assert(empty.includes(guide.regionLabel));","assert(empty.includes(render(jsx.jsx('span',{children:guide.label})).slice(6,-7)));assert(empty.includes(render(jsx.jsx('span',{children:guide.regionLabel})).slice(6,-7)));"],
];let after=before;for(const [a,b]of edits){assert.equal(after.split(a).length,2,a);after=after.replace(a,b);}
fs.writeFileSync(stage+'/TEST_BEFORE_REPAIR.mjs',before,{flag:'wx'});fs.writeFileSync(file,after);let inverse=after;for(const [a,b]of edits.toReversed()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}assert.equal(inverse,before);
s.sourceRows=s.sourceRows.map(r=>r.path===rel?{...r,sha256:hash(file),bytes:fs.statSync(file).size}:r);s.schema='vm-body-structure-guides-source/2';s.testRepair={preimage:{path:stage+'/TEST_BEFORE_REPAIR.mjs',sha256:hash(stage+'/TEST_BEFORE_REPAIR.mjs')},priorSource:{path:old,sha256:hash(old)},edits,reason:'Resolve actual catalogue from the synthetic test namespace; compare React-escaped label text and remove Next-only prefetch from the native anchor test stub. Product and every assertion retained.'};
const sf=stage+'/SOURCE_CANDIDATE_V2.json';fs.writeFileSync(sf,JSON.stringify(s,null,2)+'\n',{flag:'wx'});const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.pendingBodyStructureGuides.source={path:sf,sha256:hash(sf)};saveIndex(i);
const run=stage+'-recipes/check.mjs';let text=fs.readFileSync(run,'utf8');assert.equal(text.split('SOURCE_CANDIDATE.json').length,2);text=text.replace('SOURCE_CANDIDATE.json','SOURCE_CANDIDATE_V2.json');fs.writeFileSync(stage+'-recipes/check-v2.mjs',text,{flag:'wx'});console.log(JSON.stringify({source:{path:sf,sha256:hash(sf)},productChanged:false}));

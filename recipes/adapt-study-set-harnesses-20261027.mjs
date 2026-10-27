import fs from 'node:fs';import assert from 'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-study-set-navigation',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parent.path),site=prep.website;
assert.equal(hash(prep.parent.path),prep.parent.sha256);
const changes=[
 ['tests/head-study-set-ui.test.ts',[
  ["const module={exports:{} as Record<string,unknown>};let mode:'locate'|'label'|'recall'='locate';","const module={exports:{} as Record<string,unknown>};const slots:unknown[]=[];let cursor=0;"],
  ["{useState:()=>[mode,(value:typeof mode)=>{mode=value;}]}","{useEffect:()=>{},useState:(initial:unknown)=>{const slot=cursor++;if(!(slot in slots))slots[slot]=typeof initial==='function'?initial():initial;return [slots[slot],(value:unknown)=>{slots[slot]=typeof value==='function'?value(slots[slot]):value;}];}}"],
  ['function render(){return Component(','function render(){cursor=0;return Component('],
 ]],
 ['tests/head-study-set-order-ui.test.ts',[["{useState:()=>['locate',()=>{}]}","{useEffect:()=>{},useState:(initial:unknown)=>[typeof initial==='function'?initial():initial,()=>{}]}" ]]],
 ['tests/head-study-comparison-ui.test.ts',[["{...React,useState:()=>['locate',()=>{}]}","{...React,useEffect:()=>{},useState:(initial:unknown)=>[typeof initial==='function'?initial():initial,()=>{}]}" ]]],
 ['tests/head-study-comparison-limits.test.mjs',[["{...React,useState:()=>['locate',()=>{}]}","{...React,useEffect:()=>{},useState:initial=>[typeof initial==='function'?initial():initial,()=>{}]}" ]]],
];
const records=[];
for(const [path,edits]of changes){const row=parent.sourceRows.find(r=>r.path===path);assert.equal(hash(site+'/'+path),row.sha256);let text=fs.readFileSync(site+'/'+path,'utf8');const original=text;for(const [before,after]of edits){assert.equal(text.split(before).length,2,path);assert(!before.includes('assert.')&&!after.includes('assert.'));text=text.replace(before,after);}fs.writeFileSync(site+'/'+path,text);let inverse=text;for(const [before,after]of [...edits].reverse()){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}assert.equal(inverse,original);records.push({path,beforeSha256:row.sha256,afterSha256:hash(site+'/'+path),edits,allOriginalAssertionsUnchanged:true});}
fs.writeFileSync(stage+'/HARNESS_ADAPTATIONS.json',JSON.stringify({at:new Date().toISOString(),parent:prep.parent,records},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({adapted:records.length,allOriginalAssertionsUnchanged:true}));

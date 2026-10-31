import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final',source=json(root+'/SOURCE.json'),site=source.website;
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const changed=['tests/clinical-review-portal-venous-xray.test.ts','tests/clinical-pancreatic-portal-composition.mjs','tests/thyroid-ui-admission-history-1031.mjs','tests/clinical-epoch-batch-d-preservation.test.mjs'];
for(const p of changed){fs.mkdirSync(path.dirname(root+'/preimages/'+p),{recursive:true});fs.copyFileSync(site+'/'+p,root+'/preimages/'+p,fs.constants.COPYFILE_EXCL);}
const portal=changed[0],composition=changed[1];let helper=fs.readFileSync(site+'/'+composition,'utf8');
const prefix='for(const [before,after]of ',suffix='.toReversed())';const start=helper.indexOf(prefix);assert(start>=0);const stop=helper.indexOf(suffix,start);assert(stop>start);const edits=JSON.parse(helper.slice(start+prefix.length,stop));assert.equal(edits.length,2);
edits.push(['      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);',`      {
        assert.deepEqual(admissionImport.bodyLesson(structure,tab),current.bodyLesson(structure,tab),\`\${id}:\${tab}: original imported admission\`);
        assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),\`\${id}:\${tab}: exact current imported lesson\`);
      }`]);
const original=fs.readFileSync(site+'/tests/fixtures/portal-before-shoulder-source-1031.ts.raw');assert.equal(createHash('sha256').update(original).digest('hex'),'2c9e5f98988eeb9276e09acccf1ea5461aec00f98c9dc8af8b009c9f2add5ba5');let proposed=original.toString();for(const [before,after]of edits){assert.equal(proposed.split(before).length,2);proposed=proposed.replace(before,after);}fs.writeFileSync(site+'/'+portal,proposed);
helper=fs.readFileSync('G:/VisibleMedicine-temp/staging/20261031-release-partition7-provenance-check/website/'+composition,'utf8');const seam=' assert.equal(sha(currentBytes),entry.current,`${name}: exact current candidate`);';assert.equal(helper.split(seam).length,2);
helper=helper.replace(seam,` // Preserve the earlier full portal assertion source before composing its older seams.
 if(name==='clinical-review-portal-venous-xray.test.ts'&&sha(currentBytes)!==entry.current){
  assert.equal(sha(currentBytes),'${hash(site+'/'+portal)}','Exact current portal source-epoch candidate');
  let text=currentBytes.toString('utf8');assert.deepEqual(Buffer.from(text),currentBytes);
  for(const [before,after]of ${JSON.stringify(edits)}.toReversed()){
   assert.equal(text.split(after).length,2,'Unique later portal source seam');text=text.replace(after,before);
  }
  currentBytes=Buffer.from(text);
 }
${seam}`);fs.writeFileSync(site+'/'+composition,helper);
let admission=fs.readFileSync(site+'/'+changed[2],'utf8');const wrong='92403824dcebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07',right='92403824dc9ebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07';assert.equal(wrong.length,63);assert.equal(right.length,64);assert.equal(admission.split(wrong).length,2);assert.equal(hash('F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/SOURCE_V2.json'),right);assert(fs.readFileSync('F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/COMPOSED_V2.json','utf8').includes(right));admission=admission.replace(wrong,right);fs.writeFileSync(site+'/'+changed[2],admission);
const proposal='G:/VisibleMedicine-temp/proposals/20261031-partition7-model-history',manifest=json(proposal+'/MANIFEST.json');assert.equal(manifest.files.length,1);const row=manifest.files[0];assert.equal(row.path,changed[3]);assert.equal(hash(site+'/'+row.path),row.baseSha256);assert.equal(hash(proposal+'/website/'+row.path),row.sha256);fs.copyFileSync(proposal+'/website/'+row.path,site+'/'+row.path);
const rows=source.sourceRows.map(r=>changed.includes(r.path)?{...r,sha256:hash(site+'/'+r.path),bytes:fs.statSync(site+'/'+r.path).size}:r);for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const next={...source,at:new Date().toISOString(),parent:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},sourceRows:rows,additionalProposal:{path:proposal+'/MANIFEST.json',sha256:hash(proposal+'/MANIFEST.json')},repairs:['Corrected63-character historical receipt hash against retained independent COMPOSED_V2 record','Preserved original portal imported lessons using authenticated historical import; current lessons compare to complete current bound source','Authenticated later model-inspection test setup before original inverse'],preimages:changed.map(p=>({sourcePath:p,path:root+'/preimages/'+p,sha256:hash(root+'/preimages/'+p)}))};fs.writeFileSync(root+'/SOURCE2.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
let runner=fs.readFileSync(root+'/focused.mjs','utf8').replace("pin=root+'/SOURCE.json'","pin=root+'/SOURCE2.json'").replace("'ui-teaching-admission-contract.test.mjs'];","'ui-teaching-admission-contract.test.mjs','clinical-epoch-batch-d-preservation.test.mjs'];").replaceAll('/focused-guarded','/focused-guarded-2').replaceAll('/FOCUSED_RESULT','/FOCUSED2_RESULT');fs.writeFileSync(root+'/focused-2.mjs',runner,{flag:'wx'});console.log(JSON.stringify({sourceSha256:hash(root+'/SOURCE2.json')}));

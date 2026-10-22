import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate',website=root+'/website';
const proposed='F:/VisibleMedicine/staging/20261022-expansion-old-review-tests/tests';
const sha=b=>createHash('sha256').update(b).digest('hex');
const originals=['colic-current-admission.test.mjs','clinical-review-desktop-layout.test.mjs'];
for(const name of originals)assert(readFileSync(website+'/tests/'+name).equals(readFileSync(proposed+'/fixtures/ae84-review/'+name+'.raw')),'Exact native original: '+name);
const walk=(dir,prefix='')=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(dir+'/'+entry.name,prefix+entry.name+'/'):[prefix+entry.name]);
const names=['colic-current-admission.test.mjs','clinical-review-desktop-layout.test.mjs','historical-review-ae84.mjs','historical-review-ae84-preservation.test.mjs',...walk(proposed+'/fixtures/ae84-review').map(name=>'fixtures/ae84-review/'+name)];
assert.equal(names.length,14);
const rows=[];
for(const name of names){
 assert(originals.includes(name)||!existsSync(website+'/tests/'+name),'No unexpected overwrite: '+name);
 const target=website+'/tests/'+name;mkdirSync(dirname(target),{recursive:true});copyFileSync(proposed+'/'+name,target);
 rows.push({path:'tests/'+name,bytes:readFileSync(target).length,sha256:sha(readFileSync(target))});
}
const typesFixture=website+'/tests/fixtures/expanded-viewer-test-types/';
const historicalProofs=['atlas-cerebral-schema-preservation.test.mjs','clinical-review-cervical-disc-tour-preservation.test.mjs'];
const preserved=[];
for(const name of historicalProofs){assert(!existsSync(typesFixture+name+'.raw'));copyFileSync(website+'/tests/'+name,typesFixture+name+'.raw');preserved.push({name,sha256:sha(readFileSync(typesFixture+name+'.raw'))});}
writeFileSync(root+'/HISTORICAL_ASSURANCE_ADOPTION.json',JSON.stringify({at:new Date().toISOString(),rows,preserved,oldReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',newReview:'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99',noAssertionRemoved:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({adopted:rows.length,preserved}));

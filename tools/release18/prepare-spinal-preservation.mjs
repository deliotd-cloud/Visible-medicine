import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main',site='G:/VisibleMedicine-temp/staging/20261031-release16-final/website';
const sha=b=>createHash('sha256').update(b).digest('hex'),admission=JSON.parse(fs.readFileSync(root+'/SPINAL_ADMITTED.json')),row=admission.rows[0];
const rows=[row],write=(name,bytes)=>{const dest=root+'/spinal/'+name;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});rows.push({path:name,before:fs.existsSync(site+'/'+name)?sha(fs.readFileSync(site+'/'+name)):null,after:sha(bytes),from:dest});};
const helper='tests/spinal-current-runtime-inverse-1031.mjs';
write(helper,`// Reverse only the two exact current-runtime admission edits; all lesson checks stay intact.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=${JSON.stringify(admission.edits,null,2)};
export function restoreSpinalOriginalRuntime(bytes){
 assert.equal(sha(bytes),'${row.after}','Exact current spinal runtime source');
 let text=bytes.toString();for(const [before,after]of [...edits].reverse()){
  assert.equal(text.split(after).length,2,'One spinal admission seam');text=text.replace(after,before);
 }
 const original=Buffer.from(text);assert.equal(sha(original),'${row.before}','Complete spinal predecessor');return original;
}
`);
const name='tests/question-source-family-inverse.mjs';let code=fs.readFileSync(site+'/'+name,'utf8');
code=code.replace("import assert from 'node:assert/strict';","import assert from 'node:assert/strict';\nimport {restoreSpinalOriginalRuntime} from './spinal-current-runtime-inverse-1031.mjs';");
const seam=" const item=cases[name];assert(item,'Only three declared question-family transitions admitted');";
assert.equal(code.split(seam).length,2);code=code.replace(seam,seam+"\n if(name==='clinical-review-spinal-disc-ultrasound.test.ts')currentBytes=restoreSpinalOriginalRuntime(currentBytes);");write(name,code);
write('tests/spinal-current-runtime-inverse-1031.test.mjs',`import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';
import {restoreSpinalOriginalRuntime} from './spinal-current-runtime-inverse-1031.mjs';
import {restoreQuestionFamilyPrior} from './question-source-family-inverse.mjs';
const name='clinical-review-spinal-disc-ultrasound.test.ts',current=readFileSync(new URL('./'+name,import.meta.url));
test('spinal runtime update preserves the entire earlier lesson and source contract',()=>{
 assert.equal(restoreSpinalOriginalRuntime(current).includes(Buffer.from("assert.equal(pin.runtimeSources.shoulder,revision)")),true);
 assert.deepEqual(restoreQuestionFamilyPrior(name,current),readFileSync(new URL('./fixtures/question-family-prior/'+name+'.raw',import.meta.url)));
});
test('altered lesson, source and refusal checks cannot pass the spinal inverse',()=>{
 for(const from of ['assert.equal(entries.length,19);',"assert.equal(lesson.readiness,'draft',id);",'assert.equal(response.status,409,']){
  assert(current.toString().includes(from));assert.throws(()=>restoreSpinalOriginalRuntime(Buffer.from(current.toString().replace(from,from+'/* changed */'))));
 }
 assert.throws(()=>restoreSpinalOriginalRuntime(Buffer.concat([current,Buffer.from('\\n// unrelated')])));
});
`);
fs.writeFileSync(root+'/SPINAL_COMPOSITION.json',JSON.stringify({schema:'vm-spinal-runtime-check-repair/1',source:admission.source,rows,productChanged:false,completeOriginalPreserved:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:rows.length}));

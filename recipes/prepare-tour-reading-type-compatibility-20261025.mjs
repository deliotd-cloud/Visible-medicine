import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const baseFile='F:/VisibleMedicine/staging/20261025-tour-neck-renal-website/SOURCE_CANDIDATE.json';
assert.equal(hash(baseFile),'c2172562233a7c3c64985d7fc75a6b6eb4df7be3c2682e437c97978b067f04ce');
const base=json(baseFile),dir='F:/VisibleMedicine/staging/20261025-tour-reading-type-compatibility';assert(!fs.existsSync(dir));
const diagnosticsFile='F:/VisibleMedicine/staging/20261025-tour-neck-renal-website/checks/types-full-attempt-1/TYPE_RESULT.json';
assert.equal(json(diagnosticsFile).diagnosticCount,5);
const changes=[
 ['tests/atlas-nested-answer-focus.test.ts',[["return bytes.includes('Choose once, or skip to reveal the answer.');","return new TextDecoder().decode(bytes).includes('Choose once, or skip to reveal the answer.');"]]],
 ['tests/atlas-tour-library-pause.test.ts',[["JSON.parse(execFileSync('git',['show',revision+':content/body-renderer-revision.json'],{cwd:sourceRoot}).toString('utf8'))","JSON.parse(execFileSync('git',['show',revision+':content/body-renderer-revision.json'],{cwd:sourceRoot,encoding:'utf8'}))"]]],
 ['tests/atlas-tour-reference-reading.test.ts',[
  ["readFileSync(base+f.path).includes('Current step explanation')","readFileSync(base+f.path,'utf8').includes('Current step explanation')"],
  ["readFileSync('public/atlas-runtime/head-neck/'+f.path).includes('Read tour notes')","readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8').includes('Read tour notes')"],
  ["readFileSync('public/atlas-review-viewer/'+f.path).includes('Read tour notes')","readFileSync('public/atlas-review-viewer/'+f.path,'utf8').includes('Read tour notes')"]
 ]]
];
const files=[];fs.mkdirSync(dir);
for(const [p,replacements] of changes){
 const from=base.website+'/'+p,row=base.sourceRows.find(r=>r.path===p);assert(row);assert.equal(hash(from),row.sha256);
 let source=fs.readFileSync(from,'utf8');const before=source;
 for(const [old,next] of replacements){assert.equal(source.split(old).length,2,p+': one exact diagnosed expression');source=source.replace(old,next);}
 let restored=source;for(const [old,next] of [...replacements].reverse()){assert.equal(restored.split(next).length,2);restored=restored.replace(next,old);}assert.equal(restored,before,'All non-diagnosed source bytes remain exact');
 const to=dir+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,source,{flag:'wx'});
 files.push({path:p,beforeSha256:row.sha256,afterSha256:hash(to),expressionCount:replacements.length,wholeSourceRestoresExactly:true});
}
fs.writeFileSync(dir+'/PATCHSET.json',JSON.stringify({schema:'vm-tour-reading-test-type-compatibility/1',at:new Date().toISOString(),parent:baseFile,parentSha256:hash(baseFile),diagnostics:{path:diagnosticsFile,sha256:hash(diagnosticsFile),count:5},files,reason:'Explicit UTF-8 decoding for text searches and Git JSON. Runtime Buffer string overloads are narrower in this full project declaration graph. No casts/any/suppressions, assertion removal, source-hash changes or fixture changes; inverse recovers all prior test bytes.',applicationOrNativeSourceChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({patchset:dir+'/PATCHSET.json',sha256:hash(dir+'/PATCHSET.json'),files:files.length,exactExpressions:5}));

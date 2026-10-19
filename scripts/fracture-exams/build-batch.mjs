import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {parse} from '../../lib/fracture-package.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const dir=await realpath(resolve(process.argv[2]||''));
const reviewOnly=process.argv.includes('--review-only');
const repo=execFileSync('git',['-C',dir,'rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const allowed=await realpath(resolve(repo,'.local/fracture-exams'));
const rel=relative(allowed,dir);if(!rel||rel.startsWith('..')||isAbsolute(rel))throw Error('PRIVATE_FOLDER_REQUIRED');
execFileSync('git',['-C',repo,'check-ignore','--quiet',resolve(dir,'review.html')]);
const contextText=await readFile(resolve(dir,'context.json'),'utf8'),context=JSON.parse(contextText);
const root=await realpath(context.sourceRoot),cases=[],packages=[];
const revision=hash(JSON.stringify({contextSha256:hash(contextText),format:'fracture-two-mark-v1',casesPerPaper:50,maxMarks:100}));
for(const c of context.cases){
  if(!['fracture','no-fracture'].includes(c.sourceLabel)||c.assets.some(a=>a.sourceRecord.hard_negative_tags.some(t=>['metal','cast'].includes(t))))throw Error('INELIGIBLE_CASE');
  const source=c.assets[0].sourceRecord;
  const id=`case_${hash(`${source.dataset_id}:${source.patient_key??'unlinked'}:${source.study_key??source.image_key}`).slice(0,32)}`;
  const images=[],localImages=[];
  for(const a of c.assets){
    const path=await realpath(a.path),r=relative(root,path);
    if(r.startsWith('..')||isAbsolute(r))throw Error('SOURCE_ESCAPE');
    const bytes=await readFile(path);if(hash(bytes)!==a.sha256)throw Error('SOURCE_CHANGED');
    if(!reviewOnly)images.push({id:`asset_${a.sha256.slice(0,32)}`,mime:'image/png',sha256:a.sha256,base64:bytes.toString('base64'),view:a.sourceRecord.view,laterality:a.sourceRecord.laterality});
    localImages.push({url:pathToFileURL(path).href,view:a.sourceRecord.view,laterality:a.sourceRecord.laterality});
  }
  cases.push({id,sourceLabel:c.sourceLabel,region:c.region||source.anatomy,reviewLimitations:c.reviewLimitations||'',groupingEvidence:c.groupingEvidence||'',images:localImages});
  if(reviewOnly)continue;
  const packaged={id,images,assessment:{format:'fracture-two-mark-v1',status:'pending',fracturePresent:c.sourceLabel==='fracture',acceptedBoneAnswers:[]},questions:[{id:`question_${hash(id+':two-mark').slice(0,32)}`,prompt:'Is there a fracture? If yes, what bone is fractured?',maxMarks:2,answer:null,rationale:'Source annotation only. Fracture status and bone key require radiologist review.'}]};
  // Small review chunks retain the existing bounded website import contract.
  let chunk=packages.at(-1);if(!chunk||chunk.length>=4){chunk=[];packages.push(chunk);}chunk.push(packaged);
}
for(const [i,chunk] of packages.entries()){
  const payload={schema:'vm-fracture-local-review-v1',contentRevision:hash(JSON.stringify({revision,chunk})),clinicalStatus:'pending',privacyStatus:'pending',reuseStatus:'pending',cases:chunk};
  const envelope=JSON.stringify({payload,sha256:hash(JSON.stringify(payload))});await parse(envelope);
  await writeFile(resolve(dir,`review-chunk-${i+1}.vm-fracture.json`),envelope,{flag:'wx'});
}
const bundle=await build({entryPoints:[resolve(repo,'scripts/fracture-exams/review-batch.tsx')],bundle:true,write:false,minify:true,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
await writeFile(resolve(dir,'review.js'),bundle.outputFiles[0].contents,{flag:'wx'});
const data=JSON.stringify({revision,cases,reviewGroup:context.reviewGroup??null}).replaceAll('<','\\u003c');
const css=`*{box-sizing:border-box}body{margin:0;background:#edf3f3;color:#102f36;font:16px/1.55 system-ui}main{max-width:1440px;margin:auto;padding:24px}header,aside{background:white;border-radius:12px;padding:24px}h1{margin-top:0}h2{font-size:22px}h2 small{font-size:15px;font-weight:400}button,input,select,textarea{font:inherit}button{padding:10px 16px;border:1px solid #59767e;border-radius:6px;background:white;color:#102f36;cursor:pointer}button:disabled{opacity:.5;cursor:default}button[aria-current=true],button[aria-pressed=true],.primary-button{background:#075b67;color:white}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #cc7500;outline-offset:3px}nav,footer{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.review-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(330px,1fr);gap:24px}figure{margin:0 0 24px}img{display:block;width:100%;max-height:650px;object-fit:contain;background:#020c10}figcaption{padding:8px}label{display:block;margin:14px 0}select,textarea{display:block;width:100%;padding:10px;margin:6px 0}textarea{min-height:85px}input[type=checkbox]{width:20px;height:20px;vertical-align:middle}.review-key{border-top:1px solid #b6c9ce;margin-top:30px;padding-top:18px}small{font-size:14px}p{overflow-wrap:anywhere}input[type=file]{max-width:100%}@media(max-width:800px){main{padding:12px}.review-grid{grid-template-columns:1fr}header,aside{padding:16px}}`;
await writeFile(resolve(dir,'review.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src file: 'self'; style-src 'unsafe-inline'; img-src file: data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>Local fracture case review</title><style>${css}</style></head><body><div id="root"></div><script type="application/json" id="batch-data">${data}</script><script src="review.js"></script></body></html>`,{flag:'wx'});
await writeFile(resolve(dir,'batch-revision.json'),JSON.stringify({revision,cases:cases.length,questions:cases.length,maxMarks:cases.length*2,fullPaperCases:50,fullPaperMarks:100,clinical:'pending',privacy:'pending',reuse:'pending',uploaded:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'local-review-only',cases:cases.length,packages:packages.length,revision}));

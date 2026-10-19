import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { assertDraftExam } from './contract.mjs';

// Local-only preparation. This package contains image bytes and must never be committed/uploaded.
const sha=value=>createHash('sha256').update(value).digest('hex');
async function main(){
  const dir=await realpath(resolve(process.argv[2]??''));
  const repo=execFileSync('git',['-C',dir,'rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
  const allowed=await realpath(resolve(repo,'.local/fracture-exams'));
  const rel=relative(allowed,dir);
  if(!rel||rel.startsWith('..')||isAbsolute(rel))throw Error();
  const target=resolve(dir,'fracture-pilot.vm-fracture.json');
  execFileSync('git',['-C',repo,'check-ignore','--quiet',target]);
  const exam=JSON.parse(await readFile(resolve(dir,'exam.draft.json'),'utf8'));
  const {revision}=assertDraftExam(exam);
  if(Object.values(exam.reviews).some(r=>r.status!=='pending'))throw Error();
  const context=JSON.parse(await readFile(resolve(dir,'context.json'),'utf8'));
  const sourceRoot=await realpath(context.sourceRoot);
  const assets=new Map(context.cases.flatMap(c=>c.assets).map(a=>[a.sha256,a.path]));
  const cases=[];
  for(const c of exam.cases){
    const evidence=await readFile(resolve(dir,'evidence',`${c.caseId}.json`));
    if(sha(evidence)!==c.sourceEvidenceSha256)throw Error();
    const images=[];
    for(const a of c.assets){
      const path=await realpath(assets.get(a.sha256)??'');
      const r=relative(sourceRoot,path);if(r.startsWith('..')||isAbsolute(r))throw Error();
      const bytes=await readFile(path);if(sha(bytes)!==a.sha256)throw Error();
      images.push({id:a.assetId,mime:'image/png',sha256:a.sha256,base64:bytes.toString('base64'),view:a.view,laterality:a.laterality});
    }
    cases.push({id:c.caseId,images,questions:c.questions.map(q=>({id:q.questionId,prompt:q.prompt,answer:q.answer,rationale:q.rationale,maxMarks:q.maxMarks}))});
  }
  const payload={schema:'vm-fracture-local-review-v1',contentRevision:revision,clinicalStatus:'pending',privacyStatus:'pending',reuseStatus:'pending',cases};
  const envelope=JSON.stringify({payload,sha256:sha(JSON.stringify(payload))});
  // Same validator as the hosted local reader; validates bounded PNG bytes and hashes.
  await import('../../public/fracture-review/package.js');
  await globalThis.VMFracturePackage.parse(envelope);
  await writeFile(target,envelope,{flag:'wx'});
  console.log(JSON.stringify({status:'private-local-package-created',cases:cases.length,images:cases.reduce((n,c)=>n+c.images.length,0),bytes:Buffer.byteLength(envelope)}));
}
main().catch(()=>{console.error('Local packaging failed. No private source values logged.');process.exitCode=1;});

// Test-only, immutable authoring-epoch replay; never a learner input.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export const beforeCommit='fb1566736ab1169da48bc7bff3dc4d0bb228dc2a';
export const afterCommit='e5521766d4035044bd2b057818d6153783a4294e';
const identities={
 [beforeCommit]:'fb1566736ab1169da48bc7bff3dc4d0bb228dc2a 02ac3bf5a0f5092b3b05a6c9b3bd72da12dddb21 a62e32a48df22b34810fb36bd80ce51467551e16',
 [afterCommit]:'e5521766d4035044bd2b057818d6153783a4294e ef05e66659239fb1d8507f9462b98d2cd24985a0 fb1566736ab1169da48bc7bff3dc4d0bb228dc2a',
};
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const catalogBlob='2f4dc97cf918c3cff128dbb55092260430634eaa';
const preservedBlobs=Object.freeze({
 'app/anatomy-data.ts':'aad16f695cae037d5254663fcdd06fb91ab4c877',
 'app/body-explorer.tsx':'c75ca9d6d2edc9b3338841c107baab68b2261aba',
 'app/body-scene.tsx':'10a6319a1759de8c3b9d6667ca61492c8f706acd',
 'app/dissection-data.ts':'59c04e3152a744e38782ec15b076874d65e88171',
 'content/hra-renal-clinical.ts':'97be11b2328cc336dc5088758d80dd70fe7788e2',
 'content/hra-renal-teaching.ts':'58f56ef6db09361ff0826bbb17cbf5fe932aaa79',
 'content/pancreatic-teaching.ts':'16dfe84f63099333347071b247d57ccbd94ff3f2',
 'content/renal-teaching.ts':'f4349465380d461dc87f4f9212a82256f4f73736',
 'drizzle/0002_specimen_review_events.sql':'62ddb97a8bc41aec21fcf92668868a62e1cfe518',
 'lib/body-display-catalog.ts':'dba16fbb0fffa0115a1f4433845a938d791471b2',
 'lib/knee-imaging.ts':'5b3e23321b44eabcc3eadc2e40e141f6eead80e0',
 'lib/um-limb-teaching.ts':'0658caf75a33cbced8aa60ec4be33b10814a7676',
 'package-lock.json':'a98e04f275aeba7c355cfa942befbb4f6b6ad2e2',
 'public/models/bodyparts3d/full-body/catalog.json':catalogBlob,
 'public/models/bodyparts3d/pancreas/display-correction.json':'25dbbe88ea6ed744f627373c6683998655322bb6',
});
const gitOptions={cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6};
const gitBufferOptions={cwd:root,windowsHide:true,env:gitOptions.env,maxBuffer:16e6};
const git=(args)=>execFileSync('git',['--no-replace-objects',...args],gitOptions).trim();

export function exactAbdominalFile(path,commit=afterCommit){
 assert(Object.hasOwn(identities,commit),'Unlisted abdominal epoch');
 const blob=commit===beforeCommit?(path===catalogPath?catalogBlob:undefined):preservedBlobs[path];
 assert(blob,'Unlisted historical direct read');
 assert.equal(git(['ls-tree',commit,path]),`100644 blob ${blob}\t${path}`,'Historical path/blob changed');
 const bytes=execFileSync('git',['--no-replace-objects','show',commit+':'+path],gitBufferOptions);
 const actual=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
 assert.equal(actual,blob,'Historical content/blob mismatch');
 return bytes;
}

export async function exactAbdominalOrganImagingEpoch(){
 for(const [commit,identity] of Object.entries(identities)){
  assert.equal(git(['show','-s','--format=%H %T %P',commit]),identity,'Wrong abdominal authoring commit/tree/parent');
  assert.equal(git(['ls-tree',commit,catalogPath]),`100644 blob ${catalogBlob}\t${catalogPath}`,'Wrong abdominal catalog blob');
 }
 const raw=JSON.parse(exactAbdominalFile(catalogPath,beforeCommit));
 const api=await exactSourceHistoryApi(beforeCommit,'display');
 const catalog=api.bodyDisplayCatalog(raw);
 return {api,catalog,raw,beforeCommit,afterCommit};
}

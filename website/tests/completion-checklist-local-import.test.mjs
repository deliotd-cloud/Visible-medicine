import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertCompleteOriginal} from './deepbrain-foot-roles.mjs';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),role=resolve(project,'tests/fixtures/checklist-v1-role');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originals=[
 ['tests/completion-checklist-local-import.test.mjs','completion-checklist-local-import.test.mjs.raw','a90edb60ae231b20ab3940a011f34b3ca7fbe46b7418219659efa72845819491'],
 ['docs/completion-checklist.json','completion-checklist.json.raw','c2b3f9aa77f815fb278f74b40a2b68f496563389906b618acf69ec74e0b3cb58'],
 ['tests/fixtures/completion-checklist-19.json','completion-checklist-19.json.raw','51d016a07f1bfe9692bbcddea3afe40168441f86f9cebdfd44e17b123abe05fd'],
 ['tests/fixtures/completion-checklist-21.json','completion-checklist-21.json.raw','2a7ebfbf4a19a31aac0b6a2a9c802f01cda2a32dbf9f0cee85f4080c24eb5411'],
];
test('original v1 checklist import: all19cases against exact parent data and current verifier',()=>{
 const verifier=readFileSync(resolve(project,'scripts/refresh-completion-checklist.mjs'));
 assert.equal(sha(verifier),'0c2a2f9a9b6eecd016b91a9c7f36e76ba43b5cb98809f23a194e404167dc808e','Exact current verifier');
 const files=originals.map(([p,name,expected])=>{const bytes=readFileSync(resolve(role,name));assert.equal(sha(bytes),expected,name);return[p,bytes];});
 const base=resolve(project,'.local/checklist-v1-evidence');mkdirSync(base,{recursive:true});const evidence=mkdtempSync(resolve(base,'run-')),child=resolve(evidence,'child');
 for(const [p,bytes] of [...files,['scripts/refresh-completion-checklist.mjs',verifier]]){const target=resolve(child,p);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes,{flag:'wx'});}
 const childEnvironment=Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(key)));
 const run=spawnSync(process.execPath,['--max-old-space-size=256','--test','--test-concurrency=1','--test-reporter=tap',resolve(child,'tests/completion-checklist-local-import.test.mjs')],{cwd:child,encoding:'utf8',windowsHide:true,shell:false,env:childEnvironment,maxBuffer:4*1024*1024});
 writeFileSync(resolve(evidence,'child.tap'),run.stdout??'',{flag:'wx'});writeFileSync(resolve(evidence,'child.stderr.log'),run.stderr??'',{flag:'wx'});
 let counts=null,error=null;try{counts=assertCompleteOriginal({code:run.status,signal:run.signal,...(run.error?{error:String(run.error)}:{})},run.stdout??'',19);}catch(e){error=String(e);}
 writeFileSync(resolve(evidence,'terminal.json'),JSON.stringify({at:new Date().toISOString(),passing:error===null,expected:19,counts,error,code:run.status,signal:run.signal,originalRootSha256:originals[0][2],originalDataSha256:originals[1][2],currentVerifierSha256:sha(verifier),exactOriginalAssertionsPreserved:true,role:'v1 compatibility under exact historical data; not current v2 installed state'},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({v1ChildEvidence:evidence,expected:19,passing:error===null}));assert.equal(error,null);
});

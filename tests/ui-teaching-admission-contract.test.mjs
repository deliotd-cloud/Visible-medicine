import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,'tests',path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact=(source,from,to)=>{assert.equal(source.split(from).length,2,`Unique seam: ${from.slice(0,70)}`);return source.replace(from,to);};
const {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=
 await import(pathToFileURL(join(root,'tests/current-atlas-delivery.mjs')).href);
const {checkedAtlasHistoryRepo}=
 await import(pathToFileURL(join(root,'tests/atlas-source-repo.mjs')).href);

const source59='3dcdf94a46db44202e72641be9fbcf1274ce5364';
const tree59='b5ab50363b521aed2e8d4f0e34a8f5ed4ecee0d5';
const rawDelivery=['fixtures/current-atlas-delivery-before-ui-teaching.txt','70397d1a602d1de4a1cb76da2687cf138f81ace50b9322a60c3ce327cd193e5d'];
const rawPortal=['fixtures/portal-admission-before-ui-teaching.txt','2c32d0068ce42d8a0bcc33b259e608af81fa9fbdd37ec27d03638a04e379b383'];
function frozen([path,hash]){const bytes=read(path);assert.equal(sha(bytes),hash,`Exact historical bytes: ${path}`);return bytes.toString();}
function prefixFor(pin){let text=frozen(rawDelivery);
 text=exact(text,source59,pin.source);text=exact(text,tree59,pin.sourceTree);
 return exact(text,'assert.equal(sourceFiles,1534);',`assert.equal(sourceFiles,${pin.reviewSourceFiles});`);}
function portalFor509b(old){let text=frozen(rawPortal);
 text=exact(text,source59,old.source);text=exact(text,tree59,old.sourceTree);
 text=exact(text,'exact clean Atlas3dc','exact clean Atlas509b');
 return exact(text,'assert.equal(pin.reviewSourceFiles,1534);',`assert.equal(pin.reviewSourceFiles,${old.reviewSourceFiles});`);}
const suffixHash='c07e33a5cfca551adee42b309942e21aa2b82eeb06cdaca073995599bd0cde68';
function admitDelivery(candidate,pin){
 const prefix=prefixFor(pin);
 assert(candidate.startsWith(prefix),'Whole original delivery assertions must retain only declared current seams');
 const suffix=candidate.slice(prefix.length);
 assert.equal(Buffer.byteLength(suffix),2067,'Exact f509 historical appendix length');
 assert.equal(sha(Buffer.from(suffix)),suffixHash,'Exact f509 historical appendix assertions');
 assert(suffix.startsWith("\ntest('complete f509 source and whole original contracts remain frozen"));
 return prefix;
}

test('59, 509b and f509 witnesses remain historical while current admission uses the actual validated producer',()=>{
 const old59Bytes=read('fixtures/current-atlas-delivery-59.json');
 assert.equal(sha(old59Bytes),'8f78fd9edc87dac6a8d9ef5fef681059bfb698eca39f0988ff470d44c0afd267');
 const old59=JSON.parse(old59Bytes);
 assert.equal(old59.source,source59);assert.equal(old59.sourceTree,tree59);assert.equal(old59.reviewSourceFiles,1534);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old59}));

 const portalBytes=read('fixtures/current-atlas-delivery-before-check-mri.json.raw');
 assert.equal(sha(portalBytes),'00279e09c93e73bf775a1702cd163b7619ce99c5211707d32150da6efeb550f0');
 const portalPin=JSON.parse(portalBytes);
 assert.equal(portalPin.source,'509b01da5d72f33bd774e4a59d63e2406af1f2ff');
 assert.equal(portalPin.sourceTree,'a9a1581bd6a3220b7d4b2554644fe0c56b688430');
 assert.equal(portalPin.reviewSourceFiles,1538);
 assert.equal(read('clinical-review-portal-venous-current-admission.test.mjs').toString(),portalFor509b(portalPin));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:portalPin}));

 const f509Bytes=read('fixtures/current-atlas-delivery-f5097af8.json');
 assert.equal(sha(f509Bytes),'b683fcb7b38b83c97c49bdc2a2903ced10de2cb69cc16a80959bbe8f21a7409a');
 const f509=JSON.parse(f509Bytes);
 assert.equal(f509.source,'f5097af8493701d64a8e2a2b5797df380f3b348a');
 assert.equal(f509.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');
 assert.equal(f509.reviewSourceFiles,1541);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:f509}));
 const f509OriginalBytes=read('fixtures/current-atlas-delivery-f5097af8.txt');
 assert.equal(sha(f509OriginalBytes),'a7ce97681413483667399d7d8388231c842082dd87a2eb8648d13751cf30aafa');

 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(pin.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');
 assert.equal(pin.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');
 const prefix=admitDelivery(read('current-atlas-delivery.test.mjs').toString(),pin);
 let fromF509=f509OriginalBytes.toString();
 fromF509=exact(fromF509,f509.source,pin.source);
 fromF509=exact(fromF509,f509.sourceTree,pin.sourceTree);
 fromF509=exact(fromF509,'assert.equal(sourceFiles,1541);',`assert.equal(sourceFiles,${pin.reviewSourceFiles});`);
 assert.equal(prefix,fromF509,'The same original prefix reconstructs from f509 independently');

 const history=checkedAtlasHistoryRepo(portalPin.source);
 assert.equal(history,sourceRoot);
 const git=(...args)=>execFileSync('git',args,{cwd:history,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 for(const witness of [portalPin,f509])assert.equal(git('rev-parse',witness.source+'^{tree}'),witness.sourceTree);
 execFileSync('git',['merge-base','--is-ancestor',portalPin.source,f509.source],{cwd:history,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 execFileSync('git',['merge-base','--is-ancestor',f509.source,pin.source],{cwd:history,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
});

test('forged old assertions, appendix, portal and stale delivery pins are refused',()=>{
 const pin=validateCurrentAtlasDelivery();
 const delivery=read('current-atlas-delivery.test.mjs').toString();
 const portalPin=JSON.parse(read('fixtures/current-atlas-delivery-before-check-mri.json.raw'));
 const portal=read('clinical-review-portal-venous-current-admission.test.mjs').toString();
 const forgedDelivery=exact(delivery,'assert.equal(sha(bytes),row.sha256,path);','assert(true);');
 assert.throws(()=>admitDelivery(forgedDelivery,pin));
 const forgedAppendix=exact(delivery,"assert.equal(old.reviewSourceFiles,1541);","assert.equal(old.reviewSourceFiles,1542);");
 assert.throws(()=>admitDelivery(forgedAppendix,pin));
 assert.notEqual(exact(portal,"assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');",'assert(true);'),portalFor509b(portalPin));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,documents:{...pin.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}));
});
